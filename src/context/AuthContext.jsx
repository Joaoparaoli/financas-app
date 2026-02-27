import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';

const AuthContext = createContext({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
});

async function requestJson(url, { body, method = 'GET' } = {}) {
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'same-origin',
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    let errorData = null;
    try {
      errorData = await response.json();
    } catch {
      errorData = null;
    }
    const message = errorData?.error || errorData?.message || `Erro ${response.status}: Falha na requisição`;
    throw new Error(message);
  }

  return response.json().catch(() => ({}));
}

export function AuthProvider({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      setLoading(true);
      const data = await requestJson('/api/auth/me');
      setUser(data.user ?? null);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAuthSuccess = useCallback(
    async (redirectTo = '/financas') => {
      await refreshUser();
      router.replace(redirectTo);
    },
    [refreshUser, router]
  );

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(
    async ({ email, password }, options = {}) => {
      const redirectTo = options.redirectTo || '/financas';
      try {
        await requestJson('/api/auth/login', { method: 'POST', body: { email, password } });
        await handleAuthSuccess(redirectTo);
        toast.success('Login realizado com sucesso');
      } catch (error) {
        toast.error(error.message);
        throw error;
      }
    },
    [handleAuthSuccess]
  );

  const register = useCallback(
    async ({ name, email, password }, options = {}) => {
      const redirectTo = options.redirectTo || '/financas';
      try {
        await requestJson('/api/auth/register', {
          method: 'POST',
          body: { name, email, password },
        });
        await handleAuthSuccess(redirectTo);
        toast.success('Conta criada com sucesso');
      } catch (error) {
        toast.error(error.message);
        throw error;
      }
    },
    [handleAuthSuccess]
  );

  const logout = useCallback(async () => {
    try {
      await requestJson('/api/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
      router.replace('/login');
    }
  }, [router]);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      refreshUser,
      isAuthenticated: Boolean(user),
    }),
    [user, loading, login, register, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
