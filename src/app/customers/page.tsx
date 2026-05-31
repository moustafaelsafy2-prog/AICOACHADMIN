'use client';

import { useState, useEffect } from 'react';
import { useSettings } from '@/contexts/SettingsContext';

type Customer = {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  balance: number;
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '' });
  const { settings } = useSettings();
  const currency = settings?.currency || 'ر.س';

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      if (res.ok) setCustomers(await res.json());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCustomer),
      });
      if (res.ok) {
        setNewCustomer({ name: '', phone: '', email: '' });
        fetchCustomers();
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">جاري التحميل...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 pb-20">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">إدارة العملاء</h1>
        <p className="text-slate-500 mt-1">تسجيل العملاء ومتابعة الديون والمبيعات الآجلة</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add Customer Form */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-1 h-fit">
          <h2 className="text-xl font-bold mb-6 text-indigo-900 border-b pb-4">إضافة عميل جديد</h2>
          <form onSubmit={handleAddCustomer} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">اسم العميل</label>
              <input required type="text" value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">رقم الهاتف (اختياري)</label>
              <input type="tel" dir="ltr" value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-left" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">البريد الإلكتروني (اختياري)</label>
              <input type="email" dir="ltr" value={newCustomer.email} onChange={e => setNewCustomer({...newCustomer, email: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-left" />
            </div>
            <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-md hover:bg-indigo-700 transition-all mt-4">تسجيل العميل</button>
          </form>
        </section>

        {/* Customers Table */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 lg:col-span-2 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50">
            <h2 className="text-xl font-bold text-slate-800">سجل العملاء</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-slate-50/50 text-slate-500 text-sm">
                <tr>
                  <th className="px-6 py-4 font-bold">الاسم</th>
                  <th className="px-6 py-4 font-bold">الهاتف</th>
                  <th className="px-6 py-4 font-bold">الرصيد / الديون</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800">{c.name}</td>
                    <td className="px-6 py-4 text-slate-500" dir="ltr" style={{textAlign: 'right'}}>{c.phone || '-'}</td>
                    <td className="px-6 py-4">
                      {c.balance > 0 ? (
                        <span className="text-rose-600 font-bold bg-rose-50 px-3 py-1 rounded-lg">
                          يوجد مديونية: {c.balance.toFixed(2)} {currency}
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-bold bg-emerald-50 px-3 py-1 rounded-lg">رصيد نظيف</span>
                      )}
                    </td>
                  </tr>
                ))}
                {customers.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-slate-400">لا يوجد عملاء مسجلين</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
