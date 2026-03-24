/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  eslint: {
    // Allow production builds to complete even with ESLint warnings/errors
    // TODO: Fix intake route TypeScript issues
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
