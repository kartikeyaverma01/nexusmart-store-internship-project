"use client";

import React, { useState, useEffect } from 'react';
import { ShoppingCart, Search, Menu, X, Plus, Minus, Trash2, Sparkles, Bot, Send, Loader2, User, LogOut, Lock, ArrowRight, Zap, ShieldCheck, TrendingUp, Sparkle, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { useCartStore } from '../lib/store';
import { useSession, signOut } from 'next-auth/react';

const SIMULATED_ACTIVITIES = [
  { location: "Mumbai", item: "Keychron Mechanical Keyboard", savings: "₹3,000" },
  { location: "Delhi NCR", item: "Premium Wireless Headphones (ANC)", savings: "₹5,000" },
  { location: "Bengaluru", item: "Ergonomic High-Back Office Chair", savings: "₹4,000" },
  { location: "Hyderabad", item: "Minimalist Classic Smartwatch v2", savings: "₹3,500" },
  { location: "Pune", item: "Water-Resistant Daily Canvas Backpack", savings: "₹1,000" }
];

const TEASER_PROMPTS = [
  "Find a gift for a coder under ₹10,000",
  "Upgrade my desk setup with clean ergonomics",
  "Best acoustic headphones for concentration"
];

export default function Home() {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isAIOpen, setIsAIOpen] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState<any>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const [activeTeaserPrompt, setActiveTeaserPrompt] = useState<string | null>(null);
  const [teaserResponseState, setTeaserResponseState] = useState<'idle' | 'typing' | 'revealed'>('idle');
  const [currentActivityIndex, setCurrentActivityIndex] = useState(0);

  const { cart, isCartOpen, setIsCartOpen, addToCart, updateQuantity, removeFromCart, cartTotal } = useCartStore();
  const cartCount = cart.reduce((count: number, item: any) => count + item.quantity, 0);

  const formatINR = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products');
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        console.error("Failed to fetch products", err);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    if (session) return;
    const interval = setInterval(() => {
      setCurrentActivityIndex((prev) => (prev + 1) % SIMULATED_ACTIVITIES.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [session]);

  const triggerTeaserSimulation = (prompt: string) => {
    setActiveTeaserPrompt(prompt);
    setTeaserResponseState('typing');
    setTimeout(() => {
      setTeaserResponseState('revealed');
    }, 1200);
  };

  const fetchWithBackoff = async (url: string, options: any, retries = 5) => {
    const delays = [1000, 2000, 4000, 8000, 16000];
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, options);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise(res => setTimeout(res, delays[i]));
      }
    }
  };

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;

    setIsAiLoading(true);
    setAiResponse(null);
    setAiError(null);

    const apiKey = ""; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

    const safeProductsForAI = Array.isArray(products) ? products : [];
    const catalogData = safeProductsForAI.map(p => 
      `{id: "${p.id}", name: "${p.name}", price: ${p.price}, category: "${p.category}", description: "${p.description}"}`
    ).join(', ');

    const payload = {
      contents: [{ parts: [{ text: `User request: ${aiQuery}` }] }],
      systemInstruction: {
        parts: [{ text: `You are an expert AI Personal Shopper for NexusMart. Here is our entire product catalog: [${catalogData}]. Based on the user's request, recommend up to 3 products that best fit their needs. Be helpful, concise, and persuasive.` }]
      },
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            message: { type: "STRING", description: "A friendly, personalized message explaining why you chose these products based on the user's input." },
            recommendedIds: { type: "ARRAY", items: { type: "STRING" }, description: "Array of the exact product IDs you are recommending from the catalog." }
          },
          required: ["message", "recommendedIds"]
        }
      }
    };

    try {
      const result = await fetchWithBackoff(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (textResponse) {
         setAiResponse(JSON.parse(textResponse));
      } else {
         throw new Error("No response from AI");
      }
    } catch (err) {
      setAiError("Sorry, my AI brain is a bit fuzzy right now. Please try again later!");
    } finally {
      setIsAiLoading(false);
    }
  };

  const safeProducts = Array.isArray(products) ? products : [];
  
  const filteredProducts = safeProducts.filter(product => {
    const matchesSearch = product?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product?.category?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || product?.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCardBadge = (category: string) => {
    switch (category) {
      case 'Electronics': return { label: 'Bestseller', styles: 'bg-orange-50 border-orange-100 text-orange-700' };
      case 'Furniture': return { label: 'Top Rated', styles: 'bg-emerald-50 border-emerald-100 text-emerald-700' };
      case 'Accessories': return { label: 'Limited Stock', styles: 'bg-red-50 border-red-100 text-red-700' };
      default: return { label: 'Exclusive', styles: 'bg-blue-50 border-blue-100 text-blue-700' };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      
      {/* 1. MEMBER SECURITY GATE & MODERN LIGHT WELCOME LANDING PAGE */}
      {!session ? (
        <div className="relative min-h-screen bg-gradient-to-tr from-blue-50 via-slate-50 to-white flex flex-col justify-between overflow-hidden">
          
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-100/50 blur-[130px] pointer-events-none"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-100/40 blur-[130px] pointer-events-none"></div>
          <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[35%] h-[35%] rounded-full bg-blue-50/20 blur-[120px] pointer-events-none"></div>

          {/* Translucent Navigation */}
          <nav className="max-w-7xl mx-auto w-full px-6 py-5 flex justify-between items-center relative z-10 border-b border-gray-200/60 bg-white/50 backdrop-blur-md">
            <div className="flex items-center gap-2.5">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2.5 rounded-xl text-white shadow-lg shadow-blue-600/25">
                <ShoppingCart size={22} />
              </div>
              <span className="font-extrabold text-2xl tracking-tight text-slate-900">
                Nexus<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Mart</span>
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-[10px] font-bold uppercase text-blue-600 tracking-wider">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block animate-ping"></span>
                14,842 Shoppers Online
              </div>
              <Link 
                href="/login" 
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-full text-sm font-extrabold transition-all border border-blue-500/20 shadow-lg shadow-blue-600/20 active:scale-95"
              >
                Sign In
              </Link>
            </div>
          </nav>



          {/* Hero Area & Interactive Workspace */}
          <div className="max-w-7xl mx-auto w-full px-6 py-12 md:py-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10 flex-grow">
            
            <div className="lg:col-span-7 space-y-8">
              
              {/* Dynamic activity ticker bubble */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200/80 text-xs font-semibold text-gray-700 shadow-sm max-w-full">
                <Zap size={14} className="text-yellow-500 animate-bounce" />
                <div className="transition-all duration-500 overflow-hidden truncate">
                  <span>Live Activity: A shopper in </span>
                  <span className="text-blue-600 font-extrabold">{SIMULATED_ACTIVITIES[currentActivityIndex].location}</span>
                  <span> secured </span>
                  <span className="text-gray-900 font-extrabold">{SIMULATED_ACTIVITIES[currentActivityIndex].item}</span>
                  <span> (Saved {SIMULATED_ACTIVITIES[currentActivityIndex].savings}!)</span>
                </div>
              </div>

              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-950 leading-[1.05] tracking-tight">
                  Secure Member-Only <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700">
                    Tech & Lifestyle Store
                  </span>
                </h1>
                <p className="text-slate-600 text-sm sm:text-base md:text-lg max-w-xl font-medium leading-relaxed">
                  Welcome to NexusMart. We bypass middlemen to bring direct value on premium tech accessories, modular desktop gear, and curated home workspace hardware. Register for free to explore.
                </p>
              </div>

              {/* INTERACTIVE AI CONCIERGE PREVIEW */}
              <div className="bg-white border border-gray-200/80 rounded-3xl p-5 md:p-6 shadow-md relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 text-indigo-600/10 group-hover:text-indigo-600/20 transition-colors pointer-events-none">
                  <Sparkles size={40} />
                </div>
                
                <h3 className="text-slate-900 text-xs font-black uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Bot size={16} className="text-indigo-600" /> Interactive AI Shopper Concierge
                </h3>
                <p className="text-slate-500 text-xs font-semibold mb-4">Click a preset request below to test how our personal artificial intelligence parses the private stock catalog:</p>
                
                {/* Preset Prompt Selectors */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {TEASER_PROMPTS.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => triggerTeaserSimulation(prompt)}
                      className={`text-left text-xs px-3 py-2 rounded-xl transition-all border font-bold ${activeTeaserPrompt === prompt ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}
                    >
                      "{prompt}"
                    </button>
                  ))}
                </div>

                {/* Simulated Response Terminal Box */}
                {activeTeaserPrompt && (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 animate-fade-in">
                    <p className="text-slate-700 text-xs font-bold flex items-center gap-1.5">
                      <User size={12} className="text-slate-400" /> You: "{activeTeaserPrompt}"
                    </p>
                    
                    {teaserResponseState === 'typing' ? (
                      <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 animate-pulse">
                        <Loader2 size={12} className="animate-spin" />
                        Analyzing physical catalog specifications...
                      </div>
                    ) : (
                      <div className="space-y-3 relative">
                        <div className="filter blur-[3.5px] select-none pointer-events-none space-y-1.5 opacity-40">
                          <p className="text-slate-600 text-xs">Based on our private catalog, here are excellent options featuring heavy-duty structural chassis, dynamic sound stages, and premium manufacturer discounts...</p>
                          <div className="h-10 bg-slate-200 rounded-xl w-full"></div>
                        </div>
                        <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-2 bg-gradient-to-t from-slate-50 to-transparent">
                          <div className="bg-indigo-600 text-white p-2 rounded-lg mb-1.5 shadow-md shadow-indigo-600/20">
                            <Lock size={14} />
                          </div>
                          <p className="text-xs font-black text-slate-900">Secure Member Account Required</p>
                          <Link href="/login" className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center gap-0.5 mt-0.5">
                            Sign in to reveal curated items <ArrowRight size={10} />
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  href="/login" 
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-full font-extrabold transition-all shadow-xl shadow-blue-600/25 text-center active:scale-95 flex items-center justify-center gap-2 group"
                >
                  Enter Storefront <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link 
                  href="/login?register=true" 
                  className="px-8 py-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-full font-bold transition-all text-center active:scale-95 shadow-sm"
                >
                  Create Member Account
                </Link>
              </div>

            </div>

            <div className="lg:col-span-5 relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl blur-2xl group-hover:from-blue-200 group-hover:to-indigo-200 transition-all"></div>
              
              <div className="relative border border-slate-200 bg-white/90 backdrop-blur-xl p-6 sm:p-8 rounded-3xl overflow-hidden shadow-xl">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-200"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-100"></span>
                  </div>
                  <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Secure Marketplace Terminal</span>
                </div>
                
                <div className="space-y-4 filter blur-md select-none pointer-events-none opacity-20">
                  {[
                    { name: "Premium Headset", category: "Electronics", price: "₹14,999" },
                    { name: "Keychron Tactile", category: "Electronics", price: "₹6,999" },
                    { name: "Executive Chair", category: "Furniture", price: "₹11,999" }
                  ].map((p, idx) => (
                    <div key={idx} className="flex gap-4 p-3 bg-slate-100 border border-slate-200 rounded-2xl items-center">
                      <div className="w-16 h-16 bg-slate-300 rounded-lg"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-400 rounded w-[60%]"></div>
                        <div className="h-3 bg-slate-200 rounded w-[40%] font-bold text-blue-400"></div>
                      </div>
                      <div className="w-12 h-6 bg-blue-500/30 rounded-full"></div>
                    </div>
                  ))}
                </div>

                <div className="absolute inset-0 flex flex-col justify-center items-center p-6 text-center bg-slate-50/70 backdrop-blur-[2px]">
                  <div className="p-4 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl shadow-xl shadow-blue-500/30 mb-4 border border-blue-400/20">
                    <Lock size={32} className="animate-pulse" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 leading-tight">Gated Member Selection</h3>
                  <p className="text-slate-500 text-xs mt-2.5 max-w-xs leading-normal">Become a registered member of our circle to unlock live pricing, consult the AI Concierge, and schedule priority delivery across India.</p>
                  
                  <Link 
                    href="/login" 
                    className="mt-6 px-6 py-2.5 bg-slate-900 text-white rounded-full font-black text-xs hover:bg-slate-800 transition-all tracking-wide uppercase active:scale-95 shadow-md flex items-center gap-1.5"
                  >
                    Authenticate Securely <ArrowUpRight size={14} />
                  </Link>
                </div>
              </div>
            </div>

          </div>

          <div className="max-w-7xl mx-auto w-full px-6 pb-16 relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="bg-white/80 border border-slate-200 rounded-3xl p-6 backdrop-blur-md hover:bg-slate-50 transition-all hover:border-slate-300 hover:shadow-lg hover:shadow-blue-500/5 group shadow-sm">
              <div className="p-3 bg-blue-50 rounded-2xl text-blue-600 w-fit mb-4 group-hover:scale-110 transition-transform">
                <TrendingUp size={20} />
              </div>
              <h4 className="text-slate-900 font-extrabold text-base">Direct Value Pricing</h4>
              <p className="text-slate-500 text-xs mt-2 leading-relaxed">We source workspace essentials and smart hardware directly from high-tier assembly yards, stripping away standard middleman commissions to protect your budget.</p>
            </div>

            <div className="bg-white/80 border border-slate-200 rounded-3xl p-6 backdrop-blur-md hover:bg-slate-50 transition-all hover:border-slate-300 hover:shadow-lg hover:shadow-indigo-500/5 group shadow-sm">
              <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 w-fit mb-4 group-hover:scale-110 transition-transform">
                <Bot size={20} />
              </div>
              <h4 className="text-slate-900 font-extrabold text-base">24/7 AI Concierge</h4>
              <p className="text-slate-500 text-xs mt-2 leading-relaxed">Our integrated shoppping assistant analyzes parameters in real-time, instantly matching products to your specific specs, space guidelines, and budgets.</p>
            </div>

            <div className="bg-white/80 border border-slate-200 rounded-3xl p-6 backdrop-blur-md hover:bg-slate-50 transition-all hover:border-slate-300 hover:shadow-lg hover:shadow-green-500/5 group shadow-sm">
              <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 w-fit mb-4 group-hover:scale-110 transition-transform">
                <ShieldCheck size={20} />
              </div>
              <h4 className="text-slate-900 font-extrabold text-base">Priority Logistics</h4>
              <p className="text-slate-500 text-xs mt-2 leading-relaxed">Every transaction is fully tracked under factory warranties and processed with secure COD or encrypted payments with rapid dispatch to all Indian metro pincodes.</p>
            </div>

          </div>

          <footer className="py-6 border-t border-slate-200 text-center text-[10px] text-slate-400 tracking-wider uppercase relative z-10 font-bold bg-white/40 backdrop-blur-md">
            © 2026 NexusMart Inc. • Secured Member Checkout Architecture • Certified Direct Logistics Nodes
          </footer>
        </div>
      ) : (
        /* 2. LOGGED-IN LIVE PREMIUM CATALOG & STOREFRONT */
        <>
          {/* NAVIGATION BAR */}
          <nav className="bg-white shadow-sm sticky top-0 z-40 border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <Link href="/" className="flex items-center gap-2 cursor-pointer">
                  <div className="bg-blue-600 p-2 rounded-lg text-white">
                    <ShoppingCart size={20} />
                  </div>
                  <span className="font-bold text-xl tracking-tight text-gray-900">Nexus<span className="text-blue-600">Mart</span></span>
                </Link>

                <div className="hidden md:flex flex-1 max-w-md mx-8 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={18} className="text-gray-400" />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Search products..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-full leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all text-gray-900 font-semibold"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    {/* ADMIN CONTROL ROOM SHORTCUT */}
                    {session.user && (session.user as any).role === "ADMIN" && (
                      <Link 
                        href="/admin" 
                        className="px-4 py-2 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-600 hover:text-white rounded-full text-xs font-black transition-all flex items-center gap-1 shadow-sm"
                      >
                        Admin Control Room
                      </Link>
                    )}
                    
                    <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full text-xs font-bold text-gray-700">
                      <User size={14} className="text-blue-600" />
                      Hi, {session.user?.name?.split(' ')[0] || 'User'}
                    </div>
                    <button 
                      onClick={() => signOut()}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-100 rounded-full transition-colors"
                      title="Sign Out"
                    >
                      <LogOut size={18} />
                    </button>
                  </div>

                  <button
                    onClick={() => setIsAIOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors font-semibold text-sm shadow-sm"
                  >
                    <Sparkles size={16} />
                    <span className="hidden sm:inline">AI Shopper</span>
                  </button>
                  
                  <button 
                    onClick={() => setIsCartOpen(true)}
                    className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    <ShoppingCart size={24} />
                    {cartCount > 0 && (
                      <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-500 rounded-full">
                        {cartCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </nav>

          {/* SPLIT-HERO BANNER DESIGN FOR PREMIUM VIEWPORT */}
          <div className="bg-gradient-to-tr from-blue-700 to-indigo-800 text-white shadow-inner">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 text-center md:text-left md:flex items-center justify-between">
              <div className="md:w-1/2">
                <span className="px-3 py-1 bg-white/10 text-white border border-white/20 text-xs font-extrabold uppercase tracking-widest rounded-full">
                  Verified Member Club Discount Code: NEXUS26
                </span>
                <h1 className="text-4xl font-black tracking-tight sm:text-5xl md:text-6xl mb-4 mt-3 leading-tight">
                  Summer Tech Sale
                </h1>
                <p className="text-lg md:text-xl text-blue-100 mb-8 max-w-lg mx-auto md:mx-0">
                  Secure premium performance products and modular computer components at special wholesale parameters.
                </p>
                <button className="bg-white text-blue-700 px-8 py-3.5 rounded-full font-extrabold shadow-lg hover:bg-gray-100 transition-colors">
                  Browse Exclusives
                </button>
              </div>
            </div>
          </div>

          {/* MAIN CONTENT - PRODUCT GRID WITH INTERACTIVE FILTERS */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex flex-col gap-6 md:flex-row md:justify-between md:items-center mb-8 border-b border-gray-200 pb-6">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Curated Marketplace Selection</h2>
              
              {/* Category Pills Slider */}
              <div className="flex flex-wrap gap-2">
                {['All', 'Electronics', 'Accessories', 'Furniture', 'Home'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${selectedCategory === cat ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="animate-spin text-blue-600" size={48} />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-500 text-lg">No products found matching your search parameters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredProducts.map((product) => {
                  const cartItem = cart.find((item: any) => item.id === product.id);
                  const inCartQty = cartItem ? cartItem.quantity : 0;
                  const badge = getCardBadge(product.category);

                  return (
                    <div key={product.id} className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 overflow-hidden border border-gray-100 group flex flex-col">
                      <Link href={`/product/${product.id}`} className="relative h-64 overflow-hidden flex-shrink-0 block cursor-pointer">
                        <img 
                          src={product.imageUrl} 
                          alt={product.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {inCartQty > 0 && (
                          <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-black shadow-md flex items-center gap-1">
                            <ShoppingCart size={12} /> {inCartQty} in Cart
                          </div>
                        )}
                        <div className={`absolute top-4 right-4 px-3 py-1 border rounded-full text-[10px] font-black uppercase tracking-wider ${badge.styles}`}>
                          {badge.label}
                        </div>
                      </Link>
                      <div className="p-6 flex flex-col flex-grow">
                        <Link href={`/product/${product.id}`} className="hover:text-blue-600 transition-colors">
                          <h3 className="text-lg font-black text-gray-900 mb-2 truncate" title={product.name}>
                            {product.name}
                          </h3>
                        </Link>
                        <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                          {product.description}
                        </p>
                        <div className="flex items-center justify-between mt-auto">
                          <span className="text-xl font-black text-gray-900">{formatINR(product.price)}</span>
                          
                          {/* INLINE CARD CONTROLLERS (UPDATE 4) */}
                          {inCartQty > 0 ? (
                            <div className="flex items-center bg-blue-50 border border-blue-200 rounded-full p-1 gap-2 shadow-sm">
                              <button 
                                onClick={() => updateQuantity(product.id, -1)}
                                className="p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors active:scale-90"
                              >
                                <Minus size={12} />
                              </button>
                              <span className="text-xs font-black text-blue-800 w-5 text-center">{inCartQty}</span>
                              <button 
                                onClick={() => addToCart(product)}
                                className="p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors active:scale-90"
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => addToCart(product)}
                              className="bg-gray-900 text-white p-2.5 rounded-full hover:bg-blue-600 transition-colors shadow-md active:scale-95"
                            >
                              <Plus size={18} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>

          {/* SLIDE-OVER AI SHOPPER SIDEBAR */}
          {isAIOpen && (
            <div className="fixed inset-0 z-50 overflow-hidden">
              <div className="absolute inset-0 bg-black bg-opacity-50 transition-opacity" onClick={() => setIsAIOpen(false)}></div>
              <div className="fixed inset-y-0 right-0 max-w-full flex">
                <div className="w-screen max-w-md w-full flex flex-col bg-white shadow-2xl h-full animate-in slide-in-from-right duration-300">
                  <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-purple-600 text-white">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                      <Bot size={24} /> ✨ AI Personal Shopper
                    </h2>
                    <button onClick={() => setIsAIOpen(false)} className="text-purple-200 hover:text-white p-2 rounded-full hover:bg-purple-700">
                      <X size={24} />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col gap-4">
                    <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-none p-4 shadow-sm self-start max-w-[90%]">
                      <p className="text-gray-700 text-sm">
                        Hi! I'm your NexusMart AI assistant. Tell me what you're looking for, who you're buying a gift for, or your budget, and I'll find the perfect items!
                      </p>
                    </div>

                    {aiError && (
                      <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm self-center">
                        {aiError}
                      </div>
                    )}

                    {aiResponse && (
                      <div className="bg-white border border-purple-200 rounded-2xl rounded-tl-none p-4 shadow-sm self-start w-full">
                        <p className="text-gray-800 text-sm mb-4 leading-relaxed">{aiResponse.message}</p>
                        <div className="space-y-3">
                          {aiResponse.recommendedIds?.map((id: any) => {
                            const product = safeProducts.find(p => p.id === parseInt(id) || p.id === id);
                            if (!product) return null;
                            return (
                              <div key={product.id} className="flex gap-3 border border-gray-100 p-2 rounded-xl bg-gray-50 items-center hover:bg-white">
                                 <img src={product.imageUrl} alt={product.name} className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
                                 <div className="flex-1 min-w-0">
                                   <h4 className="text-sm font-bold text-gray-900 truncate">{product.name}</h4>
                                   <p className="text-xs text-gray-500 font-medium">{formatINR(product.price)}</p>
                                 </div>
                                 <button onClick={() => addToCart(product)} className="bg-purple-600 text-white p-2 rounded-full hover:bg-purple-700">
                                   <Plus size={16} />
                                 </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {isAiLoading && (
                       <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-none p-4 shadow-sm self-start flex items-center gap-3">
                         <Loader2 className="animate-spin text-purple-600" size={20} />
                         <p className="text-sm text-gray-500">Searching...</p>
                       </div>
                    )}
                  </div>

                  <div className="p-4 bg-white border-t border-gray-200">
                    <form onSubmit={handleAiSubmit} className="flex gap-2 relative">
                      <input
                        type="text"
                        value={aiQuery}
                        onChange={(e) => setAiQuery(e.target.value)}
                        placeholder="e.g. Need a gift under ₹10,000"
                        className="flex-1 border border-gray-300 rounded-full pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50"
                        disabled={isAiLoading}
                      />
                      <button type="submit" disabled={isAiLoading || !aiQuery.trim()} className="absolute right-1 top-1 bottom-1 aspect-square bg-purple-600 text-white rounded-full flex items-center justify-center hover:bg-purple-700 m-1 disabled:opacity-50">
                        <Send size={16} />
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SLIDE-OVER CART SIDEBAR WITH CLASSIC BLUR OVERLAY */}
          {isCartOpen && (
            <div className="fixed inset-0 z-50 overflow-hidden animate-fade-in">
              <div className="absolute inset-0 bg-black/35 backdrop-blur-sm transition-opacity" onClick={() => setIsCartOpen(false)}></div>
              <div className="fixed inset-y-0 right-0 max-w-full flex">
                <div className="w-screen max-w-md w-full flex flex-col bg-white shadow-2xl h-full animate-in slide-in-from-right duration-300">
                  <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <ShoppingCart size={20} /> Your Cart ({cartCount})
                    </h2>
                    <button onClick={() => setIsCartOpen(false)} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100">
                      <X size={24} />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {cart.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <ShoppingCart size={48} className="mb-4 text-gray-300" />
                        <p className="text-lg">Your cart is empty.</p>
                      </div>
                    ) : (
                      cart.map((item: any) => (
                        <div key={item.id} className="flex gap-4 border-b border-gray-100 pb-4">
                          <img src={item.imageUrl} alt={item.name} className="w-20 h-20 object-cover rounded-lg border border-gray-200" />
                          <div className="flex-1 flex flex-col">
                            <div className="flex justify-between mb-1">
                              <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">{item.name}</h3>
                              <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-500">
                                <Trash2 size={16} />
                              </button>
                            </div>
                            <p className="text-sm font-bold text-gray-900 mt-auto">{formatINR(item.price)}</p>
                            <div className="flex items-center gap-3 mt-2">
                              <div className="flex items-center border border-gray-200 rounded-lg">
                                <button onClick={() => updateQuantity(item.id, -1)} className="p-1 text-gray-500 hover:bg-gray-100 rounded-l-lg"><Minus size={14} /></button>
                                <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                                <button onClick={() => updateQuantity(item.id, 1)} className="p-1 text-gray-500 hover:bg-gray-100 rounded-r-lg"><Plus size={14} /></button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {cart.length > 0 && (
                    <div className="border-t border-gray-200 p-4 bg-gray-50">
                      <div className="flex justify-between text-base font-medium text-gray-900 mb-4">
                        <p>Subtotal</p>
                        <p className="font-bold">{formatINR(cartTotal())}</p>
                      </div>
                      
                      <Link 
                        href="/checkout"
                        onClick={() => setIsCartOpen(false)}
                        className="block w-full bg-blue-600 hover:bg-blue-700 text-center rounded-full py-3.5 px-4 text-base font-semibold text-white transition-colors active:scale-95 shadow-md"
                      >
                        Proceed to Secure Checkout
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}