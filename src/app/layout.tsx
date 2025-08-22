import type { Metadata, Viewport } from 'next';
import React from 'react';
import { Inter } from 'next/font/google';
import ClientProviders from '@/components/ClientProviders';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'EARU 経理管理システム | 現代的な経理管理ソリューション',
  description: 'PCA会計システムと完全連携した直感的で革新的な経理管理アプリケーション。領収書管理、経費精算、会計データエクスポートを効率化。',
  keywords: ['経理管理', 'PCA会計', '経費精算', '領収書管理', '会計システム'],
  authors: [{ name: 'EARU' }],
  robots: 'noindex, nofollow', // 開発段階のため検索エンジンを除外
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/icon-192.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1976d2',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={inter.className} style={{ margin: 0 }}>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
