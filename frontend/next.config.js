// frontend/next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static export for GitHub Pages
  output: 'export',

  // Required for GitHub Pages
  trailingSlash: true,
  skipTrailingSlashRedirect: true,

  // Output directory
  distDir: 'dist',

  // Disable image optimization for static export
  images: {
    unoptimized: true
  },

  // GitHub Pages repository name (update this to your repo name)
  assetPrefix: process.env.NODE_ENV === 'production' ? '/PitchAI_Demo' : '',
  basePath: process.env.NODE_ENV === 'production' ? '/PitchAI_Demo' : '',

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