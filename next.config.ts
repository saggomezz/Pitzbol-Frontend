/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001',
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
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
        ],
      },
    ];
  },
  async rewrites() {
    const backendUrl = process.env.BACKEND_INTERNAL_URL || 'http://localhost:3001';
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

export default nextConfig;