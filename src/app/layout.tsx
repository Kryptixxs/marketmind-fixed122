import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SettingsProvider } from '@/services/context/SettingsContext';
import { LayoutWrapper } from '@/features/Terminal/components/LayoutWrapper';
import { AuthProvider } from '@/services/context/AuthContext';

export const metadata: Metadata = {
  title: "VANTAGE TERMINAL // Bloomberg-Grade Intelligence",
  description: "Institutional-grade market intelligence terminal for systematic traders. Real-time data, AI synthesis, and automated structure mapping.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#0a0a12",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700;800&family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="flex flex-col-reverse md:flex-row h-[100dvh] w-full overflow-hidden bg-background text-text-primary antialiased">
        <AuthProvider>
          <SettingsProvider>
            <LayoutWrapper>
              {children}
            </LayoutWrapper>
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}