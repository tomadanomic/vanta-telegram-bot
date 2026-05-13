import TelegramBot from 'node-telegram-bot-api';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Telegram Bot (webhook mode for Vercel)
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Initialize Express
const app = express();
app.use(cors());
app.use(express.json());

// Product catalog - RETATRUTIDE is hero product (top of menu)
const PRODUCTS = [
  { id: 1, name: 'Retatrutide Pen 30mg', price: 1500, emoji: '⭐' },
  { id: 2, name: 'NAD+ 500mg', price: 800, emoji: '🔋' },
  { id: 3, name: 'Tesamorelin 5mg', price: 300, emoji: '💪' },
  { id: 4, name: 'Melanotan 2 10mg', price: 300, emoji: '☀️' },
  { id: 5, name: 'HCG 5000IU', price: 400, emoji: '🧑‍🔬' },
  { id: 6, name: 'MOTSC 5mg', price: 175, emoji: '⚡' },
  { id: 7, name: 'BPC157 5mg', price: 150, emoji: '🔬' },
  { id: 8, name: 'TB500 5mg', price: 100, emoji: '🏃' },
  { id: 9, name: 'GHKCU 50mg', price: 250, emoji: '🧬' }
];

// User state tracker (in-memory; replace with Supabase for production)
const userState = new Map();

// ==================== BOT COMMAND HANDLERS ====================

async function handleStart(chatId, userId, firstName) {
  userState.set(userId, { step: 'menu', products: [] });
  await logConversation(chatId, userId, 'START', `/start`);

  const welcomeText = `👋 Welcome to VANTA Peptides!\n\nWe offer research-grade peptides, independently assayed.\n\nPick a product to order:`;

  const options = {
    reply_markup: {
      inline_keyboard: PRODUCTS.map((p) => [
        { text: `${p.emoji} ${p.name}`, callback_data: `product_${p.id}` }
      ])
    }
  };

  bot.sendMessage(chatId, welcomeText, options);
}

async function handleCallbackQuery(callbackQuery) {
  const chatId = callbackQuery.message.chat.id;
  const userId = callbackQuery.from.id;
  const data = callbackQuery.data;
  const messageId = callbackQuery.message.message_id;

  try {
    if (data.startsWith('product_')) {
      const productId = parseInt(data.split('_')[1]);
      const product = PRODUCTS.find((p) => p.id === productId);

      if (!product) {
        await bot.answerCallbackQuery(callbackQuery.id, { text: 'Product not found', show_alert: true });
        return;
      }

      userState.set(userId, { 
        step: 'quantity', 
        selectedProduct: product,
        products: []
      });

      const text = `${product.emoji} *${product.name}*\n\nHow many units would you like?`;

      const keyboard = {
        inline_keyboard: [
          [{ text: '1', callback_data: `qty_1_${productId}` }],
          [{ text: '2', callback_data: `qty_2_${productId}` }],
          [{ text: '3', callback_data: `qty_3_${productId}` }],
          [{ text: '5', callback_data: `qty_5_${productId}` }],
          [{ text: '10', callback_data: `qty_10_${productId}` }],
          [{ text: '🔙 Back to Menu', callback_data: 'menu' }]
        ]
      };

      await bot.editMessageText(text, { 
        chat_id: chatId, 
        message_id: messageId,
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });

      await logConversation(chatId, userId, 'PRODUCT_SELECTED', product.name);
      await bot.answerCallbackQuery(callbackQuery.id);
      
    } else if (data.startsWith('qty_')) {
      const parts = data.split('_');
      const qty = parseInt(parts[1]);
      const productId = parseInt(parts[2]);
      const product = PRODUCTS.find((p) => p.id === productId);

      const state = userState.get(userId);
      if (state) {
        state.step = 'address';
        state.quantity = qty;
      }

      const text = `✅ Selected: *${qty}x ${product.emoji} ${product.name}*\n\nNow, please share your delivery address:`;

      await bot.editMessageText(text, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'Markdown'
      });

      await logConversation(chatId, userId, 'QUANTITY_SELECTED', `${qty}x ${product.name}`);
      await bot.answerCallbackQuery(callbackQuery.id);
      
    } else if (data === 'menu') {
      userState.set(userId, { step: 'menu', products: [] });

      const welcomeText = `👋 Back to menu.\n\nPick a product:`;

      const keyboard = {
        inline_keyboard: PRODUCTS.map((p) => [
          { text: `${p.emoji} ${p.name}`, callback_data: `product_${p.id}` }
        ])
      };

      await bot.editMessageText(welcomeText, { 
        chat_id: chatId, 
        message_id: messageId,
        reply_markup: keyboard
      });

      await logConversation(chatId, userId, 'RETURNED_TO_MENU', 'Menu');
      await bot.answerCallbackQuery(callbackQuery.id);
      
    } else if (data.startsWith('confirm_')) {
      const orderId = data.split('_')[1];
      await logConversation(chatId, userId, 'ORDER_CONFIRMED', orderId);
      
      await bot.sendMessage(chatId, `✅ *Order confirmed!* Reference: \`${orderId}\`\n\n💰 Cash on Delivery.\nMatt will contact you shortly to confirm delivery.\n\nThank you for choosing VANTA! 🧬`, { parse_mode: 'Markdown' });
      await bot.answerCallbackQuery(callbackQuery.id);
    }
  } catch (error) {
    console.error('Callback error:', error);
    await bot.answerCallbackQuery(callbackQuery.id, { text: 'Error processing request', show_alert: true });
  }
}

