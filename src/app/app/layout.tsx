import { ShellNavigation } from './_components/ShellNavigation';

export default function AppShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative h-[100dvh] overflow-hidden bg-background text-text-primary font-mono">
      <ShellNavigation />
      <main className="h-[calc(100dvh-1.75rem)] overflow-hidden">
        <div className="h-full w-full overflow-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}
