/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  // Remove output: 'export' for Vercel deployment
  // Vercel handles server-side rendering automatically
};

module.exports = nextConfig;
