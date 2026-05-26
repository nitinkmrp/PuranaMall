
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
require("dotenv").config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const upload = multer({ dest: "/tmp" });

const pool = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("PuranaMall API is running successfully!");
});


// ================= SIGNUP =================

app.post("/api/auth/signup", async (req, res) => {
  try {

    const {
      name,
      email,
      mobile_no,
      gender,
      address,
      password
    } = req.body;

    // check existing user
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        message: "Email already exists"
      });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // insert user
    const newUser = await pool.query(
      `INSERT INTO users
      (name, email, mobile_no, gender, address, password)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        name,
        email,
        mobile_no,
        gender,
        address,
        hashedPassword
      ]
    );

    res.status(201).json({
      success: true,
      message: "Signup successful",
      user: newUser.rows[0]
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});



// ================= LOGIN =================

app.post("/api/auth/login", async (req, res) => {

  try {

    const { email, password } = req.body;

    // find user
    const user = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (user.rows.length === 0) {
      return res.status(400).json({
        message: "User not found"
      });
    }

    // compare password
    const validPassword = await bcrypt.compare(
      password,
      user.rows[0].password
    );

    if (!validPassword) {
      return res.status(400).json({
        message: "Invalid password"
      });
    }

    // create token
    const token = jwt.sign(
      { id: user.rows[0].id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: user.rows[0]
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});


// ================= MIDDLEWARE =================

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: "Access Denied: No Token Provided!" });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    res.status(400).json({ message: "Invalid Token" });
  }
};

// Update user profile (address specifically)
app.put("/api/auth/profile", authenticateToken, async (req, res) => {
  try {
    const { address } = req.body;
    
    const updatedUser = await pool.query(
      `UPDATE users 
       SET address = $1
       WHERE id = $2 RETURNING *`,
      [address, req.user.id]
    );

    if (updatedUser.rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser.rows[0]
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});


// ================= PRODUCTS (RESELL) =================

app.post("/api/products", authenticateToken, upload.single("image"), async (req, res) => {
  try {
    const { name, category, description, price, show_mobile } = req.body;
    let imageUrl = null;

    if (req.file) {
      // Upload to cloudinary
      const result = await cloudinary.uploader.upload(req.file.path);
      imageUrl = result.secure_url;
      // Delete temporary file
      fs.unlinkSync(req.file.path);
    }

    // Insert into postgres
    const newProduct = await pool.query(
      `INSERT INTO products (name, category, description, price, image_url, user_id, show_mobile)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, category, description, price, imageUrl, req.user.id, show_mobile === 'true']
    );

    res.status(201).json({
      success: true,
      message: "Product listed successfully",
      product: newProduct.rows[0]
    });
  } catch (error) {
    console.log(error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      success: false,
      message: "Server error while listing product",
      error: error.message
    });
  }
});

// Update a product
app.put("/api/products/:id", authenticateToken, upload.single("image"), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, description, price, show_mobile } = req.body;
    let imageUrl = req.body.image_url; // Assume existing image if no new file

    // Verify ownership
    const productCheck = await pool.query("SELECT user_id, image_url FROM products WHERE id = $1", [id]);
    if (productCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    if (productCheck.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: "Unauthorized to edit this product" });
    }

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path);
      imageUrl = result.secure_url;
      fs.unlinkSync(req.file.path);
    } else if (!imageUrl) {
      imageUrl = productCheck.rows[0].image_url;
    }

    const updatedProduct = await pool.query(
      `UPDATE products 
       SET name = $1, category = $2, description = $3, price = $4, image_url = $5, show_mobile = $6
       WHERE id = $7 RETURNING *`,
      [name, category, description, price, imageUrl, show_mobile === 'true', id]
    );

    res.json({
      success: true,
      message: "Product updated successfully",
      product: updatedProduct.rows[0]
    });
  } catch (error) {
    console.log(error);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

app.get("/api/products", async (req, res) => {
  try {
    const products = await pool.query(`
      SELECT p.*, u.address as user_address 
      FROM products p 
      LEFT JOIN users u ON p.user_id = u.id 
      ORDER BY p.created_at DESC
    `);
    res.json({
      success: true,
      products: products.rows
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching products"
    });
  }
});

app.get("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const product = await pool.query(`
      SELECT p.*, u.name as user_name, u.address as user_address, u.mobile_no 
      FROM products p 
      LEFT JOIN users u ON p.user_id = u.id 
      WHERE p.id = $1
    `, [id]);
    
    if (product.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    
    res.json({
      success: true,
      product: product.rows[0]
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ================= MESSAGES (CHAT) =================

app.post("/api/messages", authenticateToken, async (req, res) => {
  try {
    const { receiver_id, product_id, message } = req.body;
    const sender_id = req.user.id;

    if (!receiver_id || !product_id || !message) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const newMessage = await pool.query(
      "INSERT INTO messages (sender_id, receiver_id, product_id, message) VALUES ($1, $2, $3, $4) RETURNING *",
      [sender_id, receiver_id, product_id, message]
    );

    res.status(201).json({ success: true, message: newMessage.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.get("/api/messages/chat/:otherUserId/:productId", authenticateToken, async (req, res) => {
  try {
    const { otherUserId, productId } = req.params;
    const currentUserId = req.user.id;

    // Mark incoming messages as read
    await pool.query(`
      UPDATE messages 
      SET is_read = TRUE 
      WHERE product_id = $1 AND sender_id = $2 AND receiver_id = $3 AND is_read = FALSE
    `, [productId, otherUserId, currentUserId]);

    const messages = await pool.query(`
      SELECT m.*, 
             s.name as sender_name, 
             r.name as receiver_name
      FROM messages m
      JOIN users s ON m.sender_id = s.id
      JOIN users r ON m.receiver_id = r.id
      WHERE m.product_id = $1 
        AND ((m.sender_id = $2 AND m.receiver_id = $3) OR (m.sender_id = $3 AND m.receiver_id = $2))
      ORDER BY m.created_at ASC
    `, [productId, currentUserId, otherUserId]);

    res.json({ success: true, messages: messages.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.get("/api/messages/unread-count", authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const result = await pool.query(`
      SELECT COUNT(*) as unread_count 
      FROM messages 
      WHERE receiver_id = $1 AND is_read = FALSE
    `, [currentUserId]);

    res.json({ success: true, unreadCount: parseInt(result.rows[0].unread_count) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.get("/api/messages/conversations", authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const conversations = await pool.query(`
      SELECT DISTINCT 
        m.product_id, 
        p.name as product_name, 
        p.image_url as product_image,
        CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END as other_user_id,
        u.name as other_user_name
      FROM messages m
      JOIN products p ON m.product_id = p.id
      JOIN users u ON u.id = CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END
      WHERE m.sender_id = $1 OR m.receiver_id = $1
    `, [currentUserId]);

    res.json({ success: true, conversations: conversations.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ================= SERVER =================

if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;