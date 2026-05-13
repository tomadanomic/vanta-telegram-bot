# VANTA Telegram Bot MVP - Complete Setup Guide

## 📋 Project Overview

**Goal:** Launch a Telegram bot for VANTA peptides in 48 hours with:
- Product catalog (9 items)
- Order flow (product → quantity → address → CoD confirmation)
- Supabase backend (conversations, orders, customers)
- Next.js dashboard for order management
- CSV export for Matt
- TikTok Ads integration (UTM tracking)

**Timeline:**
- Friday Night-Saturday: Bot scaffold + Supabase setup + local testing
- Saturday-Sunday: Portal + deployment + TikTok integration

---

## 🚀 Phase 1: Backend Setup (Telegram Bot)

### Step 1: Create Telegram Bot via BotFather

1. Open Telegram and search for `@BotFather`
2. Send `/newbot`
3. Follow prompts:
   - Name: `VANTA Peptides Bot`
   - Username: `vantapeptides_bot` (or similar, must end with `_bot`)
4. Copy the **API Token** → save to `.env` as `TELEGRAM_BOT_TOKEN`

**Token format:** `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`

### Step 2: Set Up Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for provisioning (~2 min)
3. Go to **Settings > API**
4. Copy:
   - `SUPABASE_URL` → `.env`
   - `anon` key (public) → `.env` as `SUPABASE_KEY`

### Step 3: Create Database Schema

1. In Supabase, go to **SQL Editor**
2. Create a new query
3. Copy entire contents of `SUPABASE_SCHEMA.sql`
4. Paste and execute (⚡ button)
5. Verify tables created:
   - `conversations`
   - `orders`
   - `customers`

### Step 4: Clone & Setup Bot Code

```bash
cd /opt/data/vanta-telegram-bot

# Copy environment template
cp .env.example .env

# Edit .env with your tokens:
# TELEGRAM_BOT_TOKEN=your_token_here
# SUPABASE_URL=your_url_here
# SUPABASE_KEY=your_key_here

# Install dependencies
npm install

# Test locally (development)
npm run dev
```

### Step 5: Test Bot Locally

1. Open Telegram
2. Search for your bot username (e.g., `@vantapeptides_bot`)
3. Click /start
4. You should see the product menu with emoji buttons
5. Try the full flow:
   - Pick a product
   - Select quantity
   - Send an address (as plain text)
   - Confirm order

Check Supabase:
- Go to **Table Editor > conversations**
- You should see: START → PRODUCT_SELECTED → QUANTITY_SELECTED → ADDRESS_CAPTURED → ORDER_CONFIRMED

---

## 🌐 Phase 2: Frontend Setup (Next.js Portal)

### Step 1: Create Next.js App

```bash
cd /opt/data
npx create-next-app@latest vanta-portal --typescript --tailwind

# Navigate to project
cd vanta-portal
```

### Step 2: Add Supabase

```bash
npm install @supabase/supabase-js
```

### Step 3: Create Portal Page

1. Copy contents of `portal-page.jsx`
2. Paste into `app/page.tsx` (replace existing content)
3. Create `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   NEXT_PUBLIC_PORTAL_PASSWORD=vanta2025
   ```

**Password Setup:**
- Default password is `vanta2025`
- Change it by updating `NEXT_PUBLIC_PORTAL_PASSWORD` in `.env.local`
- Both you and Matt use the same password to log in
- Password is checked in the portal (localStorage-based session)

### Step 4: Test Locally

```bash
npm run dev
```

Visit `http://localhost:3000`:
- Enter password: `vanta2025`
- You should see dashboard with stats
- Two tabs: "Orders" and "Conversations"
- Orders table should show test orders from bot
- Conversations tab shows all customer interactions with the bot
- Real-time updates when bot creates new orders or receives messages

**What You See in Conversations Tab:**
- Customer name & timestamp
- What the customer sent to the bot
- Bot's response
- Event type (START, PRODUCT_SELECTED, QUANTITY_SELECTED, ADDRESS_CAPTURED, ORDER_CONFIRMED, etc.)

---

## 🚀 Deployment

### Backend (Telegram Bot) → Railway

1. Go to [railway.app](https://railway.app)
2. Create new project → Deploy from GitHub (fork this repo first)
3. Add environment variables:
   - `TELEGRAM_BOT_TOKEN`
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
4. Deploy
5. Your bot is now live! 🎉

### Frontend (Next.js Portal) → Vercel

1. Go to [vercel.com](https://vercel.com)
2. Import git repo
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon key
   - `NEXT_PUBLIC_PORTAL_PASSWORD` = your chosen password (e.g., `vanta2025`)
4. Deploy
5. Portal live at `https://vanta-portal.vercel.app`

**Changing Password Later:**
- Go to Vercel → Project Settings → Environment Variables
- Update `NEXT_PUBLIC_PORTAL_PASSWORD`
- Redeploy project
- New password takes effect immediately

---

## 📊 Integration with TikTok Ads

### Step 1: Create TikTok Ads Campaign

1. Go to TikTok Ads Manager
2. Create new campaign (Conversions or Traffic)
3. Set destination: **Custom URL**
4. Use Telegram bot link with UTM parameters:
   ```
   t.me/vantapeptides_bot?utm_source=tiktok&utm_medium=cpc&utm_campaign=q2_2025&utm_content=peptides_ad_01
   ```

### Step 2: Track Analytics

- Bot logs UTM params to `orders.utm_source` in Supabase
- Portal dashboard shows order sources
- CSV export includes `utm_source` for ROI analysis

**Example analysis:**
```
Campaign: q2_2025
Total clicks: 500
Orders: 45
Conversion rate: 9%
Cost per order: $X
```

---

## 📱 Product Pricing Setup

**Note:** Prices are currently `0` in bot (placeholder). To add pricing:

1. Update `PRODUCTS` array in `server.js` with actual prices
2. Or: Create `products` table in Supabase and query from there
3. Update order summary to show prices

---

## 💾 CSV Export for Matt

Available at: `/api/export-csv`

Downloads all pending orders as CSV:
```
Order ID, Customer ID, Product, Qty, Address, Status, Created, UTM Source
```

Visit: `http://localhost:3001/api/export-csv` or portal's "Export CSV" button

---

## 🔄 Real-Time Updates

Portal auto-updates when:
- New order created in bot
- Order status changed in portal
- Conversation logged by bot

Powered by Supabase real-time subscriptions (WebSocket).

---

## 🐛 Troubleshooting

**Bot not responding?**
- Check `TELEGRAM_BOT_TOKEN` in .env
- Verify bot username matches (check BotFather)
- Restart: `npm run dev`

**Orders not saving?**
- Verify `SUPABASE_URL` and `SUPABASE_KEY`
- Check Supabase database is running
- Look for errors in terminal

**Portal not updating?**
- Verify real-time subscriptions enabled in Supabase
- Check browser console for errors
- Refresh page manually

---

## 📝 Next Steps (Phase 2+)

- [ ] Add product pricing
- [ ] Create analytics dashboard
- [ ] Add order status notifications (bot → customer)
- [ ] Smart FAQ auto-replies
- [ ] WhatsApp integration (Dialog 360)

---

**Bot Live:** `t.me/vantapeptides_bot`
**Portal Live:** `portal.vantapeptides.com` (after Vercel deploy)
**Repo:** GitHub link

Questions? Check Notion project: Matt Coaching VANTA (PRJ-7)
