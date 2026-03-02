/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  turbopack: {}, // Silenciar warning de Turbopack en Next.js 16
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
    ],
  },
};

export default nextConfig;