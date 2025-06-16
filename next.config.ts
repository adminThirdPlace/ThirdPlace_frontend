import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },

  /* —──────── Experiments —──────── */
  experimental: {
   
    // Disable Lightning CSS so the missing binary no longer breaks the build
    optimizeCss: false,
  },

  /* —──────── Linting —──────── */
  eslint: {
    // Allow production builds to finish even if ESLint errors exist
    ignoreDuringBuilds: true,
  },

  /* —──────── Remote images whitelist —──────── */
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com',   pathname: '/**' },
      { protocol: 'https', hostname: 'unsplash.com',          pathname: '/**' },
      { protocol: 'https', hostname: 'picsum.photos',         pathname: '/**' },
      { protocol: 'https', hostname: 'images.unsplash.com',   pathname: '/' },
      { protocol: 'https', hostname: 'unsplash.com',          pathname: '/' },
      { protocol: 'https', hostname: 'picsum.photos',         pathname: '/' },
      { protocol: 'https', hostname: 'via.placeholder.com',   pathname: '/**' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com', pathname: '/**' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com',       pathname: '/**' },
      { protocol: 'https', hostname: 'res.cloudinary.com',    pathname: '/**' },
      { protocol: 'https',
        hostname: 'api.producthunt.com',
        pathname: '/widgets/embed-image/**',
      },
    ],
  },

  /* —──────── Security headers —──────── */
  async headers() {
    return [
      {
        source: '/personality-test',
        headers: [
          {
            key: 'Content-Security-Policy',
            value:
              "frame-src 'self' https://*.typeform.com https://typeform.com; " +
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.typeform.com https://typeform.com; " +
              "connect-src 'self' https://*.typeform.com https://typeform.com https://api.typeform.com;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;