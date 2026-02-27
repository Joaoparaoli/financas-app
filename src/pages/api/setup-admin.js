// Simples API para criar usuário admin inicial
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import { createUser, findUserByEmail } from '@/lib/core-db';
import { createTenantDatabase } from '@/lib/tenant-db';

const SALT_ROUNDS = 10;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const existing = findUserByEmail('admin@financas.com');
    if (existing) {
      return res.status(200).json({
        message: 'Admin já existe',
        email: 'admin@financas.com',
        password: 'admin123'
      });
    }

    const id = randomUUID();
    const passwordHash = await bcrypt.hash('admin123', SALT_ROUNDS);
    const tenantDbPath = createTenantDatabase(id);
    
    const user = createUser({
      id,
      name: 'Administrador',
      email: 'admin@financas.com',
      passwordHash,
      tenantDbPath
    });

    return res.status(201).json({
      message: 'Admin criado com sucesso',
      email: 'admin@financas.com',
      password: 'admin123'
    });
  } catch (error) {
    console.error('[setup-admin]', error);
    return res.status(500).json({ error: error.message });
  }
}
