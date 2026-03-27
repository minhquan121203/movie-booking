import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  webpack: config => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    }
    return config
  },
  devIndicators: false,
  turbopack: {},
  // XÓA 2 phần dưới đây để hết lỗi TypeScript:
  // 1. reactCompiler (Chỉ dành cho Next.js 15)
  // 2. devIndicators (Gây lỗi type)

  typescript: {
    ignoreBuildErrors: true,
  },
}

export default nextConfig