import type {Metadata} from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { NotificationToast } from '@/components/NotificationToast';
import { SettingsProvider } from '@/context/SettingsContext';

export const metadata: Metadata = {
  title: 'MarketMind',
  description: 'AI-powered financial intelligence dashboard',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--color-background)',
          color: 'var(--color-text-primary)',
          overflowX: 'hidden',
        }}
        suppressHydrationWarning
      >
        <SettingsProvider>
          <Navbar />
          <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
            {children}
          </main>
          <NotificationToast />
        </SettingsProvider>
      </body>
    </html>
  );
}
