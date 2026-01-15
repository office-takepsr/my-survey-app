/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // ビルド時の型エラーを無視する
    ignoreBuildErrors: true,
  },
  eslint: {
    // ビルド時のESLintエラーを無視する
    ignoreDuringBuilds: true,
  },
  // Turbopackの設定でビルドが止まるのを防ぐ（念のため）
  experimental: {
    turbo: {
      // 必要に応じて設定
    },
  },
};

export default nextConfig;