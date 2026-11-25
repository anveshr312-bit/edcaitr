import type { NextConfig } from 'next';

const isPreview = process.env.VERCEL_ENV === 'preview';

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ik.imagekit.io',
      },
    ],
  },
  async headers() {
    const headersList = [
      {
        source: '/:all*(webp|avif|png|jpg|jpeg|svg|ico)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];

    // Strictly protect Vercel preview deployments from indexing
    if (isPreview) {
      headersList.push({
        source: '/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow, noarchive, nosnippet',
          },
        ],
      });
    }

    return headersList;
  },
};

export default nextConfig;
