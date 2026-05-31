'use client';

import React from 'react';
import { useSettings } from '@/contexts/SettingsContext';

type CartItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
};

type ReceiptProps = {
  items: CartItem[];
  total: number;
  orderId?: number | null;
  date: string;
};

export default function Receipt({ items, total, orderId, date }: ReceiptProps) {
  const { settings } = useSettings();
  const currency = settings?.currency || 'ر.س';
  const taxRate = settings?.taxRate || 0;

  const totalBeforeTax = total / (1 + (taxRate / 100));
  const taxAmount = total - totalBeforeTax;

  return (
    <div className="receipt-container p-4 bg-white text-black w-80 text-sm font-sans mx-auto" dir="rtl">
      {/* Header */}
      <div className="text-center mb-6 border-b-2 border-dashed border-gray-400 pb-4">
        {settings?.companyLogo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={settings.companyLogo} alt="Logo" className="w-16 h-16 object-contain mx-auto mb-2 grayscale" />
        )}
        <h2 className="font-bold text-xl mb-1">{settings?.companyName || 'نظام نقاط البيع'}</h2>
        {settings?.companyAddress && <p className="text-xs text-gray-600">{settings.companyAddress}</p>}
        {settings?.companyPhone && <p className="text-xs text-gray-600 mt-1">هاتف: <span dir="ltr">{settings.companyPhone}</span></p>}
      </div>

      {/* Meta Info */}
      <div className="flex justify-between items-center mb-4 text-xs font-bold">
        <span>رقم الطلب: #{orderId || '---'}</span>
        <span dir="ltr">{date}</span>
      </div>

      {/* Items Table */}
      <table className="w-full mb-4 text-xs">
        <thead className="border-y border-dashed border-gray-400 font-bold">
          <tr>
            <th className="py-2 text-right">الصنف</th>
            <th className="py-2 text-center">الكمية</th>
            <th className="py-2 text-left">السعر</th>
          </tr>
        </thead>
        <tbody className="border-b border-dashed border-gray-400">
          {items.map((item, idx) => (
            <tr key={idx}>
              <td className="py-2 text-right">{item.name}</td>
              <td className="py-2 text-center">{item.quantity}</td>
              <td className="py-2 text-left">{(item.price * item.quantity).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="space-y-1 mb-6 text-sm">
        <div className="flex justify-between items-center text-gray-600">
          <span>المبلغ الخاضع للضريبة:</span>
          <span>{totalBeforeTax.toFixed(2)} {currency}</span>
        </div>
        <div className="flex justify-between items-center text-gray-600">
          <span>ضريبة القيمة المضافة ({taxRate}%):</span>
          <span>{taxAmount.toFixed(2)} {currency}</span>
        </div>
        <div className="flex justify-between items-center font-bold text-lg pt-2 border-t border-gray-800">
          <span>الإجمالي الكلي:</span>
          <span>{total.toFixed(2)} {currency}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mt-8 border-t-2 border-dashed border-gray-400 pt-4">
        <p className="font-bold text-sm mb-2">{settings?.receiptFooterText || 'شكراً لتسوقكم معنا'}</p>
        <div className="flex justify-center mt-2">
            {/* Simple barcode simulation */}
            <div className="w-48 h-8 bg-black opacity-80" style={{ backgroundImage: 'repeating-linear-gradient(to right, transparent, transparent 2px, white 2px, white 4px)'}}></div>
        </div>
      </div>
    </div>
  );
}
