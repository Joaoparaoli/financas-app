import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs-extra';
import { tenantsDir } from './paths';

const globalForTenants = globalThis;

if (!globalForTenants.__tenantPrismaCache) {
  globalForTenants.__tenantPrismaCache = new Map();
}

const cache = globalForTenants.__tenantPrismaCache;

function normalizeTenantPath(dbPath) {
  const target = dbPath.startsWith('file:') ? dbPath.replace('file:', '') : dbPath;
  return path.resolve(target);
}

export function getTenantPrismaClient(dbPath) {
  if (!dbPath) {
    throw new Error('Tenant database path is required');
  }

  const normalizedPath = normalizeTenantPath(dbPath);
  if (!normalizedPath.startsWith(path.resolve(tenantsDir))) {
    throw new Error('Invalid tenant database location');
  }

  if (!fs.existsSync(normalizedPath)) {
    throw new Error('Tenant database file not found');
  }

  if (cache.has(normalizedPath)) {
    return cache.get(normalizedPath);
  }

  const client = new PrismaClient({
    datasources: {
      db: {
        url: `file:${normalizedPath}`,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

  cache.set(normalizedPath, client);
  return client;
}
