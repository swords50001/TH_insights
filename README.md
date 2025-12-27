# TH Insights Dashboard

A multi-tenant analytics dashboard with dynamic, customizable quadrants and real-time data visualization.

## Quick Start

### Prerequisites
- Docker Desktop
- Git

### Running the Application

1. **Start all services:**
   ```bash
   docker compose up -d
   ```

2. **Access the application:**
   - Dashboard: http://localhost:3000/dashboard
   - Admin Cards: http://localhost:3000/admin
   - Admin Dashboard Editor: http://localhost:3000/admin/dashboard
   - Database Admin (Adminer): http://localhost:8081
   - Backend API: http://localhost:8080

3. **Stop the application:**
   ```bash
   docker compose down
   ```

## Creating Dashboard Cards

Dashboard cards display metrics or tables based on SQL queries executed against your database.

### Card Structure

Each card has the following fields:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Display name of the card |
| `description` | text | No | Description of what the card shows |
| `sql_query` | text | Yes | SQL query to execute |
| `visualization_type` | string | Yes | Either `"metric"` or `"table"` |
| `is_active` | boolean | No | Whether to show the card (default: true) |

### Method 1: Using Admin UI

1. Navigate to http://localhost:3000/admin
2. Fill in the form:
   - **Title**: Card name (e.g., "Total Revenue")
   - **Description**: What the card displays
   - **SQL Query**: Your SELECT query
   - **Type**: Choose "Metric" or "Table"
3. Click "Add Card"

### Method 2: Direct Database Insert

Connect to the database and insert cards directly:

```bash
docker compose exec db psql -U postgres -d th_db
```

Then run:

```sql
INSERT INTO dashboard_cards (title, description, sql_query, visualization_type)
VALUES ('Card Title', 'Description', 'SELECT query', 'metric');
```

## SQL Query Guidelines

### For Metric Cards

Metric cards display a single number. Your query should return **one row with one numeric column**.

**Option 1: Use a column named `total`**
```sql
SELECT 125430.50 as total
```

**Option 2: Return any single numeric value**
```sql
SELECT COUNT(*) FROM users
```

**Real-world examples:**

```sql
-- Total revenue
SELECT SUM(amount) as total FROM orders WHERE status = 'completed';

-- Active user count
SELECT COUNT(*) as total FROM users WHERE last_login > NOW() - INTERVAL '30 days';

-- Average order value
SELECT ROUND(AVG(amount)::numeric, 2) as total FROM orders;

-- Month-over-month growth percentage
SELECT ROUND(
  ((COUNT(*) FILTER (WHERE created_at >= date_trunc('month', CURRENT_DATE)) * 100.0) / 
   NULLIF(COUNT(*) FILTER (WHERE created_at >= date_trunc('month', CURRENT_DATE) - INTERVAL '1 month' 
                                AND created_at < date_trunc('month', CURRENT_DATE)), 0) - 100)::numeric, 
  2
) as total
FROM orders;
```

### For Table Cards

Table cards display rows of data in a table format. Return multiple columns and rows.

**Examples:**

```sql
-- Recent orders
SELECT 
  id,
  customer_name,
  amount,
  status,
  created_at
FROM orders
ORDER BY created_at DESC
LIMIT 10;

-- Top products by revenue
SELECT 
  product_name,
  SUM(quantity) as units_sold,
  SUM(amount) as total_revenue
FROM order_items
GROUP BY product_name
ORDER BY total_revenue DESC
LIMIT 5;

-- Customer summary
SELECT 
  customer_id,
  customer_name,
  COUNT(*) as order_count,
  SUM(amount) as lifetime_value,
  MAX(created_at) as last_order
FROM orders
GROUP BY customer_id, customer_name
ORDER BY lifetime_value DESC;
```

### SQL Query Safety Rules

The system enforces these safety restrictions:

1. **Only SELECT queries allowed** - No INSERT, UPDATE, DELETE, DROP, etc.
2. **No dangerous keywords** - Comments (--), multiple statements (;), or SQL injection patterns are blocked
3. **Row limit enforced** - Results are automatically limited to 1000 rows max
4. **No nested transactions** - Queries are executed in read-only mode

## Organizing Cards into Quadrants

### Auto-Assignment

By default, cards are auto-assigned based on type:
- **Metric cards** → "Metrics" quadrant (top-left)
- **Table cards** → "Tables" quadrant (top-right)

