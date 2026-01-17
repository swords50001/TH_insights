# AWS RDS Connectivity Resolution - Complete Analysis

**Date:** January 17, 2026  
**Duration:** ~5 hours across multiple troubleshooting sessions  
**Final Status:** ✅ RESOLVED

---

## Executive Summary

Successfully resolved persistent AWS RDS database connectivity issues that prevented the TH Insights backend from connecting to PostgreSQL. The root cause was **AWS RDS subnet selection behavior** - even with "Publicly accessible = Yes", RDS can bind to private IPs in subnets without Internet Gateway routing, causing all connection attempts to timeout.

**The Solution:**
1. Created a dedicated DB subnet group (`th-public-only`) containing ONLY subnets with proper Internet Gateway routes
2. Deleted and recreated the RDS instance using this subnet group from creation
3. Fixed database credentials and added missing schema migrations
4. Result: Database now accessible at public IP `16.146.254.36` with successful connections from App Runner

---

## Root Cause Analysis

### The Problem

AWS RDS "Publicly accessible" setting is **misleading**. When enabled, it:
- ✅ Allows public IP assignment
- ✅ Enables connections from internet IPs
- ❌ **Does NOT guarantee the database will be placed in a publicly-routed subnet**

### How AWS RDS Subnet Selection Works

When you create an RDS instance:
1. You specify a **DB Subnet Group** (a collection of subnets)
2. AWS picks ONE subnet from that group to place your RDS instance
3. The RDS instance gets a private IP from that subnet
4. If "Publicly accessible = Yes", AWS also creates a public DNS entry
5. **But the DNS resolves to the subnet's IP** - if that subnet lacks IGW routing, connections fail

### The Default VPC Problem

Our AWS account's default VPC (`vpc-06887a73b54135881`) had:
- 9 subnets total
- 7 were truly private (no IGW route)
- 2 were marked "public" (`MapPublicIpOnLaunch: true`) but also lacked IGW routes
- The default DB subnet group included all 9 subnets

**Result:** Every RDS instance we created randomly selected a subnet, and since 9/9 lacked proper routing, every instance was unreachable.

---

## Failed Approaches (What Didn't Work)

### Attempt 1: Security Group Modifications
**Action:** Added inbound rule allowing TCP 5432 from `0.0.0.0/0`  
**Result:** ❌ Still timeout  
**Why:** Security groups control traffic *to* a reachable instance. Routing determines *if* the instance is reachable at all.

### Attempt 2: App Runner VPC Connector
**Action:** Created VPC connector with egress security group allowing TCP 5432  
**Result:** ❌ Still timeout on private IP `172.31.65.42`  
**Why:** VPC connector enables private networking, but RDS was in a subnet without any routing (not even internal VPC routing was configured properly).

### Attempt 3: Using Existing RDS Instances
**Tested:**
- `th-db-insights`: Private IP, timeout
- `thdbprod`: Public IP `16.145.187.93`, timeout
- `th-insights-production` (v1): Mixed public/private subnets, got private IP `172.31.65.42`, timeout

**Why All Failed:** All were using the default DB subnet group, which included unrouted subnets.

### Attempt 4: Modify Existing RDS Subnet Group
**Action:** Tried `aws rds modify-db-instance --db-subnet-group-name th-public-only`  
**Result:** ❌ Error: `InvalidVPCNetworkStateFault`  
**Why:** AWS doesn't allow changing DB subnet groups on existing RDS instances, even within the same VPC.

---

## The Solution (What Finally Worked)

### Step 1: Create Properly-Routed Subnets

We already had 2 subnets that could be fixed:
- `subnet-042acc59cdc46f556` (us-west-2a, 172.31.48.0/20)
- `subnet-063c3a2fe1fd5a1b6` (us-west-2b, 172.31.32.0/20)

