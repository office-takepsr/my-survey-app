/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true, // 型エラーを無視する
  },
  eslint: {
    ignoreDuringBuilds: true, // 文法チェックを無視する
  },
};

export default nextConfig;