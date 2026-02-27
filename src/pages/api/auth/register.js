import { registerUser } from '@/lib/auth';
import { createSession } from '@/lib/session';

function sanitizeUser(user) {
  if (!user) return null;
  const { passwordHash, ...safe } = user;
  return safe;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  try {
    const { name, email, password } = req.body || {};
    const user = await registerUser({ name, email, password });
    createSession(res, user);
    return res.status(201).json({ user: sanitizeUser(user) });
  } catch (error) {
    console.error('[POST /api/auth/register]', error);
    const message = error?.message || 'Falha ao registrar usuário';
    const status = error?.message ? 400 : 500;
    return res.status(status).json({ error: message });
  }
}
