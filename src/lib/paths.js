import path from 'path';

function normalizeFileUrl(value, fallback) {
  let target = value || fallback;
  if (!target) {
    throw new Error('Path value is required');
  }
  if (target.startsWith('file:')) {
    target = target.replace('file:', '');
  }
  return path.resolve(process.cwd(), target);
}

export const templateDbPath = normalizeFileUrl(process.env.DATABASE_URL, 'file:./data/template.db');
export const coreDbPath = normalizeFileUrl(process.env.CORE_DATABASE_URL, 'file:./data/core.db');
export const tenantsDir = normalizeFileUrl(process.env.TENANTS_DIR, 'data/tenants');

export function resolveTenantDbPath(filename) {
  return path.resolve(tenantsDir, filename);
}
