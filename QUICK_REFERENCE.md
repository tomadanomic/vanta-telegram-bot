# VANTA Bot - Quick Reference Card

## 🎯 What You Need (Before Launch)

From Matt:
- [ ] Product prices (AED or USD per unit)
- [ ] Telegram business contact (for customer support)
- [ ] TikTok ad account access (for UTM campaigns)
- [ ] Shipping/delivery regions/rates

---

## 📱 Credentials Checklist

### Telegram
- [ ] Bot username: `vantapeptides_bot` (or your choice)
- [ ] Bot token: `123456:ABC-DEF...` (from BotFather)
- [ ] Link: `t.me/vantapeptides_bot`

### Supabase
- [ ] Project URL: `https://xxxxx.supabase.co`
- [ ] Anon key: `eyJhbGciOi...` (starts with eyJ)
- [ ] Tables created: conversations, orders, customers ✓

### Railway
- [ ] GitHub repo connected ✓
- [ ] Environment variables set ✓
- [ ] Bot running: `https://vanta-bot.railway.app/health`

### Vercel
- [ ] Next.js repo deployed ✓
- [ ] Environment variables set ✓
- [ ] Portal running: `https://vanta-portal.vercel.app`
- [ ] Portal password set: `NEXT_PUBLIC_PORTAL_PASSWORD` env var

---

## 🔐 Portal Access & Password

**Login to Portal:**
```
URL: https://vanta-portal.vercel.app
Password: vanta2025 (default, change via Vercel env vars)
```

**Access for You & Matt:**
- Same password for both users
- Each logs in on their device
- Session persists (localStorage)
- Logout button in top right

**What You See:**
1. **Stats** - Total orders, pending count, confirmed count
2. **Orders Tab** - All incoming orders with status management
3. **Conversations Tab** - Customer interactions with bot
4. **Buttons** - Export CSV, Refresh, Logout

**Changing Password (Post-Deploy):**
```
Vercel → vanta-portal → Settings → Environment Variables
Edit: NEXT_PUBLIC_PORTAL_PASSWORD
Redeploy
New password active immediately
```

---

## 💰 Product Catalog (With Actual Prices)

```javascript
// In server.js, PRODUCTS array is now populated:

const PRODUCTS = [
  { id: 1, name: 'Retatrutide Pen 30mg', price: 1500, emoji: '⭐' },  // HERO PRODUCT
  { id: 2, name: 'NAD+ 500mg', price: 800, emoji: '🔋' },
  { id: 3, name: 'Tesamorelin 5mg', price: 300, emoji: '💪' },
  { id: 4, name: 'Melanotan 2 10mg', price: 300, emoji: '☀️' },
  { id: 5, name: 'HCG 5000IU', price: 400, emoji: '🧑‍🔬' },
  { id: 6, name: 'MOTSC 5mg', price: 175, emoji: '⚡' },
  { id: 7, name: 'BPC157 5mg', price: 150, emoji: '🔬' },
  { id: 8, name: 'TB500 5mg', price: 100, emoji: '🏃' },
  { id: 9, name: 'GHKCU 50mg', price: 250, emoji: '🧬' }
];
```

**Prices (AED):**
| Product | Price | Notes |
|---------|-------|-------|
| ⭐ Retatrutide Pen 30mg | 1,500 AED | Hero product - featured first in bot menu |
| 🔋 NAD+ 500mg | 800 AED | Premium supplement |
| 💪 Tesamorelin 5mg | 300 AED | Popular GH releaser |
| ☀️ Melanotan 2 10mg | 300 AED | Tanning peptide |
| 🧑‍🔬 HCG 5000IU | 400 AED | Fertility support |
| ⚡ MOTSC 5mg | 175 AED | Mid-range |
| 🔬 BPC157 5mg | 150 AED | Recovery peptide |
| 🏃 TB500 5mg | 100 AED | Budget option |
| 🧬 GHKCU 50mg | 250 AED | Growth hormone secretagogue |

**Menu Order:**
- Retatrutide is FIRST (hero product, TikTok marketing focus)
- Then NAD+ (premium, high price point)
- Then others by price/popularity

---

## 🎬 TikTok Campaign Template

