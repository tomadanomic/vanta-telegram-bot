import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import dotenv from 'dotenv';
import { trackPurchase, trackAddToCart, trackInitiateCheckout } from './tiktok-conversions.js';

dotenv.config();

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL.trim(),
  process.env.SUPABASE_KEY.replace(/\s/g, '')
);

// Initialize Express
const app = express();
app.use(cors());
app.use(express.json());

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

// ==================== PRODUCT CATALOG WITH DESCRIPTIONS ====================

const PRODUCTS = [
  {
    id: 1,
    name: 'Retatrutide Pen 30mg',
    price: 1500,
    emoji: '⭐',
    description: 'Advanced GLP-3/GCG/CGA receptor agonist. Powerful for fat loss and metabolic optimization.'
  },
  {
    id: 2,
    name: 'NAD+ 500mg',
    price: 800,
    emoji: '🔋',
    description: 'Cellular energy booster. Supports mitochondrial function, anti-aging, and mental clarity.'
  },
  {
    id: 3,
    name: 'Tesamorelin 5mg',
    price: 300,
    emoji: '💪',
    description: 'GHRH analog for muscle growth and fat loss. Enhances growth hormone naturally.'
  },
  {
    id: 4,
    name: 'Melanotan 2 10mg',
    price: 300,
    emoji: '☀️',
    description: 'Natural-looking tan without sun damage. Supports libido and mood enhancement.'
  },
  {
    id: 5,
    name: 'HCG 5000IU',
    price: 400,
    emoji: '🧑‍🔬',
    description: 'Hormone support for fertility and PCT. Maintains testicular function and muscle mass.'
  },
  {
    id: 6,
    name: 'MOTSC 5mg',
    price: 175,
    emoji: '⚡',
    description: 'Peptide for metabolic support and energy. Fast-acting for performance optimization.'
  },
  {
    id: 7,
    name: 'BPC157 5mg',
    price: 150,
    emoji: '🔬',
    description: 'Healing and recovery peptide. Supports joint, gut, and tissue regeneration.'
  },
  {
    id: 8,
    name: 'TB500 5mg',
    price: 100,
    emoji: '🏃',
    description: 'Collagen and actin regulator. Accelerates recovery and improves flexibility.'
  },
  {
    id: 9,
    name: 'GHKCU 50mg',
    price: 250,
    emoji: '🧬',
    description: 'Collagen booster and skin/joint support. Anti-aging and regeneration powerhouse.'
  }
];

// User state tracker - now includes name, phone, delivery status
const userState = new Map();

// ==================== TELEGRAM API HELPERS ====================

async function sendMessage(chatId, text, keyboard = null) {
  try {
    const payload = {
      chat_id: chatId,
      text: text,
      parse_mode: 'Markdown'
    };
    if (keyboard) payload.reply_markup = keyboard;

    const response = await axios.post(`${TELEGRAM_API}/sendMessage`, payload);
    return response.data;
  } catch (error) {
    console.error('Error sending message:', error.response?.data || error.message);
    throw error;
  }
}

// ==================== BOT FLOW ====================

async function handleStart(chatId, userId, firstName) {
  userState.set(userId, {
    step: 'name',
    cart: [],
    deliveryDate: null,
    cashConfirmed: false,
    customerName: null,
    customerPhone: null
  });

  await logConversation(chatId, userId, 'START', '/start');
  await sendMessage(chatId, `👋 Welcome to *VANTA Peptides*!\n\nI'm here to help you find the perfect products for your goals. 💪\n\n*First, what's your name?*`);
}

async function handleNameInput(chatId, userId, name) {
  const state = userState.get(userId);
  if (!state) return;

  state.customerName = name;
  state.step = 'shopping';

  const welcomeText = `Nice to meet you, *${name}*! 👋\n\nLet's find your products. Click a product below to add it to your cart! 🛍️`;
  await sendMessage(chatId, welcomeText, getProductKeyboard());
  await logConversation(chatId, userId, 'NAME_PROVIDED', name);
}

function getProductKeyboard() {
  const keyboard = {
    inline_keyboard: PRODUCTS.map(p => [
      {
        text: `${p.emoji} ${p.name} (AED ${p.price})`,
        callback_data: `product_${p.id}`
      }
    ]).concat([
      [{ text: '✅ Checkout', callback_data: 'checkout' }],
      [{ text: '❓ Questions?', callback_data: 'help' }]
    ])
  };
  return keyboard;
}

