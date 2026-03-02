import { WebviewWindow } from '@tauri-apps/api/window';

export const isTauri = () => typeof window !== 'undefined' && (window as any).__TAURI__ !== undefined;

export async function popOutWidget(title: string, route: string) {
  if (!isTauri()) {
    window.open(route, '_blank', 'width=800,height=600');
    return;
  }

  const label = `popout-${Math.random().toString(36).substring(7)}`;
  const webview = new WebviewWindow(label, {
    url: route,
    title: `${title} - MarketMind`,
    width: 800,
    height: 600,
    resizable: true,
  });

  webview.once('tauri://created', function () {
    console.log('Popout window created');
  });

  webview.once('tauri://error', function (e) {
    console.error('Error creating popout window', e);
  });
}