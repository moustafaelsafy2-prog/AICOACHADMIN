'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { FiShoppingCart, FiList, FiBox, FiUsers, FiLogOut } from 'react-icons/fi';
import { HiOutlineSparkles } from 'react-icons/hi';

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  if (!session) return null;

  const links = [
    { href: '/', label: 'نقطة البيع (POS)', icon: <FiShoppingCart className="text-xl" /> },
    { href: '/orders', label: 'سجل المبيعات', icon: <FiList className="text-xl" /> },
    { href: '/inventory', label: 'المخزون', icon: <FiBox className="text-xl" /> },
  ];

  if (session.user?.role === 'ADMIN') {
    links.push({ href: '/accounts', label: 'الحسابات', icon: <FiUsers className="text-xl" /> });
  }

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col h-screen flex-shrink-0 relative z-20 shadow-2xl">
      <div className="p-6 border-b border-slate-800/50 bg-slate-900/50">
        <div className="flex items-center justify-center gap-2 mb-2 text-indigo-400">
            <HiOutlineSparkles className="text-2xl" />
            <h2 className="text-2xl font-bold tracking-tight text-white">نظام POS</h2>
        </div>
        <div className="text-center text-sm text-slate-400 font-medium">
          {session.user?.name}
          <br />
          <span className={`text-xs inline-block mt-2 px-2.5 py-1 rounded-full font-bold tracking-wide ${session.user?.role === 'ADMIN' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800 text-slate-300'}`}>
            {session.user?.role === 'ADMIN' ? 'مدير النظام' : 'كاشير'}
          </span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-50'
              }`}
            >
              <div className={`${isActive ? 'text-white' : 'text-slate-500'}`}>
                  {link.icon}
              </div>
              <span className="font-semibold text-[15px]">{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800/50">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 rounded-xl transition-all duration-200 font-medium"
        >
          <FiLogOut className="text-xl" />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  );
}
