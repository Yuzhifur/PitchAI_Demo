// frontend/next.config.js
/** @type {import('next').NextConfig} */

// Check if we're building for static export (GitHub Pages)
const isStaticExport = process.env.NEXT_EXPORT === 'true';

const nextConfig = {
  // Enable static export for GitHub Pages only when explicitly requested
  ...(isStaticExport && { 
    output: 'export',
    distDir: 'dist',
    assetPrefix: '/PitchAI_Demo',
    basePath: '/PitchAI_Demo',
    trailingSlash: true,
    skipTrailingSlashRedirect: true,
  }),

  // Image optimization
  images: {
    unoptimized: isStaticExport
  },

  // Environment variables available to the client
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_APP_MODE: process.env.NEXT_PUBLIC_APP_MODE,
  },

  // Enable React strict mode
  reactStrictMode: true,

  // SWC minification
  swcMinify: true,

}

module.exports = nextConfig