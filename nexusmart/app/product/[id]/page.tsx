"use client";

import React, { useState, useEffect } from 'react';
import { ArrowLeft, ShoppingCart, Truck, Shield, Star, Plus, Minus, X, Trash2, Loader2, MapPin, BadgePercent, CheckCircle } from 'lucide-react';
import { useCartStore } from '../../../lib/store';

export default function ProductPage() {
  const [id, setId] = useState<string | null>(null);
  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Delivery Pin Code States
  const [pinCode, setPinCode] = useState('');
  const [deliveryStatus, setDeliveryStatus] = useState<any>(null);
  const [isPinChecking, setIsPinChecking] = useState(false);

  const { cart, isCartOpen, setIsCartOpen, addToCart, updateQuantity, removeFromCart } = useCartStore();
  const cartTotal = cart.reduce((total: number, item: any) => total + item.price * item.quantity, 0);
  const cartCount = cart.reduce((count: number, item: any) => count + item.quantity, 0);

  const formatINR = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  useEffect(() => {
    const pathParts = window.location.pathname.split('/');
    const extractedId = pathParts[pathParts.length - 1];
    const finalId = extractedId && extractedId !== '[id]' ? extractedId : '1';
    setId(finalId);
    
    const fetchSingleProduct = async () => {
      try {
        const response = await fetch('/api/products');
        if (!response.ok) throw new Error("Failed to fetch");
        const data = await response.json();
        const foundProduct = data.find((p: any) => p.id === parseInt(finalId));
        setProduct(foundProduct || null);
      } catch (error) {
        console.error("Failed to fetch product:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSingleProduct();
  }, []);

  const checkPinCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinCode.trim() || pinCode.length !== 6) {
      setDeliveryStatus({ error: "Please enter a valid 6-digit PIN code." });
      return;
    }

    setIsPinChecking(true);
    setDeliveryStatus(null);

    setTimeout(() => {
      setIsPinChecking(false);
      const isMetropolitan = parseInt(pinCode[0]) <= 4;
      
      if (isMetropolitan) {
        setDeliveryStatus({
          metro: true,
          days: "1-2 Days (Priority Express)",
          cod: "COD Available",
          deliveryCost: "FREE Delivery"
        });
      } else {
        setDeliveryStatus({
          metro: false,
          days: "4-5 Days (Standard Shipping)",
          cod: "COD Available on orders over ₹1,000",
          deliveryCost: "FREE Delivery"
        });
      }
    }, 800);
  };

  const getProductSpecs = (category: string) => {
    const specsMap: any = {
      "Electronics": {
        "Brand": "Nexus Signature",
        "Connectivity": "Bluetooth 5.2 / Hot-Swappable Wired",
        "Battery / Power": "USB Type-C Fast Charge (Up to 40 Hours)",
        "Warranty": "1 Year Manufacturer's Warranty",
        "Box Content": "Premium Item, Charging Cord, Setup Guide, Warranty Certificate"
      },
      "Accessories": {
        "Brand": "Aura Wearables",
        "Water Resistance": "IP68 Dust & Waterproof certified",
        "Material": "Premium space-grade metal alloys / 1000D Canvas",
        "Warranty": "6 Months Limited Domestic Warranty",
        "Box Content": "Main product, Multi-compartment guides, Registration Card"
      },
      "Furniture": {
        "Brand": "UrbanFit Comfort",
        "Frame Material": "Heavy-duty steel reinforced nylon casing",
        "Upholstery": "Anti-sweat breathable premium micro-weave mesh",
        "Max Load Limit": "Tested up to 135 kg",
        "Assembly": "DIY Easy assembly (Video & booklet manual inside)"
      },
      "Home": {
        "Brand": "Handcrafted Indian Artistry",
        "Material": "Natural Organic Lead-Free Ceramic Clay",
        "Finish Type": "Dual-Tone Vitrified Volcanic Ash Glaze",
        "Dishwasher Safe": "Yes, Dishwasher & Microwave Friendly",
        "Craft Origin": "Khurja Pottery Artisans, Uttar Pradesh"
      }
    };
    return specsMap[category] || specsMap["Electronics"];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Product not found</h1>
        <a href="/" className="text-blue-600 hover:underline">Return to Home</a>
      </div>
    );
  }

  const specifications = getProductSpecs(product.category);

  const cartItem = cart.find((item: any) => item.id === product.id);
  const quantityInCart = cartItem ? cartItem.quantity : 0;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      
      {/* SIMPLE NAVBAR FOR PRODUCT PAGE */}
      <nav className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <a href="/" className="flex items-center gap-2 cursor-pointer text-gray-600 hover:text-blue-600 transition-colors">
            <ArrowLeft size={20} />
            <span className="font-semibold hidden sm:inline">Back to Store</span>
          </a>
          <button onClick={() => setIsCartOpen(true)} className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors">
            <ShoppingCart size={24} />
            {cartCount > 0 && (
              <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold text-white transform translate-x-1/4 -translate-y-1/4 bg-red-500 rounded-full">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* PRODUCT DETAILS UI */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row mb-12">
          
          {/* Left Side: Image */}
          <div className="md:w-1/2 bg-gray-100 p-8 flex items-center justify-center">
            <img 
              src={product.imageUrl} 
              alt={product.name} 
              className="max-w-full max-h-[450px] object-cover rounded-2xl shadow-lg hover:scale-105 transition-transform duration-500"
            />
          </div>

          {/* Right Side: Details */}
          <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
            <div className="uppercase tracking-wide text-xs text-blue-600 font-extrabold mb-2 tracking-widest bg-blue-50 px-2.5 py-1 rounded-full w-fit">
              {product.category}
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
              {product.name}
            </h1>
            
            <div className="flex items-center gap-2 mb-4">
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => <Star key={i} size={18} fill="currentColor" />)}
              </div>
              <span className="text-gray-500 text-sm font-semibold bg-gray-100 px-2 py-0.5 rounded">(4.8 Stars out of 1,214 ratings)</span>
            </div>

            <p className="text-4xl font-black text-gray-900 mb-4">
              {formatINR(product.price)}
              <span className="text-sm text-green-600 font-bold ml-3 inline-flex items-center gap-1">
                <BadgePercent size={18} /> Inclusive of all taxes
              </span>
            </p>
            
            <p className="text-gray-600 text-base mb-6 leading-relaxed">
              {product.description}
            </p>

            {/* PIN CODE SHIPPING ESTIMATOR CHECKER */}
            <div className="bg-gray-50 border border-gray-200 p-5 rounded-2xl mb-6">
              <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-1.5">
                <MapPin size={16} className="text-blue-600" /> Delivery & COD Checker
              </h3>
              <form onSubmit={checkPinCode} className="flex gap-2">
                <input 
                  type="text" 
                  maxLength={6}
                  placeholder="Enter 6-digit Pin Code (e.g., 110001)"
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                  className="flex-1 bg-white border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
                <button 
                  type="submit" 
                  disabled={isPinChecking}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-md disabled:opacity-50"
                >
                  {isPinChecking ? "Checking..." : "Check"}
                </button>
              </form>

              {deliveryStatus && (
                <div className="mt-3 text-sm font-medium">
                  {deliveryStatus.error ? (
                    <p className="text-red-600">{deliveryStatus.error}</p>
                  ) : (
                    <div className="space-y-1.5 p-3 bg-white border border-gray-100 rounded-xl">
                      <p className="text-gray-700 flex items-center gap-1">
                        <CheckCircle size={14} className="text-green-500" /> Deliverable to Pincode {pinCode}!
                      </p>
                      <p className="text-gray-500 text-xs">Estimated Delivery: <span className="font-bold text-gray-800">{deliveryStatus.days}</span></p>
                      <p className="text-gray-500 text-xs">Payment Method: <span className="font-bold text-gray-800">{deliveryStatus.cod}</span></p>
                      <p className="text-gray-500 text-xs">Shipping Cost: <span className="font-bold text-green-600">{deliveryStatus.deliveryCost}</span></p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="flex items-center gap-2.5 text-xs font-semibold text-gray-700 bg-gray-50 p-3.5 border border-gray-100 rounded-xl">
                <Truck className="text-blue-600" size={18} />
                <span>Pan-India Swift Dispatch</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs font-semibold text-gray-700 bg-gray-50 p-3.5 border border-gray-100 rounded-xl">
                <Shield className="text-blue-600" size={18} />
                <span>Secure Brand Assured</span>
              </div>
            </div>

            {}
            {quantityInCart > 0 ? (
              <div className="w-full flex items-center justify-between bg-blue-50 border-2 border-blue-200 rounded-2xl p-2 shadow-md">
                <button 
                  onClick={() => updateQuantity(product.id, -1)}
                  className="p-3 bg-blue-600 text-white hover:bg-blue-700 rounded-xl transition-all flex items-center justify-center shadow-md active:scale-95"
                >
                  <Minus size={20} />
                </button>
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">Cart Quantity</span>
                  <span className="text-base font-extrabold text-blue-800">{quantityInCart} Units Selected</span>
                </div>
                <button 
                  onClick={() => addToCart(product)}
                  className="p-3 bg-blue-600 text-white hover:bg-blue-700 rounded-xl transition-all flex items-center justify-center shadow-md active:scale-95"
                >
                  <Plus size={20} />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => addToCart(product)}
                className="w-full bg-blue-600 text-white py-4 rounded-full font-bold text-lg hover:bg-blue-700 hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <ShoppingCart size={24} />
                Add to Shopping Cart
              </button>
            )}
          </div>
        </div>

        {/* DETAILS SPECIFICATIONS TABLE */}
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-gray-100">
          <h2 className="text-xl md:text-2xl font-black text-gray-900 mb-6">Technical Specifications</h2>
          <div className="border border-gray-200 rounded-2xl overflow-hidden divide-y divide-gray-200">
            {Object.entries(specifications).map(([key, value]: any) => (
              <div key={key} className="grid grid-cols-3 p-4 bg-white hover:bg-gray-50 transition-colors">
                <div className="font-bold text-sm text-gray-500 uppercase tracking-wider">{key}</div>
                <div className="col-span-2 text-sm text-gray-800 font-medium">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* SLIDE-OVER CART SIDEBAR */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {}
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
                    <p className="font-bold">{formatINR(cartTotal)}</p>
                  </div>
                  <button className="w-full bg-blue-600 border border-transparent rounded-full py-3 px-4 text-base font-semibold text-white hover:bg-blue-700">
                    Proceed to Checkout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}