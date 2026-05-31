import type { Metadata } from "next";
import { Tajawal } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import Sidebar from "@/components/Sidebar";

const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ['300', '400', '500', '700', '800', '900']
});

export const metadata: Metadata = {
  title: "Arabic POS System",
  description: "Point of Sale System for Arab Businesses",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${tajawal.className} bg-slate-50 text-slate-900 min-h-screen antialiased flex overflow-hidden`}>
        <Providers>
          <Sidebar />
          <div className="flex-1 h-screen overflow-y-auto">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
