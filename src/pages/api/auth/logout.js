import { clearSession } from '@/lib/session';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  clearSession(res);
  return res.status(200).json({ message: 'Sessão encerrada com sucesso' });
}
