import type { Metadata } from "next";
import "./globals.css";
import { SettingsProvider } from "@/context/SettingsContext";
import { CommandPalette } from "@/components/CommandPalette";
import { LayoutWrapper } from "@/components/LayoutWrapper";

export const metadata: Metadata = {
  title: "VANTAGE TERMINAL // v4.0",
  description: "Institutional Intelligence",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* Changed to flex-col-reverse on mobile so sidebar sits at the bottom, md:flex-row for desktop left-side */}
      <body className="flex flex-col-reverse md:flex-row h-screen w-screen overflow-hidden bg-background text-text-primary antialiased">
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