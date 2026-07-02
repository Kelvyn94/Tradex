-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(30) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trades table
CREATE TABLE IF NOT EXISTS trades (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date VARCHAR(20) NOT NULL,
    instrument VARCHAR(10) NOT NULL,
    direction VARCHAR(5) NOT NULL CHECK (direction IN ('Long', 'Short')),
    entry DECIMAL(20, 8) NOT NULL CHECK (entry >= 0),
    exit DECIMAL(20, 8) NOT NULL CHECK (exit >= 0),
    size DECIMAL(20, 8) NOT NULL CHECK (size >= 0),
    stop_loss DECIMAL(20, 8) DEFAULT NULL CHECK (stop_loss >= 0),
    take_profit DECIMAL(20, 8) DEFAULT NULL CHECK (take_profit >= 0),
    pnl DECIMAL(20, 8) DEFAULT 0,
    pnl_percentage DECIMAL(10, 4) DEFAULT 0,
    risk_reward_ratio DECIMAL(10, 4) DEFAULT NULL,
    tags TEXT[] DEFAULT '{}',
    notes TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_date ON trades(date);
CREATE INDEX IF NOT EXISTS idx_trades_instrument ON trades(instrument);
CREATE INDEX IF NOT EXISTS idx_trades_direction ON trades(direction);
CREATE INDEX IF NOT EXISTS idx_trades_user_date ON trades(user_id, date DESC);