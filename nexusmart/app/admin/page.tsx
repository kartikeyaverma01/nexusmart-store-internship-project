"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  BarChart3, ShoppingCart, Users, Package, AlertCircle, 
  Plus, CheckCircle2, ChevronRight, ArrowLeft, Loader2, RefreshCw 
} from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  
  // Dashboard tab control (overview, orders, add-product)
  const [activeTab, setActiveTab] = useState('overview');

  // Stats State
  const [stats, setStats] = useState<any>(null);
  const [isStatsLoading, setIsStatsLoading] = useState(true);

  // Orders State
  const [orders, setOrders] = useState<any[]>([]);
  const [isOrdersLoading, setIsOrdersLoading] = useState(true);

  // Add Product Form State
  const [productForm, setProductForm] = useState({
    name: '',
    price: '',
    category: 'Electronics',
    imageUrl: '',
    description: ''
  });
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);
  const [formFeedback, setFormFeedback] = useState<any>(null);

  // --- DIAGNOSTIC SESSION LOG ---
  useEffect(() => {
    if (status !== 'loading') {
      console.log("========================================");
      console.log("🔒 NEXUSMART SESSION DIAGNOSTIC LOG:");
      console.log("Session Status:", status);
      console.log("User Session Object:", session);
      console.log("User Role Found:", (session?.user as any)?.role);
      console.log("========================================");
    }
  }, [session, status]);

  const formatINR = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  // Fetch Metrics & Analytics
  const fetchStats = async () => {
    try {
      setIsStatsLoading(true);
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsStatsLoading(false);
    }
  };

  // Fetch Orders List
  const fetchOrders = async () => {
    try {
      setIsOrdersLoading(true);
      const res = await fetch('/api/admin/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (session && (session.user as any)?.role === "ADMIN") {
      fetchStats();
      fetchOrders();
    }
  }, [session]);

  const handleUpdateStatus = async (orderId: string, currentStatus: string) => {
    let nextStatus = 'Processing';
    if (currentStatus === 'Processing') nextStatus = 'Dispatched';
    else if (currentStatus === 'Dispatched') nextStatus = 'Delivered';
    else return;

    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, newStatus: nextStatus })
      });

      if (res.ok) {
        fetchOrders();
        fetchStats();
      }
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormFeedback(null);

    if (!productForm.name || !productForm.price || !productForm.imageUrl || !productForm.description) {
      setFormFeedback({ error: "Please enter all product specifications" });
      return;
    }

    setIsSubmittingProduct(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productForm)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to commit product");

      setFormFeedback({ success: `Product "${productForm.name}" created successfully and is now live!` });
      setProductForm({ name: '', price: '', category: 'Electronics', imageUrl: '', description: '' });
      fetchStats();
    } catch (err: any) {
      setFormFeedback({ error: err.message });
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  // Gatekeeper: Reject access if not an ADMIN
  if (status === 'unauthenticated' || (session?.user as any)?.role !== "ADMIN") {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 px-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md text-center border border-gray-100">
          <AlertCircle size={64} className="text-red-500 mx-auto mb-4 animate-pulse" />
          <h1 className="text-2xl font-black text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-500 text-sm mb-6 leading-relaxed font-semibold">
            This directory is restricted to Administrator access. If you are an administrator, please sign out and sign back in using correct credentials.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-left">
            <p className="text-xs font-bold text-amber-800">Diagnostic Quick View:</p>
            <p className="text-[11px] font-semibold text-amber-700 mt-1">Status: <span className="font-bold">{status}</span></p>
            <p className="text-[11px] font-semibold text-amber-700">Logged User: <span className="font-bold">{session?.user?.email || 'None'}</span></p>
            <p className="text-[11px] font-semibold text-amber-700">Role in Cookie: <span className="font-bold">{(session?.user as any)?.role || 'undefined'}</span></p>
          </div>
          <div className="space-y-3">
            <Link href="/" className="block w-full py-3 border border-gray-300 hover:bg-gray-50 rounded-full font-bold transition-all text-gray-700 text-sm">
              Return to Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-16">
      
      {/* Admin Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors font-bold text-sm">
            <ArrowLeft size={16} /> Return to Store
          </Link>
          <div className="font-extrabold text-lg">
            NexusMart <span className="text-blue-600">Admin Control Room</span>
          </div>
          <div className="bg-blue-100 text-blue-800 text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full">
            Admin Mode
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* TAB CONTROLLERS */}
        <div className="flex border-b border-gray-200 mb-8 gap-6 text-sm font-bold text-gray-500">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`pb-4 border-b-2 transition-all flex items-center gap-1.5 ${activeTab === 'overview' ? 'border-blue-600 text-blue-600' : 'border-transparent hover:text-gray-900'}`}
          >
            <BarChart3 size={18} /> Overview
          </button>
          <button 
            onClick={() => setActiveTab('orders')}
            className={`pb-4 border-b-2 transition-all flex items-center gap-1.5 ${activeTab === 'orders' ? 'border-blue-600 text-blue-600' : 'border-transparent hover:text-gray-900'}`}
          >
            <ShoppingCart size={18} /> Orders Manager ({orders.length})
          </button>
          <button 
            onClick={() => setActiveTab('add-product')}
            className={`pb-4 border-b-2 transition-all flex items-center gap-1.5 ${activeTab === 'add-product' ? 'border-blue-600 text-blue-600' : 'border-transparent hover:text-gray-900'}`}
          >
            <Package size={18} /> Add New Product
          </button>
        </div>

        {/* TAB 1: OVERVIEW & ANALYTICS */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {isStatsLoading ? (
              <div className="flex justify-center py-10"><Loader2 className="animate-spin text-blue-600" size={32} /></div>
            ) : stats ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
                  <div className="bg-green-100 text-green-600 p-4 rounded-2xl"><ShoppingCart size={24} /></div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Sales Revenue</p>
                    <p className="text-2xl font-black mt-0.5">{formatINR(stats.totalEarnings)}</p>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
                  <div className="bg-blue-100 text-blue-600 p-4 rounded-2xl"><ShoppingCart size={24} /></div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Orders Handled</p>
                    <p className="text-2xl font-black mt-0.5">{stats.totalOrders}</p>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
                  <div className="bg-purple-100 text-purple-600 p-4 rounded-2xl"><Package size={24} /></div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Live Catalog Items</p>
                    <p className="text-2xl font-black mt-0.5">{stats.totalProducts}</p>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
                  <div className="bg-yellow-100 text-yellow-600 p-4 rounded-2xl"><Users size={24} /></div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Registered Members</p>
                    <p className="text-2xl font-black mt-0.5">{stats.totalUsers}</p>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-lg font-black text-gray-900 leading-tight">Need to expand the NexusMart Catalog?</h3>
                <p className="text-sm text-gray-500 mt-1">Add details, prices, specs and premium descriptions to make catalog additions live instantly.</p>
              </div>
              <button 
                onClick={() => setActiveTab('add-product')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full text-sm transition-all flex items-center gap-1.5 active:scale-95"
              >
                <Plus size={16} /> Create Catalog Entry
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: INTERACTIVE ORDERS LIST */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-extrabold text-base text-gray-900">Registered Incoming Order Logs</h3>
              <button onClick={fetchOrders} className="p-2 text-gray-400 hover:text-blue-600 rounded-full hover:bg-gray-100 transition-colors">
                <RefreshCw size={16} />
              </button>
            </div>

            {isOrdersLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={32} /></div>
            ) : orders.length === 0 ? (
              <div className="text-center py-20 text-gray-500 font-medium">No order transactions saved in PostgreSQL.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-400 border-b border-gray-200">
                      <th className="p-4 pl-6">Tracking ID</th>
                      <th className="p-4">Customer Details</th>
                      <th className="p-4">Items Ordered</th>
                      <th className="p-4">Amount Paid</th>
                      <th className="p-4 text-center">Status</th>
                      <th className="p-4 pr-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-semibold text-gray-700">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-4 pl-6 text-xs text-blue-600 font-mono font-black">{order.trackingId}</td>
                        <td className="p-4">
                          <p className="text-gray-900 font-bold">{order.customerName}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{order.phone} | PIN: {order.postalCode}</p>
                        </td>
                        <td className="p-4 max-w-xs">
                          <div className="space-y-1">
                            {order.items?.map((item: any) => (
                              <p key={item.id} className="text-xs truncate" title={item.product?.name}>
                                • {item.product?.name} <span className="text-gray-400 font-bold">(x{item.quantity})</span>
                              </p>
                            ))}
                          </div>
                        </td>
                        <td className="p-4 font-extrabold text-gray-900">{formatINR(order.totalAmount)}</td>
                        <td className="p-4 text-center">
                          <span className={`inline-block text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                            order.orderStatus === 'Processing' ? 'bg-blue-100 text-blue-800' :
                            order.orderStatus === 'Dispatched' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {order.orderStatus}
                          </span>
                        </td>
                        <td className="p-4 pr-6 text-right">
                          {order.orderStatus !== 'Delivered' ? (
                            <button
                              onClick={() => handleUpdateStatus(order.id, order.orderStatus)}
                              className="px-3.5 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-600 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 ml-auto active:scale-95"
                            >
                              Move to Next Step <ChevronRight size={14} />
                            </button>
                          ) : (
                            <span className="text-xs font-bold text-green-600 flex items-center gap-1 justify-end">
                              <CheckCircle2 size={14} /> Fulfilled
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CATALOG FORM TO ADD NEW PRODUCTS */}
        {activeTab === 'add-product' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-gray-100 max-w-2xl mx-auto">
            <h3 className="font-extrabold text-lg text-gray-900 border-b border-gray-100 pb-4 mb-6">Create New Catalog Product Card</h3>
            
            {formFeedback && (
              <div className={`p-4 rounded-xl mb-6 text-sm font-semibold flex gap-2.5 ${formFeedback.success ? 'bg-green-50 border border-green-100 text-green-700' : 'bg-red-50 border border-red-100 text-red-700'}`}>
                {formFeedback.success ? <CheckCircle2 size={18} className="mt-0.5" /> : <AlertCircle size={18} className="mt-0.5" />}
                <p>{formFeedback.success || formFeedback.error}</p>
              </div>
            )}

            <form onSubmit={handleAddProduct} className="space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Product Title / Name</label>
                  <input 
                    type="text"
                    value={productForm.name}
                    onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-semibold"
                    placeholder="e.g. Ergonomic Keyboard"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Price (in ₹ Rupees)</label>
                  <input 
                    type="number"
                    value={productForm.price}
                    onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-semibold"
                    placeholder="e.g. 4999"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Category</label>
                  <select 
                    value={productForm.category}
                    onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-semibold"
                  >
                    <option>Electronics</option>
                    <option>Accessories</option>
                    <option>Furniture</option>
                    <option>Home</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">High-Res Image URL</label>
                  <input 
                    type="text"
                    value={productForm.imageUrl}
                    onChange={(e) => setProductForm({...productForm, imageUrl: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-semibold"
                    placeholder="Paste direct Unsplash/CDN link"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Brief Descriptive Summary</label>
                <textarea 
                  rows={4}
                  value={productForm.description}
                  onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-semibold"
                  placeholder="Provide an overview..."
                />
              </div>

              <button 
                type="submit"
                disabled={isSubmittingProduct}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-4 rounded-xl font-bold transition-all shadow-md mt-6 active:scale-95 flex items-center justify-center gap-1.5"
              >
                {isSubmittingProduct ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Adding item to database...
                  </>
                ) : (
                  "Create Live Catalog Card"
                )}
              </button>
            </form>
          </div>
        )}

      </main>
    </div>
  );
}