'use client';

import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch {
      setError('حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 inset-x-0 h-64 bg-indigo-600 [clip-path:polygon(0_0,100%_0,100%_40%,0_100%)] z-0"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <h2 className="mt-6 text-center text-4xl font-extrabold text-white tracking-tight">
          نظام نقاط البيع
        </h2>
        <p className="mt-2 text-center text-sm text-indigo-100 font-medium">
          الرجاء تسجيل الدخول للمتابعة
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-10 px-6 shadow-2xl sm:rounded-2xl sm:px-12 border border-slate-100/50">
          <form className="space-y-7" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-rose-50 border-r-4 border-rose-500 p-4 rounded-lg">
                <div className="flex">
                  <div className="mr-3">
                    <p className="text-sm text-rose-700 font-medium">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-bold text-slate-700 mb-2"
              >
                البريد الإلكتروني
              </label>
              <div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-left transition-shadow"
                  dir="ltr"
                  placeholder="admin@pos.com"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-bold text-slate-700 mb-2"
              >
                كلمة المرور
              </label>
              <div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-left transition-shadow"
                  dir="ltr"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-md text-[15px] font-bold text-white transition-all duration-200 ${
                  loading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transform active:scale-[0.98]'
                }`}
              >
                {loading ? 'جاري التحقق...' : 'تسجيل الدخول'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
