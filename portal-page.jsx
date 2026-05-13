import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Dashboard() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  const [orders, setOrders] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, confirmed: 0 });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' or 'conversations'

  // Password check on mount
  useEffect(() => {
    const stored = localStorage.getItem('vanta_auth');
    if (stored === 'authenticated') {
      setAuthenticated(true);
    }
  }, []);

  // Fetch data only when authenticated
  useEffect(() => {
    if (authenticated) {
      fetchData();
      subscribeToUpdates();
    }
  }, [authenticated]);

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    
    // Check password (you can change this to match your chosen password)
    // Using environment variable NEXT_PUBLIC_PORTAL_PASSWORD for flexibility
    const correctPassword = process.env.NEXT_PUBLIC_PORTAL_PASSWORD || 'vanta2025';
    
    if (password === correctPassword) {
      setAuthenticated(true);
      localStorage.setItem('vanta_auth', 'authenticated');
      setPassword('');
      setPasswordError('');
    } else {
      setPasswordError('Incorrect password');
      setPassword('');
    }
  }

  function handleLogout() {
    setAuthenticated(false);
    localStorage.removeItem('vanta_auth');
    setPassword('');
  }

  async function fetchData() {
    setLoading(true);
    try {
      // Fetch orders
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      // Fetch conversations
      const { data: convoData } = await supabase
        .from('conversations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      setOrders(ordersData || []);
      setConversations(convoData || []);

      // Calculate stats
      const total = ordersData?.length || 0;
      const pending = ordersData?.filter(o => o.status === 'pending').length || 0;
      const confirmed = ordersData?.filter(o => o.status === 'confirmed').length || 0;

      setStats({ total, pending, confirmed });
      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setLoading(false);
    }
  }

  function subscribeToUpdates() {
    // Subscribe to order changes
    const ordersSubscription = supabase
      .channel('orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchData();
      })
      .subscribe();

    // Subscribe to conversation changes
    const convoSubscription = supabase
      .channel('conversations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      ordersSubscription.unsubscribe();
      convoSubscription.unsubscribe();
    };
  }

  async function updateOrderStatus(orderId, newStatus) {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', orderId);

    if (!error) {
      fetchData();
    }
  }

  async function exportCSV() {
    try {
      const response = await fetch('/api/export-csv');
      const csv = await response.text();
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vanta-orders-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error exporting CSV:', err);
    }
  }

  // LOGIN SCREEN
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white/10 backdrop-blur border border-purple-500/50 rounded-lg p-8">
            <h1 className="text-3xl font-bold text-white text-center mb-2">🧬 VANTA</h1>
            <p className="text-purple-200 text-center mb-8">Peptides Management Portal</p>
            
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-purple-200 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter portal password"
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-purple-500/50 text-white placeholder-purple-300/50 focus:outline-none focus:border-purple-400"
                  autoFocus
                />
              </div>
              
              {passwordError && (
                <div className="text-red-400 text-sm text-center">{passwordError}</div>
              )}
              
              <button
                type="submit"
                className="w-full px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:shadow-lg transition"
              >
                Enter Portal
              </button>
            </form>
            
            <p className="text-xs text-purple-300 text-center mt-6">
              🔒 Secure access for you and Matt only
            </p>
          </div>
        </div>
      </div>
    );
  }

  // MAIN DASHBOARD (AUTHENTICATED)
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header with Logout */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">🧬 VANTA Peptides Dashboard</h1>
            <p className="text-purple-200">Real-time order & conversation tracking</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-white/10 border border-red-500/50 text-red-300 font-semibold rounded-lg hover:bg-red-500/10 transition"
          >
            🚪 Logout
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur border border-purple-500/50 rounded-lg p-6">
            <div className="text-purple-200 text-sm font-semibold mb-1">Total Orders</div>
            <div className="text-3xl font-bold text-white">{stats.total}</div>
          </div>
          <div className="bg-white/10 backdrop-blur border border-yellow-500/50 rounded-lg p-6">
            <div className="text-yellow-200 text-sm font-semibold mb-1">Pending</div>
            <div className="text-3xl font-bold text-white">{stats.pending}</div>
          </div>
          <div className="bg-white/10 backdrop-blur border border-green-500/50 rounded-lg p-6">
            <div className="text-green-200 text-sm font-semibold mb-1">Confirmed</div>
            <div className="text-3xl font-bold text-white">{stats.confirmed}</div>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="mb-8 flex gap-4">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-6 py-2 font-semibold rounded-lg transition ${
              activeTab === 'orders'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                : 'bg-white/10 border border-purple-500/50 text-purple-200 hover:bg-white/20'
            }`}
          >
            📦 Orders
          </button>
          <button
            onClick={() => setActiveTab('conversations')}
            className={`px-6 py-2 font-semibold rounded-lg transition ${
              activeTab === 'conversations'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                : 'bg-white/10 border border-purple-500/50 text-purple-200 hover:bg-white/20'
            }`}
          >
            💬 Conversations
          </button>
        </div>

        {/* Action Buttons */}
        <div className="mb-8 flex gap-4">
          <button
            onClick={exportCSV}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:shadow-lg transition"
          >
            📥 Export CSV
          </button>
          <button
            onClick={() => fetchData()}
            className="px-6 py-2 bg-white/10 border border-purple-500/50 text-white font-semibold rounded-lg hover:bg-white/20 transition"
          >
            🔄 Refresh
          </button>
        </div>

        {loading && <div className="text-center text-purple-200">Loading...</div>}

        {/* ORDERS TAB */}
        {activeTab === 'orders' && !loading && (
          <div className="bg-white/10 backdrop-blur border border-purple-500/50 rounded-lg overflow-hidden">
            <div className="p-6 border-b border-purple-500/30">
              <h2 className="text-xl font-bold text-white">📦 Recent Orders ({stats.total})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-purple-500/30">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-purple-200">Product</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-purple-200">Qty</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-purple-200">Customer Address</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-purple-200">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-purple-200">Date</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-purple-200">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-purple-300">
                        No orders yet. Waiting for first customer...
                      </td>
                    </tr>
                  ) : (
                    orders.map((order) => (
                      <tr key={order.id} className="border-b border-purple-500/20 hover:bg-white/5 transition">
                        <td className="px-6 py-4 text-white font-semibold">{order.product_name}</td>
                        <td className="px-6 py-4 text-white">{order.quantity}x</td>
                        <td className="px-6 py-4 text-purple-200 text-sm truncate max-w-xs">{order.address}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            order.status === 'pending' ? 'bg-yellow-500/30 text-yellow-200' :
                            order.status === 'confirmed' ? 'bg-green-500/30 text-green-200' :
                            'bg-purple-500/30 text-purple-200'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-purple-200 text-sm">
                          {new Date(order.created_at).toLocaleDateString()} {new Date(order.created_at).toLocaleTimeString()}
                        </td>
                        <td className="px-6 py-4">
                          {order.status === 'pending' && (
                            <button
                              onClick={() => updateOrderStatus(order.id, 'confirmed')}
                              className="text-sm px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition"
                            >
                              ✓ Confirm
                            </button>
                          )}
                          {order.status === 'confirmed' && (
                            <button
                              onClick={() => updateOrderStatus(order.id, 'shipped')}
                              className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                            >
                              📦 Shipped
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CONVERSATIONS TAB */}
        {activeTab === 'conversations' && !loading && (
          <div className="bg-white/10 backdrop-blur border border-purple-500/50 rounded-lg overflow-hidden">
            <div className="p-6 border-b border-purple-500/30">
              <h2 className="text-xl font-bold text-white">💬 Customer Conversations ({conversations.length})</h2>
            </div>
            <div className="p-6 max-h-screen overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="text-center text-purple-300 py-8">
                  No conversations yet. Waiting for first customer...
                </div>
              ) : (
                <div className="space-y-4">
                  {conversations.map((convo) => (
                    <div key={convo.id} className="bg-white/5 border border-purple-500/20 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-xs bg-purple-500/50 text-purple-100 px-3 py-1 rounded-full font-semibold">
                            {convo.event_type || 'MESSAGE'}
                          </span>
                          <span className="text-xs text-purple-300">
                            Customer: {convo.customer_name || convo.user_id}
                          </span>
                        </div>
                        <span className="text-xs text-purple-400">
                          {new Date(convo.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-white text-sm leading-relaxed">
                        {convo.message && (
                          <>
                            <span className="text-purple-300">Customer:</span> "{convo.message}"
                          </>
                        )}
                        {convo.response && (
                          <>
                            <br />
                            <span className="text-green-300">Bot:</span> "{convo.response}"
                          </>
                        )}
                        {convo.event_data && !convo.message && (
                          <span className="text-purple-300 italic">{convo.event_data}</span>
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
