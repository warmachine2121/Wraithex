/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for Cloudflare Pages
  experimental: {
    runtime: 'edge',
  },
};

module.exports = nextConfig;
