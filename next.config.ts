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
    } else {
      const externals = config.externals ?? [];
      if (Array.isArray(externals)) {
        externals.push('@ffmpeg-installer/ffmpeg', 'fluent-ffmpeg');
        config.externals = externals;
      } else if (typeof externals === 'function') {
        const original = externals;
        config.externals = (
          context: unknown,
          request: string | undefined,
          callback: (error?: Error | null, result?: string) => void
        ) => {
          if (request && ['@ffmpeg-installer/ffmpeg', 'fluent-ffmpeg'].includes(request)) {
            return callback(null, `commonjs ${request}`);
          }
          return original(context, request, callback);
        };
      } else {
        config.externals = {
          ...externals,
          '@ffmpeg-installer/ffmpeg': 'commonjs @ffmpeg-installer/ffmpeg',
          'fluent-ffmpeg': 'commonjs fluent-ffmpeg',
        };
      }
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
