/**
 * Prisma Client Singleton
 * Verhindert mehrfache Instanziierung in Development (Hot Reload)
 */

import { PrismaClient } from '@prisma/client';

// Globale Variable für Prisma Client (nur in Development)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Prisma Client Singleton
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

// In Development: Speichere Client in globalem Scope
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;

