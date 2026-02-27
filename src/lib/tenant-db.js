import path from 'path';
import fs from 'fs-extra';
import { templateDbPath, tenantsDir, resolveTenantDbPath } from './paths';

function assertTemplateExists() {
  if (!fs.existsSync(templateDbPath)) {
    throw new Error('Template database not found. Run "npx prisma db push" to generate data/template.db');
  }
}

function ensureTenantsDir() {
  fs.ensureDirSync(tenantsDir);
}

export function createTenantDatabase(userId) {
  if (!userId) {
    throw new Error('User id is required to create a tenant database');
  }

  assertTemplateExists();
  ensureTenantsDir();

  const filename = `${userId}.db`;
  const destination = resolveTenantDbPath(filename);

  if (fs.existsSync(destination)) {
    throw new Error('Tenant database already exists for this user');
  }

  fs.copyFileSync(templateDbPath, destination);
  return destination;
}

export function getTenantDatabasePath(userId) {
  if (!userId) {
    throw new Error('User id is required');
  }
  const filename = `${userId}.db`;
  return resolveTenantDbPath(filename);
}
