import './colors_and_type.css';
import './globals.css';
import type { Metadata } from 'next';
import { AuthProvider } from '@/lib/context/AuthContext';

export const metadata: Metadata = {
  title: 'CryptoFolio',
  description: 'Track your crypto portfolio — manual assets, ETH & SOL wallets, FIFO cost basis.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning style={{ colorScheme: 'light', background: '#ffffff' }}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: `html,body{background:#ffffff !important;color-scheme:light}` }} />
      </head>
      <body suppressHydrationWarning style={{ background: '#ffffff' }}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