### Manual Assignment (Admin Only)

#### Method 1: Dropdown in Admin Cards Page

1. Go to http://localhost:3000/admin
2. Find the card in the table
3. Use the "Assigned Quadrant" dropdown
4. Select: Metrics, Tables, Analytics, or Reports

#### Method 2: Drag-and-Drop in Admin Dashboard

1. Go to http://localhost:3000/admin/dashboard
2. Drag cards between quadrants
3. Changes save automatically to localStorage

### Available Quadrants

Default quadrants (can be customized):
- **Metrics** (top-left)
- **Tables** (top-right)
- **Analytics** (bottom-left)
- **Reports** (bottom-right)

You can add more quadrants using the "+ Add Quadrant" button in the dashboard.

## Customizing the Dashboard Layout

### For Admin Users

1. Navigate to http://localhost:3000/admin/dashboard
2. **Add Quadrants**: Click "+ Add Quadrant"
3. **Move Quadrants**: Drag the header to reposition
4. **Resize Quadrants**: Drag the bottom-right corner handle
5. **Move Cards**: Drag cards between quadrants
6. **Remove Quadrants**: Click the "×" button
7. **Reset Layout**: Click "Reset Layout" to restore default 2×2 grid

All changes persist in localStorage automatically.

## Example: Complete Card Setup

### Create a "Total Revenue" Metric Card

```bash
# Connect to database
docker compose exec db psql -U postgres -d th_db

# Insert the card
INSERT INTO dashboard_cards (title, description, sql_query, visualization_type)
VALUES (
  'Total Revenue',
  'Sum of all completed orders',
  'SELECT SUM(amount) as total FROM orders WHERE status = ''completed''',
  'metric'
);

# Verify it was created
SELECT * FROM dashboard_cards WHERE title = 'Total Revenue';
```

### Create a "Top Customers" Table Card

```sql
INSERT INTO dashboard_cards (title, description, sql_query, visualization_type)
VALUES (
  'Top Customers',
  'Top 10 customers by lifetime value',
  'SELECT customer_name, SUM(amount) as total_spent, COUNT(*) as order_count 
   FROM orders 
   GROUP BY customer_name 
   ORDER BY total_spent DESC 
   LIMIT 10',
  'table'
);
```

## Troubleshooting

### Cards Not Showing Data

1. Check backend logs: `docker compose logs backend`
2. Check SQL query returns data:
   ```bash
   docker compose exec db psql -U postgres -d th_db -c "YOUR_QUERY_HERE"
   ```
3. Verify card is active: `is_active = true`

### Cards in Wrong Quadrant

1. Clear localStorage: Browser console → `localStorage.clear()`
2. Refresh the page
3. Reassign cards in Admin page

### Backend Connection Issues

1. Verify services are running: `docker compose ps`
2. Check database connection: `docker compose logs db`
3. Restart services: `docker compose restart backend`

## Database Schema

### dashboard_cards Table

```sql
CREATE TABLE dashboard_cards (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  sql_query TEXT,
  visualization_type VARCHAR(50) DEFAULT 'metric',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Development Setup (Without Docker)

### Backend (Express + TypeScript)

1. Copy example env and fill values:
   ```bash
   cd backend
   cp .env.example .env
   # edit .env and set JWT_SECRET and DB_* values
   ```

2. Install and run in dev (uses `ts-node`):
   ```bash
   npm install
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   npm start
   ```

### Frontend (Vite + React)

1. Copy example env:
   ```bash
   cd frontend
   cp .env.example .env
   # edit VITE_API_URL if backend runs on different host/port
   ```

2. Install and run dev server (default Vite port 5173):
   ```bash
   npm install
   npm run dev
   ```

### Environment Variables

Backend configuration:
- `JWT_SECRET` - Secret key for JWT token generation
- `DB_HOST` - Database host (use `localhost` for local dev, `db` for Docker)
- `DB_PORT` - Database port (default: 5432)
- `DB_NAME` - Database name
- `DB_USER` - Database username
- `DB_PASSWORD` - Database password

Frontend configuration:
- `VITE_API_URL` - Backend API URL (default: http://localhost:8080)

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, React Router
- **Backend**: Node.js 20, Express, TypeScript
- **Database**: PostgreSQL 15
- **Deployment**: Docker, Docker Compose, Nginx

## License

MIT
