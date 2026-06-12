# Future AI Hub Clone

A full-stack clone of the Future AI Hub investment platform.

## Tech Stack

- **Frontend**: Vanilla JS SPA with WebGL particle background
- **Backend**: Node.js + Express + Socket.IO
- **Styling**: Custom CSS with dark theme, Font Awesome icons

## Features

- **Home**: News feed, banner slider, notifications, quick menu
- **Products**: Investment products organized by series (E, G, A, Z, VIP)
- **Orders**: View active and completed investment orders
- **Profile**: User info, balance, recharge, withdrawal
- **VIP System**: 10 VIP levels with invite-based upgrades
- **Lucky Draw**: Lottery spin wheel with prizes
- **Chat**: Real-time customer support (Socket.IO)
- **Payment**: Mobile money recharge (AIRTEL/MTN)
- **Invite**: Share referral code with QR code

## Getting Started

```bash
cd future-aihub
npm install
npm start
```

Then open http://localhost:3000 in your browser.

## API Endpoints

All endpoints accept POST with JSON body:

- `/koa/get/all/set` - Get site settings
- `/koa/get/news/list` - Get news articles
- `/koa/get/my/data` - Get user profile data
- `/koa/get/notice/list` - Get notifications
- `/koa/get/homePage/data` - Get homepage stats
- `/koa/getList/fundType` - Get investment categories
- `/koa/getList/fundOfType` - Get products by category
- `/koa/get/my/fundOrder/list` - Get user orders
- `/koa/is/upgrade/vip` - Get VIP level info
- `/koa/get/lotterySet` - Get lottery settings
- `/koa/start/lottery` - Spin the lottery
- `/koa/get/my/channelAndSet` - Get withdrawal settings
- `/koa/apply/taken` - Submit withdrawal request

## Currency

The platform uses **UGX (Ugandan Shilling)** with mobile money payments via AIRTEL and MTN.
