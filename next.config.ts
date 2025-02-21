/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  async rewrites() {
    return [
      // Public routes
      {
        source: "/",
        destination: "/public",
      },
      {
        source: "/about",
        destination: "/public/about",
      },
      // Protected routes
      {
        source: "/dashboard",
        destination: "/protected/dashboard",
      },
      {
        source: "/admin",
        destination: "/protected/admin",
      },
      {
        source: "/account",
        destination: "/protected/account",
      },
      {
        source: "/account/reset-password",
        destination: "/protected/account/reset-password",
      },
      {
        source: "/account/delete-account",
        destination: "/protected/account/delete-account",
      },
    ];
  },
};

module.exports = nextConfig;
