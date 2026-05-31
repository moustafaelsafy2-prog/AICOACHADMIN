'use client';

import { useState, useEffect } from 'react';

type OrderItem = {
  id: number;
  product: { name: string };
  quantity: number;
  price: number;
};

type Order = {
  id: number;
  totalAmount: number;
  createdAt: string;
  items: OrderItem[];
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        setOrders(await res.json());
      }
    } catch (error) {
      console.error('Failed to fetch orders', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  if (loading) return <div className="p-8 text-center">جاري التحميل...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">سجل المبيعات</h1>
          <p className="text-gray-500 mt-2">عرض جميع الطلبات السابقة وتفاصيلها</p>
        </div>
      </header>

      {/* Orders Table */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50">
          <h2 className="text-xl font-bold">قائمة الطلبات</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-6 py-3 font-medium">رقم الطلب</th>
                <th className="px-6 py-3 font-medium">التاريخ</th>
                <th className="px-6 py-3 font-medium">المنتجات</th>
                <th className="px-6 py-3 font-medium">الإجمالي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map(order => (
                <tr key={order.id} className="hover:bg-gray-50 align-top">
                  <td className="px-6 py-4 font-bold text-blue-600">#{order.id}</td>
                  <td className="px-6 py-4 text-gray-500" dir="ltr" style={{textAlign: 'right'}}>
                    {new Date(order.createdAt).toLocaleString('ar-SA')}
                  </td>
                  <td className="px-6 py-4">
                    <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                      {order.items.map(item => (
                        <li key={item.id}>
                          {item.product?.name} <span className="text-gray-400">({item.quantity} × {item.price} ر.س)</span>
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-6 py-4 font-bold text-lg">{order.totalAmount.toFixed(2)} ر.س</td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">لا توجد طلبات سابقة</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
