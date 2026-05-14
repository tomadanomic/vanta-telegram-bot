import crypto from 'crypto';
import axios from 'axios';

/**
 * TikTok Conversions API Integration
 * 
 * Sends conversion events from the bot back to TikTok for proper ROAS tracking.
 * User identity (email/phone) is hashed using SHA-256 per TikTok requirements.
 * 
 * Docs: https://ads.tiktok.com/marketing_api/docs?id=1739499237889025
 */

const TIKTOK_API_BASE = 'https://business-api.tiktok.com/open_api/v1.3';

// Required env vars (add to .env file):
// TIKTOK_PIXEL_ID=your_pixel_id_here (required)
// TIKTOK_ACCESS_TOKEN=your_access_token_here (optional if using server-side pixel)
// TIKTOK_BUSINESS_ID=your_business_id (optional for server-side API)

/**
 * Hash email/phone for TikTok user identity
 * TikTok requires SHA-256 hashed values in lowercase
 */
export function hashUserIdentity(email, phone = null) {
  try {
    // Normalize and hash email
    const normalizedEmail = email?.toLowerCase().trim();
    const hashedEmail = normalizedEmail 
      ? crypto.createHash('sha256').update(normalizedEmail).digest('hex')
      : null;

    // Normalize and hash phone (remove non-digits)
    const cleanPhone = phone?.replace(/\D/g, '');
    const hashedPhone = cleanPhone
      ? crypto.createHash('sha256').update(cleanPhone).digest('hex')
      : null;

    return {
      email: hashedEmail,
      phone_number: hashedPhone
    };
  } catch (error) {
    console.error('Error hashing user identity:', error);
    return { email: null, phone_number: null };
  }
}

/**
 * Send conversion event to TikTok
 * 
 * @param {Object} conversionData
 *   - event_name: 'Purchase' | 'AddToCart' | 'InitiateCheckout' | 'ViewContent' | 'CompletePayment'
 *   - value: order total in AED
 *   - currency: 'AED' or other
 *   - email: customer email
 *   - phone: customer phone (will be hashed)
 *   - product_id: array of product IDs
 *   - properties: custom event properties
 */
export async function sendConversionEvent(conversionData) {
  try {
    const pixelId = process.env.TIKTOK_PIXEL_ID;
    const accessToken = process.env.TIKTOK_ACCESS_TOKEN;

    // Validate credentials
    if (!pixelId || !accessToken) {
      console.warn(
        'TikTok Conversions API not configured. ' +
        'Add TIKTOK_PIXEL_ID and TIKTOK_ACCESS_TOKEN to .env to enable.'
      );
      return { success: false, reason: 'credentials_missing' };
    }

    // Hash user identity
    const userIdentity = hashUserIdentity(conversionData.email, conversionData.phone);

    // Build event payload per TikTok spec
    const eventPayload = {
      data: [
        {
          event_name: conversionData.event_name || 'Purchase',
          event_time: Math.floor(Date.now() / 1000), // Unix timestamp
          user_data: {
            email: userIdentity.email,
            phone_number: userIdentity.phone_number,
            // Optional: client_ip, user_agent, etc. can be added from req headers
          },
          event_id: `${conversionData.order_id || 'order'}_${Date.now()}`, // Unique event ID for dedup
          value: conversionData.value,
          currency: conversionData.currency || 'AED',
          contents: (conversionData.products || []).map(p => ({
            content_id: p.id || 'unknown',
            content_name: p.name || 'Product',
            content_type: 'product',
            quantity: p.quantity || 1,
            price: p.price || 0
          })),
          properties: conversionData.properties || {}
        }
      ],
      pixel_code: pixelId,
      partner_name: 'hermes_bot'
    };

    // Send to TikTok API
    const response = await axios.post(
      `${TIKTOK_API_BASE}/pixel/track/`,
      eventPayload,
      {
        headers: {
          'Access-Token': accessToken,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data?.code === 0) {
      console.log(
        `✅ TikTok conversion event sent: ${conversionData.event_name} (${conversionData.value} ${conversionData.currency})`
      );
      return { success: true, data: response.data };
    } else {
      console.error('TikTok API error:', response.data);
      return { success: false, error: response.data };
    }
  } catch (error) {
    console.error('Error sending TikTok conversion event:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Track purchase conversion (main event)
 */
export async function trackPurchase(orderData) {
  return sendConversionEvent({
    event_name: 'Purchase',
    event_id: orderData.order_id,
    value: orderData.total_amount,
    currency: orderData.currency || 'AED',
    email: orderData.customer_email,
    phone: orderData.customer_phone,
    products: orderData.items,
    properties: {
      order_id: orderData.order_id,
      source: 'telegram_bot',
      customer_name: orderData.customer_name
    }
  });
}

/**
 * Track add-to-cart (mid-funnel event for better pixel learning)
 */
export async function trackAddToCart(cartData) {
  return sendConversionEvent({
    event_name: 'AddToCart',
    value: cartData.cart_total,
    currency: cartData.currency || 'AED',
    email: cartData.customer_email,
    phone: cartData.customer_phone,
    products: cartData.items,
    properties: {
      source: 'telegram_bot',
      items_count: cartData.items.length
    }
  });
}

/**
 * Track checkout initiation (conversion funnel event)
 */
export async function trackInitiateCheckout(checkoutData) {
  return sendConversionEvent({
    event_name: 'InitiateCheckout',
    value: checkoutData.checkout_total,
    currency: checkoutData.currency || 'AED',
    email: checkoutData.customer_email,
    phone: checkoutData.customer_phone,
    products: checkoutData.items,
    properties: {
      source: 'telegram_bot',
      checkout_step: checkoutData.step || 'delivery_info'
    }
  });
}

export default {
  hashUserIdentity,
  sendConversionEvent,
  trackPurchase,
  trackAddToCart,
  trackInitiateCheckout
};
