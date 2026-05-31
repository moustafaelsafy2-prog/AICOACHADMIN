'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  if (!session) return null;

  const links = [
    { href: '/', label: 'نقطة البيع (POS)', icon: '🛒' },
    { href: '/orders', label: 'سجل المبيعات', icon: '📋' },
    { href: '/inventory', label: 'المخزون', icon: '📦' },
  ];

  if (session.user?.role === 'ADMIN') {
    links.push({ href: '/accounts', label: 'الحسابات', icon: '👥' });
  }

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col h-screen flex-shrink-0 relative z-20">
      <div className="p-6 border-b border-gray-800">
        <h2 className="text-2xl font-bold text-center">نظام POS</h2>
        <div className="mt-2 text-center text-sm text-gray-400">
          {session.user?.name}
          <br />
          <span className="text-xs inline-block mt-1 bg-gray-800 px-2 py-1 rounded">
            {session.user?.role === 'ADMIN' ? 'مدير' : 'كاشير'}
          </span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span className="text-xl">{link.icon}</span>
              <span className="font-medium">{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
        >
          <span>🚪</span>
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  );
}
