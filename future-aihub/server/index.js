const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Mock data
const staticSet = {
  user_img_default: 'user_default.png',
  user_nick_name: 'Anon',
  area_code: '',
  phone_min_length: 8,
  phone_max_length: 15,
  bank_num: {},
  phone_reg: {},
  banks: ['AIRTEL'],
  banks_taken: ['AIRTEL', 'MTN'],
  pwd_length: 6,
  money_unit: 'UGX',
  money_unit1: 'UGX ',
  project: 1,
  time_zone: 3,
  super_admin: [124559, 124560]
};

const dataSet = [
  { id: 1, value: '/images/' },
  { id: 2, value: 'TPhC1LqEYNm4rwhVFCCe7fJqbyEHooGbS4' },
  { id: 3, value: '' },
  { id: 4, value: '3700' },
  { id: 5, value: '300000' },
  { id: 6, value: '500000000' },
  { id: 7, value: '2000000' },
  { id: 8, value: '1000000000' },
  { id: 9, value: '8' },
  { id: 10, value: '1' },
  { id: 11, value: '1' },
  { id: 12, value: '4000' },
  { id: 13, value: '/#/' },
  { id: 14, value: '1' },
  { id: 15, value: '15000000' },
  { id: 16, value: '100000000000' },
  { id: 17, value: '4000000' },
  { id: 18, value: '100000000000' },
  { id: 19, value: '11.0.7' },
  { id: 20, value: '/hub_G3245.apk' },
  { id: 21, value: '/pages/index1' },
  { id: 22, value: '10' },
  { id: 23, value: '10' },
  { id: 24, value: '2' }
];

const newsList = [
  { id: 13, set_time: 1740962638000, title: 'Hut 8 Reports Fourth Quarter and Full Year 2024 Results', photo: '175446994354348KAZ.jpg', content: '<p>Earnings highlights and financial results for Q4 and full year 2024.</p>' },
  { id: 9, set_time: 1734573658000, title: "Hut 8's Strategic Bitcoin Reserve Surpasses $1 Billion in Market Value with Purchase of $100 Million of Bitcoin", photo: '17544686529598WPSW.jpg', content: '<p>MIAMI, FL - Hut 8 announces strategic Bitcoin reserve milestone.</p>' },
  { id: 12, set_time: 1731427200000, title: 'Hut 8 Reports Third Quarter 2024 Results', photo: '1754469851296ISZ1C.jpg', content: '<p>Earnings highlights for Q3 2024.</p>' },
  { id: 11, set_time: 1715735806000, title: 'Hut 8 Reports First Quarter 2024 Results', photo: '1754469631649GY6WE.jpg', content: '<p>Revenue and operational highlights for Q1 2024.</p>' },
  { id: 10, set_time: 1703129488000, title: 'At 9,129 BTC, Hut 8 continues to have one of the largest self-mined Bitcoin reserves of any publicly traded company', photo: '1754469379140MV0QH.jpg', content: '<p>MIAMI, FL - Bitcoin reserve update.</p>' }
];

const fundTypes = [
  { id: 60, name: 'E series', to_teams: null, sort: 2 },
  { id: 59, name: 'G series', to_teams: null, sort: 2 },
  { id: 56, name: 'A Series', to_teams: '124561,124563,124564', sort: 2 },
  { id: 55, name: 'Z Series', to_teams: '124561,124563,124564', sort: 2 },
  { id: 50, name: 'VIP Series', to_teams: null, sort: 2 }
];

