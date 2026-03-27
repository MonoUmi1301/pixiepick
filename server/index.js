const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const app = express();
const port = process.env.PORT || 8888;

// ====== CORS ======
// Railway frontend URL ใส่ใน env: FRONTEND_URL=https://your-frontend.up.railway.app
const allowedOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // อนุญาต localhost (dev) และ origins ที่กำหนดใน env (production)
    if (
      !origin ||
      origin.startsWith('http://localhost') ||
      origin.startsWith('http://127.0.0.1') ||
      allowedOrigins.includes(origin)
    ) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS: ' + origin));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

app.use(bodyParser.json());

// ====== Static files + uploads ======
// Railway ไม่มี persistent disk (free tier) — ใช้ /tmp สำหรับ upload
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
app.use('/uploads', express.static(uploadDir));

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// ====== MySQL Connection (Railway MySQL Plugin ใช้ env อัตโนมัติ) ======
let conn = null;
const initMySQL = async () => {
  conn = await mysql.createConnection({
    host:     process.env.MYSQLHOST     || process.env.DB_HOST     || '127.0.0.1',
    user:     process.env.MYSQLUSER     || process.env.DB_USER     || 'root',
    password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || 'root',
    database: process.env.MYSQLDATABASE || process.env.DB_NAME     || 'pixelstore_db',
    port:     process.env.MYSQLPORT     || process.env.DB_PORT     || 3306,
    // retry ถ้า connection หลุด
    connectTimeout: 10000,
  });

  // reconnect อัตโนมัติเมื่อ connection หลุด
  conn.on('error', async (err) => {
    console.error('MySQL connection error:', err.message);
    if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ECONNRESET') {
      console.log('Reconnecting to MySQL...');
      await initMySQL();
    }
  });
};

// Helper: ตรวจสอบ connection ก่อน query ทุกครั้ง
const query = async (sql, params) => {
  try {
    return await conn.query(sql, params);
  } catch (err) {
    if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ECONNRESET') {
      await initMySQL();
      return await conn.query(sql, params);
    }
    throw err;
  }
};

// Helper: สร้าง image URL ที่ถูกต้องตาม environment
const getImageUrl = (req, filename) => {
  const baseUrl = process.env.RAILWAY_PUBLIC_DOMAIN
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
    : `${req.protocol}://${req.get('host')}`;
  return `${baseUrl}/uploads/${filename}`;
};

// ====== Health Check (Railway ใช้ตรวจสอบว่า server ทำงาน) ======
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ========== Users ==========

app.post('/users/register', async (req, res) => {
  const { email, password, firstname, lastname } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  try {
    const [existing] = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    const [result] = await query(
      'INSERT INTO users (email, password, firstname, lastname) VALUES (?, ?, ?, ?)',
      [email, password, firstname, lastname]
    );
    res.json({ message: 'User registered successfully', userId: result.insertId });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', errorMessage: error.message });
  }
});

app.post('/users/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  try {
    const [rows] = await query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
    const user = rows[0];
    if (password !== user.password) return res.status(401).json({ message: 'Incorrect password' });
    res.json({ message: 'Login successful', user });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', errorMessage: error.message });
  }
});

app.post('/users/update', async (req, res) => {
  const { email, firstname, lastname, age, gender, interests, description, payment_method } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required for updating profile.' });
  try {
    const [existing] = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length === 0) return res.status(404).json({ message: 'User not found.' });
    await query(
      'UPDATE users SET firstname=?, lastname=?, age=?, gender=?, interests=?, description=?, payment_method=? WHERE email=?',
      [firstname, lastname, age, gender, interests, description, payment_method, email]
    );
    res.json({ message: 'Profile updated successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', errorMessage: error.message });
  }
});

app.get('/users/profile/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await query('SELECT * FROM users WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', errorMessage: error.message });
  }
});

// ========== Products ==========

app.post('/products', upload.single('image'), async (req, res) => {
  const { name, description, price, stock } = req.body;
  const img_url = req.file ? req.file.filename : 'default.png';
  try {
    const [result] = await query(
      'INSERT INTO products (name, description, price, stock, img_url) VALUES (?, ?, ?, ?, ?)',
      [name, description, price, stock, img_url]
    );
    res.json({ message: 'Product added successfully', productId: result.insertId, img_url });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', errorMessage: error.message });
  }
});

