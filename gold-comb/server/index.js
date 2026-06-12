const express = require('express');
const path = require('path');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

const JWT_SECRET = 'goldcomb_secret_key_2026';
const DEPOSIT_NUMBER = '0754235466';

// Database setup
const db = new Database(path.join(__dirname, '../data.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT DEFAULT 'User',
    wallet REAL DEFAULT 0,
    balance REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    series TEXT NOT NULL,
    amount REAL NOT NULL,
    daily_profit REAL NOT NULL,
    duration_days INTEGER NOT NULL,
    total_return REAL NOT NULL,
    start_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    end_date DATETIME,
    accumulated REAL DEFAULT 0,
    status TEXT DEFAULT 'active',
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    amount REAL NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// Gold bar products
const products = {
  A: [
    { id: 'A1', name: 'A-1 Mini Gold', series: 'A', price: 10000, daily_profit: 500, duration: 20, total_return: 30000, image: 'gold-a1.svg' },
    { id: 'A2', name: 'A-2 Small Gold', series: 'A', price: 25000, daily_profit: 1500, duration: 20, total_return: 55000, image: 'gold-a2.svg' },
    { id: 'A3', name: 'A-3 Standard Gold', series: 'A', price: 50000, daily_profit: 3500, duration: 20, total_return: 120000, image: 'gold-a3.svg' },
  ],
  B: [
    { id: 'B1', name: 'B-1 Premium Gold', series: 'B', price: 100000, daily_profit: 7000, duration: 25, total_return: 275000, image: 'gold-b1.svg' },
    { id: 'B2', name: 'B-2 Elite Gold', series: 'B', price: 250000, daily_profit: 18000, duration: 25, total_return: 700000, image: 'gold-b2.svg' },
    { id: 'B3', name: 'B-3 Royal Gold', series: 'B', price: 500000, daily_profit: 40000, duration: 25, total_return: 1500000, image: 'gold-b3.svg' },
  ],
  F: [
    { id: 'F1', name: 'F-1 Fortune Gold', series: 'F', price: 1000000, daily_profit: 80000, duration: 30, total_return: 3400000, image: 'gold-f1.svg' },
    { id: 'F2', name: 'F-2 Fortune Plus', series: 'F', price: 2500000, daily_profit: 210000, duration: 30, total_return: 8800000, image: 'gold-f2.svg' },
    { id: 'F3', name: 'F-3 Fortune Max', series: 'F', price: 5000000, daily_profit: 450000, duration: 30, total_return: 18500000, image: 'gold-f3.svg' },
  ],
  Z: [
    { id: 'Z1', name: 'Z-1 Zeus Gold', series: 'Z', price: 10000000, daily_profit: 1000000, duration: 35, total_return: 45000000, image: 'gold-z1.svg' },
    { id: 'Z2', name: 'Z-2 Zeus Premium', series: 'Z', price: 25000000, daily_profit: 2800000, duration: 35, total_return: 123000000, image: 'gold-z2.svg' },
    { id: 'Z3', name: 'Z-3 Zeus Ultimate', series: 'Z', price: 50000000, daily_profit: 6000000, duration: 35, total_return: 260000000, image: 'gold-z3.svg' },
  ]
};

// Auth middleware
function auth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ success: false, msg: 'No token' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (e) {
    return res.status(401).json({ success: false, msg: 'Invalid token' });
  }
}

// Auth routes
app.post('/api/register', (req, res) => {
  const { phone, password, name } = req.body;
  if (!phone || !password) return res.json({ success: false, msg: 'Phone and password required' });
  if (password.length < 6) return res.json({ success: false, msg: 'Password must be at least 6 characters' });

  const existing = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone);
  if (existing) return res.json({ success: false, msg: 'Phone already registered' });

  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare('INSERT INTO users (phone, password, name) VALUES (?, ?, ?)').run(phone, hash, name || 'User');
  const token = jwt.sign({ id: result.lastInsertRowid }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ success: true, token, user: { id: result.lastInsertRowid, phone, name: name || 'User', wallet: 0, balance: 0 } });
});

app.post('/api/login', (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) return res.json({ success: false, msg: 'Phone and password required' });

  const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
  if (!user) return res.json({ success: false, msg: 'Account not found' });

  if (!bcrypt.compareSync(password, user.password)) return res.json({ success: false, msg: 'Wrong password' });

  const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ success: true, token, user: { id: user.id, phone: user.phone, name: user.name, wallet: user.wallet, balance: user.balance } });
});

// User routes
app.get('/api/me', auth, (req, res) => {
  const user = db.prepare('SELECT id, phone, name, wallet, balance, created_at FROM users WHERE id = ?').get(req.userId);
  if (!user) return res.json({ success: false, msg: 'User not found' });

  // Calculate accumulated profits for active orders
  const orders = db.prepare('SELECT * FROM orders WHERE user_id = ? AND status = ?').all(req.userId, 'active');
  let totalDailyEarning = 0;
  const now = Date.now();

  for (const order of orders) {
    const startMs = new Date(order.start_date).getTime();
    const daysPassed = Math.min(Math.floor((now - startMs) / 86400000), order.duration_days);
    const accumulated = daysPassed * order.daily_profit;
    totalDailyEarning += order.daily_profit;

    if (accumulated !== order.accumulated) {
      db.prepare('UPDATE orders SET accumulated = ? WHERE id = ?').run(accumulated, order.id);
    }
    if (daysPassed >= order.duration_days && order.status === 'active') {
      db.prepare("UPDATE orders SET status = 'harvest', accumulated = ? WHERE id = ?").run(order.total_return, order.id);
    }
  }

  res.json({ success: true, user, daily_earning: totalDailyEarning });
});

