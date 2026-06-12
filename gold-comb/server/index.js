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
  return { users: [], orders: [], transactions: [], referrals: [], lottery_spins: [], nextId: 1 };
}

function genInviteCode() {
  return 'GC' + Math.random().toString(36).substring(2, 8).toUpperCase();
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
    { id: 'F1', name: 'F-1 Fortune Gold', series: 'F', price: 1000000, daily_profit: 80000, duration: 50, total_return: 5000000 },
    { id: 'F2', name: 'F-2 Fortune Plus', series: 'F', price: 2500000, daily_profit: 210000, duration: 50, total_return: 13000000 },
    { id: 'F3', name: 'F-3 Fortune Max', series: 'F', price: 5000000, daily_profit: 450000, duration: 50, total_return: 27500000 },
  ],
  Z: [
    { id: 'Z1', name: 'Z-1 Zeus Gold', series: 'Z', price: 10000000, daily_profit: 1000000, duration: 75, total_return: 85000000 },
    { id: 'Z2', name: 'Z-2 Zeus Premium', series: 'Z', price: 25000000, daily_profit: 2800000, duration: 75, total_return: 235000000 },
    { id: 'Z3', name: 'Z-3 Zeus Ultimate', series: 'Z', price: 50000000, daily_profit: 6000000, duration: 75, total_return: 500000000 },
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
  const invite_code = genInviteCode();
  const user = { id, phone, password: hash, name: name || 'User', wallet: 0, balance: 0, invite_code, referred_by: null, referral_earnings: 0, lottery_spins: 0, created_at: new Date().toISOString() };

  // Check if registered via referral
  const { ref_code } = req.body;
  if (ref_code) {
    const referrer = db.users.find(u => u.invite_code === ref_code);
    if (referrer && referrer.id !== id) {
      user.referred_by = referrer.id;
      referrer.lottery_spins = (referrer.lottery_spins || 0) + 1;
      db.referrals.push({ id: db.nextId++, referrer_id: referrer.id, referred_id: id, created_at: new Date().toISOString() });
    }
  }

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

  // Calculate referral daily bonus (5% of each referral's daily earning)
  const referrals = db.referrals ? db.referrals.filter(r => r.referrer_id === req.userId) : [];
  let referralBonus = 0;
  for (const ref of referrals) {
    const refOrders = db.orders.filter(o => o.user_id === ref.referred_id && o.status === 'active');
    for (const o of refOrders) { referralBonus += Math.floor(o.daily_profit * 0.05); }
  }

  res.json({
    success: true,
    user: { id: user.id, phone: user.phone, name: user.name, wallet: user.wallet, balance: user.balance, invite_code: user.invite_code, referral_earnings: user.referral_earnings || 0, lottery_spins: user.lottery_spins || 0, created_at: user.created_at },
    daily_earning: totalDailyEarning,
    referral_bonus: referralBonus,
    referral_count: referrals.length
  });
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

// Referral / Invite
app.get('/api/referrals', auth, (req, res) => {
  const db = getDB();
  const user = db.users.find(u => u.id === req.userId);
  const referrals = (db.referrals || []).filter(r => r.referrer_id === req.userId);
  const members = referrals.map(r => {
    const member = db.users.find(u => u.id === r.referred_id);
    if (!member) return null;
    const activeOrders = db.orders.filter(o => o.user_id === member.id && o.status === 'active').length;
    return { name: member.name, phone: member.phone.slice(0, 4) + '****' + member.phone.slice(-2), joined: r.created_at, active_orders: activeOrders };
  }).filter(Boolean);

  res.json({ success: true, invite_code: user.invite_code, referral_count: referrals.length, members, lottery_spins: user.lottery_spins || 0 });
});

// Claim referral daily reward
app.post('/api/claim-referral-reward', auth, (req, res) => {
  const db = getDB();
  const user = db.users.find(u => u.id === req.userId);
  const referrals = (db.referrals || []).filter(r => r.referrer_id === req.userId);

  // Check last claim time
  const lastClaim = user.last_referral_claim || '2000-01-01';
  const today = new Date().toISOString().split('T')[0];
  if (lastClaim === today) return res.json({ success: false, msg: 'Already claimed today. Come back tomorrow!' });

  // Calculate bonus: 5% of each referral's active daily profits
  let bonus = 0;
  for (const ref of referrals) {
    const refOrders = db.orders.filter(o => o.user_id === ref.referred_id && o.status === 'active');
    for (const o of refOrders) { bonus += Math.floor(o.daily_profit * 0.05); }
  }

  if (bonus === 0) return res.json({ success: false, msg: 'No active referral earnings to claim. Invite friends who invest!' });

  user.balance += bonus;
  user.referral_earnings = (user.referral_earnings || 0) + bonus;
  user.last_referral_claim = today;
  db.transactions.push({ id: db.nextId++, user_id: req.userId, type: 'referral_reward', amount: bonus, description: `Daily referral bonus (${referrals.length} members)`, created_at: new Date().toISOString() });
  saveDB(db);

  res.json({ success: true, msg: `${bonus.toLocaleString()} UGX referral reward added to balance!`, bonus, balance: user.balance });
});

// Lottery
app.post('/api/lottery/spin', auth, (req, res) => {
  const db = getDB();
  const user = db.users.find(u => u.id === req.userId);
  if ((user.lottery_spins || 0) <= 0) return res.json({ success: false, msg: 'No spins available. Invite a friend to earn a spin!' });

  // Prize pool (weighted random)
  const prizes = [
    { amount: 500, label: '500 UGX', weight: 40 },
    { amount: 1000, label: '1,000 UGX', weight: 30 },
    { amount: 2500, label: '2,500 UGX', weight: 15 },
    { amount: 5000, label: '5,000 UGX', weight: 8 },
    { amount: 10000, label: '10,000 UGX', weight: 4 },
    { amount: 25000, label: '25,000 UGX', weight: 1.5 },
    { amount: 50000, label: '50,000 UGX', weight: 0.8 },
    { amount: 100000, label: '100,000 UGX', weight: 0.15 },
    { amount: 500000, label: '500,000 UGX', weight: 0.05 },
  ];

  const totalWeight = prizes.reduce((s, p) => s + p.weight, 0);
  let rand = Math.random() * totalWeight;
  let prize = prizes[0];
  for (const p of prizes) {
    rand -= p.weight;
    if (rand <= 0) { prize = p; break; }
  }

  user.lottery_spins--;
  user.balance += prize.amount;
  db.transactions.push({ id: db.nextId++, user_id: req.userId, type: 'lottery', amount: prize.amount, description: `Lottery win: ${prize.label}`, created_at: new Date().toISOString() });
  if (!db.lottery_spins) db.lottery_spins = [];
  db.lottery_spins.push({ id: db.nextId++, user_id: req.userId, amount: prize.amount, created_at: new Date().toISOString() });
  saveDB(db);

  res.json({ success: true, msg: `You won ${prize.label}!`, amount: prize.amount, balance: user.balance, spins_left: user.lottery_spins });
});

// Transactions
app.get('/api/transactions', auth, (req, res) => {
  const db = getDB();
  const txns = db.transactions.filter(t => t.user_id === req.userId).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 50);
  res.json({ success: true, transactions: txns });
});