**Actions:**
```bash
# Create route table with IGW route
aws ec2 create-route-table --vpc-id vpc-06887a73b54135881
# Route ID: rtb-0cb1d95cf8cf30aee

# Add route to Internet Gateway
aws ec2 create-route --route-table-id rtb-0cb1d95cf8cf30aee \
  --destination-cidr-block 0.0.0.0/0 \
  --gateway-id igw-0716a828398e518f3

# Associate subnets with this route table
aws ec2 associate-route-table --route-table-id rtb-0cb1d95cf8cf30aee \
  --subnet-id subnet-042acc59cdc46f556
aws ec2 associate-route-table --route-table-id rtb-0cb1d95cf8cf30aee \
  --subnet-id subnet-063c3a2fe1fd5a1b6
```

**Result:** These 2 subnets now have working internet connectivity via IGW `igw-0716a828398e518f3`.

### Step 2: Create Exclusive DB Subnet Group

```bash
aws rds create-db-subnet-group \
  --db-subnet-group-name th-public-only \
  --db-subnet-group-description "Only subnets with IGW routing" \
  --subnet-ids subnet-042acc59cdc46f556 subnet-063c3a2fe1fd5a1b6
```

**Key Principle:** By limiting the subnet group to ONLY these 2 properly-routed subnets, we guarantee RDS will be reachable no matter which one AWS picks.

### Step 3: Delete and Recreate RDS

**Why necessary:** AWS doesn't allow modifying subnet groups on existing instances.

**Process:**
1. Deleted `th-insights-production` (original)
2. Created new RDS instance with these settings:
   - Engine: PostgreSQL 15.14-R2
   - Master username: `postgres`
   - Master password: `DJJAiKQVI0RTVHK`
   - **DB subnet group:** `th-public-only` ← **Critical**
   - Publicly accessible: Yes
   - Security group: `sg-027a35265c428977a` (allows TCP 5432 from 0.0.0.0/0)
   - Initial database: `postgres`

**Verification:**
```bash
nslookup th-insights-production.cx4mmeokynqf.us-west-2.rds.amazonaws.com
# Address: 16.146.254.36 ← Public IP, not 172.31.x.x!

nc -zv 16.146.254.36 5432
# Connection to 16.146.254.36 port 5432 [tcp/postgresql] succeeded!
```

### Step 4: Fix Database Credentials

**Issue:** App Runner environment variables had wrong username (`thadmin` instead of `postgres`)

**Fix:**
- Updated `DB_USER` to `postgres`
- Updated `DB_PASSWORD` to `DJJAiKQVI0RTVHK`
- Redeployed App Runner backend service

### Step 5: Fix Missing Migrations

**Issue:** Migrations were trying to `ALTER TABLE` on tables that didn't exist yet.

**Root Cause:** Migration files assumed tables already existed from a previous schema.

**Fix:**
1. Created `000_initial_schema.sql` to create base tables:
   - `dashboard_cards`
   - `dashboards`
2. Updated `001_add_multi_tenancy.sql` to add `name` column to `users` table
3. Manually added `name` column to existing database (since migration already ran)

**Commands:**
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255);
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
```

### Step 6: Create Admin User

```bash
curl -X POST https://wb8dgirwq3.us-west-2.awsapprunner.com/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"TestPassword123","name":"Admin"}'

# Response:
# {"success":true,"user":{"id":1,"email":"admin@example.com","name":"Admin"}}
```

---

## Final Working Configuration

### RDS Instance
- **Identifier:** `th-insights-production`
- **Endpoint:** `th-insights-production.cx4mmeokynqf.us-west-2.rds.amazonaws.com`
- **Public IP:** `16.146.254.36`
- **DB Subnet Group:** `th-public-only`
- **Subnets:** Only `subnet-042acc59cdc46f556`, `subnet-063c3a2fe1fd5a1b6` (both with IGW routes)
- **Security Group:** `sg-027a35265c428977a` (inbound TCP 5432 from 0.0.0.0/0)
- **Credentials:** `postgres` / `DJJAiKQVI0RTVHK`
- **Database:** `postgres`

### App Runner Backend
- **Service:** `th-insights-backend`
- **URL:** `https://wb8dgirwq3.us-west-2.awsapprunner.com`
- **Egress:** Default (no VPC connector needed - RDS is publicly accessible)
- **Environment Variables:**
  - `DB_HOST=th-insights-production.cx4mmeokynqf.us-west-2.rds.amazonaws.com`
  - `DB_NAME=postgres`
  - `DB_USER=postgres`
  - `DB_PASSWORD=DJJAiKQVI0RTVHK`
  - `DB_PORT=5432`
  - `JWT_SECRET=[secret]`

