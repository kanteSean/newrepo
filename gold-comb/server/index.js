const express = require('express');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

const JWT_SECRET = 'goldcomb_secret_key_2026';
const DEPOSIT_NUMBER = '0754235466';
const DB_FILE = path.join(__dirname, '../data.json');

// Simple JSON file database
function loadDB() {
  try {
    if (fs.existsSync(DB_FILE)) return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (e) {}
  return { users: [], orders: [], transactions: [], nextId: 1 };
}

function saveDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function getDB() { return loadDB(); }

// Gold bar products
const products = {
  A: [
    { id: 'A1', name: 'A-1 Mini Gold', series: 'A', price: 10000, daily_profit: 500, duration: 20, total_return: 30000 },
    { id: 'A2', name: 'A-2 Small Gold', series: 'A', price: 25000, daily_profit: 1500, duration: 20, total_return: 55000 },
    { id: 'A3', name: 'A-3 Standard Gold', series: 'A', price: 50000, daily_profit: 3500, duration: 20, total_return: 120000 },
  ],
  B: [
    { id: 'B1', name: 'B-1 Premium Gold', series: 'B', price: 100000, daily_profit: 7000, duration: 25, total_return: 275000 },
    { id: 'B2', name: 'B-2 Elite Gold', series: 'B', price: 250000, daily_profit: 18000, duration: 25, total_return: 700000 },
    { id: 'B3', name: 'B-3 Royal Gold', series: 'B', price: 500000, daily_profit: 40000, duration: 25, total_return: 1500000 },
  ],
  F: [
    { id: 'F1', name: 'F-1 Fortune Gold', series: 'F', price: 1000000, daily_profit: 80000, duration: 30, total_return: 3400000 },
    { id: 'F2', name: 'F-2 Fortune Plus', series: 'F', price: 2500000, daily_profit: 210000, duration: 30, total_return: 8800000 },
    { id: 'F3', name: 'F-3 Fortune Max', series: 'F', price: 5000000, daily_profit: 450000, duration: 30, total_return: 18500000 },
  ],
  Z: [
    { id: 'Z1', name: 'Z-1 Zeus Gold', series: 'Z', price: 10000000, daily_profit: 1000000, duration: 35, total_return: 45000000 },
    { id: 'Z2', name: 'Z-2 Zeus Premium', series: 'Z', price: 25000000, daily_profit: 2800000, duration: 35, total_return: 123000000 },
    { id: 'Z3', name: 'Z-3 Zeus Ultimate', series: 'Z', price: 50000000, daily_profit: 6000000, duration: 35, total_return: 260000000 },
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

  const db = getDB();
  const existing = db.users.find(u => u.phone === phone);
  if (existing) return res.json({ success: false, msg: 'Phone already registered' });

  const id = db.nextId++;
  const hash = bcrypt.hashSync(password, 10);
  const user = { id, phone, password: hash, name: name || 'User', wallet: 0, balance: 0, created_at: new Date().toISOString() };
  db.users.push(user);
  saveDB(db);

  const token = jwt.sign({ id }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ success: true, token, user: { id, phone, name: user.name, wallet: 0, balance: 0 } });
});

app.post('/api/login', (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) return res.json({ success: false, msg: 'Phone and password required' });

  const db = getDB();
  const user = db.users.find(u => u.phone === phone);
  if (!user) return res.json({ success: false, msg: 'Account not found' });

  if (!bcrypt.compareSync(password, user.password)) return res.json({ success: false, msg: 'Wrong password' });

  const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ success: true, token, user: { id: user.id, phone: user.phone, name: user.name, wallet: user.wallet, balance: user.balance } });
});

