// Gold Comb - Gold Bar Investment Platform
(function() {
  'use strict';

  const state = {
    token: localStorage.getItem('gc_token'),
    user: null,
    products: {},
    orders: [],
    currentPage: 'home',
    dailyEarning: 0
  };

  // Icons as SVG
  const ICONS = {
    goldBar: '<svg viewBox="0 0 24 24"><path d="M5 20h14l2-8H3l2 8zM3 12h18l-1-4H4l-1 4zM7 8h10l-1-4H8L7 8z"/></svg>',
    wallet: '<svg viewBox="0 0 24 24"><path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>',
    chart: '<svg viewBox="0 0 24 24"><path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"/></svg>',
    orders: '<svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>',
    user: '<svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>',
    home: '<svg viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>',
    arrow: '<svg viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>',
    deposit: '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>',
    withdraw: '<svg viewBox="0 0 24 24"><path d="M11 9h2V6h3l-4-4-4 4h3v3zm-2 2H2v10h7V11zm6 0v10h7V11h-7z"/></svg>',
  };

  function fmt(n) { return Number(n || 0).toLocaleString(); }

  async function api(method, url, body) {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (state.token) opts.headers['Authorization'] = 'Bearer ' + state.token;
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(url, opts);
    return res.json();
  }

  function toast(msg) {
    let t = document.getElementById('toast');
    if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
  }

  // Router
  function navigate(page, data) {
    state.currentPage = page;
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));

    const el = document.getElementById('page-' + page);
    if (el) { el.classList.add('active'); el.classList.add('fade-in'); }

    const tab = document.querySelector(`[data-tab="${page}"]`);
    if (tab) tab.classList.add('active');

    const tabBar = document.querySelector('.tab-bar');
    const subPages = ['product-detail', 'deposit', 'withdraw', 'invite', 'lottery'];
    if (tabBar) tabBar.style.display = subPages.includes(page) ? 'none' : 'flex';

    switch(page) {
      case 'home': renderDashboard(); break;
      case 'products': renderProducts(); break;
      case 'orders': renderOrders(); break;
      case 'profile': renderProfile(); break;
      case 'product-detail': renderProductDetail(data); break;
      case 'deposit': renderDeposit(data); break;
      case 'withdraw': renderWithdraw(); break;
      case 'invite': renderInvite(); break;
      case 'lottery': renderLottery(); break;
    }
  }

  // Auth
  function renderAuth(mode = 'login') {
    document.getElementById('app').innerHTML = `
      <div class="auth-page fade-in">
        <img src="/images/logo.png" class="auth-logo" alt="Gold Comb">
        <h1 class="auth-title">GOLD COMB</h1>
        <p class="auth-subtitle">${mode === 'login' ? 'Welcome back! Sign in to continue.' : 'Create your investment account.'}</p>
        <div class="auth-form">
          ${mode === 'register' ? '<div class="input-group"><label>Full Name</label><input type="text" id="auth-name" placeholder="Enter your name"></div>' : ''}
          <div class="input-group"><label>Phone Number</label><input type="tel" id="auth-phone" placeholder="0754xxxxxx"></div>
          <div class="input-group"><label>Password</label><input type="password" id="auth-pwd" placeholder="Min 6 characters"></div>
          <button class="btn btn-gold" onclick="doAuth('${mode}')">${mode === 'login' ? 'Sign In' : 'Create Account'}</button>
          <p class="auth-switch">
            ${mode === 'login' ? "Don't have an account? <a onclick=\"renderAuth('register')\">Sign Up</a>" : "Already have an account? <a onclick=\"renderAuth('login')\">Sign In</a>"}
          </p>
        </div>
      </div>
    `;
  }

  window.renderAuth = renderAuth;

  window.doAuth = async function(mode) {
    const phone = document.getElementById('auth-phone').value.trim();
    const pwd = document.getElementById('auth-pwd').value;
    const name = mode === 'register' ? document.getElementById('auth-name')?.value.trim() : undefined;

    if (!phone || !pwd) return toast('Please fill all fields');
    if (pwd.length < 6) return toast('Password must be at least 6 characters');

    const url = mode === 'login' ? '/api/login' : '/api/register';
    const ref_code = new URLSearchParams(window.location.search).get('ref') || undefined;
    const res = await api('POST', url, { phone, password: pwd, name, ref_code });

    if (res.success) {
      state.token = res.token;
      state.user = res.user;
      localStorage.setItem('gc_token', res.token);
      renderMain();
      navigate('home');
    } else {
      toast(res.msg || 'Error');
    }
  };

  // Main app layout
  function renderMain() {
    document.getElementById('app').innerHTML = `
      <div id="page-home" class="page"></div>
      <div id="page-products" class="page"></div>
      <div id="page-orders" class="page"></div>
      <div id="page-profile" class="page"></div>
      <div id="page-product-detail" class="page"></div>
      <div id="page-deposit" class="page"></div>
      <div id="page-withdraw" class="page"></div>
      <div id="page-invite" class="page"></div>
      <div id="page-lottery" class="page"></div>
      <div class="tab-bar">
        <div class="tab-item active" data-tab="home" onclick="navigate('home')">
          ${ICONS.home}<span>Home</span>
        </div>
        <div class="tab-item" data-tab="products" onclick="navigate('products')">
          ${ICONS.goldBar}<span>Gold Bars</span>
        </div>
        <div class="tab-item" data-tab="orders" onclick="navigate('orders')">
          ${ICONS.orders}<span>Orders</span>
        </div>
        <div class="tab-item" data-tab="profile" onclick="navigate('profile')">
          ${ICONS.user}<span>Account</span>
        </div>
      </div>
      <div class="modal-overlay" id="modal"><div class="modal"><h3 id="modal-title"></h3><p id="modal-body"></p><button class="btn btn-gold" onclick="closeModal()">OK</button></div></div>
    `;
  }

  // Dashboard
  async function renderDashboard() {
    const res = await api('GET', '/api/me');
    if (!res.success) { logout(); return; }
    state.user = res.user;
    state.dailyEarning = res.daily_earning;

    document.getElementById('page-home').innerHTML = `
      <div class="fade-in">
        <div class="dashboard-header">
          <div class="dash-greeting">Welcome back,</div>
          <div class="dash-name">${state.user.name}</div>
          <div class="wallet-cards">
            <div class="wallet-card gold">
              <div class="label">Wallet</div>
              <div class="amount">${fmt(state.user.wallet)}</div>
            </div>
            <div class="wallet-card green">
              <div class="label">Balance</div>
              <div class="amount">${fmt(state.user.balance)}</div>
            </div>
          </div>
        </div>
        <div class="daily-earning">
          <div class="info">
            <div class="label">Daily Earning</div>
            <div class="value">${fmt(state.dailyEarning)} UGX</div>
          </div>
          <div class="icon">${ICONS.chart}</div>
        </div>
        <div class="action-buttons">
          <div class="action-btn deposit" onclick="navigate('deposit')">Deposit</div>
          <div class="action-btn withdraw" onclick="navigate('withdraw')">Withdraw</div>
        </div>

        <div style="padding: 0 20px; margin-bottom: 10px;">
          <h3 style="font-size: 16px; margin-bottom: 12px;">Quick Invest</h3>
        </div>
        <div id="quick-products" style="padding: 0 20px;"></div>
      </div>
    `;

    // Load featured products
    const pRes = await api('GET', '/api/products');
    if (pRes.success) {
      state.products = pRes.products;
      const featured = [...(pRes.products.A || []).slice(0, 2), ...(pRes.products.B || []).slice(0, 1)];
      document.getElementById('quick-products').innerHTML = featured.map(p => productCardHTML(p)).join('');
    }
  }

  function productCardHTML(p) {
    return `
      <div class="product-card" onclick="navigate('product-detail', '${p.id}')">
        <div class="icon-wrap">${ICONS.goldBar}</div>
        <div class="info">
          <div class="name">${p.name}</div>
          <div class="meta">${p.duration} days • ${fmt(p.daily_profit)} UGX/day</div>
        </div>
        <div class="price-col">
          <div class="price">${fmt(p.price)}</div>
          <div class="return">→ ${fmt(p.total_return)}</div>
        </div>
      </div>
    `;
  }

  // Products page
  async function renderProducts() {
    const res = await api('GET', '/api/products');
    if (res.success) state.products = res.products;

    const series = Object.keys(state.products);
    const activeSeries = series[0] || 'A';

    document.getElementById('page-products').innerHTML = `
      <div class="fade-in">
        <div style="padding: 20px 20px 0;"><h2 style="font-size: 20px;">Gold Bars</h2><p style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;">Choose your investment tier</p></div>
        <div class="series-tabs" id="series-tabs">
          ${series.map(s => `<div class="series-tab ${s === activeSeries ? 'active' : ''}" data-series="${s}">${s} Series</div>`).join('')}
        </div>
        <div class="product-grid" id="product-grid"></div>
      </div>
    `;

    document.querySelectorAll('.series-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.series-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        renderProductGrid(tab.dataset.series);
      });
    });

    renderProductGrid(activeSeries);
  }

  function renderProductGrid(series) {
    const prods = state.products[series] || [];
    document.getElementById('product-grid').innerHTML = prods.map(p => productCardHTML(p)).join('');
  }

  // Product detail
  function renderProductDetail(productId) {
    let product = null;
    for (const series of Object.values(state.products)) {
      product = series.find(p => p.id === productId);
      if (product) break;
    }
    if (!product) return navigate('products');

    document.getElementById('page-product-detail').innerHTML = `
      <div class="page-header">
        <div class="back" onclick="navigate('products')">${ICONS.arrow}</div>
        <div class="title">${product.name}</div>
        <div style="width:32px"></div>
      </div>
      <div class="product-detail fade-in">
        <div class="pd-header">
          <div class="pd-icon">${ICONS.goldBar}</div>
          <div class="pd-name">${product.name}</div>
          <div class="pd-series">${product.series} Series Gold Bar</div>
        </div>
        <div class="pd-stats">
          <div class="pd-stat"><div class="label">Price</div><div class="value gold">${fmt(product.price)} UGX</div></div>
          <div class="pd-stat"><div class="label">Duration</div><div class="value">${product.duration} days</div></div>
          <div class="pd-stat"><div class="label">Daily Profit</div><div class="value green">${fmt(product.daily_profit)} UGX</div></div>
          <div class="pd-stat"><div class="label">Total Return</div><div class="value gold">${fmt(product.total_return)} UGX</div></div>
        </div>

        <button class="btn btn-gold" onclick="buyProduct('${product.id}')">Buy Now (from Wallet)</button>
        <div style="text-align: center; margin: 15px 0; font-size: 13px; color: var(--text-secondary);">or deposit to purchase</div>
        
        <div class="deposit-box">
          <h3>Deposit to Mobile Money</h3>
          <div class="deposit-row">
            <div><div class="label">Number</div><div class="value">${DEPOSIT_NUMBER}</div></div>
            <button class="copy-btn" onclick="copyText('${DEPOSIT_NUMBER}')">Copy</button>
          </div>
          <div class="deposit-row">
            <div><div class="label">Account Name</div><div class="value">Gold Comb Ltd</div></div>
          </div>
          <div class="deposit-row">
            <div><div class="label">Amount</div><div class="value" style="color: var(--gold);">${fmt(product.price)} UGX</div></div>
            <button class="copy-btn" onclick="copyText('${product.price}')">Copy</button>
          </div>
          <div class="confirm-section">
            <input type="text" id="txn-id" placeholder="Enter Transaction ID after payment" maxlength="12">
            <button class="btn btn-gold" onclick="confirmDeposit(${product.price})">Confirm Deposit</button>
          </div>
        </div>
      </div>
    `;
  }

  const DEPOSIT_NUMBER = '0754235466';

  window.buyProduct = async function(productId) {
    const res = await api('POST', '/api/buy', { product_id: productId });
    if (res.success) {
      toast(res.msg);
      navigate('orders');
    } else {
      toast(res.msg || 'Purchase failed');
    }
  };

  window.confirmDeposit = async function(amount) {
    const txnId = document.getElementById('txn-id')?.value.trim();
    if (!txnId || txnId.length < 8) return toast('Enter valid Transaction ID');

    const res = await api('POST', '/api/deposit', { amount, txn_id: txnId });
    if (res.success) {
      toast('Deposit confirmed! ' + fmt(amount) + ' UGX added to wallet.');
      state.user.wallet = res.wallet;
      navigate('home');
    } else {
      toast(res.msg || 'Deposit failed');
    }
  };

  // Deposit page
  function renderDeposit(data) {
    document.getElementById('page-deposit').innerHTML = `
      <div class="page-header">
        <div class="back" onclick="navigate('home')">${ICONS.arrow}</div>
        <div class="title">Deposit</div>
        <div style="width:32px"></div>
      </div>
      <div class="product-detail fade-in">
        <div class="deposit-box">
          <h3>Send Mobile Money to:</h3>
          <div class="deposit-row">
            <div><div class="label">Number</div><div class="value">${DEPOSIT_NUMBER}</div></div>
            <button class="copy-btn" onclick="copyText('${DEPOSIT_NUMBER}')">Copy</button>
          </div>
          <div class="deposit-row">
            <div><div class="label">Account Name</div><div class="value">Gold Comb Ltd</div></div>
          </div>
          <div class="deposit-row">
            <div><div class="label">Method</div><div class="value">AIRTEL / MTN</div></div>
          </div>
        </div>
        <div style="padding: 20px;">
          <div class="input-group"><label>Amount (UGX)</label><input type="number" id="dep-amount" placeholder="Min 10,000 UGX"></div>
          <div class="input-group"><label>Transaction ID</label><input type="text" id="dep-txn" placeholder="Enter TXN ID from SMS" maxlength="12"></div>
          <button class="btn btn-gold" onclick="submitDeposit()">Confirm Deposit</button>
        </div>
      </div>
    `;
  }

  window.submitDeposit = async function() {
    const amount = parseInt(document.getElementById('dep-amount').value);
    const txnId = document.getElementById('dep-txn').value.trim();
    if (!amount || amount < 10000) return toast('Minimum deposit is 10,000 UGX');
    if (!txnId || txnId.length < 8) return toast('Enter valid Transaction ID');

    const res = await api('POST', '/api/deposit', { amount, txn_id: txnId });
    if (res.success) {
      toast('Deposit confirmed! ' + fmt(amount) + ' UGX added to wallet.');
      navigate('home');
    } else {
      toast(res.msg || 'Deposit failed');
    }
  };

  // Orders page
  async function renderOrders() {
    const res = await api('GET', '/api/orders');
    const orders = res.orders || [];

    const active = orders.filter(o => o.status === 'active');
    const harvest = orders.filter(o => o.status === 'harvest');
    const completed = orders.filter(o => o.status === 'completed');

    document.getElementById('page-orders').innerHTML = `
      <div class="fade-in">
        <div style="padding: 20px 20px 0;"><h2 style="font-size: 20px;">My Orders</h2></div>
        <div class="orders-tabs">
          <div class="orders-tab active" data-filter="active">Active (${active.length})</div>
          <div class="orders-tab" data-filter="harvest">Harvest (${harvest.length})</div>
          <div class="orders-tab" data-filter="completed">Done (${completed.length})</div>
        </div>
        <div id="orders-list"></div>
      </div>
    `;

    document.querySelectorAll('.orders-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.orders-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        renderOrdersList(orders, tab.dataset.filter);
      });
    });

    renderOrdersList(orders, 'active');
  }

  function renderOrdersList(orders, filter) {
    const filtered = orders.filter(o => o.status === filter);
    const list = document.getElementById('orders-list');

    if (filtered.length === 0) {
      list.innerHTML = `<div class="empty-state">${ICONS.orders}<p>No ${filter} orders yet.</p></div>`;
      return;
    }

    list.innerHTML = filtered.map(o => `
      <div class="order-card">
        <div class="top">
          <div class="name">${o.product_name}</div>
          <div class="status ${o.status}">${o.status === 'harvest' ? '🌾 Ready!' : o.status}</div>
        </div>
        <div class="progress-bar"><div class="fill" style="width: ${o.progress}%"></div></div>
        <div class="stats">
          <div>Day ${o.days_passed}/${o.duration_days}</div>
          <div>Earned: <span class="value">${fmt(o.accumulated)} UGX</span></div>
        </div>
        <div class="stats" style="margin-top: 6px;">
          <div>Invested: ${fmt(o.amount)} UGX</div>
          <div>Return: <span class="value">${fmt(o.total_return)} UGX</span></div>
        </div>
        ${o.status === 'harvest' ? `<button class="harvest-btn" onclick="harvestOrder(${o.id})">🌾 Harvest Now</button>` : ''}
      </div>
    `).join('');
  }

  window.harvestOrder = async function(orderId) {
    const res = await api('POST', '/api/harvest', { order_id: orderId });
    if (res.success) {
      toast(res.msg);
      renderOrders();
    } else {
      toast(res.msg || 'Harvest failed');
    }
  };

  // Profile
  async function renderProfile() {
    const res = await api('GET', '/api/me');
    if (res.success) state.user = res.user;
    const u = state.user || {};

    const txnRes = await api('GET', '/api/transactions');
    const txns = txnRes.transactions || [];

    document.getElementById('page-profile').innerHTML = `
      <div class="fade-in">
        <div style="text-align: center; padding: 30px 20px;">
          <img src="/images/logo.png" style="width: 60px; height: 60px; border-radius: 50%; border: 2px solid var(--gold); margin-bottom: 10px;">
          <div style="font-size: 20px; font-weight: 700;">${u.name}</div>
          <div style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;">${u.phone}</div>
        </div>

        <div class="wallet-cards" style="padding: 0 20px; margin-bottom: 20px;">
          <div class="wallet-card gold">
            <div class="label">Wallet</div>
            <div class="amount">${fmt(u.wallet)}</div>
          </div>
          <div class="wallet-card green">
            <div class="label">Balance</div>
            <div class="amount">${fmt(u.balance)}</div>
          </div>
        </div>

        <div class="action-buttons">
          <div class="action-btn deposit" onclick="navigate('deposit')">Deposit</div>
          <div class="action-btn withdraw" onclick="navigate('withdraw')">Withdraw</div>
        </div>

        <!-- Invite & Lottery buttons -->
        <div class="action-buttons" style="margin-top: 0;">
          <div class="action-btn" style="background: linear-gradient(135deg, #6c5ce7, #a29bfe); color: #fff;" onclick="navigate('invite')">Invite Friends</div>
          <div class="action-btn" style="background: linear-gradient(135deg, #e17055, #fab1a0); color: #fff;" onclick="navigate('lottery')">Lottery 🎰</div>
        </div>

        <div style="padding: 0 20px; margin-top: 15px;">
          <div style="display: flex; justify-content: space-between; padding: 14px; background: rgba(108,92,231,0.1); border-radius: 12px; border: 1px solid rgba(108,92,231,0.2); margin-bottom: 12px;">
            <div><div style="font-size: 11px; color: var(--text-secondary);">Referral Earnings</div><div style="font-size: 16px; font-weight: 700; color: #a29bfe; margin-top: 3px;">${fmt(u.referral_earnings || 0)} UGX</div></div>
            <div><div style="font-size: 11px; color: var(--text-secondary);">Lottery Spins</div><div style="font-size: 16px; font-weight: 700; color: #fab1a0; margin-top: 3px;">${u.lottery_spins || 0}</div></div>
          </div>
        </div>

        <div style="padding: 0 20px;">
          <h3 style="font-size: 16px; margin-bottom: 12px;">Recent Transactions</h3>
          ${txns.length === 0 ? '<p style="font-size: 13px; color: var(--text-secondary);">No transactions yet.</p>' :
            txns.slice(0, 10).map(t => `
              <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                <div>
                  <div style="font-size: 14px;">${t.description}</div>
                  <div style="font-size: 11px; color: var(--text-secondary); margin-top: 3px;">${new Date(t.created_at).toLocaleDateString()}</div>
                </div>
                <div style="font-size: 14px; font-weight: 600; color: ${t.amount > 0 ? 'var(--success)' : 'var(--danger)'};">${t.amount > 0 ? '+' : ''}${fmt(t.amount)} UGX</div>
              </div>
            `).join('')
          }
        </div>

        <div style="padding: 20px;">
          <button class="btn btn-outline" style="border-color: var(--danger); color: var(--danger);" onclick="logout()">Sign Out</button>
        </div>
      </div>
    `;
  }

  // Invite page
  async function renderInvite() {
    const res = await api('GET', '/api/referrals');
    const data = res.success ? res : { invite_code: '', referral_count: 0, members: [], lottery_spins: 0 };
    const inviteLink = window.location.origin + '?ref=' + data.invite_code;

    document.getElementById('page-invite').innerHTML = `
      <div class="page-header">
        <div class="back" onclick="navigate('profile')">${ICONS.arrow}</div>
        <div class="title">Invite Friends</div>
        <div style="width:32px"></div>
      </div>
      <div class="fade-in" style="padding: 20px;">
        <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, rgba(108,92,231,0.1), transparent); border-radius: var(--radius); border: 1px solid rgba(108,92,231,0.2); margin-bottom: 20px;">
          <div style="font-size: 40px; margin-bottom: 10px;">🎁</div>
          <h3 style="font-size: 18px; margin-bottom: 8px;">Earn Daily Rewards!</h3>
          <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.5;">Invite friends and earn <strong style="color: var(--gold);">5% daily</strong> of their investment profits directly to your balance. Plus get a <strong style="color: #fab1a0;">free lottery spin</strong> for each invite!</p>
        </div>

        <div class="deposit-box" style="background: linear-gradient(135deg, rgba(108,92,231,0.08), transparent); border-color: rgba(108,92,231,0.2);">
          <h3 style="color: #a29bfe;">Your Invite Link</h3>
          <div style="background: rgba(0,0,0,0.3); padding: 12px; border-radius: 8px; word-break: break-all; font-size: 13px; margin-bottom: 12px;">${inviteLink}</div>
          <button class="btn btn-gold" onclick="copyText('${inviteLink}')">Copy Invite Link</button>
          <div style="margin-top: 10px; text-align: center; font-size: 12px; color: var(--text-secondary);">Code: <strong style="color: #a29bfe;">${data.invite_code}</strong></div>
        </div>

        <div style="display: flex; gap: 12px; margin: 20px 0;">
          <div style="flex: 1; padding: 14px; background: var(--bg-card); border-radius: 12px; text-align: center;">
            <div style="font-size: 22px; font-weight: 700; color: #a29bfe;">${data.referral_count}</div>
            <div style="font-size: 11px; color: var(--text-secondary); margin-top: 3px;">Friends Invited</div>
          </div>
          <div style="flex: 1; padding: 14px; background: var(--bg-card); border-radius: 12px; text-align: center;">
            <div style="font-size: 22px; font-weight: 700; color: #fab1a0;">${data.lottery_spins}</div>
            <div style="font-size: 11px; color: var(--text-secondary); margin-top: 3px;">Lottery Spins</div>
          </div>
        </div>

        <button class="btn btn-gold" onclick="claimReferralReward()">Claim Daily Referral Reward</button>

        ${data.members.length > 0 ? `
          <h3 style="font-size: 15px; margin: 20px 0 12px;">Your Team</h3>
          ${data.members.map(m => `
            <div style="display: flex; justify-content: space-between; padding: 12px; background: var(--bg-card); border-radius: 10px; margin-bottom: 8px;">
              <div>
                <div style="font-size: 14px; font-weight: 500;">${m.name}</div>
                <div style="font-size: 11px; color: var(--text-secondary);">${m.phone}</div>
              </div>
              <div style="font-size: 12px; color: var(--success);">${m.active_orders} orders</div>
            </div>
          `).join('')}
        ` : '<div class="empty-state"><p>No team members yet. Share your link!</p></div>'}
      </div>
    `;
  }

  window.claimReferralReward = async function() {
    const res = await api('POST', '/api/claim-referral-reward');
    if (res.success) {
      toast(res.msg);
      renderInvite();
    } else {
      toast(res.msg || 'Cannot claim yet');
    }
  };

  // Lottery page
  async function renderLottery() {
    const res = await api('GET', '/api/me');
    if (res.success) state.user = res.user;
    const spins = state.user?.lottery_spins || 0;

    document.getElementById('page-lottery').innerHTML = `
      <div class="page-header">
        <div class="back" onclick="navigate('profile')">${ICONS.arrow}</div>
        <div class="title">Lucky Lottery</div>
        <div style="width:32px"></div>
      </div>
      <div class="fade-in" style="padding: 20px; text-align: center;">
        <div style="font-size: 60px; margin: 20px 0;">🎰</div>
        <h2 style="font-size: 22px; margin-bottom: 8px;">Lucky Gold Spin</h2>
        <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 25px;">Spin the wheel for a chance to win up to <strong style="color: var(--gold);">500,000 UGX!</strong></p>

        <div style="padding: 20px; background: linear-gradient(135deg, rgba(225,112,85,0.1), transparent); border-radius: var(--radius); border: 1px solid rgba(225,112,85,0.2); margin-bottom: 20px;">
          <div style="font-size: 14px; color: var(--text-secondary);">Available Spins</div>
          <div style="font-size: 36px; font-weight: 700; color: #fab1a0; margin-top: 6px;">${spins}</div>
        </div>

        <button class="btn btn-gold" style="font-size: 18px; padding: 18px;" onclick="spinLottery()" ${spins === 0 ? 'disabled style="opacity: 0.5; font-size: 18px; padding: 18px;"' : ''}>🎰 SPIN NOW!</button>

        ${spins === 0 ? '<p style="font-size: 13px; color: var(--text-secondary); margin-top: 15px;">Invite a friend to earn a free spin!</p>' : ''}

        <div id="lottery-result" style="margin-top: 20px;"></div>

        <div style="margin-top: 30px; text-align: left;">
          <h3 style="font-size: 15px; margin-bottom: 12px;">Prize Table</h3>
          <div style="font-size: 12px; color: var(--text-secondary);">
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);"><span>500 UGX</span><span>40%</span></div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);"><span>1,000 UGX</span><span>30%</span></div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);"><span>2,500 UGX</span><span>15%</span></div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);"><span>5,000 UGX</span><span>8%</span></div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);"><span>10,000 UGX</span><span>4%</span></div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);"><span>25,000 UGX</span><span>1.5%</span></div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);"><span>50,000 UGX</span><span>0.8%</span></div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);"><span>100,000 UGX</span><span>0.15%</span></div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; color: var(--gold);"><span>500,000 UGX</span><span>0.05%</span></div>
          </div>
        </div>
      </div>
    `;
  }

  window.spinLottery = async function() {
    const res = await api('POST', '/api/lottery/spin');
    if (res.success) {
      const resultEl = document.getElementById('lottery-result');
      resultEl.innerHTML = `
        <div style="padding: 20px; background: linear-gradient(135deg, rgba(212,168,67,0.2), rgba(184,134,11,0.1)); border-radius: var(--radius); border: 2px solid var(--gold); animation: fadeIn 0.5s ease;">
          <div style="font-size: 30px;">🎉</div>
          <div style="font-size: 20px; font-weight: 700; color: var(--gold); margin-top: 8px;">You won ${fmt(res.amount)} UGX!</div>
          <div style="font-size: 13px; color: var(--text-secondary); margin-top: 6px;">Added to your balance. Spins left: ${res.spins_left}</div>
        </div>
      `;
      toast('🎉 ' + res.msg);
      setTimeout(() => renderLottery(), 3000);
    } else {
      toast(res.msg || 'No spins available');
    }
  };

  // Withdraw
  function renderWithdraw() {
    document.getElementById('page-withdraw').innerHTML = `
      <div class="page-header">
        <div class="back" onclick="navigate('home')">${ICONS.arrow}</div>
        <div class="title">Withdraw</div>
        <div style="width:32px"></div>
      </div>
      <div class="withdraw-page fade-in">
        <div class="withdraw-balance">
          <div class="label">Available Balance</div>
          <div class="amount">${fmt(state.user?.balance || 0)} UGX</div>
        </div>
        <div class="input-group"><label>Withdraw Method</label>
          <select id="w-method" style="width:100%;padding:14px 16px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.15);border-radius:12px;color:#fff;font-size:15px;outline:none;">
            <option value="AIRTEL">AIRTEL Mobile Money</option>
            <option value="MTN">MTN Mobile Money</option>
          </select>
        </div>
        <div class="input-group"><label>Phone Number</label><input type="tel" id="w-phone" placeholder="0754xxxxxx" value="${state.user?.phone || ''}"></div>
        <div class="input-group"><label>Amount (UGX)</label><input type="number" id="w-amount" placeholder="Min 10,000 UGX"></div>
        <button class="btn btn-gold" onclick="submitWithdraw()">Submit Withdrawal</button>
      </div>
    `;
  }

  window.submitWithdraw = async function() {
    const amount = parseInt(document.getElementById('w-amount').value);
    const phone = document.getElementById('w-phone').value.trim();
    const method = document.getElementById('w-method').value;
    if (!amount || amount < 10000) return toast('Minimum withdrawal is 10,000 UGX');
    if (!phone) return toast('Enter phone number');

    const res = await api('POST', '/api/withdraw', { amount, phone, method });
    if (res.success) {
      toast(res.msg);
      navigate('home');
    } else {
      toast(res.msg || 'Withdrawal failed');
    }
  };

  // Utils
  window.navigate = navigate;

  window.copyText = function(text) {
    navigator.clipboard.writeText(String(text)).then(() => toast('Copied!')).catch(() => toast(text));
  };

  window.closeModal = function() {
    document.getElementById('modal')?.classList.remove('active');
  };

  window.logout = function() {
    localStorage.removeItem('gc_token');
    state.token = null;
    state.user = null;
    renderAuth('login');
  };

  // Init
  async function init() {
    if (state.token) {
      const res = await api('GET', '/api/me');
      if (res.success) {
        state.user = res.user;
        state.dailyEarning = res.daily_earning;
        renderMain();
        navigate('home');
      } else {
        localStorage.removeItem('gc_token');
        state.token = null;
        renderAuth('login');
      }
    } else {
      renderAuth('login');
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