async function handleMessage(msg) {
  if (!msg.text || msg.text.startsWith('/')) return;

  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = msg.text;

  const state = userState.get(userId);
  if (!state || state.step !== 'address') return;

  // Save order to Supabase
  const { data, error } = await supabase
    .from('orders')
    .insert([
      {
        telegram_user_id: userId,
        chat_id: chatId,
        product_name: state.selectedProduct.name,
        quantity: state.quantity,
        address: text,
        status: 'pending',
        utm_source: text.includes('utm_') ? extractUTM(text) : null,
        created_at: new Date().toISOString()
      }
    ])
    .select();

  if (error) {
    console.error('Supabase error:', JSON.stringify(error));
    await bot.sendMessage(chatId, `❌ Error saving order: ${error.message || 'Unknown error'}. Please try again.`);
    return;
  }

  const orderId = data[0]?.id || `VANTA-${Date.now()}`;
  
  const confirmText = `
📦 *Order Summary*
├─ Product: ${state.selectedProduct.emoji} ${state.selectedProduct.name}
├─ Quantity: ${state.quantity}x
├─ Address: \`${text}\`
└─ Payment: 💰 Cash on Delivery

Confirm this order?
  `;

  const options = {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '✅ Confirm', callback_data: `confirm_${orderId}` }],
        [{ text: '❌ Cancel & Edit', callback_data: 'menu' }]
      ]
    }
  };

  bot.sendMessage(chatId, confirmText, options);
  await logConversation(chatId, userId, 'ADDRESS_CAPTURED', text);
  userState.set(userId, { step: 'confirm', orderId });
}

// ==================== HELPER FUNCTIONS ====================

async function logConversation(chatId, userId, eventType, eventData) {
  try {
    await supabase
      .from('conversations')
      .insert([
        {
          telegram_user_id: userId,
          chat_id: chatId,
          event_type: eventType,
          event_data: eventData,
          created_at: new Date().toISOString()
        }
      ]);
  } catch (err) {
    console.error('Error logging conversation:', err);
  }
}

function extractUTM(text) {
  const match = text.match(/utm_([^=]+)=([^&\s]+)/);
  return match ? { [match[1]]: match[2] } : null;
}

// ==================== EXPRESS ROUTES ====================

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Webhook endpoint for Telegram
app.post('/telegram', async (req, res) => {
  try {
    const update = req.body;
    console.log('Received update:', JSON.stringify(update).substring(0, 200));

    if (update.message) {
      const message = update.message;
      const chatId = message.chat.id;
      const userId = message.from.id;
      const firstName = message.from.first_name || 'there';
      
      console.log(`Message from ${userId}: ${message.text}`);
      
      if (message.text && message.text.startsWith('/start')) {
        await handleStart(chatId, userId, firstName);
      } else if (message.text) {
        await handleMessage(message);
      }
    }

    if (update.callback_query) {
      console.log(`Callback from ${update.callback_query.from.id}: ${update.callback_query.data}`);
      await handleCallbackQuery(update.callback_query);
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    res.json({ ok: false, error: error.message });
  }
});

app.get('/api/orders', async (req, res) => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.json(data);
});

app.get('/api/conversations', async (req, res) => {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.json(data);
});

app.get('/api/export-csv', async (req, res) => {
  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  const csv = [
    ['Order ID', 'Customer ID', 'Product', 'Qty', 'Address', 'Status', 'Created', 'UTM Source'].join(','),
    ...orders.map(o => [
      o.id,
      o.telegram_user_id,
      o.product_name,
      o.quantity,
      `"${o.address}"`,
      o.status,
      o.created_at,
      o.utm_source || ''
    ].join(','))
  ].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=vanta-orders.csv');
  res.send(csv);
});

// ==================== SERVER ====================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ VANTA Telegram Bot running on port ${PORT}`);
  console.log(`Webhook: /telegram`);
  console.log(`Bot token: ${process.env.TELEGRAM_BOT_TOKEN ? '✓' : '✗'}`);
  console.log(`Supabase: ${process.env.SUPABASE_URL ? '✓' : '✗'}`);
});

export default app;
