import { getSessionUser } from '@/lib/session';

function sanitize(user) {
  if (!user) return null;
  const { passwordHash, ...safe } = user;
  return safe;
}

export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  const user = getSessionUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  return res.status(200).json({ user: sanitize(user) });
}