// User routes
app.get('/api/me', auth, (req, res) => {
  const db = getDB();
  const user = db.users.find(u => u.id === req.userId);
  if (!user) return res.json({ success: false, msg: 'User not found' });

  // Calculate accumulated profits for active orders
  const userOrders = db.orders.filter(o => o.user_id === req.userId && o.status === 'active');
  let totalDailyEarning = 0;
  const now = Date.now();
  let changed = false;

  for (const order of userOrders) {
    const startMs = new Date(order.start_date).getTime();
    const daysPassed = Math.min(Math.floor((now - startMs) / 86400000), order.duration_days);
    const accumulated = daysPassed * order.daily_profit;
    totalDailyEarning += order.daily_profit;

    if (accumulated !== order.accumulated) {
      order.accumulated = accumulated;
      changed = true;
    }
    if (daysPassed >= order.duration_days && order.status === 'active') {
      order.status = 'harvest';
      order.accumulated = order.total_return;
      changed = true;
    }
  }

  if (changed) saveDB(db);

  res.json({ success: true, user: { id: user.id, phone: user.phone, name: user.name, wallet: user.wallet, balance: user.balance, created_at: user.created_at }, daily_earning: totalDailyEarning });
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

// Confirm deposit
app.post('/api/deposit', auth, (req, res) => {
  const { amount, txn_id } = req.body;
  if (!amount || amount < 10000) return res.json({ success: false, msg: 'Minimum deposit is 10,000 UGX' });
  if (!txn_id) return res.json({ success: false, msg: 'Transaction ID required' });

  const db = getDB();
  const user = db.users.find(u => u.id === req.userId);
  user.wallet += amount;
  db.transactions.push({ id: db.nextId++, user_id: req.userId, type: 'deposit', amount, description: `Deposit via Mobile Money (TXN: ${txn_id})`, created_at: new Date().toISOString() });
  saveDB(db);

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

  const db = getDB();
  const user = db.users.find(u => u.id === req.userId);
  if (user.wallet < product.price) return res.json({ success: false, msg: 'Insufficient wallet balance. Deposit first.' });

  user.wallet -= product.price;

  const endDate = new Date(Date.now() + product.duration * 86400000).toISOString();
  const order = {
    id: db.nextId++,
    user_id: req.userId,
    product_id: product.id,
    product_name: product.name,
    series: product.series,
    amount: product.price,
    daily_profit: product.daily_profit,
    duration_days: product.duration,
    total_return: product.total_return,
    start_date: new Date().toISOString(),
    end_date: endDate,
    accumulated: 0,
    status: 'active'
  };
  db.orders.push(order);
  db.transactions.push({ id: db.nextId++, user_id: req.userId, type: 'purchase', amount: -product.price, description: `Purchased ${product.name}`, created_at: new Date().toISOString() });
  saveDB(db);

  res.json({ success: true, msg: `${product.name} purchased successfully!` });
});

// Orders
app.get('/api/orders', auth, (req, res) => {
  const db = getDB();
  const userOrders = db.orders.filter(o => o.user_id === req.userId);
  const now = Date.now();

  const enriched = userOrders.map(order => {
    const startMs = new Date(order.start_date).getTime();
    const daysPassed = Math.min(Math.floor((now - startMs) / 86400000), order.duration_days);
    const accumulated = daysPassed * order.daily_profit;
    const progress = Math.min((daysPassed / order.duration_days) * 100, 100);
    return { ...order, days_passed: daysPassed, accumulated, progress };
  }).sort((a, b) => new Date(b.start_date) - new Date(a.start_date));

  res.json({ success: true, orders: enriched });
});

// Harvest
app.post('/api/harvest', auth, (req, res) => {
  const { order_id } = req.body;
  const db = getDB();
  const order = db.orders.find(o => o.id === order_id && o.user_id === req.userId && o.status === 'harvest');
  if (!order) return res.json({ success: false, msg: 'Order not ready for harvest' });

  order.status = 'completed';
  const user = db.users.find(u => u.id === req.userId);
  user.balance += order.total_return;
  db.transactions.push({ id: db.nextId++, user_id: req.userId, type: 'harvest', amount: order.total_return, description: `Harvested ${order.product_name}`, created_at: new Date().toISOString() });
  saveDB(db);

  res.json({ success: true, msg: `Harvested ${order.product_name}! ${order.total_return.toLocaleString()} UGX added to balance.` });
});

// Withdraw
app.post('/api/withdraw', auth, (req, res) => {
  const { amount, phone, method } = req.body;
  if (!amount || amount < 10000) return res.json({ success: false, msg: 'Minimum withdrawal is 10,000 UGX' });

  const db = getDB();
  const user = db.users.find(u => u.id === req.userId);
  if (user.balance < amount) return res.json({ success: false, msg: 'Insufficient balance' });

  user.balance -= amount;
  db.transactions.push({ id: db.nextId++, user_id: req.userId, type: 'withdraw', amount: -amount, description: `Withdrawal to ${method || 'Mobile Money'} ${phone || ''}`, created_at: new Date().toISOString() });
  saveDB(db);

  res.json({ success: true, msg: 'Withdrawal submitted. Processing within 24 hours.' });
});

// Transactions
app.get('/api/transactions', auth, (req, res) => {
  const db = getDB();
  const txns = db.transactions.filter(t => t.user_id === req.userId).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 50);
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
