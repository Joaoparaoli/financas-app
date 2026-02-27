import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import { createUser, findUserByEmail } from './core-db';

const SALT_ROUNDS = 10;

export async function registerUser({ name, email, password }) {
  if (!name || !email || !password) {
    throw new Error('Todos os campos são obrigatórios');
  }

  const existing = await findUserByEmail(email);
  if (existing) {
    throw new Error('Já existe um usuário com este e-mail');
  }

  const id = randomUUID();
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  return createUser({ id, name: name.trim(), email: email.trim(), passwordHash });
}

export async function authenticateUser({ email, password }) {
  if (!email || !password) {
    throw new Error('E-mail e senha são obrigatórios');
  }

  const user = await findUserByEmail(email);
  if (!user) {
    throw new Error('Credenciais inválidas');
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    throw new Error('Credenciais inválidas');
  }

  return user;
}