// Admin dashboard
const ADMIN_KEY = 'goldcomb_admin_2026';

function adminAuth(req, res, next) {
  const key = req.headers['x-admin-key'] || req.query.key;
  if (key !== ADMIN_KEY) return res.status(403).json({ success: false, msg: 'Unauthorized' });
  next();
}

app.get('/api/admin/stats', adminAuth, (req, res) => {
  const db = getDB();
  const totalUsers = db.users.length;
  const totalOrders = db.orders.length;
  const activeOrders = db.orders.filter(o => o.status === 'active').length;
  const harvestOrders = db.orders.filter(o => o.status === 'harvest').length;
  const completedOrders = db.orders.filter(o => o.status === 'completed').length;
  const totalDeposited = db.transactions.filter(t => t.type === 'deposit').reduce((s, t) => s + t.amount, 0);
  const totalWithdrawn = db.transactions.filter(t => t.type === 'withdraw').reduce((s, t) => s + Math.abs(t.amount), 0);
  const totalReferrals = (db.referrals || []).length;
  res.json({ success: true, stats: { totalUsers, totalOrders, activeOrders, harvestOrders, completedOrders, totalDeposited, totalWithdrawn, totalReferrals } });
});

app.get('/api/admin/users', adminAuth, (req, res) => {
  const db = getDB();
  const users = db.users.map(u => ({
    id: u.id, phone: u.phone, name: u.name, wallet: u.wallet, balance: u.balance,
    invite_code: u.invite_code, referral_earnings: u.referral_earnings || 0,
    lottery_spins: u.lottery_spins || 0, created_at: u.created_at,
    orders: db.orders.filter(o => o.user_id === u.id).length,
    total_deposited: db.transactions.filter(t => t.user_id === u.id && t.type === 'deposit').reduce((s, t) => s + t.amount, 0)
  }));
  res.json({ success: true, users });
});

app.get('/api/admin/transactions', adminAuth, (req, res) => {
  const db = getDB();
  const txns = db.transactions.map(t => {
    const user = db.users.find(u => u.id === t.user_id);
    return { ...t, user_name: user ? user.name : 'Unknown', user_phone: user ? user.phone : '' };
  }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 200);
  res.json({ success: true, transactions: txns });
});

app.get('/api/admin/orders', adminAuth, (req, res) => {
  const db = getDB();
  const now = Date.now();
  const orders = db.orders.map(o => {
    const user = db.users.find(u => u.id === o.user_id);
    const startMs = new Date(o.start_date).getTime();
    const daysPassed = Math.min(Math.floor((now - startMs) / 86400000), o.duration_days);
    const progress = Math.min((daysPassed / o.duration_days) * 100, 100);
    return { ...o, user_name: user ? user.name : 'Unknown', user_phone: user ? user.phone : '', days_passed: daysPassed, progress };
  }).sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
  res.json({ success: true, orders });
});

// Serve admin page
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin.html'));
});

// Catch-all SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Gold Comb server running on port ${PORT}`);
});
