import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import dotenv from 'dotenv';

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

// Product catalog
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

// User state tracker
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
    console.error('sendMessage error:', error.response?.data || error.message);
    throw error;
  }
}

async function editMessage(chatId, messageId, text, keyboard = null) {
  try {
    const payload = {
      chat_id: chatId,
      message_id: messageId,
      text: text,
      parse_mode: 'Markdown'
    };
    if (keyboard) payload.reply_markup = keyboard;

    const response = await axios.post(`${TELEGRAM_API}/editMessageText`, payload);
    return response.data;
  } catch (error) {
    console.error('editMessage error:', error.response?.data || error.message);
    throw error;
  }
}

async function answerCallback(callbackId, text = null) {
  try {
    const payload = { callback_query_id: callbackId };
    if (text) {
      payload.text = text;
      payload.show_alert = false;
    }
    const response = await axios.post(`${TELEGRAM_API}/answerCallbackQuery`, payload);
    return response.data;
  } catch (error) {
    console.error('answerCallback error:', error.response?.data || error.message);
  }
}

// ==================== BOT HANDLERS ====================

async function handleStart(chatId, userId) {
  userState.set(userId, { step: 'menu' });
  await logConversation(chatId, userId, 'START', '/start');

  const text = `👋 Welcome to VANTA Peptides!\n\nWe offer research-grade peptides, independently assayed.\n\nPick a product to order:`;
  
  const keyboard = {
    inline_keyboard: PRODUCTS.map((p) => [
      { text: `${p.emoji} ${p.name}`, callback_data: `product_${p.id}` }
    ])
  };

  await sendMessage(chatId, text, keyboard);
}

async function handleCallback(callbackQuery) {
  const { id: callbackId, from: { id: userId }, message: { chat: { id: chatId }, message_id: messageId }, data } = callbackQuery;

  try {
    if (data.startsWith('product_')) {
      const productId = parseInt(data.split('_')[1]);
      const product = PRODUCTS.find(p => p.id === productId);
      
      if (!product) {
        await answerCallback(callbackId, 'Product not found');
        return;
      }

      userState.set(userId, { step: 'quantity', selectedProduct: product });

      const text = `${product.emoji} *${product.name}*\n\nHow many units?`;
      const keyboard = {
        inline_keyboard: [
          [{ text: '1', callback_data: `qty_1_${productId}` }],
          [{ text: '2', callback_data: `qty_2_${productId}` }],
          [{ text: '3', callback_data: `qty_3_${productId}` }],
          [{ text: '5', callback_data: `qty_5_${productId}` }],
          [{ text: '10', callback_data: `qty_10_${productId}` }],
          [{ text: '🔙 Back', callback_data: 'menu' }]
        ]
      };

      await editMessage(chatId, messageId, text, keyboard);
      await logConversation(chatId, userId, 'PRODUCT_SELECTED', product.name);
      await answerCallback(callbackId);

    } else if (data.startsWith('qty_')) {
      const [_, qty, productId] = data.split('_');
      const product = PRODUCTS.find(p => p.id === parseInt(productId));
      const state = userState.get(userId);

      if (state) {
        state.step = 'address';
        state.quantity = parseInt(qty);
      }

      const text = `✅ *${qty}x ${product.emoji} ${product.name}*\n\nShare your delivery address:`;
      await editMessage(chatId, messageId, text);
      await logConversation(chatId, userId, 'QUANTITY_SELECTED', `${qty}x ${product.name}`);
      await answerCallback(callbackId);

    } else if (data === 'menu') {
      userState.set(userId, { step: 'menu' });

      const text = `👋 Back to menu.\n\nPick a product:`;
      const keyboard = {
        inline_keyboard: PRODUCTS.map((p) => [
          { text: `${p.emoji} ${p.name}`, callback_data: `product_${p.id}` }
        ])
      };

      await editMessage(chatId, messageId, text, keyboard);
      await logConversation(chatId, userId, 'RETURNED_TO_MENU', 'Menu');
      await answerCallback(callbackId);

    } else if (data.startsWith('confirm_')) {
      const orderId = data.split('_')[1];
      await logConversation(chatId, userId, 'ORDER_CONFIRMED', orderId);
      
      const text = `✅ *Order confirmed!* Reference: \`${orderId}\`\n\n💰 Cash on Delivery.\nMatt will contact you shortly.\n\nThank you for choosing VANTA! 🧬`;
      await sendMessage(chatId, text);
      await answerCallback(callbackId);
    }
  } catch (error) {
    console.error('Callback error:', error);
    await answerCallback(callbackId, 'Error processing request');
  }
}

