import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Suspense } from 'react';
import './globals.css';
import { LanguageProvider } from '../i18n/LanguageContext';
import { AuthProvider } from '../context/AuthContext';
import { Header } from '../components/common/Header';
import { Footer } from '../components/common/Footer';
import { BottomNav } from '../components/common/BottomNav';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Astra — Official Grain Procurement Platform',
  description: 'Direct procurement at verified government depots with digital weighment, real-time slot booking, and guaranteed MSP payment.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`antialiased overflow-x-hidden bg-white text-slate-900 min-h-screen flex flex-col selection:bg-indigo-900 selection:text-indigo-100 ${inter.variable} font-sans`} suppressHydrationWarning>
        <LanguageProvider>
          <AuthProvider>
            <Suspense fallback={null}>
              <Header />
            </Suspense>
            <div className="flex-1 flex flex-col min-w-0 w-full pb-[calc(72px+env(safe-area-inset-bottom))] md:pb-0">{children}</div>
            <Footer />
            <Suspense fallback={null}>
              <BottomNav />
            </Suspense>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}