async function handleProductSelected(chatId, userId, productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  const infoText = `*${product.emoji} ${product.name}*\n\n${product.description}\n\n*Price: AED ${product.price}*\n\nℹ️ Learn more about this product?`;

  await sendMessage(chatId, infoText, {
    inline_keyboard: [
      [
        { text: '📚 Learn More', callback_data: `info_${productId}` },
        { text: '➕ Add to Cart', callback_data: `add_to_cart_${productId}` }
      ],
      [{ text: '⬅️ Back to Products', callback_data: 'back_to_products' }]
    ]
  });

  await logConversation(chatId, userId, 'PRODUCT_SELECTED', product.name);
}

async function handleAddToCart(chatId, userId, productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  const qtyText = `How many *${product.name}* would you like?`;
  await sendMessage(chatId, qtyText, {
    inline_keyboard: [
      [
        { text: '1', callback_data: `qty_${productId}_1` },
        { text: '2', callback_data: `qty_${productId}_2` },
        { text: '3', callback_data: `qty_${productId}_3` }
      ],
      [
        { text: '4', callback_data: `qty_${productId}_4` },
        { text: '5', callback_data: `qty_${productId}_5` },
        { text: 'Other', callback_data: `qty_${productId}_other` }
      ],
      [{ text: '⬅️ Back', callback_data: 'back_to_products' }]
    ]
  });
}

async function handleQuantitySelected(chatId, userId, productId, quantity) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  const state = userState.get(userId);
  
  state.cart.push({
    productId,
    name: product.name,
    price: product.price,
    quantity: parseInt(quantity)
  });

  const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartSummary = state.cart.map(item => `${item.quantity}x ${item.name} - AED ${item.price * item.quantity}`).join('\n');

  const cartText = `✅ Added to cart!\n\n*Your Cart:*\n${cartSummary}\n\n*Subtotal: AED ${subtotal}*\n\nWhat would you like to do?`;

  await sendMessage(chatId, cartText, {
    inline_keyboard: [
      [{ text: '🛒 Continue Shopping', callback_data: 'back_to_products' }],
      [{ text: '✅ Proceed to Checkout', callback_data: 'checkout' }],
      [{ text: '🗑️ Clear Cart', callback_data: 'clear_cart' }]
    ]
  });

  await logConversation(chatId, userId, 'ITEM_ADDED', `${quantity}x ${product.name}`);
}

async function handleCheckout(chatId, userId) {
  const state = userState.get(userId);

  if (state.cart.length === 0) {
    await sendMessage(chatId, 'Your cart is empty! Let\'s add some products. 🛍️', getProductKeyboard());
    return;
  }

  state.step = 'delivery_date';
  
  const deliveryText = `📅 *When do you need delivery?*\n\nSelect your preferred delivery window:`;
  
  await sendMessage(chatId, deliveryText, {
    inline_keyboard: [
      [{ text: '⚡ ASAP (Today/Tomorrow)', callback_data: 'delivery_asap' }],
      [{ text: '📅 This Week', callback_data: 'delivery_week' }],
      [{ text: '🗓️ Next Week', callback_data: 'delivery_next_week' }]
    ]
  });
}

async function handleDeliveryDate(chatId, userId, dateOption) {
  const state = userState.get(userId);
  const dateMap = {
    'asap': 'ASAP (Today/Tomorrow)',
    'week': 'This Week',
    'next_week': 'Next Week'
  };

  state.deliveryDate = dateMap[dateOption] || dateOption;
  
  await proceedToConfirmation(chatId, userId);
}

async function proceedToConfirmation(chatId, userId) {
  const state = userState.get(userId);
  state.step = 'confirm_order';

  const cartSummary = state.cart.map(item => `${item.quantity}x ${item.name} - AED ${item.price * item.quantity}`).join('\n');
  const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const confirmText = `*📦 Order Summary*\n\n${cartSummary}\n\n*Subtotal: AED ${subtotal}*\n_Delivery: ${state.deliveryDate}_\n\n💰 *Payment:* Cash on Delivery\n\n✅ Do you confirm you'll have cash ready for delivery?`;

  await sendMessage(chatId, confirmText, {
    inline_keyboard: [
      [
        { text: '✅ Yes, I Confirm', callback_data: 'confirm_yes' },
        { text: '❌ No, Go Back', callback_data: 'confirm_no' }
      ]
    ]
  });

  await logConversation(chatId, userId, 'CHECKOUT_STARTED', `Total: AED ${subtotal}`);
}

