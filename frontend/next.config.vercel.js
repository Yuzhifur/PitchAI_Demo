// next.config.vercel.js - Clean config for Vercel deployment
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Environment variables available to the client
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_APP_MODE: process.env.NEXT_PUBLIC_APP_MODE,
  },

  // Enable React strict mode
  reactStrictMode: true,

  // SWC minification
  swcMinify: true,

  // Image optimization enabled for Vercel
  images: {
    unoptimized: false
  },
}

module.exports = nextConfig