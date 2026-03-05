import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SettingsProvider } from '@/services/context/SettingsContext';
import { LayoutWrapper } from '@/features/Terminal/components/LayoutWrapper';
import { AuthProvider } from '@/services/context/AuthContext';

export const metadata: Metadata = {
  title: "VANTAGE TERMINAL // v4.0",
  description: "Institutional Intelligence",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="flex flex-col-reverse md:flex-row h-[100dvh] w-full overflow-hidden antialiased">
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