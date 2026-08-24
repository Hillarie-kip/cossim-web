/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations
  reactStrictMode: true,

  sassOptions: {
    silenceDeprecations: [
      'import', 
      'legacy-js-api', 
      'global-builtin', 
      'color-functions'
    ],
  },
  
  // PWA and metadata configuration
  experimental: {
    webVitalsAttribution: ['CLS', 'LCP'],
  },
  
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
  
  // Compression
  compress: true,
  
  // Environment variables validation
  env: {
    CUSTOM_APP_NAME: 'COSSIM',
    CUSTOM_APP_VERSION: '0.1.0',
  },
  
  // Bundle analysis (useful for optimization)
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    if (!dev && !isServer) {
      config.optimization.providedExports = true;
      config.optimization.usedExports = true;
    }
    config.ignoreWarnings = [
      /postcss-url-parser: Unable to find uri in/,
    ];
    return config;
  },
};

export default nextConfig;
