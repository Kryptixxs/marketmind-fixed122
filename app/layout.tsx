"use client";

import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { SettingsProvider } from "@/context/SettingsContext";
import { CommandPalette } from "@/components/CommandPalette";
import { NotificationToast } from "@/components/NotificationToast";
import { useTauriUpdater } from "@/hooks/use-tauri-updater";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useTauriUpdater();

  return (
    <html lang="en">
      <body className="flex h-screen w-screen overflow-hidden bg-background text-text-primary antialiased">
        <SettingsProvider>
          <Sidebar />
          <main className="flex-1 flex flex-col min-w-0 bg-background relative">
            {children}
          </main>
          <CommandPalette />
          <NotificationToast />
        </SettingsProvider>
      </body>
    </html>
  );
}