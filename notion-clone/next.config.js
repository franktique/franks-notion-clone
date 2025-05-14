/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // Add support for PDF.js
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    
    // Return the modified config
    return config;
  },
};

module.exports = nextConfig;
