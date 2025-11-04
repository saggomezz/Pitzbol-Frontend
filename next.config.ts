/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Esta es la nueva sintaxis recomendada que reemplaza a 'domains'
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'museocabanas.jalisco.gob.mx', // <-- Añadido
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
      {
        protocol: 'https',
        hostname: 'campestre.media',
      },
      {
        protocol: 'https',
        hostname: 'image-tc.galaxy.tf', // <-- Añadido (de "Centro de Guadalajara")
      },
      {
        protocol: 'https',
        hostname: 'encrypted-tbn0.gstatic.com', // <-- Añadido (de "Nieves de Garrafa")
      },
      {
        protocol: 'https',
        hostname: 'img.freepik.com', // <-- Mantenido de tu config anterior
      },
      {
        protocol: 'https',
        hostname: 'www.liderempresarial.com', // <-- Aquí está el nuevo dominio
      },
      {
        protocol: 'https',
        hostname: 'visitmexico.com', // <-- ¡Añadido!
      },
    ],
  },
};

module.exports = nextConfig;