async function handleMessage(msg) {
  const { chat: { id: chatId }, from: { id: userId }, text } = msg;

  if (!text || text.startsWith('/')) return;

  const state = userState.get(userId);
  if (!state || state.step !== 'address') return;

  try {
    console.log('Attempting to insert order:', {
      telegram_user_id: userId,
      chat_id: chatId,
      product_name: state.selectedProduct.name,
      quantity: state.quantity,
      address: text
    });

    // Insert order to Supabase
    const { data, error } = await supabase
      .from('orders')
      .insert([{
        telegram_user_id: userId,
        chat_id: chatId,
        product_name: state.selectedProduct.name,
        quantity: state.quantity,
        address: text,
        status: 'pending',
        created_at: new Date().toISOString()
      }])
      .select();

    if (error) {
      console.error('Supabase insert error:', error);
      await sendMessage(chatId, `❌ Order error: ${error.message}`);
      return;
    }

    console.log('Order inserted successfully:', data);

    const orderId = data[0]?.id || `VANTA-${Date.now()}`;
    
    const confirmText = `
📦 *Order Summary*
├─ Product: ${state.selectedProduct.emoji} ${state.selectedProduct.name}
├─ Qty: ${state.quantity}x
├─ Address: \`${text}\`
└─ Payment: 💰 Cash on Delivery

Confirm?
    `;

    const keyboard = {
      inline_keyboard: [
        [{ text: '✅ Confirm', callback_data: `confirm_${orderId}` }],
        [{ text: '❌ Cancel', callback_data: 'menu' }]
      ]
    };

    await sendMessage(chatId, confirmText, keyboard);
    await logConversation(chatId, userId, 'ADDRESS_CAPTURED', text);
    userState.set(userId, { step: 'confirm', orderId });

  } catch (error) {
    console.error('Order exception:', error);
    await sendMessage(chatId, `❌ Error: ${error.message}`);
  }
}

async function logConversation(chatId, userId, eventType, eventData) {
  try {
    await supabase.from('conversations').insert([{
      telegram_user_id: userId,
      chat_id: chatId,
      event_type: eventType,
      event_data: eventData,
      created_at: new Date().toISOString()
    }]);
  } catch (err) {
    console.error('Log error:', err);
  }
}

// ==================== EXPRESS ROUTES ====================

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/telegram', async (req, res) => {
  try {
    const { message, callback_query } = req.body;

    if (message) {
      if (message.text?.startsWith('/start')) {
        await handleStart(message.chat.id, message.from.id);
      } else {
        await handleMessage(message);
      }
    }

    if (callback_query) {
      await handleCallback(callback_query);
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.json({ ok: false, error: error.message });
  }
});

app.get('/api/orders', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/conversations', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/export-csv', async (req, res) => {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const csv = [
      ['Order ID', 'Customer ID', 'Product', 'Qty', 'Address', 'Status', 'Created'].join(','),
      ...orders.map(o => [o.id, o.telegram_user_id, o.product_name, o.quantity, `"${o.address}"`, o.status, o.created_at].join(','))
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

    // Send message to Telegram user
    const text = `*Matt:* ${message}`;
    await sendMessage(userId, text);

    // Log to conversations table
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
  console.log(`Webhook: POST /telegram`);
});

export default app;
