const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    const res = await pool.query("SELECT id, name, email, mobile_no, gender, address FROM users WHERE email = $1", ["testregisterotp@gmail.com"]);
    console.log("Database user records for testregisterotp@gmail.com:");
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (error) {
    console.error("Database query failed:", error);
  } finally {
    await pool.end();
  }
}

main();