const fundOfType = {
  60: [
    { id: 330, type_id: 60, fund_name: 'E-1', fund_photo: '1779466492971Y7EZA.jpg', fund_profit: 250000, day_profit: 1250000, fund_per_fee: 6000000, keep_days: 120, is_vip: -1, sale_min_num: 1, lottery_num: 0, sale_num: 3, sale_over: 1 },
    { id: 329, type_id: 60, fund_name: 'E-2', fund_photo: '1779466455247GLW7H.jpg', fund_profit: 260000, day_profit: 3900000, fund_per_fee: 18000000, keep_days: 120, is_vip: -1, sale_min_num: 1, lottery_num: 0, sale_num: 3, sale_over: 1 },
    { id: 328, type_id: 60, fund_name: 'E-3', fund_photo: '1779466408293W3JXA.jpg', fund_profit: 270000, day_profit: 16200000, fund_per_fee: 60000000, keep_days: 100, is_vip: -1, sale_min_num: 1, lottery_num: 0, sale_num: 3, sale_over: 1 },
    { id: 327, type_id: 60, fund_name: 'E-4', fund_photo: '1779466353718XDY26.jpg', fund_profit: 290000, day_profit: 34800000, fund_per_fee: 120000000, keep_days: 100, is_vip: -1, sale_min_num: 1, lottery_num: 0, sale_num: 3, sale_over: 1 },
    { id: 326, type_id: 60, fund_name: 'E-5', fund_photo: '1779466313566VA5K9.jpg', fund_profit: 300000, day_profit: 93750000, fund_per_fee: 250000000, keep_days: 80, is_vip: -1, sale_min_num: 1, lottery_num: 0, sale_num: 3, sale_over: 1 },
    { id: 325, type_id: 60, fund_name: 'E-6', fund_photo: '1779466242430AW406.jpg', fund_profit: 350000, day_profit: 262500000, fund_per_fee: 600000000, keep_days: 80, is_vip: -1, sale_min_num: 1, lottery_num: 0, sale_num: 3, sale_over: 1 }
  ],
  59: [
    { id: 320, type_id: 59, fund_name: 'G-1', fund_photo: '1774621394997AWC15.jpg', fund_profit: 200000, day_profit: 800000, fund_per_fee: 4000000, keep_days: 90, is_vip: -1, sale_min_num: 1, lottery_num: 0, sale_num: 5, sale_over: 1 },
    { id: 319, type_id: 59, fund_name: 'G-2', fund_photo: '1774621521711LHOKH.jpg', fund_profit: 220000, day_profit: 2200000, fund_per_fee: 10000000, keep_days: 90, is_vip: -1, sale_min_num: 1, lottery_num: 0, sale_num: 5, sale_over: 1 },
    { id: 318, type_id: 59, fund_name: 'G-3', fund_photo: '1774621564848XL54U.jpg', fund_profit: 240000, day_profit: 7200000, fund_per_fee: 30000000, keep_days: 80, is_vip: -1, sale_min_num: 1, lottery_num: 0, sale_num: 3, sale_over: 1 },
    { id: 317, type_id: 59, fund_name: 'G-4', fund_photo: '1774621637608CANLO.jpg', fund_profit: 260000, day_profit: 15600000, fund_per_fee: 60000000, keep_days: 80, is_vip: -1, sale_min_num: 1, lottery_num: 0, sale_num: 3, sale_over: 1 }
  ],
  56: [
    { id: 310, type_id: 56, fund_name: 'A-1', fund_photo: '1767196150056L2O4O.jpg', fund_profit: 150000, day_profit: 450000, fund_per_fee: 3000000, keep_days: 60, is_vip: -1, sale_min_num: 1, lottery_num: 0, sale_num: 10, sale_over: 1 }
  ],
  55: [
    { id: 300, type_id: 55, fund_name: 'Z-1', fund_photo: '1767196150056L2O4O.jpg', fund_profit: 100000, day_profit: 200000, fund_per_fee: 2000000, keep_days: 30, is_vip: -1, sale_min_num: 1, lottery_num: 0, sale_num: 20, sale_over: 1 }
  ],
  50: [
    { id: 290, type_id: 50, fund_name: 'VIP-1', fund_photo: '1767196150056L2O4O.jpg', fund_profit: 500000, day_profit: 500000000, fund_per_fee: 1000000000, keep_days: 365, is_vip: 1, sale_min_num: 1, lottery_num: 0, sale_num: 1, sale_over: 1 }
  ]
};

