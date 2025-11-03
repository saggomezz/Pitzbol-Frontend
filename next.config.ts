/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'images.unsplash.com',
      'campestre.media',          
      'upload.wikimedia.org',    
      'img.freepik.com'
    ], 
  },
};

module.exports = nextConfig;