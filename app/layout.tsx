import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SettingsProvider } from "@/context/SettingsContext";
import { CommandPalette } from "@/components/CommandPalette";
import { LayoutWrapper } from "@/components/LayoutWrapper";

export const metadata: Metadata = {
  title: "VANTAGE TERMINAL // v4.0",
  description: "Institutional Intelligence",
};

// Explicitly define the viewport to allow zooming and ensure proper mobile scaling
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
      <body className="flex flex-col-reverse md:flex-row h-[100dvh] w-full overflow-hidden bg-background text-text-primary antialiased">
        <SettingsProvider>
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
          <CommandPalette />
        </SettingsProvider>
      </body>
    </html>
  );
}