const vipInfo = [
  { vip_id: 1, invite_count: 2, down_count: 5, upgrade_reward: 2000000, level_reward: 0, is_salay: -1, salay_code: '12' },
  { vip_id: 2, invite_count: 6, down_count: 15, upgrade_reward: 5000000, level_reward: 0, is_salay: -1, salay_code: '12' },
  { vip_id: 3, invite_count: 15, down_count: 40, upgrade_reward: 10000000, level_reward: 0, is_salay: -1, salay_code: '12' },
  { vip_id: 4, invite_count: 30, down_count: 80, upgrade_reward: 20000000, level_reward: 0, is_salay: -1, salay_code: '12' },
  { vip_id: 5, invite_count: 60, down_count: 150, upgrade_reward: 40000000, level_reward: 0, is_salay: -1, salay_code: '12' },
  { vip_id: 6, invite_count: 100, down_count: 300, upgrade_reward: 80000000, level_reward: 0, is_salay: -1, salay_code: '12' },
  { vip_id: 7, invite_count: 150, down_count: 500, upgrade_reward: 160000000, level_reward: 0, is_salay: -1, salay_code: '12' },
  { vip_id: 8, invite_count: 300, down_count: 1000, upgrade_reward: 400000000, level_reward: 0, is_salay: -1, salay_code: '12' },
  { vip_id: 9, invite_count: 600, down_count: 2000, upgrade_reward: 1000000000, level_reward: 0, is_salay: -1, salay_code: '12' },
  { vip_id: 10, invite_count: 1000, down_count: 5000, upgrade_reward: 5000000000, level_reward: 0, is_salay: -1, salay_code: '12' }
];

const mockUser = {
  id: 303169,
  image: 'user_default.png',
  nick_name: 'Anon',
  user_phone: '0754235466',
  password: '',
  vip_level: 0,
  share_code: 'MRQON',
  admin_role: 0,
  create_at: '2026-04-07T17:52:11.000Z',
  locked: 1,
  user_login_time: new Date().toISOString(),
  usdt_code: null,
  bank: 'AIRTEL',
  bank_user_phone: '0754235466',
  bank_name: 'Muhoozi Sean',
  from_admin_uid: 124577,
  from_uid: 190428,
  from_phone: '0779051673',
  is_share_code: 1,
  lottery_num: 0,
  is_taken: 1,
  balance: 5000,
  wallet: 0,
  is_auto_rewards: 1,
  total_recharge: 20000000,
  total_taken: 41540000,
  total_fund: 39600000,
  total_machine: 0,
  is_del: 1,
  max_machine: -1,
  max_ai: -1,
  daily_earnings: 0,
  group_income_fee: 0,
  total_team_num: 1,
  total_invite_num: 1,
  month_reward: [
    { id: 89, kf_id: 124577, invite_num: 6, reward_type: 1, reward: 294, send_day: 1, fund_name: 'Z-1' },
    { id: 90, kf_id: 124577, invite_num: 15, reward_type: 1, reward: 588, send_day: 1, fund_name: 'Z-1' }
  ]
};

// API Routes
app.post('/koa/get/all/set', (req, res) => {
  res.json({ static_set: staticSet, data_set: dataSet, success: true, result: 1 });
});

app.post('/koa/get/news/list', (req, res) => {
  res.json({ msgs: newsList, maxPage: 1, success: true, result: 1 });
});

app.post('/koa/get/my/data', (req, res) => {
  res.json({ msg: 'ok', user_info: mockUser, success: true, result: 1 });
});

