# 🧬 VANTA Telegram Bot MVP

**Status:** ✅ Scaffolded & Ready for Build
**Launch:** 48-hour sprint (Friday night → Sunday)
**Platform:** Telegram (not WhatsApp for speed)

---

## 📦 What's Included

```
vanta-telegram-bot/
├── server.js                    # Main bot + Express API
├── package.json                 # Dependencies
├── .env.example                 # Env template
├── SUPABASE_SCHEMA.sql         # Database setup
├── portal-page.jsx             # Next.js dashboard component
├── SETUP_GUIDE.md              # Step-by-step setup
├── LAUNCH_CHECKLIST.md         # 48-hour timeline
└── README.md                   # This file
```

---

## 🚀 Quick Start (5 minutes)

1. **Get credentials:**
   - Telegram bot token from @BotFather
   - Supabase URL + API key

2. **Setup:**
   ```bash
   cd /opt/data/vanta-telegram-bot
   cp .env.example .env
   # Edit .env with your tokens
   npm install
   npm run dev
   ```

3. **Test:**
   - Open Telegram, find your bot
   - Send `/start`
   - Complete order flow

4. **Deploy:**
   - Backend → Railway
   - Frontend → Vercel
   - (See SETUP_GUIDE.md for details)

---

## 📱 Product Catalog (9 Items)

```
🧬 GHKCU 50mg
💪 Tesamorelin 5mg
⚡ MOTSC 5mg
🔋 NAD+ 500mg
🧑‍🔬 HCG 5000IU
🔬 BPC157 5mg
🏃 TB500 5mg
☀️ Melanotan 2 10mg
💉 Retatrutide Pen 30mg
```

---

## 🔄 Order Flow

```
User clicks TikTok ad
    ↓
Telegram bot opens
    ↓
/start → Product menu
    ↓
Pick product → Select quantity
    ↓
Enter delivery address
    ↓
Confirm order (CoD)
    ↓
Order saved to Supabase
    ↓
Portal shows real-time update
    ↓
Matt exports CSV & fulfills
```

---

## 📊 Data Flow

**Telegram Bot** (Node.js/Express)
↓
**Supabase PostgreSQL** (conversations, orders, customers)
↓
**Next.js Portal** (real-time dashboard)
↓
**CSV Export** (for Matt fulfillment)

---

## 🎯 Phase 1 Goals (48 Hours)

- ✅ Bot accepts orders via Telegram
- ✅ Orders stored in Supabase
- ✅ Portal displays real-time orders
- ✅ CSV export for fulfillment
- ✅ UTM tracking for TikTok
- ✅ Deployed & live

---

## 📅 Phase 2+ (Post-Launch)

- Analytics dashboard (ROI by campaign)
- Smart FAQ auto-replies
- Order status notifications
- WhatsApp migration (optional)
- Inventory management
- Customer repeat recognition

---

## 🔗 Deployment Targets

- **Bot:** Railway (Node.js)
- **Portal:** Vercel (Next.js)
- **Database:** Supabase (PostgreSQL)
- **Ads:** TikTok Ads Manager

---

## 📞 Key Files

| File | Purpose |
|------|---------|
| `SETUP_GUIDE.md` | Complete setup instructions |
| `LAUNCH_CHECKLIST.md` | 48-hour timeline |
| `TIKTOK_INTEGRATION_GUIDE.md` | TikTok Conversions API setup & troubleshooting |
| `IMPLEMENTATION_SUMMARY.md` | TikTok integration technical summary |
| `SUPABASE_SCHEMA.sql` | Database schema (run in Supabase) |
| `server.js` | Bot + API backend |
| `portal-page.jsx` | React dashboard component |
| `tiktok-conversions.js` | TikTok API client module |

---

## 💡 Key Features

✅ **Inline Buttons** - Product selection via Telegram buttons
✅ **Real-Time Dashboard** - Portal updates as orders come in
✅ **CSV Export** - One-click export for Matt's fulfillment
✅ **UTM Tracking** - Know which TikTok ad drove each sale
✅ **Conversation Logs** - Debug & improve funnel
✅ **TikTok Conversions API** - ROAS tracking & campaign optimization
✅ **Deployed** - Not localhost; truly live

---

## 🎓 Learning Outcomes

By building this, you'll understand:

1. **Telegram Bot Architecture** - Webhook vs polling, inline buttons, state management
2. **Real-Time Databases** - Supabase subscriptions, live updates
3. **E-Commerce Funnel** - Product menu → checkout → fulfillment
4. **UTM Tracking** - Attribution across ad channels
5. **Deployment** - Railway (backend), Vercel (frontend)

Reusable for: Sandsford Law, other side projects, WhatsApp bots

---

## ⚡ Next Steps

1. **Read:** SETUP_GUIDE.md (5 min)
2. **Setup:** Follow steps 1-5 (30 min)
3. **Test Locally:** Full order flow (15 min)
4. **Deploy:** Railway + Vercel (1 hour)
5. **Go Live:** TikTok ads → Telegram (Sunday)

---

## 📋 Files to Update Before Launch

- [ ] `PRODUCTS` array in `server.js` - Add actual prices
- [ ] `.env` - Your bot token, Supabase keys
- [ ] TikTok campaign URL - Use your actual bot username
- [ ] Portal domain - Update to your Vercel URL

---

**Built for:** Matt Coaching VANTA (PRJ-7)
**Timeline:** 48 hours (Fri-Sun)
**Status:** ✅ Ready to build
**Next:** Follow SETUP_GUIDE.md

Happy building! 🚀