**Campaign Name:** VANTA Peptides Q2
**Objective:** Traffic (or Conversions)
**Landing Page:** 
```
t.me/vantapeptides_bot?utm_source=tiktok&utm_medium=cpc&utm_campaign=q2_2025&utm_content=peptides_promo_01
```

**UTM Parameters:**
- `utm_source` = tiktok
- `utm_medium` = cpc (cost-per-click)
- `utm_campaign` = q2_2025 (or your naming scheme)
- `utm_content` = creative variant (peptides_promo_01, etc.)

**Portal Analytics:**
- Go to portal → All orders with UTM tracking visible
- Export CSV → Check `utm_source` column
- Calculate: clicks → conversions → cost/order

---

## 🔗 Key URLs (After Deploy)

| Service | URL |
|---------|-----|
| Telegram Bot | `t.me/vantapeptides_bot` |
| Portal | `https://vanta-portal.vercel.app` |
| API Health | `https://vanta-bot.railway.app/health` |
| Orders API | `https://vanta-bot.railway.app/api/orders` |
| CSV Export | `https://vanta-bot.railway.app/api/export-csv` |
| Supabase Dashboard | `https://app.supabase.com` |

---

## 📊 Monitoring (Post-Launch)

**Daily Check:**
```
Portal → Orders today = ?
Portal → Pending count = ?
CSV Export → Share with Matt
TikTok Ads → Check spend
```

**Weekly Report:**
```
Total orders: X
Total revenue (est): Y AED
Cost per order: Z
Conversion rate: %
Top product: ?
```

---

## 🛠️ Maintenance Commands

```bash
# Deploy new bot code
git push origin main  # → Railway auto-deploys

# View logs (local)
npm run dev

# View logs (Railway)
# → Go to railway.app dashboard

# Export orders
curl https://vanta-bot.railway.app/api/orders | jq

# Get CSV
curl https://vanta-bot.railway.app/api/export-csv > orders.csv
```

---

## ⚠️ Troubleshooting Cheat Sheet

| Issue | Fix |
|-------|-----|
| Bot not responding | Check Railway logs, verify token |
| Portal not updating | Check Supabase real-time, refresh page |
| Orders not saving | Verify Supabase tables exist & connection works |
| UTM not logged | Check bot code logs, verify URL format |
| Deployment failed | Check env vars on Railway/Vercel |

---

## 📞 Support

**Bot Issues?**
- Check Railway dashboard logs
- Verify .env has all required vars
- Test with Telegram directly

**Portal Issues?**
- Check Vercel deployment logs
- Verify NEXT_PUBLIC_ vars are set
- Check browser console (F12)

**Database Issues?**
- Go to Supabase SQL editor
- Verify tables exist: `SELECT * FROM conversations LIMIT 1;`
- Check row count: `SELECT COUNT(*) FROM orders;`

**Still stuck?**
- Check Notion: PRJ-7 (Matt Coaching VANTA)
- Review SETUP_GUIDE.md step-by-step
- Ask in Hermes CLI

---

## 🎓 Architecture at a Glance

```
User on TikTok
    ↓
Clicks ad link: t.me/vantapeptides_bot?utm_source=tiktok
    ↓
Telegram opens bot
    ↓
Node.js bot (server.js) receives /start
    ↓
Sends product menu (inline buttons)
    ↓
User selects product → qty → address
    ↓
Bot saves to Supabase (conversations, orders tables)
    ↓
Portal (Next.js) auto-updates via real-time subscription
    ↓
Matt sees new order in portal
    ↓
Matt clicks CSV export → fulfills order
    ↓
User gets delivery (CoD payment collected)
```

---

## 🚀 Go-Live Checklist (Day-of)

- [ ] All env vars set on Railway + Vercel
- [ ] Supabase tables populated (test data OK)
- [ ] Bot responds to /start
- [ ] Portal loads without errors
- [ ] CSV export works
- [ ] TikTok campaign URL is correct
- [ ] Matt has portal link + understands dashboard
- [ ] Test order from different account works end-to-end
- [ ] Deployment links shared with stakeholders
- [ ] Monitoring/alerts set up
- [ ] Go live! 🎉

---

**Built with:** Node.js + Telegram Bot API + Supabase + Next.js
**Deployed:** Railway + Vercel
**Status:** Ready for 48-hour sprint
**Next:** Follow SETUP_GUIDE.md
