/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
};

module.exports = {
  ...nextConfig,
  env: {
    ALCHEMY_KEY: process.env.ALCHEMY_KEY,
  },
};
