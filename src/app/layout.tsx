import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import Sidebar from "@/components/Sidebar";

const cairo = Cairo({ subsets: ["latin", "arabic"] });

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
      <body className={`${cairo.className} bg-gray-50 text-gray-900 min-h-screen antialiased flex overflow-hidden`}>
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
