
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
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
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("PuranaMall API is running successfully!");
});


// ================= MAIL HELPER =================
async function sendEmail(to, subject, html) {
  const nodemailer = require("nodemailer");
  let transporter;
  let isSandbox = false;

  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    const host = process.env.EMAIL_HOST || "mail.privateemail.com";
    const port = parseInt(process.env.EMAIL_PORT, 10) || 465;
    const secure = process.env.EMAIL_SECURE !== "false" && (process.env.EMAIL_SECURE === "true" || port === 465);

    transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        rejectUnauthorized: true
      }
    });
  } else {
    isSandbox = true;
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    console.log(`✉️ Local SMTP sandbox configured. Test link login at: https://ethereal.email`);
  }

  const fromAddress = process.env.EMAIL_FROM || (process.env.EMAIL_USER ? `"PuranaMall Support" <${process.env.EMAIL_USER}>` : `"PuranaMall Support" <no-reply@puranamall.in>`);

  const info = await transporter.sendMail({
    from: fromAddress,
    to,
    subject,
    html
  });

  if (isSandbox) {
    console.log(`✉️ Ethereal Sandbox Email Sent! View link: ${nodemailer.getTestMessageUrl(info)}`);
  }
  return info;
}

// ================= OTP GENERATION & VERIFICATION =================

app.post("/api/auth/send-otp", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: "Email is required." });
  }

  try {
    // Check if email already exists
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Email already exists"
      });
    }

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes validity

    // Save to database
    await pool.query("DELETE FROM email_otps WHERE email = $1", [email]);
    await pool.query(
      "INSERT INTO email_otps (email, otp, expires_at) VALUES ($1, $2, $3)",
      [email, otp, expiresAt]
    );

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff; color: #1e293b;">
        <h2 style="color: #00a8b5; text-align: center; margin-bottom: 24px;">PuranaMall Verification Code</h2>
        <p>Thank you for signing up on PuranaMall. Please use the following One-Time Password (OTP) to complete your email verification:</p>
        <div style="text-align: center; margin: 32px 0;">
          <span style="font-size: 32px; font-weight: bold; color: #00a8b5; letter-spacing: 6px; padding: 12px 28px; background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; display: inline-block;">${otp}</span>
        </div>
        <p style="font-size: 14px; color: #64748b; margin-top: 24px;">This OTP is valid for <strong>10 minutes</strong>. If you did not request this, you can ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">PuranaMall Next Gen Campus Marketplace</p>
      </div>
    `;

    await sendEmail(email, "Verify Your Email - PuranaMall OTP", htmlContent);

    res.json({
      success: true,
      message: "A verification OTP has been sent to your email address."
    });

  } catch (error) {
    console.error("Error sending signup OTP:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send verification OTP."
    });
  }
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
      password,
      otp
    } = req.body;

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: "Email verification OTP is required."
      });
    }

    // Verify OTP in db
    const otpResult = await pool.query(
      "SELECT * FROM email_otps WHERE email = $1 AND otp = $2 AND expires_at > NOW()",
      [email, otp]
    );
    const otpValid = otpResult.rows.length > 0;

    if (!otpValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification OTP."
      });
    }

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

    // Clean up OTP
    await pool.query("DELETE FROM email_otps WHERE email = $1", [email]);

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


// ================= PASSWORD RECOVERY =================

app.post("/api/auth/forgot-password", async (req, res) => {
  const { email } = req.body;
  const crypto = require("crypto");

  try {
    const userResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "No account found with this email address." });
    }

    const user = userResult.rows[0];
    const token = crypto.randomBytes(20).toString("hex");
    const expires = new Date(Date.now() + 3600000); // 1 hour validity

    await pool.query(
      "UPDATE users SET reset_password_token = $1, reset_password_expires = $2 WHERE id = $3",
      [token, expires, user.id]
    );

    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const resetUrl = `${clientUrl}/reset-password/${token}`;

    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #10b981; text-align: center;">PuranaMall Recovery Portal</h2>
          <p>Hello <strong>${user.name}</strong>,</p>
          <p>You requested a secure password reset link for your campus account. Click the button below to update your credentials:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset My Password</a>
          </div>
          <p style="font-size: 12px; color: #64748b;">This link is valid for 1 hour. If you did not trigger this request, you can safely ignore this email.</p>
        </div>
      `;

    await sendEmail(user.email, "Password Reset Request Link - PuranaMall", htmlContent);

    res.json({ success: true, message: "A secure reset link has been dispatched to your email address!" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server encountered an error sending reset email." });
  }
});

