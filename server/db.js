require("dotenv").config();
const {Pool}= require("pg");

const pool = new Pool({
    user: process.env.DB_USER,
    host:process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port:process.env.DB_PORT,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});
pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("❌ Database connection failed:", err.message);
  } else {
    console.log("✅ Database connected successfully!");
    console.log("Current Server Time:", res.rows[0].now);

    // Create products table if it doesn't exist
    pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        description TEXT,
        price VARCHAR(50),
        image_url TEXT,
        user_id INTEGER,
        show_mobile BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `).then(() => {
      // Safely try to add user_id and show_mobile in case the table already existed without it
      return pool.query(`
        ALTER TABLE products 
        ADD COLUMN IF NOT EXISTS user_id INTEGER,
        ADD COLUMN IF NOT EXISTS show_mobile BOOLEAN DEFAULT FALSE
      `);
    }).then(() => {
      console.log("✅ Products table verified with user_id and show_mobile");
      
      // Create users table if it doesn't exist
      return pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          mobile_no VARCHAR(20),
          gender VARCHAR(20),
          address TEXT,
          password VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }).then(() => {
      console.log("✅ Users table verified");
      // Create messages table
      return pool.query(`
        CREATE TABLE IF NOT EXISTS messages (
          id SERIAL PRIMARY KEY,
          sender_id INTEGER,
          receiver_id INTEGER,
          product_id INTEGER,
          message TEXT NOT NULL,
          is_read BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }).then(() => {
      // Safely try to add is_read in case the table already existed
      return pool.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE`);
    }).then(() => {
      console.log("✅ Messages table verified");
      
      // Create feedback table if it doesn't exist
      return pool.query(`
        CREATE TABLE IF NOT EXISTS feedback (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          rating INTEGER NOT NULL,
          category VARCHAR(100),
          message TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }).then(async () => {
      console.log("✅ Feedback table verified");
      
      // Auto-seed Admin user if not exists
      try {
        const adminEmail = 'admin@gmail.com';
        const checkAdmin = await pool.query("SELECT * FROM users WHERE email = $1", [adminEmail]);
        if (checkAdmin.rows.length === 0) {
          const bcrypt = require("bcryptjs");
          const hashedPassword = await bcrypt.hash('Np@275151', 10);
          await pool.query(
            `INSERT INTO users (name, email, password, mobile_no, gender, address)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            ['Admin', adminEmail, hashedPassword, '9999999999', 'Male', '{"city":"Ghaziabad","state":"Uttar Pradesh","pincode":"201009"}']
          );
          console.log("👥 Admin user ('admin@gmail.com') seeded successfully!");
        } else {
          console.log("👥 Admin user already exists.");
        }
      } catch (err) {
        console.error("❌ Error seeding Admin user:", err.message);
      }
    }).catch(err => console.error("❌ Error verifying database tables:", err.message));
  }
});
module.exports = pool;