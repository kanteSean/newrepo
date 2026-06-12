// Future AI Hub - Single Page Application
(function() {
  'use strict';

  const APP = {
    currentPage: 'index1',
    user: null,
    settings: null,
    dataSet: [],
    imageBase: '/images/',
    moneyUnit: 'UGX'
  };

  // HTTP helper
  async function api(url, data = {}) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'token': 'mock-token' },
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch (e) {
      console.error('API error:', url, e);
      return { success: false };
    }
  }

  function formatMoney(amount) {
    if (!amount) return '0';
    return Number(amount).toLocaleString();
  }

  function formatDate(ts) {
    const d = new Date(ts);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  // Initialize app
  async function init() {
    initWebGL();
    const [settingsRes, userRes] = await Promise.all([
      api('/koa/get/all/set'),
      api('/koa/get/my/data')
    ]);
    if (settingsRes.success) {
      APP.settings = settingsRes.static_set;
      APP.dataSet = settingsRes.data_set;
      APP.moneyUnit = settingsRes.static_set.money_unit;
      const imgSet = settingsRes.data_set.find(d => d.id === 1);
      if (imgSet) APP.imageBase = '/images/';
    }
    if (userRes.success) {
      APP.user = userRes.user_info;
    }
    renderApp();
    navigateTo('index1');
  }

  function renderApp() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div id="page-index1" class="page"></div>
      <div id="page-index2" class="page"></div>
      <div id="page-index4" class="page"></div>
      <div id="page-index5" class="page"></div>
      <div id="page-vip" class="page"></div>
      <div id="page-lottery" class="page"></div>
      <div id="page-withdraw" class="page"></div>
      <div id="page-invite" class="page"></div>
      <div id="page-chat" class="page"></div>
      <div id="page-payment" class="page"></div>
      <div class="tab-bar">
        <div class="tab-item active" data-page="index1">
          <i class="fas fa-chart-line"></i>
          <span>Home</span>
        </div>
        <div class="tab-item" data-page="index2">
          <i class="fas fa-coins"></i>
          <span>Orders</span>
        </div>
        <div class="tab-item" data-page="index4">
          <i class="fas fa-bahai"></i>
          <span>Products</span>
        </div>
        <div class="tab-item" data-page="index5">
          <i class="fas fa-user-cog"></i>
          <span>Me</span>
        </div>
      </div>
      <div class="modal-overlay" id="modal">
        <div class="modal">
          <h3 id="modal-title"></h3>
          <p id="modal-body"></p>
          <button class="btn" onclick="closeModal()">OK</button>
        </div>
      </div>
    `;

    // Tab click handlers
    document.querySelectorAll('.tab-item').forEach(tab => {
      tab.addEventListener('click', () => {
        navigateTo(tab.dataset.page);
      });
    });
  }

  function navigateTo(page) {
    APP.currentPage = page;
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));

    const pageEl = document.getElementById('page-' + page);
    if (pageEl) {
      pageEl.classList.add('active');
      pageEl.classList.add('fade-in');
    }

    const tabEl = document.querySelector(`.tab-item[data-page="${page}"]`);
    if (tabEl) tabEl.classList.add('active');

    // Show/hide tab bar for sub-pages
    const tabBar = document.querySelector('.tab-bar');
    const subPages = ['vip', 'lottery', 'withdraw', 'invite', 'chat', 'payment'];
    tabBar.style.display = subPages.includes(page) ? 'none' : 'flex';

    // Render page content
    switch(page) {
      case 'index1': renderHome(); break;
      case 'index2': renderOrders(); break;
      case 'index4': renderProducts(); break;
      case 'index5': renderProfile(); break;
      case 'vip': renderVIP(); break;
      case 'lottery': renderLottery(); break;
      case 'withdraw': renderWithdraw(); break;
      case 'invite': renderInvite(); break;
      case 'chat': renderChat(); break;
      case 'payment': renderPayment(); break;
    }
  }

  // HOME PAGE
  async function renderHome() {
    const [newsRes, noticeRes] = await Promise.all([
      api('/koa/get/news/list'),
      api('/koa/get/notice/list')
    ]);
    const news = newsRes.msgs || [];
    const notices = noticeRes.msgs || [];
    const topNotice = notices.find(n => n.is_top === 1);

    document.getElementById('page-index1').innerHTML = `
      <div class="content fade-in">
        <!-- Banner swiper -->
        <div class="swiper" id="home-swiper">
          <img src="${APP.imageBase}${news[0] ? news[0].photo : ''}" alt="Banner">
          <div class="swiper-dots">
            ${news.map((_, i) => `<div class="swiper-dot ${i === 0 ? 'active' : ''}"></div>`).join('')}
          </div>
        </div>

        <!-- Notice bar -->
        ${topNotice ? `
        <div class="notice-bar">
          <i class="fas fa-bell"></i>
          <div class="text">${topNotice.title}</div>
        </div>` : ''}

        <!-- Menu grid -->
        <div class="menu-grid">
          <div class="menu-item" onclick="navigateTo('chat')">
            <i class="fas fa-headset"></i>
            <span>Support</span>
          </div>
          <div class="menu-item" onclick="navigateTo('invite')">
            <i class="fas fa-gift"></i>
            <span>Invite</span>
          </div>
          <div class="menu-item" onclick="navigateTo('vip')">
            <i class="fas fa-crown"></i>
            <span>VIP</span>
          </div>
          <div class="menu-item" onclick="navigateTo('lottery')">
            <i class="fas fa-trophy"></i>
            <span>Lottery</span>
          </div>
        </div>

        <!-- Data bar -->
        <div class="data-bar">
          <div class="data-item">
            <div class="value">${formatMoney(APP.user?.balance || 0)}</div>
            <div class="label">Balance (${APP.moneyUnit})</div>
          </div>
          <div class="data-item">
            <div class="value">${formatMoney(APP.user?.daily_earnings || 0)}</div>
            <div class="label">Today's Earnings</div>
          </div>
          <div class="data-item">
            <div class="value">${APP.user?.total_team_num || 0}</div>
            <div class="label">Team</div>
          </div>
        </div>

        <!-- News section -->
        <div class="section-title">
          <h3>Latest News</h3>
          <span class="more"><i class="fa fa-angle-double-down"></i> More</span>
        </div>
        ${news.map(n => `
          <div class="news-item" onclick="showModal('${n.title.replace(/'/g, "\\'")}', '${n.content.replace(/'/g, "\\'")}')">
            <img src="${APP.imageBase}${n.photo}" alt="${n.title}">
            <div class="info">
              <h4>${n.title}</h4>
              <div class="time">${formatDate(n.set_time)}</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    // Auto-rotate banner
    let bannerIdx = 0;
    const swiperEl = document.getElementById('home-swiper');
    if (swiperEl && news.length > 1) {
      setInterval(() => {
        bannerIdx = (bannerIdx + 1) % news.length;
        swiperEl.querySelector('img').src = APP.imageBase + news[bannerIdx].photo;
        swiperEl.querySelectorAll('.swiper-dot').forEach((dot, i) => {
          dot.classList.toggle('active', i === bannerIdx);
        });
      }, 4000);
    }
  }

  // ORDERS PAGE
  async function renderOrders() {
    const res = await api('/koa/get/my/fundOrder/list');
    const orders = res.msgs || [];

    document.getElementById('page-index2').innerHTML = `
      <div class="content fade-in">
        <div class="order-tabs">
          <div class="order-tab active">Active</div>
          <div class="order-tab">Completed</div>
        </div>
        ${orders.length === 0 ? `
          <div class="no-data">
            <i class="fas fa-coins"></i>
            <p>No orders yet. Start investing to see your orders here.</p>
          </div>
        ` : orders.map(o => `
          <div class="fund-card">
            <div class="info">
              <div class="name">${o.fund_name}</div>
              <div class="profit">Daily: ${formatMoney(o.day_profit)} ${APP.moneyUnit}</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // PRODUCTS PAGE
  async function renderProducts() {
    const typesRes = await api('/koa/getList/fundType');
    const types = typesRes.msgs || [];
    const activeType = types[0]?.id || 60;

    document.getElementById('page-index4').innerHTML = `
      <div class="content fade-in">
        <div class="type-tabs" id="type-tabs">
          ${types.map(t => `
            <div class="type-tab ${t.id === activeType ? 'active' : ''}" data-id="${t.id}">${t.name}</div>
          `).join('')}
        </div>
        <div id="fund-list"></div>
      </div>
    `;

    document.querySelectorAll('.type-tab').forEach(tab => {
      tab.addEventListener('click', async () => {
        document.querySelectorAll('.type-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        await loadFunds(parseInt(tab.dataset.id));
      });
    });

    await loadFunds(activeType);
  }

  async function loadFunds(typeId) {
    const res = await api('/koa/getList/fundOfType', { type_id: typeId });
    const funds = res.msgs || [];
    const listEl = document.getElementById('fund-list');
    if (!listEl) return;

    listEl.innerHTML = funds.map(f => `
      <div class="fund-card" onclick="showModal('${f.fund_name}', 'Price: ${formatMoney(f.fund_per_fee)} ${APP.moneyUnit}<br>Daily Profit: ${formatMoney(f.day_profit)} ${APP.moneyUnit}<br>Duration: ${f.keep_days} days<br>Return Rate: ${(f.fund_profit/1000).toFixed(1)}%')">
        <img src="${APP.imageBase}${f.fund_photo}" alt="${f.fund_name}">
        <div class="info">
          <div class="name">${f.fund_name}</div>
          <div class="profit">Daily: ${formatMoney(f.day_profit)} ${APP.moneyUnit}</div>
          <div class="details">${f.keep_days} days • Rate: ${(f.fund_profit/1000).toFixed(1)}%</div>
        </div>
        <div class="price">
          <div class="amount">${formatMoney(f.fund_per_fee)}</div>
          <div class="unit">${APP.moneyUnit}</div>
        </div>
      </div>
    `).join('');
  }

  // PROFILE PAGE
  function renderProfile() {
    const u = APP.user || {};
    document.getElementById('page-index5').innerHTML = `
      <div class="content fade-in">
        <div class="profile-header">
          <div class="profile-avatar">
            <img src="${APP.imageBase}${u.image || 'user_default.png'}" alt="Avatar">
          </div>
          <div class="profile-name">${u.nick_name || 'Anon'}</div>
          <div class="profile-phone">${u.user_phone || ''}</div>
          <div class="profile-vip"><i class="fas fa-star"></i> VIP ${u.vip_level || 0}</div>
        </div>

        <div class="balance-card">
          <div class="label">Balance</div>
          <div class="amount">${APP.moneyUnit} ${formatMoney(u.balance || 0)}</div>
          <div class="balance-actions">
            <button class="btn btn-primary" onclick="navigateTo('payment')">Recharge</button>
            <button class="btn btn-secondary" onclick="navigateTo('withdraw')">Withdraw</button>
          </div>
        </div>

        <div class="data-bar">
          <div class="data-item">
            <div class="value">${formatMoney(u.total_recharge || 0)}</div>
            <div class="label">Total Recharge</div>
          </div>
          <div class="data-item">
            <div class="value">${formatMoney(u.total_taken || 0)}</div>
            <div class="label">Total Withdrawn</div>
          </div>
          <div class="data-item">
            <div class="value">${formatMoney(u.total_fund || 0)}</div>
            <div class="label">Total Invested</div>
          </div>
        </div>

        <div class="menu-list">
          <div class="menu-list-item" onclick="navigateTo('vip')">
            <i class="fas fa-crown"></i>
            <div class="text">VIP Level</div>
            <i class="fa fa-angle-right arrow"></i>
          </div>
          <div class="menu-list-item" onclick="navigateTo('invite')">
            <i class="fas fa-users"></i>
            <div class="text">Invite Friends</div>
            <i class="fa fa-angle-right arrow"></i>
          </div>
          <div class="menu-list-item" onclick="navigateTo('chat')">
            <i class="fas fa-headset"></i>
            <div class="text">Customer Service</div>
            <i class="fa fa-angle-right arrow"></i>
          </div>
          <div class="menu-list-item" onclick="navigateTo('lottery')">
            <i class="fas fa-gift"></i>
            <div class="text">Lucky Draw</div>
            <i class="fa fa-angle-right arrow"></i>
          </div>
          <div class="menu-list-item" onclick="showModal('Team', 'Total team members: ${u.total_team_num || 0}<br>Direct invites: ${u.total_invite_num || 0}')">
            <i class="fas fa-handshake"></i>
            <div class="text">My Team</div>
            <i class="fa fa-angle-right arrow"></i>
          </div>
          <div class="menu-list-item" onclick="showModal('Bills', 'Total Recharge: ${formatMoney(u.total_recharge)} ${APP.moneyUnit}<br>Total Withdrawn: ${formatMoney(u.total_taken)} ${APP.moneyUnit}<br>Total Invested: ${formatMoney(u.total_fund)} ${APP.moneyUnit}')">
            <i class="fas fa-money-check"></i>
            <div class="text">Bill Records</div>
            <i class="fa fa-angle-right arrow"></i>
          </div>
        </div>
      </div>
    `;
  }

  // VIP PAGE
  async function renderVIP() {
    const res = await api('/koa/is/upgrade/vip');
    const vipList = res.vip_info || [];
    const currentLevel = APP.user?.vip_level || 0;

    document.getElementById('page-vip').innerHTML = `
      <div class="page-header">
        <div class="back-btn" onclick="navigateTo('index5')"><i class="fa fa-arrow-left"></i></div>
        <div class="title">VIP Center</div>
      </div>
      <div class="content fade-in">
        <div class="card-bg light" style="margin: 15px; text-align: center; padding: 25px;">
          <i class="fas fa-crown" style="font-size: 40px; color: #ffd700; margin-bottom: 10px;"></i>
          <div style="font-size: 22px; font-weight: bold;">VIP ${currentLevel}</div>
          <div style="font-size: 12px; color: rgba(255,255,255,0.5); margin-top: 5px;">Current Level</div>
        </div>
        ${vipList.map(v => `
          <div class="vip-card ${v.vip_id <= currentLevel ? 'achieved' : ''}">
            <div class="level"><i class="fas fa-medal"></i> VIP ${v.vip_id}</div>
            <div class="req">Invite: ${v.invite_count} members • Team: ${v.down_count} members</div>
            <div class="reward">Reward: ${formatMoney(v.upgrade_reward)} ${APP.moneyUnit}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // LOTTERY PAGE
  async function renderLottery() {
    const res = await api('/koa/get/lotterySet');
    const prizes = ['1,000', '2,000', '3,000', '5,000', 'START', '10,000', '500', '8,000', 'Again'];

    document.getElementById('page-lottery').innerHTML = `
      <div class="page-header">
        <div class="back-btn" onclick="navigateTo('index1')"><i class="fa fa-arrow-left"></i></div>
        <div class="title">Lucky Draw</div>
      </div>
      <div class="content fade-in">
        <div class="lottery-container">
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="font-size: 14px; color: rgba(255,255,255,0.6);">Remaining draws: <span style="color: #4fc3f7; font-weight: bold;">${res.lottery_num || 0}</span></div>
          </div>
          <div class="lottery-grid">
            ${prizes.map((p, i) => `
              <div class="grid-item ${i === 4 ? 'center' : ''}" data-idx="${i}" onclick="${i === 4 ? 'startLottery()' : ''}">
                ${i === 4 ? 'START' : p + ' UGX'}
              </div>
            `).join('')}
          </div>
          <div style="text-align: center; margin-top: 30px;">
            <h3 style="margin-bottom: 15px;">Recent Winners</h3>
            <div id="lottery-history"></div>
          </div>
        </div>
      </div>
    `;

    const histRes = await api('/koa/get/lottery/list');
    const history = histRes.msg || [];
    const histEl = document.getElementById('lottery-history');
    if (histEl) {
      histEl.innerHTML = history.map(h => `
        <div style="padding: 8px; font-size: 12px; color: rgba(255,255,255,0.5);">
          ${h.user_phone} won ${h.name} - ${formatDate(new Date(h.time).getTime())}
        </div>
      `).join('');
    }
  }

  // WITHDRAW PAGE
  async function renderWithdraw() {
    const res = await api('/koa/get/my/channelAndSet');
    const me = res.msg?.me || APP.user || {};

    document.getElementById('page-withdraw').innerHTML = `
      <div class="page-header">
        <div class="back-btn" onclick="navigateTo('index5')"><i class="fa fa-arrow-left"></i></div>
        <div class="title">Withdraw</div>
      </div>
      <div class="content fade-in">
        <div class="card-bg light" style="margin: 15px; text-align: center;">
          <div style="font-size: 12px; color: rgba(255,255,255,0.5);">Available Balance</div>
          <div style="font-size: 24px; font-weight: bold; color: #4fc3f7; margin-top: 5px;">${APP.moneyUnit} ${formatMoney(me.balance || 0)}</div>
        </div>
        <div class="withdraw-form">
          <div class="form-group">
            <label>Payment Method</label>
            <select id="withdraw-bank">
              <option value="AIRTEL">AIRTEL</option>
              <option value="MTN">MTN</option>
            </select>
          </div>
          <div class="form-group">
            <label>Phone Number</label>
            <input type="text" id="withdraw-phone" value="${me.bank_user_phone || ''}" placeholder="Enter phone number">
          </div>
          <div class="form-group">
            <label>Account Name</label>
            <input type="text" id="withdraw-name" value="${me.bank_name || ''}" placeholder="Enter account name">
          </div>
          <div class="form-group">
            <label>Amount (${APP.moneyUnit})</label>
            <input type="number" id="withdraw-amount" placeholder="Enter withdrawal amount">
          </div>
          <div class="form-group">
            <label>Password</label>
            <input type="password" id="withdraw-pwd" placeholder="Enter 6-digit password">
          </div>
          <button class="btn-submit" onclick="submitWithdraw()">Submit Withdrawal</button>
        </div>
      </div>
    `;
  }

  // INVITE PAGE
  function renderInvite() {
    const code = APP.user?.share_code || 'XXXXX';
    const link = window.location.origin + '/#/?code=' + code;

    document.getElementById('page-invite').innerHTML = `
      <div class="page-header">
        <div class="back-btn" onclick="navigateTo('index5')"><i class="fa fa-arrow-left"></i></div>
        <div class="title">Invite Friends</div>
      </div>
      <div class="content fade-in">
        <div class="invite-page">
          <div class="card-bg light" style="padding: 30px;">
            <div style="font-size: 14px; color: rgba(255,255,255,0.6); margin-bottom: 10px;">Your Invite Code</div>
            <div class="invite-code">${code}</div>
            <div style="font-size: 12px; color: rgba(255,255,255,0.4); margin-top: 10px;">Share this code with friends to earn rewards</div>
          </div>
          <div class="qr-container" id="qr-code">
            <canvas id="qr-canvas" width="200" height="200"></canvas>
          </div>
          <button class="btn-long" onclick="copyToClipboard('${link}')">
            <i class="fas fa-copy"></i> Copy Invite Link
          </button>
          <button class="btn-long" style="background: rgba(255,255,255,0.1); color: #fff; border: 1px solid rgba(255,255,255,0.2);" onclick="copyToClipboard('${code}')">
            <i class="fas fa-share-alt"></i> Copy Invite Code
          </button>
        </div>
      </div>
    `;

    // Generate simple QR code visual placeholder
    const canvas = document.getElementById('qr-canvas');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, 200, 200);
      ctx.fillStyle = '#000';
      // Simple QR-like pattern
      for (let i = 0; i < 20; i++) {
        for (let j = 0; j < 20; j++) {
          if (Math.random() > 0.5 || (i < 4 && j < 4) || (i > 15 && j < 4) || (i < 4 && j > 15)) {
            ctx.fillRect(i * 10, j * 10, 10, 10);
          }
        }
      }
      // QR corners
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, 70, 70);
      ctx.fillStyle = '#fff';
      ctx.fillRect(10, 10, 50, 50);
      ctx.fillStyle = '#000';
      ctx.fillRect(20, 20, 30, 30);

      ctx.fillStyle = '#000';
      ctx.fillRect(130, 0, 70, 70);
      ctx.fillStyle = '#fff';
      ctx.fillRect(140, 10, 50, 50);
      ctx.fillStyle = '#000';
      ctx.fillRect(150, 20, 30, 30);

      ctx.fillStyle = '#000';
      ctx.fillRect(0, 130, 70, 70);
      ctx.fillStyle = '#fff';
      ctx.fillRect(10, 140, 50, 50);
      ctx.fillStyle = '#000';
      ctx.fillRect(20, 150, 30, 30);
    }
  }

  // CHAT PAGE
  function renderChat() {
    document.getElementById('page-chat').innerHTML = `
      <div class="page-header">
        <div class="back-btn" onclick="navigateTo('index1')"><i class="fa fa-arrow-left"></i></div>
        <div class="title">Customer Service</div>
      </div>
      <div class="chat-container">
        <div class="chat-messages" id="chat-messages">
          <div class="chat-message received">
            <div class="bubble">Welcome to Future AI Hub support! How can we help you today?</div>
          </div>
        </div>
        <div class="chat-input">
          <input type="text" id="chat-input" placeholder="Type a message..." onkeypress="if(event.key==='Enter')sendMessage()">
          <button onclick="sendMessage()"><i class="fas fa-paper-plane"></i></button>
        </div>
      </div>
    `;
  }

  // PAYMENT PAGE
  function renderPayment() {
    document.getElementById('page-payment').innerHTML = `
      <div class="page-header">
        <div class="back-btn" onclick="navigateTo('index5')"><i class="fa fa-arrow-left"></i></div>
        <div class="title">Recharge</div>
      </div>
      <div class="content fade-in">
        <div class="withdraw-form">
          <div class="form-group">
            <label>Payment Method</label>
            <select id="pay-method">
              <option value="AIRTEL">AIRTEL Mobile Money</option>
              <option value="MTN">MTN Mobile Money</option>
            </select>
          </div>
          <div class="form-group">
            <label>Amount (${APP.moneyUnit})</label>
            <input type="number" id="pay-amount" placeholder="Enter amount (min 300,000)">
          </div>
          <button class="btn-submit" onclick="submitPayment()">Pay Now</button>
        </div>
        <div id="payment-info" style="display:none; margin: 15px;">
          <div class="card-bg light" style="padding: 20px;">
            <h3 style="margin-bottom: 15px; text-align: center;">Payment Information</h3>
            <div style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
              <div style="font-size: 12px; color: rgba(255,255,255,0.5);">Account Number</div>
              <div style="font-size: 16px; margin-top: 4px;" id="pay-account">0754235466</div>
            </div>
            <div style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
              <div style="font-size: 12px; color: rgba(255,255,255,0.5);">Account Name</div>
              <div style="font-size: 16px; margin-top: 4px;" id="pay-name">Future AI Hub</div>
            </div>
            <div style="padding: 10px 0;">
              <div style="font-size: 12px; color: rgba(255,255,255,0.5);">Amount</div>
              <div style="font-size: 20px; font-weight: bold; color: #4fc3f7; margin-top: 4px;" id="pay-display-amount">0</div>
            </div>
            <button class="btn-submit" style="margin-top: 15px;" onclick="showModal('Payment Submitted', 'Your payment is being processed. It typically takes 1-5 minutes to confirm.')">I have paid</button>
          </div>
        </div>
      </div>
    `;
  }

  // Global functions
  window.navigateTo = navigateTo;

  window.showModal = function(title, body) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = body;
    document.getElementById('modal').classList.add('active');
  };

  window.closeModal = function() {
    document.getElementById('modal').classList.remove('active');
  };

  window.sendMessage = function() {
    const input = document.getElementById('chat-input');
    const msg = input.value.trim();
    if (!msg) return;

    const messages = document.getElementById('chat-messages');
    messages.innerHTML += `<div class="chat-message sent"><div class="bubble">${msg}</div></div>`;
    input.value = '';
    messages.scrollTop = messages.scrollHeight;

    setTimeout(() => {
      messages.innerHTML += `<div class="chat-message received"><div class="bubble">Thank you for your message. Our team will respond shortly.</div></div>`;
      messages.scrollTop = messages.scrollHeight;
    }, 1500);
  };

  window.submitWithdraw = async function() {
    const amount = document.getElementById('withdraw-amount').value;
    const pwd = document.getElementById('withdraw-pwd').value;
    if (!amount || !pwd) {
      showModal('Error', 'Please fill in all fields.');
      return;
    }
    if (pwd.length !== 6) {
      showModal('Error', 'Password must be 6 digits.');
      return;
    }
    const res = await api('/koa/apply/taken', { amount, password: pwd });
    if (res.success) {
      showModal('Success', 'Withdrawal request submitted successfully!');
    } else {
      showModal('Error', res.msg || 'Withdrawal failed.');
    }
  };

  window.submitPayment = function() {
    const amount = document.getElementById('pay-amount').value;
    if (!amount || parseInt(amount) < 300000) {
      showModal('Error', 'Minimum recharge amount is 300,000 ' + APP.moneyUnit);
      return;
    }
    document.getElementById('payment-info').style.display = 'block';
    document.getElementById('pay-display-amount').textContent = formatMoney(amount) + ' ' + APP.moneyUnit;
    document.querySelector('.withdraw-form').style.display = 'none';
  };

  window.startLottery = async function() {
    const items = document.querySelectorAll('.lottery-grid .grid-item:not(.center)');
    let idx = 0;
    let speed = 100;
    let rounds = 0;

    const animate = () => {
      items.forEach(item => item.classList.remove('active'));
      items[idx % items.length].classList.add('active');
      idx++;
      rounds++;

      if (rounds < 24) {
        speed += 10;
        setTimeout(animate, speed);
      } else {
        // Show result
        api('/koa/start/lottery').then(res => {
          if (res.success) {
            showModal('Congratulations!', `You won: ${res.msg.name}`);
          }
        });
      }
    };
    animate();
  };

  window.copyToClipboard = function(text) {
    navigator.clipboard.writeText(text).then(() => {
      showModal('Copied!', 'Link copied to clipboard.');
    }).catch(() => {
      showModal('Copy', text);
    });
  };

  // WebGL Particle Background
  function initWebGL() {
    const holder = document.getElementById('waves');
    if (!holder) return;

    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl', { antialias: false });
    if (!gl) return;

    holder.appendChild(canvas);

    function resize() {
      canvas.width = window.innerWidth * devicePixelRatio;
      canvas.height = window.innerHeight * devicePixelRatio;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    resize();
    window.addEventListener('resize', resize);

    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, `
      attribute vec4 a_position;
      attribute vec4 a_color;
      uniform float u_time;
      uniform vec2 u_resolution;
      void main() {
        vec2 pos = a_position.xy;
        pos.y += sin(pos.x * 3.0 + u_time) * 0.05;
        pos.x += cos(pos.y * 2.0 + u_time * 0.7) * 0.03;
        gl_Position = vec4(pos, 0.0, 1.0);
        gl_PointSize = (3.0 + sin(u_time + a_position.x * 10.0) * 2.0);
        gl_PointSize *= (u_resolution.y / 800.0);
      }
    `);
    gl.compileShader(vertexShader);

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, `
      precision mediump float;
      uniform float u_time;
      void main() {
        float dist = length(gl_PointCoord - vec2(0.5));
        if (dist > 0.5) discard;
        float alpha = (1.0 - dist * 2.0) * 0.6;
        vec3 color = mix(vec3(0.3, 0.7, 0.97), vec3(0.1, 0.4, 0.8), sin(u_time * 0.5) * 0.5 + 0.5);
        gl_FragColor = vec4(color, alpha);
      }
    `);
    gl.compileShader(fragmentShader);

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    // Generate particles
    const count = 200;
    const positions = new Float32Array(count * 2);
    for (let i = 0; i < count; i++) {
      positions[i * 2] = (Math.random() * 2 - 1);
      positions[i * 2 + 1] = (Math.random() * 2 - 1);
    }

    const posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const timeLoc = gl.getUniformLocation(program, 'u_time');
    const resLoc = gl.getUniformLocation(program, 'u_resolution');

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.clearColor(0, 0, 0, 0);

    function render(time) {
      time *= 0.001;
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(timeLoc, time);
      gl.uniform2f(resLoc, canvas.width, canvas.height);
      gl.drawArrays(gl.POINTS, 0, count);
      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
  }

  // Start the app
  document.addEventListener('DOMContentLoaded', init);
})();
