"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useCartStore } from '../../lib/store';
import { ArrowLeft, CreditCard, ShieldCheck, MapPin, Truck, CheckCircle2, UserCheck, Smartphone, ShoppingBag, Landmark, Key, Ticket, Clipboard, Printer } from 'lucide-react';
import Link from 'next/link';

export default function CheckoutPage() {
  const { data: session, status } = useSession();
  const { cart, useCartStoreState, cartTotal, clearCart } = useCartStore();
  
  // Checkout Stepper State (1: Address, 2: Payment, 3: Success Confirmation)
  const [step, setStep] = useState(1);

  // Address Form States
  const [addressForm, setAddressForm] = useState({
    name: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    pinCode: '',
  });
  const [formErrors, setFormErrors] = useState<any>({});

  // Payment Selection States
  const [paymentMethod, setPaymentMethod] = useState('UPI'); // UPI, Card, NetBanking, COD
  const [upiId, setUpiId] = useState('');
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvv: '',
    holder: ''
  });
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Order Result States
  const [orderSummary, setOrderSummary] = useState<any>(null);

  // Auto-fill client name from NextAuth session if available
  useEffect(() => {
    if (session?.user?.name) {
      setAddressForm(prev => ({ ...prev, name: session.user.name || '' }));
    }
  }, [session]);

  const formatINR = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  // Helper validation for India coordinates
  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: any = {};
    if (!addressForm.name.trim()) errors.name = "Full Name is required";
    if (!addressForm.phone.match(/^[6-9]\d{9}$/)) errors.phone = "Enter a valid 10-digit Indian Mobile Number";
    if (!addressForm.street.trim()) errors.street = "Detailed street address is required";
    if (!addressForm.city.trim()) errors.city = "City is required";
    if (!addressForm.state.trim()) errors.state = "State is required";
    if (!addressForm.pinCode.match(/^\d{6}$/)) errors.pinCode = "Enter a valid 6-digit postal PIN Code";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setStep(2); // Progress to Payment Screen
  };

  const handlePlaceOrder = async () => {
    // Payment-specific validation mock-ups
    if (paymentMethod === 'UPI' && (!upiId.trim() || !upiId.includes('@'))) {
      setFormErrors({ payment: "Please enter a valid UPI ID (e.g., user@okhdfc)" });
      return;
    }
    if (paymentMethod === 'Card') {
      const cleanCard = cardDetails.number.replace(/\s+/g, '');
      if (cleanCard.length < 16) {
        setFormErrors({ payment: "Please enter a valid 16-digit credit/debit card number" });
        return;
      }
      if (!cardDetails.expiry.includes('/')) {
        setFormErrors({ payment: "Please provide valid expiry details (MM/YY)" });
        return;
      }
      if (cardDetails.cvv.length < 3) {
        setFormErrors({ payment: "Please enter a valid CVV" });
        return;
      }
    }

    setIsSubmittingOrder(true);
    setFormErrors({});

    try {
      const fullAddress = `${addressForm.street}, ${addressForm.city}, ${addressForm.state}`;
      const payload = {
        customerName: addressForm.name,
        shippingAddress: fullAddress,
        phone: addressForm.phone,
        postalCode: addressForm.pinCode,
        paymentMethod: paymentMethod,
        totalAmount: cartTotal(),
        items: cart
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to log order");

      // Successful order execution!
      setOrderSummary(data);
      // Clean cart globally
      clearCart();
      setStep(3); // Progress to Success screen
    } catch (err: any) {
      setFormErrors({ submit: err.message || "Something went wrong. Please check connection and try again." });
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // Helper function to copy tracking codes
  const copyToClipboard = (text: string) => {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500 font-semibold">Validating secure checkout terminal...</p>
        </div>
      </div>
    );
  }

  // Gatekeeper: If not logged in, reject access
  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 px-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md text-center border border-gray-100">
          <ShieldCheck size={64} className="text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-black text-gray-900 mb-2">Member Authentication Needed</h1>
          <p className="text-gray-500 text-sm mb-6">Please log in to your account to utilize our integrated secure checkout pipelines.</p>
          <Link href="/login" className="block w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold transition-all shadow-md">
            Sign In & Return
          </Link>
        </div>
      </div>
    );
  }

  // Cart Gatekeeper: If cart has no items and we aren't in Success stage
  if (cart.length === 0 && step !== 3) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 px-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md text-center border border-gray-100">
          <ShoppingBag size={64} className="text-blue-500 mx-auto mb-4" />
          <h1 className="text-2xl font-black text-gray-900 mb-2">Your Cart is Empty</h1>
          <p className="text-gray-500 text-sm mb-6">Please add tech products to your shopping cart before initiating checkout operations.</p>
          <Link href="/" className="block w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold transition-all shadow-md">
            Return to Store
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-16">
      
      {/* Header Banner */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors">
            <ArrowLeft size={18} />
            <span className="font-bold text-sm">Cancel & Return</span>
          </Link>
          <div className="font-bold text-lg tracking-tight">
            NexusMart <span className="text-blue-600">Checkout Terminal</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold bg-green-50 border border-green-200 text-green-700 px-3 py-1.5 rounded-full">
            <ShieldCheck size={14} /> Encrypted Session
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* STEPPER METERS */}
        {step < 3 && (
          <div className="max-w-3xl mx-auto mb-10 flex items-center justify-center">
            <div className="flex items-center w-full max-w-xs justify-between relative">
              <div className="flex flex-col items-center z-10">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step >= 1 ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-500'}`}>1</div>
                <span className="text-xs font-bold mt-1 text-gray-600">Shipping</span>
              </div>
              <div className={`flex-1 h-0.5 mx-2 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'} transition-all`}></div>
              <div className="flex flex-col items-center z-10">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step >= 2 ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-500'}`}>2</div>
                <span className="text-xs font-bold mt-1 text-gray-600">Payment</span>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT AREA: INTERACTIVE FORMS */}
          <div className="lg:col-span-8">
            
            {/* STEP 1: SHIPPING DETAILS FORM */}
            {step === 1 && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-gray-100">
                <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
                  <MapPin className="text-blue-600" size={22} /> Enter Delivery Address Details
                </h2>

                <form onSubmit={handleAddressSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-extrabold text-gray-600 uppercase tracking-widest mb-1.5">Recipient Full Name</label>
                      <input 
                        type="text"
                        value={addressForm.name}
                        onChange={(e) => setAddressForm({...addressForm, name: e.target.value})}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-semibold"
                        placeholder="Recipient's Name"
                      />
                      {formErrors.name && <p className="text-red-500 text-xs font-bold mt-1">{formErrors.name}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold text-gray-600 uppercase tracking-widest mb-1.5">10-Digit Mobile Number</label>
                      <input 
                        type="tel"
                        maxLength={10}
                        value={addressForm.phone}
                        onChange={(e) => setAddressForm({...addressForm, phone: e.target.value.replace(/\D/g, '')})}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-semibold"
                        placeholder="Mobile Number"
                      />
                      {formErrors.phone && <p className="text-red-500 text-xs font-bold mt-1">{formErrors.phone}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-gray-600 uppercase tracking-widest mb-1.5">Detailed Delivery Street Address</label>
                    <input 
                      type="text"
                      value={addressForm.street}
                      onChange={(e) => setAddressForm({...addressForm, street: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-semibold"
                      placeholder="House No, Apartment Name, Street Name"
                    />
                    {formErrors.street && <p className="text-red-500 text-xs font-bold mt-1">{formErrors.street}</p>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div>
                      <label className="block text-xs font-extrabold text-gray-600 uppercase tracking-widest mb-1.5">City</label>
                      <input 
                        type="text"
                        value={addressForm.city}
                        onChange={(e) => setAddressForm({...addressForm, city: e.target.value})}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-semibold"
                        placeholder="City"
                      />
                      {formErrors.city && <p className="text-red-500 text-xs font-bold mt-1">{formErrors.city}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold text-gray-600 uppercase tracking-widest mb-1.5">State</label>
                      <input 
                        type="text"
                        value={addressForm.state}
                        onChange={(e) => setAddressForm({...addressForm, state: e.target.value})}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-semibold"
                        placeholder="State"
                      />
                      {formErrors.state && <p className="text-red-500 text-xs font-bold mt-1">{formErrors.state}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold text-gray-600 uppercase tracking-widest mb-1.5">Indian PIN Code</label>
                      <input 
                        type="text"
                        maxLength={6}
                        value={addressForm.pinCode}
                        onChange={(e) => setAddressForm({...addressForm, pinCode: e.target.value.replace(/\D/g, '')})}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-semibold"
                        placeholder="6-digit PIN Code"
                      />
                      {formErrors.pinCode && <p className="text-red-500 text-xs font-bold mt-1">{formErrors.pinCode}</p>}
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold transition-all shadow-md mt-6 active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    Continue to Payment Options
                  </button>
                </form>
              </div>
            )}

            {/* STEP 2: PAYMENT METHOD VIEW */}
            {step === 2 && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-gray-100">
                <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-6">
                  <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                    <CreditCard className="text-blue-600" size={22} /> Select Secure Payment Method
                  </h2>
                  <button 
                    onClick={() => setStep(1)}
                    className="text-xs font-bold text-blue-600 hover:underline"
                  >
                    Edit Shipping Info
                  </button>
                </div>

                {/* Quick Info Block */}
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3 text-blue-800 text-xs font-medium mb-6">
                  <Truck size={18} className="flex-shrink-0" />
                  <p>Shipping to <span className="font-bold">{addressForm.name}</span>, PIN: {addressForm.pinCode}. Expected Delivery in 1-4 Days.</p>
                </div>

                {/* Grid of Options */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                  {[
                    { id: 'UPI', label: 'UPI QR / ID', desc: 'GPay, PhonePe, Paytm', icon: Smartphone },
                    { id: 'Card', label: 'Credit/Debit', desc: 'Visa, Master, RuPay', icon: CreditCard },
                    { id: 'NetBanking', label: 'Net Banking', desc: 'Direct Bank Gateway', icon: Landmark },
                    { id: 'COD', label: 'Cash / Pay on Delivery', desc: 'Secure cash at door', icon: Truck },
                  ].map((opt) => {
                    const IconComp = opt.icon;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => {
                          setPaymentMethod(opt.id);
                          setFormErrors({});
                        }}
                        className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between h-32 active:scale-95 ${paymentMethod === opt.id ? 'border-2 border-blue-600 bg-blue-50/50 shadow-md' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                      >
                        <div className={`p-2 rounded-xl w-fit ${paymentMethod === opt.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                          <IconComp size={18} />
                        </div>
                        <div>
                          <p className="font-extrabold text-xs text-gray-800">{opt.label}</p>
                          <p className="text-[10px] text-gray-400 font-medium leading-tight mt-0.5">{opt.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Sub Forms for Payment Method Simulators */}
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 mb-6">
                  {paymentMethod === 'UPI' && (
                    <div>
                      <h3 className="font-bold text-sm text-gray-800 mb-1">Enter your Virtual UPI ID</h3>
                      <p className="text-xs text-gray-500 mb-4">You will receive a collection request on your verified banking interface.</p>
                      <input 
                        type="text"
                        placeholder="e.g. username@okhdfc"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-semibold"
                      />
                    </div>
                  )}

                  {paymentMethod === 'Card' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">16-Digit Card Number</label>
                        <input 
                          type="text"
                          maxLength={19}
                          placeholder="XXXX XXXX XXXX XXXX"
                          value={cardDetails.number}
                          onChange={(e) => setCardDetails({...cardDetails, number: e.target.value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim()})}
                          className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-semibold"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Expiry Details</label>
                          <input 
                            type="text"
                            maxLength={5}
                            placeholder="MM/YY"
                            value={cardDetails.expiry}
                            onChange={(e) => setCardDetails({...cardDetails, expiry: e.target.value})}
                            className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">CVV Security Code</label>
                          <input 
                            type="password"
                            maxLength={3}
                            placeholder="***"
                            value={cardDetails.cvv}
                            onChange={(e) => setCardDetails({...cardDetails, cvv: e.target.value.replace(/\D/g, '')})}
                            className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-semibold"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'NetBanking' && (
                    <div>
                      <h3 className="font-bold text-sm text-gray-800 mb-2">Select Preferred Bank Gateway</h3>
                      <select className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-semibold">
                        <option>State Bank of India (SBI)</option>
                        <option>HDFC Bank</option>
                        <option>ICICI Bank</option>
                        <option>Axis Bank</option>
                        <option>Punjab National Bank</option>
                      </select>
                    </div>
                  )}

                  {paymentMethod === 'COD' && (
                    <div className="flex gap-3 text-gray-700 text-sm font-medium">
                      <CheckCircle2 className="text-green-500 flex-shrink-0 mt-0.5" />
                      <p>No immediate payment required! Cash or Card payment options will be offered at your doorstep by our priority courier executive.</p>
                    </div>
                  )}
                </div>

                {formErrors.payment && <p className="text-red-500 text-xs font-black text-center mb-4">{formErrors.payment}</p>}
                {formErrors.submit && <p className="text-red-500 text-xs font-black text-center mb-4">{formErrors.submit}</p>}

                <button 
                  onClick={handlePlaceOrder}
                  disabled={isSubmittingOrder}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-4 rounded-xl font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5"
                >
                  {isSubmittingOrder ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Processing Secure Payment Transaction...
                    </>
                  ) : (
                    `Authorize & Place Order: ${formatINR(cartTotal())}`
                  )}
                </button>
              </div>
            )}

            {/* STEP 3: ORDER COMPLETED SUCCESSFULLY */}
            {step === 3 && orderSummary && (
              <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-gray-100 max-w-2xl mx-auto">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                    <CheckCircle2 size={40} />
                  </div>
                  <h1 className="text-3xl font-black text-gray-900 mb-2">Order Confirmed!</h1>
                  <p className="text-gray-500 text-sm">Thank you for your order, {addressForm.name}. Your priority tech package has been scheduled for packaging.</p>
                </div>

                {/* Tracking & ID Panel */}
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 mb-8 space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Unique Customer ID</p>
                      <p className="font-extrabold text-xs text-gray-700">{orderSummary.customerId}</p>
                    </div>
                    <button 
                      onClick={() => copyToClipboard(orderSummary.customerId)}
                      className="text-gray-400 hover:text-blue-600 transition-colors"
                      title="Copy Customer ID"
                    >
                      <Clipboard size={16} />
                    </button>
                  </div>

                  <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Tracking Reference Code</p>
                      <p className="font-black text-sm text-blue-600">{orderSummary.trackingId}</p>
                    </div>
                    <button 
                      onClick={() => copyToClipboard(orderSummary.trackingId)}
                      className="text-gray-400 hover:text-blue-600 transition-colors"
                      title="Copy Tracking ID"
                    >
                      <Clipboard size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Order Status</p>
                      <span className="inline-block mt-1 text-xs font-bold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">{orderSummary.orderStatus}</span>
                    </div>
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Payment Channel</p>
                      <p className="text-xs font-extrabold text-gray-700 mt-1 uppercase">{paymentMethod}</p>
                    </div>
                  </div>
                </div>

                {/* Delivery and Print Options */}
                <div className="space-y-4">
                  <div className="flex gap-3 text-xs text-gray-500 font-medium">
                    <Truck size={18} className="text-blue-600 flex-shrink-0" />
                    <p>Dispatch parameters mapped. Tracking will go live on our nodes within 12 hours. A tracking link is sent to <span className="font-semibold text-gray-800">{session?.user?.email}</span>.</p>
                  </div>

                  <div className="flex gap-3 pt-6 border-t border-gray-100">
                    <button 
                      onClick={() => window.print()}
                      className="flex-1 py-3 border border-gray-300 hover:bg-gray-50 rounded-xl font-bold text-sm transition-all text-gray-700 flex items-center justify-center gap-1.5"
                    >
                      <Printer size={16} /> Print Receipt / Invoice
                    </button>
                    <Link 
                      href="/" 
                      className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all text-center flex items-center justify-center"
                    >
                      Return to Storefront
                    </Link>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* RIGHT AREA: STICKY INVOICE BREAKDOWN (Only visible on Step 1 and Step 2) */}
          {step < 3 && (
            <div className="lg:col-span-4 bg-white rounded-3xl p-6 shadow-xl border border-gray-100 lg:sticky lg:top-24">
              <h3 className="font-extrabold text-base text-gray-900 mb-4 pb-3 border-b border-gray-100">Order Invoice Receipt</h3>
              
              {/* Order Items List */}
              <div className="space-y-4 max-h-52 overflow-y-auto pr-1 mb-6">
                {cart.map((item: any) => (
                  <div key={item.id} className="flex gap-3 items-center">
                    <img src={item.imageUrl} alt={item.name} className="w-12 h-12 object-cover rounded-lg border border-gray-200" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-gray-900 truncate">{item.name}</h4>
                      <p className="text-[10px] text-gray-400 font-semibold">{item.quantity} Unit(s) x {formatINR(item.price)}</p>
                    </div>
                    <span className="text-xs font-bold text-gray-900 flex-shrink-0">{formatINR(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              {/* Price Calculation Fields */}
              <div className="space-y-3 pt-4 border-t border-gray-100 text-xs font-medium text-gray-500">
                <div className="flex justify-between">
                  <p>Cart Subtotal</p>
                  <p className="font-bold text-gray-800">{formatINR(cartTotal())}</p>
                </div>
                <div className="flex justify-between">
                  <p>Indian GST (Tax inclusive)</p>
                  <p className="font-bold text-green-600">₹0 (Included)</p>
                </div>
                <div className="flex justify-between">
                  <p>Priority Shipping Charges</p>
                  <p className="font-bold text-green-600">FREE</p>
                </div>
                <div className="flex justify-between text-base font-extrabold text-gray-900 pt-3 border-t border-dashed border-gray-200">
                  <p>Grand Total Due</p>
                  <p className="text-blue-600">{formatINR(cartTotal())}</p>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}