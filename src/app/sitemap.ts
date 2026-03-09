import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://marketmind.app';
  const paths = [
    '/',
    '/features',
    '/pricing',
    '/solutions',
    '/security',
    '/status',
    '/docs',
    '/blog',
    '/changelog',
    '/about',
    '/contact',
    '/careers',
    '/legal/terms',
    '/legal/privacy',
    '/legal/cookies',
    '/legal/disclaimer',
    '/login',
    '/signup',
    '/forgot',
    '/verify',
    '/app',
    '/app/terminal',
    '/app/workspaces',
    '/app/monitors',
    '/app/alerts',
    '/app/orders',
    '/app/blotter',
    '/app/messages',
    '/app/reports',
    '/app/settings',
    '/app/profile',
    '/app/admin',
  ];

  return paths.map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: path.startsWith('/app') ? 'daily' : 'weekly',
    priority: path === '/' ? 1 : path.startsWith('/app/terminal') ? 0.9 : 0.7,
  }));
}
