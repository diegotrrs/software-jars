import type { MetadataRoute } from 'next';

const manifest = (): MetadataRoute.Manifest => ({
  name: 'Software Jars',
  short_name: 'Software Jars',
  description: 'A hub of small apps that each do one thing.',
  start_url: '/',
  display: 'standalone',
  background_color: '#ffffff',
  theme_color: '#4F46E5',
  icons: [
    { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
});

export default manifest;
