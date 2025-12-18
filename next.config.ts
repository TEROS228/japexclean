import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false, // Отключаем strict mode чтобы избежать двойного рендеринга

  // Production optimizations
  // swcMinify is now default in Next.js 15+
  compress: true, // Enable gzip compression

  // Performance optimizations
  poweredByHeader: false, // Remove X-Powered-By header for security
  generateEtags: false, // Disable ETags to prevent caching

  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'], // Modern image formats
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 0, // No cache
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "thumbnail.image.rakuten.co.jp",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "image.rakuten.co.jp",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "tshop.r10s.jp",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "item-shopping.c.yimg.jp",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "shopping.c.yimg.jp",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "auctions.c.yimg.jp",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "z-shopping.c.yimg.jp",
        port: "",
        pathname: "/**",
      },
    ],
  },

  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Disable automatic refresh to preserve WebSocket connections
  onDemandEntries: {
    maxInactiveAge: 60 * 60 * 1000, // Keep pages in memory for 1 hour
    pagesBufferLength: 10,
  },

  // Experimental features for better performance
  experimental: {
    optimizeCss: true, // Optimize CSS (critters now installed)
    optimizePackageImports: ['lucide-react', 'react-icons'], // Tree-shake large icon libraries
  },

  // Headers - No caching
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
