'use client';

import { useState, useEffect } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { FiTrendingUp, FiDollarSign, FiShoppingBag, FiActivity } from 'react-icons/fi';

type ReportData = {
  totalSales: number;
  totalOrdersCount: number;
  todaysSales: number;
  topProducts: { name: string, quantity: number, revenue: number }[];
};

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const { settings } = useSettings();
  const currency = settings?.currency || 'ر.س';

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await fetch('/api/reports');
        if (res.ok) {
          setData(await res.json());
        }
      } catch (error) {
        console.error('Failed to fetch reports', error);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  if (loading || !data) return <div className="p-8 text-center text-slate-500">جاري تجميع البيانات...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 pb-20">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">التقارير والإحصائيات</h1>
        <p className="text-slate-500 mt-1">نظرة عامة على أداء المبيعات والمخزون</p>
      </header>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="bg-indigo-100 text-indigo-600 p-4 rounded-xl">
            <FiDollarSign className="text-2xl" />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-bold mb-1">إجمالي المبيعات (تراكمي)</p>
            <h3 className="text-2xl font-black text-slate-800">{data.totalSales.toFixed(2)} {currency}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="bg-emerald-100 text-emerald-600 p-4 rounded-xl">
            <FiActivity className="text-2xl" />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-bold mb-1">مبيعات اليوم</p>
            <h3 className="text-2xl font-black text-slate-800">{data.todaysSales.toFixed(2)} {currency}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="bg-amber-100 text-amber-600 p-4 rounded-xl">
            <FiShoppingBag className="text-2xl" />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-bold mb-1">إجمالي الطلبات الفواتير</p>
            <h3 className="text-2xl font-black text-slate-800">{data.totalOrdersCount}</h3>
          </div>
        </div>
      </div>

      {/* Top Products */}
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-2 mb-6 border-b pb-4">
            <FiTrendingUp className="text-indigo-600 text-xl" />
            <h2 className="text-xl font-bold text-indigo-900">أكثر المنتجات مبيعاً</h2>
        </div>

        {data.topProducts.length === 0 ? (
          <p className="text-center text-slate-400 py-8">لا توجد مبيعات حتى الآن</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-6 py-4 font-bold rounded-r-xl">المنتج</th>
                  <th className="px-6 py-4 font-bold">الكمية المباعة</th>
                  <th className="px-6 py-4 font-bold rounded-l-xl">العائد الكلي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.topProducts.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800">{p.name}</td>
                    <td className="px-6 py-4">
                        <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg font-bold">{p.quantity}</span>
                    </td>
                    <td className="px-6 py-4 font-black text-emerald-600">{p.revenue.toFixed(2)} {currency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
