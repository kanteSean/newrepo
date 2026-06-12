# Gold Comb

Gold bar investment platform with daily profit accumulation and mobile money payments.

## Features

- **Gold Bar Products**: A, B, F, Z series (10k → 50M UGX)
- **Daily Profit**: See earnings accumulate day by day on your dashboard
- **Wallet + Balance**: Deposits go to Wallet, withdrawals come from Balance
- **Harvest System**: Orders mature over time, then you harvest the returns
- **Multi-User Accounts**: Full registration/login with SQLite storage
- **Mobile Money**: Deposit via AIRTEL/MTN (number: 0754235466)

## Getting Started

```bash
cd gold-comb
npm install
npm start
```

Open http://localhost:3000

## Product Tiers

| Series | Products | Price Range | Duration | Daily Profit |
|--------|----------|-------------|----------|--------------|
| A | A-1 to A-3 | 10k – 50k UGX | 20 days | 500 – 3,500 UGX |
| B | B-1 to B-3 | 100k – 500k UGX | 25 days | 7k – 40k UGX |
| F | F-1 to F-3 | 1M – 5M UGX | 30 days | 80k – 450k UGX |
| Z | Z-1 to Z-3 | 10M – 50M UGX | 35 days | 1M – 6M UGX |

## How It Works

1. Register an account
2. Browse gold bars by series (A → Z, cheap to expensive)
3. Click a gold bar → see deposit number (0754235466)
4. Send mobile money, enter Transaction ID to confirm
5. Money goes to **Wallet** → Buy gold bar from wallet
6. Track daily profit accumulation in Orders
7. When duration completes → Harvest! Returns go to **Balance**
8. Withdraw from Balance to your mobile money
