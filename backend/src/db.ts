
import { Pool } from "pg";

const useSSL = process.env.DB_SSL === 'true';

export const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: useSSL ? { rejectUnauthorized: false } : false
});