// Products
app.get('/api/products', (req, res) => {
  res.json({ success: true, products });
});

app.get('/api/products/:series', (req, res) => {
  const series = req.params.series.toUpperCase();
  if (!products[series]) return res.json({ success: false, msg: 'Series not found' });
  res.json({ success: true, products: products[series] });
});

// Deposit info
app.get('/api/deposit-info', auth, (req, res) => {
  res.json({ success: true, number: DEPOSIT_NUMBER, name: 'Gold Comb Ltd', method: 'Mobile Money (AIRTEL/MTN)' });
});

// Confirm deposit (manual verification in real app)
app.post('/api/deposit', auth, (req, res) => {
  const { amount, txn_id } = req.body;
  if (!amount || amount < 10000) return res.json({ success: false, msg: 'Minimum deposit is 10,000 UGX' });
  if (!txn_id) return res.json({ success: false, msg: 'Transaction ID required' });

  db.prepare('UPDATE users SET wallet = wallet + ? WHERE id = ?').run(amount, req.userId);
  db.prepare('INSERT INTO transactions (user_id, type, amount, description) VALUES (?, ?, ?, ?)').run(req.userId, 'deposit', amount, `Deposit via Mobile Money (TXN: ${txn_id})`);

  const user = db.prepare('SELECT wallet, balance FROM users WHERE id = ?').get(req.userId);
  res.json({ success: true, msg: 'Deposit confirmed', wallet: user.wallet, balance: user.balance });
});

// Buy product
app.post('/api/buy', auth, (req, res) => {
  const { product_id } = req.body;
  let product = null;
  for (const series of Object.values(products)) {
    product = series.find(p => p.id === product_id);
    if (product) break;
  }
  if (!product) return res.json({ success: false, msg: 'Product not found' });

  const user = db.prepare('SELECT wallet FROM users WHERE id = ?').get(req.userId);
  if (user.wallet < product.price) return res.json({ success: false, msg: 'Insufficient wallet balance' });

  db.prepare('UPDATE users SET wallet = wallet - ? WHERE id = ?').run(product.price, req.userId);

  const endDate = new Date(Date.now() + product.duration * 86400000).toISOString();
  db.prepare('INSERT INTO orders (user_id, product_id, product_name, series, amount, daily_profit, duration_days, total_return, end_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
    req.userId, product.id, product.name, product.series, product.price, product.daily_profit, product.duration, product.total_return, endDate
  );

  db.prepare('INSERT INTO transactions (user_id, type, amount, description) VALUES (?, ?, ?, ?)').run(req.userId, 'purchase', -product.price, `Purchased ${product.name}`);

  res.json({ success: true, msg: `${product.name} purchased successfully!` });
});

// Orders
app.get('/api/orders', auth, (req, res) => {
  const orders = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY start_date DESC').all(req.userId);
  const now = Date.now();

  const enriched = orders.map(order => {
    const startMs = new Date(order.start_date).getTime();
    const daysPassed = Math.min(Math.floor((now - startMs) / 86400000), order.duration_days);
    const accumulated = daysPassed * order.daily_profit;
    const progress = Math.min((daysPassed / order.duration_days) * 100, 100);
    return { ...order, days_passed: daysPassed, accumulated, progress };
  });

  res.json({ success: true, orders: enriched });
});

// Harvest (collect completed order)
app.post('/api/harvest', auth, (req, res) => {
  const { order_id } = req.body;
  const order = db.prepare("SELECT * FROM orders WHERE id = ? AND user_id = ? AND status = 'harvest'").get(order_id, req.userId);
  if (!order) return res.json({ success: false, msg: 'Order not ready for harvest' });

  db.prepare("UPDATE orders SET status = 'completed' WHERE id = ?").run(order_id);
  db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(order.total_return, req.userId);
  db.prepare('INSERT INTO transactions (user_id, type, amount, description) VALUES (?, ?, ?, ?)').run(req.userId, 'harvest', order.total_return, `Harvested ${order.product_name}`);

  res.json({ success: true, msg: `Harvested ${order.product_name}! ${order.total_return.toLocaleString()} UGX added to balance.` });
});

// Withdraw
app.post('/api/withdraw', auth, (req, res) => {
  const { amount, phone, method } = req.body;
  if (!amount || amount < 10000) return res.json({ success: false, msg: 'Minimum withdrawal is 10,000 UGX' });

  const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.userId);
  if (user.balance < amount) return res.json({ success: false, msg: 'Insufficient balance' });

  db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(amount, req.userId);
  db.prepare('INSERT INTO transactions (user_id, type, amount, description) VALUES (?, ?, ?, ?)').run(req.userId, 'withdraw', -amount, `Withdrawal to ${method || 'Mobile Money'} ${phone || ''}`);

  res.json({ success: true, msg: 'Withdrawal submitted. Processing within 24 hours.' });
});

// Transactions
app.get('/api/transactions', auth, (req, res) => {
  const txns = db.prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 50').all(req.userId);
  res.json({ success: true, transactions: txns });
});

// Catch-all SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Gold Comb server running on port ${PORT}`);
});
