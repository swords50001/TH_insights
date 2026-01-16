const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  host: 'th-insights-db.cx4mmeokynqf.us-west-2.rds.amazonaws.com',
  user: 'thadmin',
  password: 'DJJAiKQVI0RTVHK',
  database: 'th-db-insights',
  port: 5432,
});

async function createUser(email, password, name) {
  try {
    // Create users table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert user
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name',
      [email, passwordHash, name || email]
    );

    console.log('✅ User created successfully:', result.rows[0]);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

const email = process.argv[2];
const password = process.argv[3];
const name = process.argv[4];

if (!email || !password) {
  console.log('Usage: node create-user.js <email> <password> [name]');
  process.exit(1);
}

createUser(email, password, name);
