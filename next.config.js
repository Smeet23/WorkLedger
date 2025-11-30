/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['avatars.githubusercontent.com', 'github.com', 'gitlab.com', 'secure.gravatar.com'],
    formats: ['image/avif', 'image/webp'],
  },
  // Optimize production builds
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  swcMinify: true,
  // Experimental optimizations
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-avatar', '@radix-ui/react-dialog'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Externalize pdfkit and qrcode for server-side to avoid bundling issues
      // This allows them to use node_modules directly, including font files
      config.externals = config.externals || []
      config.externals.push({
        pdfkit: 'commonjs pdfkit',
        qrcode: 'commonjs qrcode',
      })
    }
    return config
  },
}

module.exports = nextConfig