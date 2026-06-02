/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'i.ytimg.com' },
      { protocol: 'https', hostname: 'yt3.ggpht.com' },
      { protocol: 'https', hostname: '*.googleusercontent.com' },
      // Invidious instances proxy thumbnails through themselves
      { protocol: 'https', hostname: '*.riverside.rocks' },
      { protocol: 'https', hostname: '*.datura.network' },
      { protocol: 'https', hostname: '*.cdaut.de' },
    ],
    unoptimized: true,
  },
  output: 'export',
  // Set NEXT_PUBLIC_BASE_PATH in GitHub repo Settings → Variables
  // e.g. /scribe  (match your repo name)
  // Leave empty for a custom domain
  basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? '',
  assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH ?? '',
}

module.exports = nextConfig
