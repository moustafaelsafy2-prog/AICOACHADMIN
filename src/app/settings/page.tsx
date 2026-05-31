'use client';

import { useState, useEffect } from 'react';
import { useSettings } from '@/contexts/SettingsContext';

export default function SettingsPage() {
  const { settings: currentSettings, refreshSettings } = useSettings();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    companyLogo: '',
    companyAddress: '',
    companyPhone: '',
    currency: 'ر.س',
    taxRate: 15,
    receiptFooterText: ''
  });

  useEffect(() => {
    if (currentSettings) {
      setFormData({
        companyName: currentSettings.companyName || '',
        companyLogo: currentSettings.companyLogo || '',
        companyAddress: currentSettings.companyAddress || '',
        companyPhone: currentSettings.companyPhone || '',
        currency: currentSettings.currency || 'ر.س',
        taxRate: currentSettings.taxRate || 0,
        receiptFooterText: currentSettings.receiptFooterText || ''
      });
    }
  }, [currentSettings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          taxRate: parseFloat(formData.taxRate.toString())
        })
      });
      if (res.ok) {
        await refreshSettings();
        alert('تم حفظ الإعدادات بنجاح');
      } else {
        alert('حدث خطأ أثناء حفظ الإعدادات');
      }
    } catch (error) {
      console.error(error);
      alert('حدث خطأ أثناء الحفظ');
    } finally {
      setLoading(false);
    }
  };

  if (!currentSettings) return <div className="p-8 text-center">جاري التحميل...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 pb-20">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">الإعدادات العامة</h1>
        <p className="text-slate-500 mt-1">تخصيص بيانات النظام، الفواتير، والعملة</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Company Settings */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-xl font-bold mb-6 text-indigo-900 border-b pb-4">بيانات الشركة الأساسية</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">اسم الشركة / المتجر</label>
              <input type="text" required value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">رابط الشعار (Logo URL)</label>
              <input type="url" dir="ltr" placeholder="https://example.com/logo.png" value={formData.companyLogo} onChange={e => setFormData({...formData, companyLogo: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-left" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">العنوان</label>
              <input type="text" value={formData.companyAddress} onChange={e => setFormData({...formData, companyAddress: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">رقم الهاتف</label>
              <input type="tel" dir="ltr" value={formData.companyPhone} onChange={e => setFormData({...formData, companyPhone: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-left" />
            </div>
          </div>
        </section>

        {/* Financial Settings */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-xl font-bold mb-6 text-indigo-900 border-b pb-4">الإعدادات المالية</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">العملة الافتراضية</label>
              <select value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="ر.س">ريال سعودي (ر.س)</option>
                <option value="درهم">درهم إماراتي (درهم)</option>
                <option value="د.ك">دينار كويتي (د.ك)</option>
                <option value="ر.ع">ريال عماني (ر.ع)</option>
                <option value="ج.م">جنيه مصري (ج.م)</option>
                <option value="$">دولار أمريكي ($)</option>
                <option value="€">يورو (€)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">نسبة الضريبة (VAT %)</label>
              <input type="number" step="0.1" required value={formData.taxRate} onChange={e => setFormData({...formData, taxRate: parseFloat(e.target.value) || 0})} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
          </div>
        </section>

        {/* Receipt Settings */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-xl font-bold mb-6 text-indigo-900 border-b pb-4">إعدادات الفاتورة والطباعة</h2>
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">رسالة تذييل الفاتورة</label>
              <textarea rows={3} value={formData.receiptFooterText} onChange={e => setFormData({...formData, receiptFooterText: e.target.value})} placeholder="مثال: شكراً لتسوقكم معنا، البضاعة المباعة لا ترد ولا تستبدل بعد 3 أيام." className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"></textarea>
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <button disabled={loading} type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-all disabled:bg-indigo-400">
            {loading ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
          </button>
        </div>
      </form>
    </div>
  );
}
