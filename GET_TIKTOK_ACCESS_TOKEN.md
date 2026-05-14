# Getting Your TikTok Access Token for Conversions API

You have:
- ✅ Pixel ID: D7QEM5BC77U9UIR3JCI0
- ✅ Business ID: 7246403475188219906
- ✅ Account ID: 7634914739365298184
- ❌ Access Token: (still needed)

## Quick Path: Get Access Token (5 minutes)

### Option 1: Via OAuth (Recommended)

1. Go to [TikTok for Business](https://business.tiktok.com/)
2. Click your account icon → **Settings** → **Apps & Permissions**
3. Under "Developer Account", click **Create an app**
   - App name: "Vanta Bot Conversions"
   - Purpose: "Conversion tracking"
4. In the app settings, find **Access Token** or **Credentials** section
5. Copy the **Access Token** (looks like: `c1a2b3d4e5f6...`)

### Option 2: Via Business Manager

1. Go to [TikTok Ads Manager](https://ads.tiktok.com/)
2. Settings → **Account** → **Developer Settings** or **Apps**
3. Look for **API Credentials** section
4. Generate or copy **Access Token**

### Option 3: Contact TikTok Support

If you can't find it in the UI:
- Go to TikTok Business Center → Help → Contact Support
- Ask for: "Access Token for Conversions API with pixel_track scope"
- Provide them: Business ID 7246403475188219906

---

## Once You Have the Access Token

1. Open `/opt/data/vanta-telegram-bot/.env`
2. Add this line:
   ```
   TIKTOK_ACCESS_TOKEN=your_access_token_here
   ```
3. Save and restart the bot:
   ```bash
   npm start
   ```

---

## Troubleshooting

**"Where is my access token?"**
- Some TikTok accounts may use different UI layouts
- Try: Ads Manager → Settings → Advanced → API/Integrations → Get Token

**"I see a token but it looks different"**
- If it starts with `c_` or similar, that's correct
- If it's a long base64 string, that's also correct
- Just copy the whole thing

**"Still can't find it?"**
- Some business accounts may need to enable API access first
- Settings → Manage Permissions → Enable Conversions API access

---

## Need Help?

Once you have the token, reply with it and I'll:
1. Add it to your `.env`
2. Restart the bot
3. Test a conversion
4. Verify it's working in TikTok Pixel dashboard

You're very close! Just need that one token.
