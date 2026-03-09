import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SettingsProvider } from '@/services/context/SettingsContext';
import { LayoutWrapper } from '@/features/Terminal/components/LayoutWrapper';
import { AuthProvider } from '@/services/context/AuthContext';
import { ClientProviders } from './_components/ClientProviders';
import { Analytics } from '@vercel/analytics/next';

export const metadata: Metadata = {
  title: "MarketMind Terminal",
  description: "Institutional-Grade Market Intelligence Platform",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#060a13",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bbg-terminal-root" style={{ backgroundColor: '#000000' }}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700;800&family=Roboto+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen w-full text-text-primary antialiased" style={{ backgroundColor: '#000000' }}>
        <AuthProvider>
          <SettingsProvider>
            <ClientProviders>
              <LayoutWrapper>
                {children}
              </LayoutWrapper>
            </ClientProviders>
          </SettingsProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
