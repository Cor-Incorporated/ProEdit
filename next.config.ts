import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel deployment optimization
  outputFileTracingRoot: process.cwd(),

  // FFmpeg.wasmのSharedArrayBuffer対応
  // Note: coi-serviceworker handles COOP/COEP headers for us
  // These headers are kept as fallback for environments where Service Worker is not available
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
        ],
      },
      // Ensure static FFmpeg files are accessible
      {
        source: "/ffmpeg/:path*",
        headers: [
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp",
          },
          {
            key: "Cross-Origin-Resource-Policy",
            value: "cross-origin",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
        ],
      },
    ];
  },

  // 画像最適化設定
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  // Webpack configuration for FFmpeg.wasm
  webpack: (config, { isServer }) => {
    // Client-side only: Configure for FFmpeg.wasm
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
      
      // Optimize for FFmpeg.wasm
      config.module = {
        ...config.module,
        rules: [
          ...config.module.rules,
          {
            test: /\.wasm$/,
            type: 'asset/resource',
          },
        ],
      };
    }
    return config;
  },
  
  // Next.js 15: Turbopack is default in dev, ensure compatibility
  experimental: {
    // Ensure FFmpeg workers are handled correctly
    optimizePackageImports: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
  },
};

export default nextConfig;
