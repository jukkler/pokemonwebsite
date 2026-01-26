import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
        pathname: '/PokeAPI/**',
      },
    ],
    // Performance: Moderne Bildformate für bessere Kompression
    formats: ['image/avif', 'image/webp'],
    // Performance: Längere Cache-Dauer für Sprites (30 Tage)
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
};

export default nextConfig;