app.get('/products', async (req, res) => {
  try {
    const [products] = await query('SELECT id, name, description, price, stock, img_url FROM products');
    const productsWithImages = products.map(p => ({
      ...p,
      img_url: getImageUrl(req, p.img_url)  // ✅ URL ถูกต้องทั้ง local และ Railway
    }));
    res.json(productsWithImages);
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', errorMessage: error.message });
  }
});

// ========== Orders ==========

app.post('/orders', async (req, res) => {
  const { user_id, total_price, shipping_address, payment_method, items } = req.body;
  if (!user_id || !total_price || !shipping_address || !payment_method || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'ข้อมูลไม่ครบ หรือไม่มีสินค้าในรายการ' });
  }
  try {
    const [orderResult] = await query(
      `INSERT INTO orders (user_id, total_price, shipping_address, payment_method, status) VALUES (?, ?, ?, ?, 'pending')`,
      [user_id, total_price, shipping_address, payment_method]
    );
    const orderId = orderResult.insertId;
    for (const item of items) {
      const { id: product_id, quantity, price } = item;
      if (!product_id || !quantity || !price) continue;
      await query(
        'INSERT INTO order_items (order_id, product_id, quantity, price, subtotal) VALUES (?, ?, ?, ?, ?)',
        [orderId, product_id, quantity, price, quantity * price]
      );
    }
    res.status(201).json({ message: 'Order created successfully', orderId });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Internal Server Error', errorMessage: error.message });
  }
});

// ========== Admin API ==========

app.get('/api/all-users', async (req, res) => {
  try {
    const [users] = await query('SELECT id, email, firstname AS first_name, lastname AS last_name FROM users');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching users', error: err.message });
  }
});

app.get('/api/search', async (req, res) => {
  const { query: q } = req.query;
  if (!q) return res.status(400).json({ message: 'Query is required' });
  try {
    let rows;
    if (!isNaN(q)) {
      [rows] = await query('SELECT * FROM users WHERE id = ?', [q]);
    } else {
      [rows] = await query('SELECT * FROM users WHERE email LIKE ?', [`%${q}%`]);
    }
    res.json(rows.map(u => ({ id: u.id, email: u.email, first_name: u.firstname, last_name: u.lastname })));
  } catch (err) {
    res.status(500).json({ message: 'Search error', error: err.message });
  }
});

app.get('/api/user/:id', async (req, res) => {
  try {
    const [rows] = await query('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
    const u = rows[0];
    res.json({
      id: u.id, email: u.email, first_name: u.firstname, last_name: u.lastname,
      age: u.age, gender: u.gender, interests: u.interests,
      description: u.description, payment_method: u.payment_method
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching user', error: err.message });
  }
});

app.put('/api/user/:id', async (req, res) => {
  const { email, first_name, last_name, age, gender, interests, description, payment_method } = req.body;
  try {
    await query(
      'UPDATE users SET email=?, firstname=?, lastname=?, age=?, gender=?, interests=?, description=?, payment_method=? WHERE id=?',
      [email, first_name, last_name, age, gender, interests, description, payment_method, req.params.id]
    );
    res.json({ message: 'User updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error updating user', error: err.message });
  }
});

app.delete('/api/user/:id', async (req, res) => {
  try {
    await query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting user', error: err.message });
  }
});

app.get('/api/user/:id/orders', async (req, res) => {
  try {
    const [orders] = await query(
      'SELECT id, total_price AS total, status FROM orders WHERE user_id = ?',
      [req.params.id]
    );
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching orders', error: err.message });
  }
});

app.get('/api/check-role', async (req, res) => {
  const userId = req.query.user_id;
  if (!userId) return res.status(400).json({ message: 'User ID is required' });
  try {
    const [rows] = await query('SELECT role FROM users WHERE id = ?', [userId]);
    if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json({ role: rows[0].role });
  } catch (err) {
    res.status(500).json({ message: 'Error checking role', error: err.message });
  }
});

// ====== Start Server ======
app.listen(port, async () => {
  try {
    await initMySQL();
    console.log('✅ MySQL connected successfully');
  } catch (err) {
    console.error('❌ MySQL connection failed:', err.message);
    process.exit(1); // ถ้า DB ต่อไม่ได้ให้ crash ทันที Railway จะ restart ให้
  }
  console.log(`🚀 Server running on port ${port}`);
});
