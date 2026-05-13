# VANTA Telegram Bot - 48-Hour MVP Checklist

## 🎯 Phase 1: Core Bot (Friday Night - Saturday, 24 hours)

### Hour 1-2: Telegram Setup
- [ ] Create bot via BotFather, get API token
- [ ] Create Supabase project, get URL + API key
- [ ] Store credentials in `.env`

### Hour 3-6: Database Setup
- [ ] Run `SUPABASE_SCHEMA.sql` in Supabase SQL editor
- [ ] Verify tables created: `conversations`, `orders`, `customers`
- [ ] Test Supabase connection from bot code

### Hour 7-12: Bot Development
- [ ] `npm install` dependencies
- [ ] Update `PRODUCTS` array with 9 items (with prices once Matt provides)
- [ ] Test `/start` command → product menu
- [ ] Test product selection → quantity buttons
- [ ] Test quantity → address input
- [ ] Test address → order confirmation
- [ ] Verify orders saved to Supabase

### Hour 13-18: Local Testing
- [ ] Send 5 test orders through bot
- [ ] Verify all conversations logged in Supabase
- [ ] Check CSV export format
- [ ] Test health check: `GET /health`

### Hour 19-24: Bot Deployment
- [ ] Fork repo to GitHub
- [ ] Deploy to Railway
- [ ] Add environment variables on Railway
- [ ] Test bot live: `t.me/vantapeptides_bot`
- [ ] Verify orders still logged to Supabase

---

## 🎯 Phase 2: Portal & Analytics (Saturday - Sunday, 24 hours)

### Hour 25-28: Next.js Portal
- [ ] Create Next.js app with Tailwind
- [ ] Install Supabase client
- [ ] Copy portal code to `app/page.tsx`
- [ ] Test locally: `npm run dev`
- [ ] Verify real-time updates when bot creates orders

### Hour 29-32: Portal Features
- [ ] Stats cards (total, pending, confirmed)
- [ ] Orders table with all columns
- [ ] Status update buttons (pending → confirmed)
- [ ] CSV export button
- [ ] Conversations log

### Hour 33-36: Portal Deployment
- [ ] Deploy to Vercel
- [ ] Add environment variables
- [ ] Test live: `portal.vantapeptides.com`
- [ ] Verify real-time subscriptions work

### Hour 37-40: TikTok Integration
- [ ] Create TikTok Ads campaign (test)
- [ ] Set destination to bot link with UTM: `t.me/vantapeptides_bot?utm_source=tiktok&utm_campaign=q2`
- [ ] Test click → bot opens
- [ ] Verify UTM logged in `orders.utm_source`
- [ ] Create sample analytics report

### Hour 41-44: Polish & Testing
- [ ] Test full funnel: TikTok ad → bot → portal
- [ ] Create CSV export for Matt
- [ ] Document all deployment links
- [ ] Write quick-start for Matt
- [ ] Review Notion project updates

### Hour 45-48: Launch Prep
- [ ] Set product prices in bot
- [ ] QA: Test ordering flow end-to-end
- [ ] Get Matt's approval
- [ ] Set up monitoring/alerts
- [ ] Go live with TikTok ads 🚀

---

## 📋 Key Decisions

- **Bot Framework:** node-telegram-bot-api (simple, polling-based)
- **Database:** Supabase PostgreSQL (real-time, no setup)
- **Frontend:** Next.js + Tailwind (fast, scalable)
- **Payment:** Cash on Delivery (no stripe integration needed)
- **Hosting:** Railway (backend) + Vercel (frontend)
- **Analytics:** UTM params + Supabase dashboard

---

## 🎁 Deliverables

By Sunday night:

1. **Telegram Bot** - Live at `t.me/vantapeptides_bot`
   - Fully functional order flow
   - Supabase backend operational
   
2. **Management Portal** - Live at `portal.vantapeptides.com`
   - Real-time order tracking
   - CSV export for fulfillment
   - Conversation logs

3. **Analytics Ready**
   - UTM tracking integrated
   - TikTok ads campaign ready
   - ROI reporting structure in place

4. **Documentation**
   - Full setup guide
   - Deployment instructions
   - TikTok integration guide
   - Notion project updated

---

## 🔗 Links (To Update After Deploy)

- Telegram Bot: `t.me/vantapeptides_bot`
- Portal: `https://vanta-portal.vercel.app`
- Backend API: `https://vanta-bot.railway.app`
- GitHub: `https://github.com/...`
- Notion Project: `Matt Coaching VANTA (PRJ-7)`

---

## 📞 Contact & Support

- **Questions?** Check Notion PRJ-7
- **Bot Issues?** Check terminal logs on Railway
- **Portal Issues?** Check Vercel deployment logs
- **Database Issues?** Check Supabase SQL editor

---

**Status:** READY FOR LAUNCH
**Est. Duration:** 48 hours
**Target Go-Live:** Sunday, [DATE] at 11:59 PM
**First Campaign:** TikTok Ads Week 1 (limited budget test)
