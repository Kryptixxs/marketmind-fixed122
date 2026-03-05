import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Inter } from "next/font/google";
import "./globals.css";
import { SettingsProvider } from '@/services/context/SettingsContext';
import { LayoutWrapper } from '@/features/Terminal/components/LayoutWrapper';
import { AuthProvider } from '@/services/context/AuthContext';

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains-mono",
});

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

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
    <html lang="en" className={`${jetbrainsMono.variable} ${inter.variable}`}>
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
