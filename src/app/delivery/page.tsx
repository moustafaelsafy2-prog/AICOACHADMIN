'use client';

import { useState, useEffect } from 'react';
import { useSettings } from '@/contexts/SettingsContext';

type DeliveryWorker = {
  id: number;
  name: string;
  phone: string | null;
  balance: number;
};

export default function DeliveryPage() {
  const [workers, setWorkers] = useState<DeliveryWorker[]>([]);
  const [loading, setLoading] = useState(true);
  const [newWorker, setNewWorker] = useState({ name: '', phone: '' });
  const { settings } = useSettings();
  const currency = settings?.currency || 'ر.س';

  const fetchWorkers = async () => {
    try {
      const res = await fetch('/api/delivery');
      if (res.ok) setWorkers(await res.json());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  const handleAddWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWorker),
      });
      if (res.ok) {
        setNewWorker({ name: '', phone: '' });
        fetchWorkers();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSettle = async (id: number, amount: number) => {
    if(!confirm(`هل استلمت مبلغ ${amount} ${currency} من السائق لتسوية العهدة؟`)) return;
    try {
        const res = await fetch(`/api/delivery/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'SETTLE', amount })
        });
        if (res.ok) fetchWorkers();
    } catch (e) {
        console.error(e);
    }
  }

  if (loading) return <div className="p-8 text-center text-slate-500">جاري التحميل...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 pb-20">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">إدارة عمال التوصيل</h1>
        <p className="text-slate-500 mt-1">إضافة مناديب التوصيل ومتابعة عهدة النقدية لديهم</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add Worker Form */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-1 h-fit">
          <h2 className="text-xl font-bold mb-6 text-indigo-900 border-b pb-4">إضافة مندوب جديد</h2>
          <form onSubmit={handleAddWorker} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">اسم المندوب</label>
              <input required type="text" value={newWorker.name} onChange={e => setNewWorker({...newWorker, name: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">رقم الهاتف</label>
              <input type="tel" required dir="ltr" value={newWorker.phone} onChange={e => setNewWorker({...newWorker, phone: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-left" />
            </div>
            <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-md hover:bg-indigo-700 transition-all mt-4">تسجيل المندوب</button>
          </form>
        </section>

        {/* Workers Table */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 lg:col-span-2 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50">
            <h2 className="text-xl font-bold text-slate-800">قائمة المناديب (العهدة)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-slate-50/50 text-slate-500 text-sm">
                <tr>
                  <th className="px-6 py-4 font-bold">الاسم</th>
                  <th className="px-6 py-4 font-bold">الهاتف</th>
                  <th className="px-6 py-4 font-bold">العهدة (الكاش)</th>
                  <th className="px-6 py-4 font-bold">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {workers.map(w => (
                  <tr key={w.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800">{w.name}</td>
                    <td className="px-6 py-4 text-slate-500" dir="ltr" style={{textAlign: 'right'}}>{w.phone || '-'}</td>
                    <td className="px-6 py-4">
                      {w.balance > 0 ? (
                        <span className="text-rose-600 font-bold bg-rose-50 px-3 py-1 rounded-lg">
                          مطلوب منه: {w.balance.toFixed(2)} {currency}
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-bold bg-emerald-50 px-3 py-1 rounded-lg">لا توجد عهدة</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                       {w.balance > 0 && (
                           <button onClick={() => handleSettle(w.id, w.balance)} className="text-indigo-600 font-bold hover:text-indigo-800 underline text-sm">تسوية العهدة</button>
                       )}
                    </td>
                  </tr>
                ))}
                {workers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-400">لا يوجد مناديب مسجلين</td>
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
