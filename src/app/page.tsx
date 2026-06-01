'use client';

import { useState, useEffect, useRef } from 'react';
import { FiTrash2, FiPlus, FiMinus, FiShoppingBag, FiCheckCircle, FiX, FiPrinter, FiSearch } from 'react-icons/fi';
import Image from 'next/image';
import { useSettings } from '@/contexts/SettingsContext';
import Receipt from '@/components/Receipt';

type Product = {
  id: number;
  name: string;
  price: number;
  stock: number;
  unit?: string;
  type?: string;
  barcode?: string | null;
  imageUrl?: string | null;
};

type CartItem = Product & {
  quantity: number;
};

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastOrder, setLastOrder] = useState<any>(null);
  const [barcodeInput, setBarcodeInput] = useState('');
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const [shift, setShift] = useState<any>(null);
  const [startCash, setStartCash] = useState('');
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcInput, setCalcInput] = useState('');

  // Checkout Modal State
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [orderType, setOrderType] = useState('TAKEAWAY');
  const [paymentType, setPaymentType] = useState('CASH');
  const [customerId, setCustomerId] = useState('');
  const [deliveryWorkerId, setDeliveryWorkerId] = useState('');
  const [deliveryFee, setDeliveryFee] = useState('');

  const [customers, setCustomers] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);

  const { settings } = useSettings();
  const currency = settings?.currency || 'ر.س';

  const fetchProducts = async () => {
    try {
      const [res, catRes] = await Promise.all([
         fetch('/api/products'),
         fetch('/api/categories')
      ]);
      const data = await res.json();
      const catData = await catRes.json();
      setProducts(data.filter((p: Product) => p.type !== 'INGREDIENT'));
      setCategories(catData);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchShift();
    fetchCustomersAndWorkers();
  }, []);

  const filteredProducts = selectedCategory
    ? products.filter(p => (p as any).categoryId === selectedCategory)
    : products;

  const fetchCustomersAndWorkers = async () => {
    try {
      const [cRes, wRes] = await Promise.all([
        fetch('/api/customers'),
        fetch('/api/delivery')
      ]);
      if(cRes.ok) setCustomers(await cRes.json());
      if(wRes.ok) setWorkers(await wRes.json());
    } catch (e) {
      console.error("Failed to load CRM data");
    }
  };

  const fetchShift = async () => {
    try {
      const res = await fetch('/api/shifts');
      const data = await res.json();
      setShift(data);
    } catch (error) {
      console.error('Failed to fetch shift status');
    }
  };

  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'OPEN', startCash: parseFloat(startCash) || 0 })
      });
      if (res.ok) fetchShift();
    } catch (error) {
      console.error(error);
    }
  };

  const handleCloseShift = async () => {
    if(!confirm('هل أنت متأكد من إنهاء الوردية الحالية؟')) return;
    try {
      const res = await fetch('/api/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CLOSE', endCash: 0 }) // For full feature, would ask for actual end cash
      });
      if (res.ok) fetchShift();
    } catch (error) {
      console.error(error);
    }
  };

  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === product.id);
      if (existing) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: number) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity < 1) return;
    setCart((prevCart) =>
      prevCart.map((item) => (item.id === productId ? { ...item, quantity } : item))
    );
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const initiateCheckout = () => {
    if (cart.length === 0) return;
    setShowCheckoutModal(true);
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    const finalTotal = total + (parseFloat(deliveryFee) || 0);

    const orderData = {
      totalAmount: finalTotal,
      type: orderType,
      paymentType,
      customerId: customerId || null,
      deliveryWorkerId: orderType === 'DELIVERY' ? deliveryWorkerId || null : null,
      deliveryFee: orderType === 'DELIVERY' ? parseFloat(deliveryFee) || 0 : 0,
      items: cart.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        price: item.price
      }))
    };

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      if (res.ok) {
        const orderResponse = await res.json();
        setLastOrder({
          id: orderResponse.id,
          items: [...cart],
          total: finalTotal,
          date: new Date().toLocaleString('ar-SA')
        });
        setShowCheckoutModal(false);
        setShowReceipt(true);
        setCart([]);
        setOrderType('TAKEAWAY');
        setPaymentType('CASH');
        setCustomerId('');
        setDeliveryWorkerId('');
        setDeliveryFee('');
        fetchProducts(); // Refresh stock
      } else {
        alert('حدث خطأ أثناء إتمام الطلب.');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('حدث خطأ أثناء إتمام الطلب.');
    }
  };

  const printReceipt = () => {
    window.print();
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput) return;

    // First try finding by barcode, then by exact name
    const foundProduct = products.find(p =>
      p.barcode === barcodeInput || p.name.toLowerCase() === barcodeInput.toLowerCase()
    );

    if (foundProduct) {
      addToCart(foundProduct);
      setBarcodeInput(''); // clear input
    } else {
      alert('المنتج غير موجود');
    }

    // Keep focus for next scan
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  };

  // Keep scanner input focused when clicking anywhere outside inputs
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && target.tagName !== 'SELECT' && barcodeInputRef.current) {
        barcodeInputRef.current.focus();
      }
    };
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);

  if (loading || !shift) return <div className="p-8 text-center text-xl">جاري التحميل...</div>;

  if (shift.status === 'CLOSED') {
    return (
      <main className="flex h-full items-center justify-center bg-slate-50">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <div className="bg-indigo-100 text-indigo-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiCheckCircle className="text-3xl" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">بدء وردية جديدة</h2>
          <p className="text-slate-500 mb-8">يجب عليك فتح وردية جديدة لبدء المبيعات واستقبال الطلبات.</p>
          <form onSubmit={handleOpenShift} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 text-right">النقدية الافتتاحية في الدرج</label>
              <input
                type="number"
                required
                value={startCash}
                onChange={e => setStartCash(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-left"
                dir="ltr"
                placeholder="0.00"
              />
            </div>
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl shadow-md transition-all">
              فتح الوردية الآن
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="flex h-full overflow-hidden bg-slate-50 text-slate-900">
      {/* Products Section */}
      <section className="flex-1 p-8 overflow-y-auto">
        <header className="mb-8 flex justify-between items-end">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-slate-800">المنتجات</h1>
              <button onClick={() => setShowCalculator(true)} className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center transition-colors">
                🖩 آلة حاسبة
              </button>
              <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span> وردية مفتوحة
              </span>
              <button onClick={handleCloseShift} className="text-xs text-rose-500 hover:text-rose-700 underline font-medium">إنهاء الوردية</button>
            </div>
            <p className="text-slate-500 mt-1">اختر المنتجات لإضافتها إلى السلة أو امسح الباركود</p>
          </div>
          <form onSubmit={handleBarcodeSubmit} className="relative w-72">
            <input
              ref={barcodeInputRef}
              type="text"
              autoFocus
              placeholder="امسح الباركود أو ابحث..."
              className="w-full pl-4 pr-12 py-3 bg-white border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none text-left"
              dir="ltr"
              value={barcodeInput}
              onChange={e => setBarcodeInput(e.target.value)}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
               <FiSearch className="text-xl" />
            </div>
            <button type="submit" className="hidden">بحث</button>
          </form>
        </header>

        {/* Categories Bar */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-4 hide-scrollbar">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-6 py-3 rounded-full font-bold whitespace-nowrap transition-all ${
              selectedCategory === null
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            الكل
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-6 py-3 rounded-full font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-300">
            لا توجد منتجات حالياً.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="bg-white p-4 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 flex flex-col items-center text-center gap-3 transform hover:-translate-y-1 group"
              >
                <div className="w-24 h-24 bg-indigo-50/50 rounded-xl flex items-center justify-center mb-1 overflow-hidden relative group-hover:bg-indigo-100 transition-colors border border-indigo-50">
                  {product.imageUrl ? (
                     // eslint-disable-next-line @next/next/no-img-element
                     <img src={product.imageUrl} alt={product.name} className="object-cover w-full h-full" />
                  ) : (
                    <span className="text-indigo-400 text-4xl font-bold">{product.name.charAt(0)}</span>
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-between w-full">
                  <h3 className="font-bold text-slate-700 line-clamp-2 text-sm mb-1">{product.name}</h3>
                  <div>
                    <p className="text-indigo-600 font-black text-lg">{product.price} {currency}</p>
                    <p className={`text-xs mt-1 font-medium ${product.stock < 10 ? 'text-rose-500' : 'text-slate-400'}`}>المخزون: {product.stock}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Cart Section */}
      <aside className="w-[400px] bg-white border-r border-slate-200 flex flex-col shadow-2xl z-10 relative">
        <header className="p-6 border-b border-slate-100 bg-white flex items-center gap-3">
          <div className="bg-indigo-100 p-2.5 rounded-xl text-indigo-600">
            <FiShoppingBag className="text-2xl" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">سلة المشتريات</h2>
        </header>

        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 bg-slate-50/50">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-60">
               <FiShoppingBag className="text-6xl mb-4" />
               <p className="text-lg font-medium">السلة فارغة حالياً</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex justify-between items-center p-4 bg-white rounded-2xl shadow-sm border border-slate-100 hover:border-indigo-100 transition-colors">
                <div className="flex-1">
                  <h4 className="font-bold text-slate-800">{item.name}</h4>
                  <div className="text-indigo-600 font-bold mt-1">{item.price} {currency}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center bg-slate-50 rounded-lg border border-slate-200">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors rounded-r-lg"
                    >
                      <FiMinus />
                    </button>
                    <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors rounded-l-lg"
                    >
                      <FiPlus />
                    </button>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-slate-300 hover:text-rose-500 p-2 rounded-full hover:bg-rose-50 transition-colors"
                  >
                    <FiTrash2 className="text-lg" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <footer className="p-6 bg-white border-t border-slate-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)] print:hidden">
          <div className="flex justify-between items-center mb-6 bg-slate-50 p-4 rounded-xl">
            <span className="text-slate-600 font-bold">الإجمالي المطلوب:</span>
            <span className="text-3xl font-black text-indigo-700">{total.toFixed(2)} {currency}</span>
          </div>
          <button
            onClick={initiateCheckout}
            disabled={cart.length === 0}
            className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-200 flex items-center justify-center gap-2 ${
              cart.length > 0
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/40 transform active:scale-[0.98]'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <FiCheckCircle className="text-xl" />
            إتمام عملية الدفع
          </button>
        </footer>
      </aside>

      {/* Checkout Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-lg w-full">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
              <h3 className="font-bold text-2xl text-slate-800 tracking-tight">إتمام الطلب</h3>
              <button onClick={() => setShowCheckoutModal(false)} className="text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full p-2 transition-colors">
                <FiX className="text-xl" />
              </button>
            </div>

            <form onSubmit={handleCheckout} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">نوع الطلب</label>
                  <select
                    value={orderType}
                    onChange={e => {
                        setOrderType(e.target.value);
                        if (e.target.value !== 'DELIVERY') {
                            setDeliveryFee('');
                            setDeliveryWorkerId('');
                        }
                    }}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="TAKEAWAY">سفري (Takeaway)</option>
                    <option value="DELIVERY">توصيل (Delivery)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">طريقة الدفع</label>
                  <select value={paymentType} onChange={e => setPaymentType(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option value="CASH">نقدي (Cash)</option>
                    <option value="CARD">بطاقة (Card)</option>
                    <option value="DEBT">آجل / دين (Debt)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">العميل (اختياري)</label>
                <select required={paymentType === 'DEBT'} value={customerId} onChange={e => setCustomerId(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="">-- اختر العميل --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} {c.phone ? `- ${c.phone}` : ''}</option>
                  ))}
                </select>
                {paymentType === 'DEBT' && <p className="text-xs text-rose-500 mt-1">يجب اختيار العميل عند الدفع الآجل لإضافة المديونية لحسابه.</p>}
              </div>

              {orderType === 'DELIVERY' && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">مندوب التوصيل</label>
                    <select required value={deliveryWorkerId} onChange={e => setDeliveryWorkerId(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none">
                      <option value="">-- اختر المندوب --</option>
                      {workers.map(w => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">رسوم التوصيل</label>
                    <input type="number" required value={deliveryFee} onChange={e => setDeliveryFee(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-left" dir="ltr" />
                  </div>
                </div>
              )}

              <div className="pt-6 border-t border-slate-100">
                 <div className="flex justify-between items-center mb-6 text-xl">
                    <span className="text-slate-600 font-bold">الإجمالي النهائي:</span>
                    <span className="font-black text-indigo-700">{(total + (parseFloat(deliveryFee) || 0)).toFixed(2)} {currency}</span>
                 </div>
                 <button type="submit" className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg shadow-md transition-colors">
                    تأكيد الطلب
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Calculator Modal */}
      {showCalculator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm print:hidden">
          <div className="bg-slate-800 p-6 rounded-3xl shadow-2xl w-80 relative">
            <div className="flex justify-between items-center mb-4 text-white">
              <h3 className="font-bold text-lg">آلة حاسبة</h3>
              <button onClick={() => setShowCalculator(false)} className="text-slate-400 hover:text-white transition-colors">
                <FiX className="text-xl" />
              </button>
            </div>

            <div className="bg-slate-900 rounded-xl p-4 mb-4 text-right overflow-hidden break-all min-h-[80px] flex flex-col justify-end">
              <div className="text-3xl font-mono text-white tracking-wider">{calcInput || '0'}</div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {['C', '(', ')', '/', '7', '8', '9', '*', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', '⌫', '='].map((btn) => (
                <button
                  key={btn}
                  onClick={() => {
                    if (btn === 'C') setCalcInput('');
                    else if (btn === '⌫') setCalcInput(prev => prev.slice(0, -1));
                    else if (btn === '=') {
                      try {
                        // Safe evaluation for simple math
                        // eslint-disable-next-line no-new-func
                        const result = new Function('return ' + calcInput)();
                        setCalcInput(String(Number.isFinite(result) ? result : 'Error'));
                      } catch (e) {
                        setCalcInput('Error');
                      }
                    } else {
                      if (calcInput === 'Error') setCalcInput(btn);
                      else setCalcInput(prev => prev + btn);
                    }
                  }}
                  className={`p-4 rounded-xl text-xl font-bold transition-colors ${
                    btn === '=' ? 'bg-indigo-600 hover:bg-indigo-500 text-white' :
                    ['/', '*', '-', '+'].includes(btn) ? 'bg-orange-500 hover:bg-orange-400 text-white' :
                    btn === 'C' || btn === '⌫' ? 'bg-rose-500 hover:bg-rose-400 text-white' :
                    'bg-slate-700 hover:bg-slate-600 text-white'
                  }`}
                >
                  {btn}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && lastOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm print:bg-white print:backdrop-blur-none">
          <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-md w-full relative print:shadow-none print:p-0">
            {/* Modal Controls (Hidden in Print) */}
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-100 print:hidden">
              <h3 className="font-bold text-lg text-slate-800">تمت العملية بنجاح!</h3>
              <button
                onClick={() => setShowReceipt(false)}
                className="text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full p-2 transition-colors"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            {/* The Actual Receipt */}
            <div className="print-area">
              <Receipt items={lastOrder.items} total={lastOrder.total} orderId={lastOrder.id} date={lastOrder.date} />
            </div>

            {/* Print Button (Hidden in Print) */}
            <div className="mt-6 pt-4 border-t border-slate-100 print:hidden">
              <button
                onClick={printReceipt}
                className="w-full flex justify-center items-center gap-2 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-colors"
              >
                <FiPrinter className="text-lg" />
                طباعة الفاتورة
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
