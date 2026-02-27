import { getSessionUser } from './session';
import { ensureTenantDbExists } from './auth';
import { getTenantPrismaClient } from './tenant-prisma';

export default function withTenantPrisma(handler) {
  return async function tenantHandler(req, res) {
    try {
      const user = getSessionUser(req);
      if (!user) {
        return res.status(401).json({ error: 'Não autenticado' });
      }

      const tenantPath = ensureTenantDbExists(user);
      const prisma = getTenantPrismaClient(tenantPath);

      req.user = user;
      return await handler(req, res, prisma);
    } catch (error) {
      console.error('[withTenantPrisma]', error);
      if (!res.headersSent) {
        return res.status(500).json({ error: 'Erro interno' });
      }
      return res.end();
    }
  };
}
