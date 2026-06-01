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
  status: string;
  items: OrderItem[];
};

import { useSettings } from '@/contexts/SettingsContext';
import { FiRefreshCcw, FiTrash2, FiEye } from 'react-icons/fi';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { settings } = useSettings();
  const currency = settings?.currency || 'ر.س';

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

  const handleReturnOrder = async (id: number) => {
    if (!confirm('هل أنت متأكد من إرجاع هذه الفاتورة؟ سيتم استعادة المخزون والأرصدة.')) return;
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'RETURNED' })
      });
      if (res.ok) fetchOrders();
      else alert('فشل إرجاع الفاتورة');
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteOrder = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذه الفاتورة نهائياً؟ هذا الإجراء لا يمكن التراجع عنه ولا يستعيد المخزون (صلاحية مدير).')) return;
    try {
      const res = await fetch(`/api/orders/${id}`, { method: 'DELETE' });
      if (res.ok) fetchOrders();
      else alert('فشل حذف الفاتورة. تأكد من أنك تملك صلاحية المدير.');
    } catch (error) {
      console.error(error);
    }
  };

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
                <th className="px-6 py-3 font-medium">الحالة</th>
                <th className="px-6 py-3 font-medium">التاريخ</th>
                <th className="px-6 py-3 font-medium">المنتجات</th>
                <th className="px-6 py-3 font-medium">الإجمالي</th>
                <th className="px-6 py-3 font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map(order => (
                <tr key={order.id} className={`hover:bg-gray-50 align-top ${order.status === 'RETURNED' ? 'bg-red-50 opacity-75' : ''}`}>
                  <td className="px-6 py-4 font-bold text-blue-600">#{order.id}</td>
                  <td className="px-6 py-4">
                    {order.status === 'RETURNED' ? (
                      <span className="px-2 py-1 text-xs font-bold bg-red-100 text-red-600 rounded">مرتجع</span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-bold bg-green-100 text-green-600 rounded">مكتمل</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-500" dir="ltr" style={{textAlign: 'right'}}>
                    {new Date(order.createdAt).toLocaleString('ar-SA')}
                  </td>
                  <td className="px-6 py-4">
                    <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                      {order.items.map(item => (
                        <li key={item.id}>
                          {item.product?.name} <span className="text-gray-400">({item.quantity} × {item.price} {currency})</span>
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-6 py-4 font-bold text-lg text-gray-800">{order.totalAmount.toFixed(2)} {currency}</td>
                  <td className="px-6 py-4 space-x-2 space-x-reverse">
                     {order.status !== 'RETURNED' && (
                        <button
                          onClick={() => handleReturnOrder(order.id)}
                          className="p-2 text-orange-500 hover:bg-orange-50 rounded"
                          title="استرجاع الفاتورة"
                        >
                          <FiRefreshCcw />
                        </button>
                     )}
                     <button
                        onClick={() => handleDeleteOrder(order.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded"
                        title="حذف نهائي"
                      >
                        <FiTrash2 />
                      </button>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">لا توجد طلبات سابقة</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