### Admin User
- **Email:** `admin@example.com`
- **Password:** `TestPassword123`
- **Role:** `admin`
- **Tenant:** `default`

---

## Key Lessons Learned

### 1. AWS RDS "Publicly Accessible" is Misleading
- Enabling it doesn't guarantee internet-reachable placement
- You must control subnet selection via DB subnet groups
- Always verify DNS resolution and test port connectivity after creation

### 2. Subnet "Public" Label is Insufficient
- A subnet needs more than `MapPublicIpOnLaunch: true`
- Must have a route table with `0.0.0.0/0 → Internet Gateway`
- AWS Console doesn't always make this distinction clear

### 3. DB Subnet Groups are Critical
- They determine WHERE your RDS instance can be placed
- Should contain ONLY subnets you've verified are properly routed
- Default groups often include problematic subnets

### 4. AWS RDS Limitations
- Cannot change subnet group on existing instances
- Cannot move instance to different VPC
- Must delete and recreate to change fundamental networking settings

### 5. Security Groups vs. Routing
- Security groups are a firewall (allow/deny traffic)
- Route tables determine IF traffic can reach the instance
- Both must be correct, but routing issues are often harder to diagnose

---

## Prevention for Future RDS Instances

### Pre-Creation Checklist

1. **Verify Subnet Routing:**
   ```bash
   # Get route table for subnet
   aws ec2 describe-route-tables --filters "Name=association.subnet-id,Values=SUBNET_ID"
   
   # Look for: 0.0.0.0/0 → igw-xxxxx
   ```

2. **Create Dedicated DB Subnet Group:**
   - Include ONLY verified public subnets (minimum 2 for multi-AZ)
   - Name it descriptively (e.g., `myapp-public-db-subnets`)
   - Document which subnets are included

3. **Test Connectivity Before Creating RDS:**
   ```bash
   # Launch EC2 instance in same subnet
   # Try to reach internet from that instance
   ping 8.8.8.8
   ```

4. **Use Explicit Names:**
   - Don't rely on default subnet groups
   - Name route tables descriptively (`rtb-public-with-igw`)
   - Tag resources clearly

### Post-Creation Verification

```bash
# 1. Check DNS resolution
nslookup YOUR-RDS-ENDPOINT

# 2. Test port connectivity
nc -zv RESOLVED_IP 5432

# 3. Test actual database connection
PGPASSWORD='password' psql -h ENDPOINT -U username -d database -c "SELECT version();"

# 4. Check from application server
# If using App Runner, check CloudWatch logs for connection errors
```

---

## Commands for Quick Verification

### Check RDS Subnet Assignment
```bash
aws rds describe-db-instances \
  --db-instance-identifier YOUR-DB-ID \
  --query 'DBInstances[0].DBSubnetGroup.Subnets[*].{SubnetId:SubnetIdentifier,AZ:SubnetAvailabilityZone.Name}' \
  --output table
```

### Check Subnet Route Table
```bash
aws ec2 describe-route-tables \
  --filters "Name=association.subnet-id,Values=YOUR-SUBNET-ID" \
  --query 'RouteTables[0].Routes' \
  --output table
```

