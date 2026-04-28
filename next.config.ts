import withPWA from '@ducanh2912/next-pwa';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb',
    },
  },
  env: {
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api.pitzbol.me:8443',
    NEXT_PUBLIC_IA_URL: process.env.NEXT_PUBLIC_IA_URL || 'https://ia.pitzbol.me',
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=(self)' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.googletagmanager.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https:",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://api.pitzbol.me:8443 https://ia.pitzbol.me:8443 wss://api.pitzbol.me:8443 https://res.cloudinary.com https://firebaseinstallations.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firebasestorage.googleapis.com https://www.googleapis.com https://js.stripe.com https://www.openstreetmap.org https://tile.openstreetmap.org https://*.tile.openstreetmap.org https://nominatim.openstreetmap.org",
              "frame-src 'self' https://js.stripe.com https://www.openstreetmap.org",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "object-src 'none'",
               "connect-src 'self' http://localhost:3001 http://127.0.0.1:3001 ws://localhost:3001 ws://127.0.0.1:3001 https://api.pitzbol.me:8443 https://ia.pitzbol.me:8443 wss://api.pitzbol.me:8443 https://res.cloudinary.com https://firebaseinstallations.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firebasestorage.googleapis.com https://www.googleapis.com https://js.stripe.com https://www.openstreetmap.org https://tile.openstreetmap.org https://*.tile.openstreetmap.org https://nominatim.openstreetmap.org",
               "upgrade-insecure-requests",
            ].join('; '),
          },
        ],
      },
    ];
  },
  async rewrites() {
    const backendUrl =
      process.env.BACKEND_INTERNAL_URL ||
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      'https://api.pitzbol.me:8443';
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
  reactStrictMode: true,
  allowedDevOrigins: ['69.30.204.56'],
  turbopack: {},
  webpack: (config: any) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@tensorflow/tfjs': false,
    };
    config.externals = [...(config.externals || []), { canvas: 'canvas' }];
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      {
        module: /@vladmandic[\\/]face-api[\\/]dist[\\/]face-api\.esm\.js/,
        message: /Critical dependency: require function is used in a way in which dependencies cannot be statically extracted/,
      },
    ];
    return config;
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'micro-cdn.summapress.com' },
      { protocol: 'https', hostname: 'www.elfinanciero.com.mx' },
      { protocol: 'https', hostname: 'www.gaceta.unam.mx' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'museocabanas.jalisco.gob.mx' },
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
      { protocol: 'https', hostname: 'campestre.media' },
      { protocol: 'https', hostname: 'image-tc.galaxy.tf' },
      { protocol: 'https', hostname: 'encrypted-tbn0.gstatic.com' },
      { protocol: 'https', hostname: 'img.freepik.com' },
      { protocol: 'https', hostname: 'www.liderempresarial.com' },
      { protocol: 'https', hostname: 'www.debate.com.mx' },
      { protocol: 'https', hostname: 'visitmexico.com' },
      { protocol: 'https', hostname: 'arquitecturaviva.com' },
      { protocol: 'https', hostname: 'A.espncdn.com' },
      { protocol: 'https', hostname: 'flagcdn.com' },
      { protocol: 'https', hostname: 'noticiasgdl.com' },
      { protocol: 'https', hostname: 'offloadmedia.feverup.com' },
      { protocol: 'https', hostname: 'www.entornoturistico.com' },
      { protocol: 'https', hostname: 'www.buenosviajes.co' },
    ],
  },
};

export default withPWA({
  dest: 'public',
  register: true,
  disable: process.env.NODE_ENV === 'development',
})(nextConfig);