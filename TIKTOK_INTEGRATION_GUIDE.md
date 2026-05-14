# TikTok Conversions API Integration

## Overview

The Vanta bot now sends conversion events to TikTok's Conversions API for accurate ROAS (Return on Ad Spend) tracking. When a customer completes a purchase, the bot automatically reports the conversion back to TikTok, allowing you to:

- **Track campaign ROI** — See which TikTok campaigns drive actual sales
- **Optimize ad spend** — TikTok's AI uses conversion data to improve targeting
- **Measure attribution** — Link purchases to the TikTok ads that drove them
- **Build better audiences** — Create lookalike audiences based on real converters

## Setup Instructions

### Step 1: Get Your TikTok Credentials

1. Log in to [TikTok Business Center](https://business.tiktok.com/)
2. Navigate to **Ads Manager** → **Assets** → **Pixels**
3. Find or create a pixel for your Vanta bot:
   - Click **Create Pixel** if you don't have one
   - Name it something like "Vanta Bot Conversions"
4. Copy the **Pixel ID** (also called "Data ID")
5. Go to **Settings** → **Access Token** and generate a new token:
   - Scopes needed: `pixel_track` (for server-side events)
   - Copy the **Access Token**

### Step 2: Update Environment Variables

Add these to your `.env` file (or update them if they exist):

```bash
TIKTOK_PIXEL_ID=your_pixel_id_from_step_1
TIKTOK_ACCESS_TOKEN=your_access_token_from_step_1
```

You can copy from `.env.example` as a template.

### Step 3: Restart the Bot

```bash
npm start
# or for development
npm run dev
```

Once restarted, the bot will automatically send conversion events to TikTok when orders are placed.

## How It Works

### User Data Hashing

Per TikTok's privacy requirements, customer emails and phone numbers are **hashed using SHA-256** before being sent to TikTok. This is:

- **Secure** — TikTok cannot see raw personal data
- **Compliant** — Meets GDPR/CCPA requirements
- **Deterministic** — Same customer data always produces the same hash, allowing TikTok to match events to users

### Events Tracked

The bot currently tracks one event type:

#### `Purchase` (Main Event)

Sent when a customer completes checkout and places an order.

**Data included:**
- Order ID (unique reference)
- Customer name
- Customer phone (hashed)
- Order total (AED)
- Product details (name, quantity, price)
- Timestamp

**Example payload:**
```json
{
  "data": [{
    "event_name": "Purchase",
    "event_time": 1715650234,
    "user_data": {
      "email": null,
      "phone_number": "a1b2c3d4e5f6..."  // SHA-256 hashed
    },
    "event_id": "abc123_1715650234",
    "value": 3500,
    "currency": "AED",
    "contents": [
      {
        "content_id": "1",
        "content_name": "Retatrutide Pen 30mg",
        "quantity": 2,
        "price": 1500
      }
    ]
  }],
  "pixel_code": "your_pixel_id",
  "partner_name": "hermes_bot"
}
```

### Future Events (Ready to Add)

The integration is built to support additional events:

- **AddToCart** — When users add items to cart (for funnel optimization)
- **InitiateCheckout** — When checkout flow starts (for cart abandonment tracking)
- **ViewContent** — When users view product details

To enable any of these, uncomment the tracking calls in `server.js` or ask Hermes to add them.

## Troubleshooting

### Events Not Appearing in TikTok

1. **Check credentials** — Verify `TIKTOK_PIXEL_ID` and `TIKTOK_ACCESS_TOKEN` are correct
   - Go to TikTok Business Center and confirm both values
   - Access tokens expire — you may need to regenerate

2. **Check logs** — Look for TikTok API responses:
   ```bash
   # In development, run:
   npm run dev
   
   # You should see in console:
   # ✅ TikTok conversion event sent: Purchase (3500 AED)
   ```

3. **Allow time for sync** — Events may take 15-30 minutes to appear in TikTok reports

4. **Test pixel** — Use TikTok's **Test Event** tool in the Pixel dashboard:
   - Send a test event from your browser
   - Verify the pixel is receiving data

### Why Is a Conversion Not Showing?

- **Missing phone number** — Bot requires phone for delivery, which is used for user identification
- **Invalid phone format** — Numbers are normalized (non-digits removed), then hashed
- **Credentials not set** — Bot will silently skip if `TIKTOK_PIXEL_ID` is missing

### Debugging

To see detailed logs when a purchase is made:

1. Open terminal where bot is running
2. Place a test order
3. Look for logs like:
   ```
   ✅ TikTok conversion event sent: Purchase (3500 AED)
   ```

If you see `TikTok Conversions API not configured`, the env vars aren't set.

## Testing

### Manual Test (Before Going Live)

1. Start bot: `npm run dev`
2. Use `/start` in Telegram
3. Add a product to cart
4. Checkout with a test phone number (e.g., `+1 555 123 4567`)
5. Check bot console for `✅ TikTok conversion event sent`
6. Wait 15-30 minutes, then check TikTok Ads Manager → **Pixels** → **Events** tab

### Production Checklist

- [ ] Credentials are set in `.env` (not hardcoded)
- [ ] Bot is restarted after adding credentials
- [ ] Test order placed and confirmed in console
- [ ] Event visible in TikTok Pixel dashboard after 15+ minutes
- [ ] Campaign budgets are set in TikTok Ads
- [ ] Bid strategy is using "Optimize for conversions" or "Automatic bidding"

## Advanced: Customizing Events

If you want to track additional data or modify how conversions are sent:

**File:** `/opt/data/vanta-telegram-bot/tiktok-conversions.js`

This module handles all TikTok communication. Key functions:

- `trackPurchase(orderData)` — Send purchase event (called automatically)
- `sendConversionEvent(conversionData)` — Low-level API call
- `hashUserIdentity(email, phone)` — Hash customer data for privacy

## Links & Resources

- **TikTok Conversions API Docs:** https://ads.tiktok.com/marketing_api/docs?id=1739499237889025
- **Pixel Setup Guide:** https://ads.tiktok.com/help/article/about-pixel
- **Test Events Tool:** In TikTok Ads Manager → Pixels → Test Events

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review bot logs (enable `npm run dev`)
3. Verify credentials in TikTok Business Center
4. Ask Hermes to review the integration

---

**Last Updated:** May 14, 2026  
**Integration Status:** ✅ Active  
**API Version:** TikTok Conversions API v1.3
