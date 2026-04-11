import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Pitzbol',
    short_name: 'Pitzbol',
    description: 'Tu guía turística para el Mundial 2026 en Guadalajara',
    start_url: '/',
    display: 'standalone',
    background_color: '#F6F0E6',
    theme_color: '#1A4D2E',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
