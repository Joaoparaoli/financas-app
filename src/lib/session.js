import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import { getUserById } from './core-db';

const COOKIE_NAME = 'financas_session';
const TOKEN_TTL = '30d';

function getSecret() {
  if (!process.env.AUTH_SECRET) {
    throw new Error('AUTH_SECRET is not configured');
  }
  return process.env.AUTH_SECRET;
}

export function createSession(res, user) {
  const token = jwt.sign({ userId: user.id }, getSecret(), { expiresIn: TOKEN_TTL });
  const serialized = cookie.serialize(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  res.setHeader('Set-Cookie', serialized);
}

export function clearSession(res) {
  const serialized = cookie.serialize(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  res.setHeader('Set-Cookie', serialized);
}

export function getTokenFromRequest(req) {
  if (!req.headers.cookie) return null;
  const cookies = cookie.parse(req.headers.cookie || '');
  return cookies[COOKIE_NAME] || null;
}

export function getSessionUser(req) {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  try {
    const payload = jwt.verify(token, getSecret());
    if (!payload?.userId) return null;
    return getUserById(payload.userId);
  } catch (error) {
    return null;
  }
}