app.post("/api/auth/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    const userResult = await pool.query(
      "SELECT * FROM users WHERE reset_password_token = $1 AND reset_password_expires > NOW()",
      [token]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ success: false, message: "Password reset link is invalid or has expired." });
    }

    const user = userResult.rows[0];
    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      "UPDATE users SET password = $1, reset_password_token = NULL, reset_password_expires = NULL WHERE id = $2",
      [hashedPassword, user.id]
    );

    res.json({ success: true, message: "Your password has been successfully reset! Redirecting to login..." });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server encountered an error resetting your password." });
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

// Delete a product
app.delete("/api/products/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Verify ownership
    const productCheck = await pool.query("SELECT user_id FROM products WHERE id = $1", [id]);
    if (productCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    if (productCheck.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: "Unauthorized to delete this product" });
    }

    // Delete associated messages and then the product
    await pool.query("DELETE FROM messages WHERE product_id = $1", [id]);
    await pool.query("DELETE FROM products WHERE id = $1", [id]);

    res.json({
      success: true,
      message: "Product deleted successfully"
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});


app.get("/api/products", async (req, res) => {
  try {
    const products = await pool.query(`
      SELECT p.*, u.name as user_name, u.address as user_address, u.mobile_no 
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

    // Emit real-time message
    io.to(receiver_id.toString()).emit("newMessage", newMessage.rows[0]);

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

// ================= FEEDBACK =================
app.post("/api/feedback", async (req, res) => {
  try {
    const { name, email, rating, category, message } = req.body;
    
    if (!name || !email || !rating || !message) {
      return res.status(400).json({ success: false, message: "Missing required feedback fields" });
    }

    const newFeedback = await pool.query(
      `INSERT INTO feedback (name, email, rating, category, message)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, email, parseInt(rating), category || 'General', message]
    );

    res.status(201).json({
      success: true,
      message: "Feedback submitted successfully! Thank you for helping us improve.",
      feedback: newFeedback.rows[0]
    });
  } catch (error) {
    console.error("Error submitting feedback:", error);
    res.status(500).json({ success: false, message: "Server error while processing feedback", error: error.message });
  }
});

// ================= ADMIN CONSOLIDATED DATA =================
app.get("/api/admin/data", async (req, res) => {
  try {
    const users = await pool.query("SELECT id, name, email, mobile_no, gender, address, created_at FROM users ORDER BY created_at DESC");
    const products = await pool.query(`
      SELECT p.*, u.name as user_name, u.email as user_email 
      FROM products p 
      LEFT JOIN users u ON p.user_id = u.id 
      ORDER BY p.created_at DESC
    `);
    const feedback = await pool.query("SELECT * FROM feedback ORDER BY created_at DESC");

    res.json({
      success: true,
      users: users.rows,
      products: products.rows,
      feedback: feedback.rows,
      uptime: Math.floor(process.uptime()),
      activeUsers: io.engine.clientsCount || 0,
      apiLimit: "Unlimited"
    });
  } catch (error) {
    console.error("Error fetching admin consolidated data:", error);
    res.status(500).json({ success: false, message: "Server error fetching admin data", error: error.message });
  }
});


// ================= DYNAMIC COLLEGES ENDPOINTS =================

// 1. Fetch all colleges (ordered alphabetically)
app.get("/api/colleges", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM colleges ORDER BY name ASC");
    res.json({ success: true, colleges: result.rows.map(r => r.name) });
  } catch (error) {
    console.error("Error fetching colleges:", error);
    res.status(500).json({ success: false, message: "Error loading college list." });
  }
});

// 2. Add a new college (Admin/Secure route)
app.post("/api/colleges", async (req, res) => {
  const { name } = req.body;
  if (!name || name.trim() === "") {
    return res.status(400).json({ success: false, message: "College name cannot be empty." });
  }

  try {
    const checkDup = await pool.query("SELECT * FROM colleges WHERE name = $1", [name.trim()]);
    if (checkDup.rows.length > 0) {
      return res.status(400).json({ success: false, message: "This college is already listed in the marketplace!" });
    }

    await pool.query("INSERT INTO colleges (name) VALUES ($1)", [name.trim()]);

    // Emit real-time notification to all connected clients that a new college has been added!
    io.emit("newCollegeAdded", name.trim());

    res.status(201).json({ success: true, message: "College added successfully to the campus database!" });
  } catch (error) {
    console.error("Error adding college:", error);
    res.status(500).json({ success: false, message: "Server error inserting college name." });
  }
});


// ================= SOCKET.IO =================

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("join", (userId) => {
    socket.join(userId.toString());
  });

  socket.on("typing", (data) => {
    io.to(data.receiverId.toString()).emit("typing", {
      senderId: data.senderId,
      productId: data.productId
    });
  });

  socket.on("stopTyping", (data) => {
    io.to(data.receiverId.toString()).emit("stopTyping", {
      senderId: data.senderId,
      productId: data.productId
    });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// ================= SERVER =================

if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;