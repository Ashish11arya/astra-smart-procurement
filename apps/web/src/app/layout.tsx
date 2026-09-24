import type { Metadata } from 'next';
import { Suspense } from 'react';
import './globals.css';
import { LanguageProvider } from '../i18n/LanguageContext';
import { AuthProvider } from '../context/AuthContext';
import { Header } from '../components/common/Header';
import { Footer } from '../components/common/Footer';
import { BottomNav } from '../components/common/BottomNav';

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
      <body className="antialiased bg-[#0B1020] text-[#F8FAFC] min-h-screen flex flex-col selection:bg-indigo-900 selection:text-indigo-100" suppressHydrationWarning>
        <LanguageProvider>
          <AuthProvider>
            <Suspense fallback={null}>
              <Header />
            </Suspense>
            <div className="flex-1 flex flex-col pb-20 md:pb-0">{children}</div>
            <Footer />
            <BottomNav />
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}

