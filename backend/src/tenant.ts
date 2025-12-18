import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';

const tenantsPath = path.resolve(__dirname, '..', 'config', 'tenants.json');
let tenants: Record<string, any> = {};

try {
  const raw = fs.readFileSync(tenantsPath, 'utf8');
  tenants = JSON.parse(raw);
} catch (err) {
  console.warn('Could not load tenants.json, defaulting to empty tenants');
}

export interface TenantRequest extends Request {
  tenant?: any;
}

export function tenantResolver(req: TenantRequest, _res: Response, next: NextFunction) {
  const host = (req.headers.host || '').split(':')[0];
  // Map host to tenant config or fallback to `default` tenant
  const cfg = tenants[host] || tenants['default'] || null;
  req.tenant = cfg;
  next();
}

export function getTenantConfig(req: TenantRequest) {
  return req.tenant || null;
}
