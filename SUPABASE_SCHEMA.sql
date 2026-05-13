-- VANTA Telegram Bot Supabase Schema
-- Run these SQL commands in your Supabase SQL editor

-- 1. Create conversations table
CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  telegram_user_id BIGINT NOT NULL,
  chat_id BIGINT NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  event_data TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index for faster queries
CREATE INDEX conversations_user_id_idx ON conversations(telegram_user_id);
CREATE INDEX conversations_chat_id_idx ON conversations(chat_id);
CREATE INDEX conversations_created_at_idx ON conversations(created_at);

-- 2. Create orders table
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  telegram_user_id BIGINT NOT NULL,
  chat_id BIGINT NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL,
  address TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, shipped, delivered, cancelled
  utm_source JSONB, -- {source: 'tiktok', campaign: 'q2', ...}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for orders
CREATE INDEX orders_user_id_idx ON orders(telegram_user_id);
CREATE INDEX orders_chat_id_idx ON orders(chat_id);
CREATE INDEX orders_status_idx ON orders(status);
CREATE INDEX orders_created_at_idx ON orders(created_at);

-- 3. Create customers table (derived from orders)
CREATE TABLE customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  telegram_user_id BIGINT UNIQUE NOT NULL,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  phone VARCHAR(20),
  email VARCHAR(255),
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(10, 2) DEFAULT 0,
  first_order_at TIMESTAMP WITH TIME ZONE,
  last_order_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX customers_user_id_idx ON customers(telegram_user_id);

-- 4. Enable Real-Time Subscriptions (Supabase)
-- Go to Supabase Dashboard > Database > Replication > Enable Replication for:
--   - conversations
--   - orders
--   - customers

-- 5. Create RLS Policies (if needed)
-- For now, disable RLS for development:
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;

-- 6. Create View: Analytics (optional, for Phase 2)
CREATE VIEW order_analytics AS
SELECT
  DATE(orders.created_at) as order_date,
  COUNT(*) as total_orders,
  SUM(orders.quantity) as total_units,
  ARRAY_AGG(DISTINCT orders.product_name) as products,
  COUNT(DISTINCT orders.telegram_user_id) as unique_customers
FROM orders
GROUP BY DATE(orders.created_at)
ORDER BY order_date DESC;
