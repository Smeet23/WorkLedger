/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['avatars.githubusercontent.com', 'github.com'],
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