### Test Database Connection
```bash
# With psql
PGPASSWORD='password' PGSSLMODE=require psql -h ENDPOINT -U username -d postgres -c "SELECT NOW();"

# With Node.js (from your app)
node -e "const {Client}=require('pg');const c=new Client({host:'ENDPOINT',port:5432,database:'postgres',user:'username',password:'password',ssl:{rejectUnauthorized:false}});c.connect().then(()=>console.log('Connected!')).catch(e=>console.error(e));"
```

---

## Cleanup Recommendations

### Optional: Remove Temporary Resources

1. **Remove Signup Endpoint** (security best practice):
   ```typescript
   // In backend/src/routes/auth.routes.ts
   // Delete or comment out the POST /signup route
   ```

2. **Tighten RDS Security Group:**
   ```bash
   # Remove 0.0.0.0/0 rule, add specific IPs
   aws ec2 revoke-security-group-ingress \
     --group-id sg-027a35265c428977a \
     --protocol tcp --port 5432 --cidr 0.0.0.0/0
   
   # Add specific App Runner egress IPs (check CloudWatch logs for actual IPs)
   aws ec2 authorize-security-group-ingress \
     --group-id sg-027a35265c428977a \
     --protocol tcp --port 5432 --cidr YOUR-APP-RUNNER-IP/32
   ```

3. **Delete Unused VPC Connectors:**
   ```bash
   aws apprunner list-vpc-connectors --region us-west-2
   # Delete ones we created but aren't using
   ```

---

## Cost Implications

### Resources Created/Modified

| Resource | Type | Cost Impact |
|----------|------|-------------|
| Route Table (`rtb-0cb1d95cf8cf30aee`) | Route Table | Free |
| Internet Gateway (existing) | IGW | Free (if used) |
| DB Subnet Group (`th-public-only`) | DB Subnet Group | Free |
| RDS Instance (`th-insights-production`) | db.t3.micro (assumed) | ~$15-30/month |
| App Runner Backend | Fargate-based | Pay per use (~$5-20/month) |
| VPC Connector (if kept) | VPC Connector | $0.10/hour (~$73/month) |

**Recommendation:** Remove unused VPC connector if not needed (we're using Default egress).

---

## Technical Debt / Future Improvements

1. **Database Backups:** Configure automated backups with 7-day retention
2. **Monitoring:** Set up CloudWatch alarms for RDS CPU, connections, storage
3. **Read Replicas:** Consider adding read replica in different AZ for HA
4. **Connection Pooling:** Implement PgBouncer or RDS Proxy for better connection management
5. **Environment Secrets:** Move DB password to AWS Secrets Manager
6. **Infrastructure as Code:** Convert all AWS resources to Terraform/CloudFormation

---

## Timeline Summary

**Session 1 (4 hours):**
- Initial deployment to App Runner
- Multiple RDS connection attempts (th-db-insights, thdbprod, th-insights-production v1)
- Security group modifications
- VPC connector creation
- Route table investigation and creation
- DB subnet group creation (`th-public-only`)
- Discovery of AWS limitation on subnet group modification

**Session 2 (1 hour):**
- RDS deletion and recreation with correct subnet group
- Database credential fixes
- Migration debugging and fixes
- Admin user creation
- **SUCCESS:** Full connectivity achieved

---

## Conclusion

After 5 hours of troubleshooting across two sessions, we successfully resolved AWS RDS connectivity issues caused by subnet routing misconfiguration. The key insight was understanding that AWS RDS subnet selection is non-deterministic and can result in placement in improperly-routed subnets, even when "Publicly accessible" is enabled.

**The solution required:**
1. Creating a custom DB subnet group with ONLY verified public subnets
2. Deleting and recreating the RDS instance (AWS limitation)
3. Fixing database credentials and schema migrations

**Current status:**
✅ Backend connected to RDS at public IP `16.146.254.36`  
✅ All migrations executed successfully  
✅ Admin user created and can login  
✅ Application fully functional  

**Recommended next step:** Remove the temporary `/signup` endpoint for security.
