# TRADEX — Trading Journal & Analytics

A full-stack trading journal for logging trades, tracking P&L, and analyzing performance across forex and gold — built as a Next.js/Node monorepo backed by PostgreSQL.

Built as a private client engagement. The live deployment isn't publicly linked to protect client confidentiality — see it in action via the demo video on my [portfolio](https://portfolio-steel-zeta-60.vercel.app/#work), or ask for a live walkthrough.

<img width="1358" height="577" alt="Tradex dashboard screenshot" src="https://github.com/user-attachments/assets/2a2eb971-7eb1-4ed9-9d45-c75d83c5023f" />

## Features

- **JWT authentication** — secure signup/login with bcrypt password hashing
- **Trade management** — add, edit, and delete trades with live P&L preview
- **Risk management** — track risk-reward ratios per trade
- **Market brief** — on-demand daily/weekly briefs pulling in macro context
- **Macro regime widget** — DXY, 10-year yield, and VIX, with a live VIX-momentum caveat
- **SMT signal feed** — real-time smart-money-technique divergence signals, plus a correlation widget
- **Backtesting** — backtest proxy route with a results view
- **Analytics** — performance metrics and charts (Recharts), CSV export
- **Forex & gold support** — pip-based calculations for FX and XAUUSD
- **Responsive UI** — works on desktop and mobile

## Tech stack

| Layer    | Stack                                                                 |
| -------- | ---------------------------------------------------------------------- |
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS, Radix UI, Recharts     |
| Backend  | Node.js, Express, PostgreSQL (Neon), JWT, bcrypt                      |
| Infra    | Vercel (web), Resend (transactional email), npm workspaces monorepo   |

## Project structure

```
Tradex/
├── apps/
│   ├── web/   # Next.js frontend (apps/web)
│   └── api/   # Express API + PostgreSQL (apps/api)
└── package.json  # npm workspaces root
```

## Getting started

### Prerequisites

- Node.js v18+
- PostgreSQL (Neon or local)
- npm

### 1. Clone and install

```bash
git clone https://github.com/Kelvyn94/Tradex.git
cd Tradex
npm install
```

### 2. Configure environment variables

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.local.example apps/web/.env.local
# fill in your database URL, JWT secret, and API keys
```

### 3. Run the API

```bash
cd apps/api
npm run dev
```

### 4. Run the web app

```bash
cd apps/web
npm run dev
```

The frontend runs on `http://localhost:3000` and talks to the API on the port set in `apps/api/.env`.

## Roadmap

- [ ] Automated tests for trade P&L and backtest calculations
- [ ] Multi-currency account support