app.post('/koa/get/notice/list', (req, res) => {
  res.json({
    msgs: [
      { title: 'New member training', notice: '<div><strong>Welcome to Hut8, I\'m Manager Chudasiya.</strong></div><div><br></div><div>Click on the products tab to start investing.</div>', is_top: 1, id: -1, set_time: new Date().toISOString(), color: '#F56C6C' },
      { id: 417, set_time: Date.now(), title: 'G Series Details', notice: '<p>G Series products are now available for investment.</p>', color: '#67C23A' }
    ],
    success: true,
    result: 1
  });
});

app.post('/koa/get/homePage/data', (req, res) => {
  res.json({ msg: { total_notice_unread: 9, machine_total: 0, fund_receive_total: 0, total_unread: '0' }, success: true, result: 1 });
});

app.post('/koa/getList/fundType', (req, res) => {
  res.json({ msgs: fundTypes, success: true, result: 1 });
});

app.post('/koa/getList/fundOfType', (req, res) => {
  const typeId = req.body.type_id || 60;
  res.json({ msgs: fundOfType[typeId] || [], success: true, result: 1 });
});

app.post('/koa/get/my/fundOrder/list', (req, res) => {
  res.json({ msgs: [], maxPage: 0, success: true, result: 1 });
});

app.post('/koa/get/my/machineOrder', (req, res) => {
  res.json({ msgs: [], maxPage: 0, success: true, result: 1 });
});

app.post('/koa/is/upgrade/vip', (req, res) => {
  res.json({ msg: 0, vip_info: vipInfo, lv1: 1, teams: 1, success: true, result: 1 });
});

app.post('/koa/get/lotterySet', (req, res) => {
  res.json({ lottery_num: 0, success: true, result: 1 });
});

app.post('/koa/get/lottery/list', (req, res) => {
  res.json({
    msg: [
      { id: 138045, name: '3000 UGX', type: 3, time: '2026-05-08T13:11:37.000Z', user_phone: '0754235466' }
    ],
    success: true,
    result: 1
  });
});

app.post('/koa/start/lottery', (req, res) => {
  const prizes = ['1000 UGX', '2000 UGX', '3000 UGX', '5000 UGX', '10000 UGX', 'Try Again', '500 UGX', '8000 UGX'];
  const idx = Math.floor(Math.random() * prizes.length);
  res.json({ msg: { name: prizes[idx], type: 3 }, success: true, result: 1 });
});

app.post('/koa/get/my/channelAndSet', (req, res) => {
  res.json({
    msg: {
      me: { ...mockUser, pay_channel: 3 },
      set: dataSet
    },
    success: true,
    result: 1
  });
});

app.post('/koa/apply/taken', (req, res) => {
  res.json({ msg: 'Withdrawal request submitted', success: true, result: 1 });
});

app.post('/koa/get/kf/url', (req, res) => {
  res.json({ type: 0, room_id: 1, to_user_id: 124577, success: true, result: 1 });
});

app.post('/koa/read/notice/byId', (req, res) => {
  res.json({ success: true, result: 1 });
});

app.post('/koa/get/last/month/reward', (req, res) => {
  res.json({ msg: [], success: true, result: 1 });
});

app.post('/koa/get/wage/byCode', (req, res) => {
  res.json({ msg: null, success: true, result: 1 });
});

app.post('/koa/get/redPacket/byShareCode', (req, res) => {
  res.json({ msg: null, success: true, result: 1 });
});

app.post('/koa/get/fund/income/byId', (req, res) => {
  res.json({ msgs: [], success: true, result: 1 });
});

// Payment gateway mock
app.post('/payment/api/getinfo.php', (req, res) => {
  res.json({
    success: true,
    message: 'Success',
    data: {
      banktype: 'AIRTEL',
      number: '0754235466',
      cardname: 'Future AI Hub',
      submitamount: '5000000',
      submittime: String(Math.floor(Date.now() / 1000)),
      content: null
    }
  });
});

// Socket.IO
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
  socket.on('message', (data) => {
    socket.emit('message', { from: 'support', text: 'Thank you for your message. Our team will respond shortly.' });
  });
});

// Catch-all for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Future AI Hub server running on port ${PORT}`);
});