async function handleConfirmOrder(chatId, userId) {
  const state = userState.get(userId);
  state.step = 'address';

  await sendMessage(chatId, '📍 *Where should we deliver?*\n\nPlease provide your full delivery address:');
  
  await logConversation(chatId, userId, 'CASH_CONFIRMED', 'Customer confirmed cash ready');
}

async function completeOrder(chatId, userId) {
  const state = userState.get(userId);

  try {
    const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const { data, error } = await supabase.from('orders').insert({
      telegram_user_id: userId,
      chat_id: chatId,
      customer_name: state.customerName,
      customer_phone: state.customerPhone,
      product_name: state.cart.map(item => `${item.quantity}x ${item.name}`).join(', '),
      quantity: state.cart.reduce((sum, item) => sum + item.quantity, 0),
      address: state.address,
      delivery_date: state.deliveryDate,
      total_amount: subtotal,
      delivery_status: 'pending',
      status: 'pending'
    });

    if (error) throw error;

    const orderRef = data?.[0]?.id || 'REF-' + Date.now();
    const successText = `✅ *Order Confirmed!*\n\n🎉 Your order has been placed successfully.\n\n*Order Reference:* \`${orderRef.slice(0, 8).toUpperCase()}\`\n\n👤 Name: ${state.customerName}\n📞 Phone: ${state.customerPhone}\n📦 Delivery to:\n_${state.address}_\n\n⏰ Delivery: ${state.deliveryDate}\n💰 Amount Due: AED ${subtotal}\n\n❓ Have any questions? Just reply here and our team will get back to you shortly! 💬`;

    await sendMessage(chatId, successText);
    await logConversation(chatId, userId, 'ORDER_PLACED', `Order Ref: ${orderRef.slice(0, 8)}, Amount: AED ${subtotal}`);

    // Send TikTok Conversions API event for attribution tracking
    trackPurchase({
      order_id: orderRef,
      customer_name: state.customerName,
      customer_email: null, // Can be added if collected in future
      customer_phone: state.customerPhone,
      total_amount: subtotal,
      currency: 'AED',
      items: state.cart.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity
      }))
    }).catch(err => console.warn('TikTok conversion tracking error:', err.message));

    state.step = 'completed';
    state.cart = [];
  } catch (error) {
    console.error('Error saving order:', error.message);
    await sendMessage(chatId, '❌ Error saving order: ' + error.message);
  }
}

async function logConversation(chatId, userId, eventType, eventData) {
  try {
    await supabase.from('conversations').insert({
      telegram_user_id: userId,
      chat_id: chatId,
      event_type: eventType,
      event_data: eventData
    });
  } catch (error) {
    console.error('Error logging conversation:', error.message);
  }
}

// ==================== WEBHOOK ====================

