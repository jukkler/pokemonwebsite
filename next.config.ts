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
    // Erlaube Bilder aus dem uploads-Verzeichnis
    unoptimized: false,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Rewrites: Leitet /uploads/avatars/* an die API-Route weiter,
  // da Next.js standalone mode keine zur Laufzeit hinzugefügten
  // Dateien aus public/ ausliefert.
  async rewrites() {
    return [
      {
        source: '/uploads/avatars/:filename',
        destination: '/api/uploads/avatars/:filename',
      },
    ];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
