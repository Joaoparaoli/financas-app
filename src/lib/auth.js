import { randomUUID } from 'crypto';
import fs from 'fs-extra';
import bcrypt from 'bcryptjs';
import { createUser, findUserByEmail } from './core-db';
import { createTenantDatabase } from './tenant-db';

const SALT_ROUNDS = 10;

export async function registerUser({ name, email, password }) {
  if (!name || !email || !password) {
    throw new Error('Todos os campos são obrigatórios');
  }

  const existing = findUserByEmail(email);
  if (existing) {
    throw new Error('Já existe um usuário com este e-mail');
  }

  const id = randomUUID();
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const tenantDbPath = createTenantDatabase(id);

  return createUser({ id, name: name.trim(), email: email.trim(), passwordHash, tenantDbPath });
}

export async function authenticateUser({ email, password }) {
  if (!email || !password) {
    throw new Error('E-mail e senha são obrigatórios');
  }

  const user = findUserByEmail(email);
  if (!user) {
    throw new Error('Credenciais inválidas');
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    throw new Error('Credenciais inválidas');
  }

  return user;
}

export function getTenantPathFromUser(user) {
  if (!user?.tenantDbPath) {
    throw new Error('Usuário sem banco configurado');
  }
  return user.tenantDbPath.startsWith('file:')
    ? user.tenantDbPath.replace('file:', '')
    : user.tenantDbPath;
}

export function ensureTenantDbExists(user) {
  const tenantPath = getTenantPathFromUser(user);
  if (!tenantPath || !fs.existsSync(tenantPath)) {
    throw new Error('Banco do usuário não encontrado');
  }
  return tenantPath;
}
