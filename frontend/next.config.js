/** @type {import('next').NextConfig} */

module.exports = {
  devIndicators: false,

  // Disable source map generation for both server and client in production
  productionBrowserSourceMaps: false,

  webpack(config, { isServer, dev }) {
    // Only modify the config in production
    if (!dev) {
      config.devtool = false; // disables source maps completely
    }
    return config;
  },

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.BACKEND_URL + '/:path*', // proxy to backend
      },
    ];
  },
};