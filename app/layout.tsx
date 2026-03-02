import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { SettingsProvider } from "@/context/SettingsContext";
import { CommandPalette } from "@/components/CommandPalette";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MarketMind Terminal",
  description: "Institutional Grade Intelligence Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-background text-foreground antialiased selection:bg-accent selection:text-white overflow-hidden`}>
        <SettingsProvider>
          <div className="flex flex-col h-screen">
            <Navbar />
            <main className="flex-1 overflow-hidden relative">
              {children}
            </main>
          </div>
          <CommandPalette />
        </SettingsProvider>
      </body>
    </html>
  );
}