app.post('/telegram', async (req, res) => {
  const { message, callback_query } = req.body;

  try {
    if (message) {
      const { chat: { id: chatId }, from: { id: userId, first_name: firstName }, text } = message;

      if (text === '/start') {
        await handleStart(chatId, userId, firstName);
      } else if (text && text.startsWith('/')) {
        await sendMessage(chatId, 'I didn\'t understand that command. Type /start to begin! 🚀');
      } else if (text) {
        const state = userState.get(userId);
        
        if (state?.step === 'name') {
          await handleNameInput(chatId, userId, text);
        } else if (state?.step === 'address') {
          // Ask for phone after address is provided
          if (!state.address) {
            state.address = text;
            await sendMessage(chatId, `Got it! 📍\n\n*What's your phone number?* (for delivery coordination)`);
            await logConversation(chatId, userId, 'ADDRESS_PROVIDED', text);
          } else if (!state.customerPhone) {
            state.customerPhone = text;
            await sendMessage(chatId, `Perfect! ✅ Your order is confirmed.\n\nYou'll receive it at:\n${state.address}\n\nOur team will contact you on ${text} for final details.`);
            await logConversation(chatId, userId, 'PHONE_PROVIDED', text);
            await completeOrder(chatId, userId);
          }
        } else {
          // Allow text messages for customer support questions
          await logConversation(chatId, userId, 'CUSTOMER_QUESTION', text);
          await sendMessage(chatId, '✅ Got your question! Our team will reply shortly. In the meantime, feel free to continue shopping or use the buttons above. 💬');
        }
      }
    }

    if (callback_query) {
      const { id: queryId, from: { id: userId }, data, message: { chat: { id: chatId } } } = callback_query;
      let state = userState.get(userId);
      
      // Initialize state if it doesn't exist
      if (!state) {
        state = {
          step: 'shopping',
          cart: [],
          deliveryDate: null,
          cashConfirmed: false,
          customerName: null,
          customerPhone: null
        };
        userState.set(userId, state);
      }

      if (data === 'back_to_products') {
        const cartText = state?.cart?.length > 0 
          ? `🛒 *Your Cart* (${state.cart.length} items) - AED ${state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)}\n\nSelect another product or checkout:`
          : 'Select a product to add to your cart:';
        await sendMessage(chatId, cartText, getProductKeyboard());
      } else if (data === 'help') {
        const helpText = `❓ *Questions About Our Products?*\n\nWe're here to help! Our team is ready to answer any questions about:\n• Product benefits & usage\n• Dosing & instructions\n• Delivery options\n• Payment details\n\nJust reply here with your question and a member of our team will get back to you shortly! 💬`;
        await sendMessage(chatId, helpText, {
          inline_keyboard: [
            [{ text: '⬅️ Back to Products', callback_data: 'back_to_products' }]
          ]
        });
      } else if (data.startsWith('product_')) {
        const productId = parseInt(data.split('_')[1]);
        await handleProductSelected(chatId, userId, productId);
      } else if (data.startsWith('info_')) {
        const productId = parseInt(data.split('_')[1]);
        const product = PRODUCTS.find(p => p.id === productId);
        const infoText = `*${product.emoji} ${product.name}*\n\n${product.description}\n\n✨ *Benefits:* Premium quality, lab-tested, discreet delivery.\n\nReady to add to cart?`;
        await sendMessage(chatId, infoText, {
          inline_keyboard: [
            [{ text: '➕ Add to Cart', callback_data: `add_to_cart_${productId}` }],
            [{ text: '⬅️ Back', callback_data: 'back_to_products' }]
          ]
        });
      } else if (data.startsWith('add_to_cart_')) {
        const productId = parseInt(data.split('_')[3]);
        await handleAddToCart(chatId, userId, productId);
      } else if (data.startsWith('qty_')) {
        const parts = data.split('_');
        const productId = parseInt(parts[1]);
        const quantity = parts[2];
        await handleQuantitySelected(chatId, userId, productId, quantity);
      } else if (data === 'clear_cart') {
        state.cart = [];
        await sendMessage(chatId, '🗑️ Cart cleared! Let\'s start fresh.', getProductKeyboard());
      } else if (data === 'checkout') {
        await handleCheckout(chatId, userId);
      } else if (data.startsWith('delivery_')) {
        const dateOption = data.split('_')[1];
        await handleDeliveryDate(chatId, userId, dateOption);
      } else if (data.startsWith('confirm_')) {
        if (data === 'confirm_yes') {
          await handleConfirmOrder(chatId, userId);
        } else {
          state.cart = [];
          await sendMessage(chatId, '❌ Order cancelled. Let\'s start over!', getProductKeyboard());
        }
      }

      await axios.post(`${TELEGRAM_API}/answerCallbackQuery`, { callback_query_id: queryId });
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Webhook error:', error.message);
    res.sendStatus(500);
  }
});

// ==================== HEALTH CHECK ====================

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'VANTA Bot is running' });
});

// ==================== EXPORT CSV ====================

app.get('/api/export-csv', async (req, res) => {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const csv = [
      ['Order ID', 'Customer Name', 'Phone', 'Products', 'Total', 'Address', 'Delivery Date', 'Status', 'Created'].join(','),
      ...orders.map(o => [o.id, o.customer_name, o.customer_phone, `"${o.product_name}"`, o.total_amount, `"${o.address}"`, o.delivery_date, o.status, o.created_at].join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=vanta-orders.csv');
    res.send(csv);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== ADMIN REPLY ENDPOINT ====================

app.post('/api/send-admin-reply', async (req, res) => {
  try {
    const { userId, message } = req.body;

    if (!userId || !message) {
      return res.status(400).json({ error: 'Missing userId or message' });
    }

    const text = `*Matt:* ${message}`;
    await sendMessage(userId, text);

    const { error: logError } = await supabase
      .from('conversations')
      .insert({
        telegram_user_id: userId,
        chat_id: userId,
        event_type: 'ADMIN_REPLY',
        event_data: message,
      });

    if (logError) throw logError;

    res.json({ success: true, message: 'Reply sent' });
  } catch (error) {
    console.error('Error sending admin reply:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== SERVER ====================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ VANTA Bot running on port ${PORT}`);
});
