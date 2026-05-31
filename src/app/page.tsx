'use client';

import { useState, useEffect } from 'react';

type Product = {
  id: number;
  name: string;
  price: number;
  stock: number;
};

type CartItem = Product & {
  quantity: number;
};

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error('Failed to fetch products', error);
    } finally {
      setLoading(false);
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

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    const orderData = {
      totalAmount: total,
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
        alert('تمت عملية الدفع بنجاح!');
        setCart([]);
        fetchProducts(); // Refresh stock
      } else {
        alert('حدث خطأ أثناء إتمام الطلب.');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('حدث خطأ أثناء إتمام الطلب.');
    }
  };

  if (loading) return <div className="p-8 text-center text-xl">جاري التحميل...</div>;

  return (
    <main className="flex h-screen overflow-hidden bg-gray-50 text-gray-900">
      {/* Products Section */}
      <section className="flex-1 p-6 overflow-y-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">المنتجات</h1>
          <p className="text-gray-500">اختر المنتجات لإضافتها إلى السلة</p>
        </header>

        {products.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            لا توجد منتجات. الرجاء إضافة منتجات من قاعدة البيانات.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 flex flex-col items-center text-center gap-2"
              >
                <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center text-2xl font-bold mb-2">
                  {product.name.charAt(0)}
                </div>
                <h3 className="font-semibold">{product.name}</h3>
                <p className="text-blue-600 font-bold">{product.price} ر.س</p>
                <p className="text-xs text-gray-400">المخزون: {product.stock}</p>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Cart Section */}
      <aside className="w-96 bg-white border-r border-gray-200 flex flex-col shadow-lg z-10">
        <header className="p-6 border-b border-gray-100 bg-gray-50">
          <h2 className="text-2xl font-bold text-gray-800">سلة المشتريات</h2>
        </header>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {cart.length === 0 ? (
            <div className="text-center text-gray-400 mt-20">السلة فارغة</div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-800">{item.name}</h4>
                  <div className="text-blue-600 font-bold text-sm">{item.price} ر.س</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-white rounded-md border border-gray-200 shadow-sm">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors rounded-r-md"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors rounded-l-md"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <footer className="p-6 bg-gray-50 border-t border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <span className="text-gray-600 font-medium">الإجمالي:</span>
            <span className="text-3xl font-bold text-gray-900">{total.toFixed(2)} ر.س</span>
          </div>
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
              cart.length > 0
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            إتمام الدفع
          </button>
        </footer>
      </aside>
    </main>
  );
}
