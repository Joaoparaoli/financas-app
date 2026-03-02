import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

const AuthContext = createContext({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const getClientOrThrow = useCallback(() => {
    if (!supabase) {
      throw new Error('Supabase não inicializado. Verifique NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.');
    }
    return supabase;
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      setLoading(true);
      const client = getClientOrThrow();
      const { data: { user: supabaseUser }, error } = await client.auth.getUser();
      if (error) throw error;
      setUser(supabaseUser);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [getClientOrThrow]);

  useEffect(() => {
    refreshUser();
    
    // Listener para mudanças de auth
    if (!supabase) {
      setLoading(false);
      return undefined;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [refreshUser]);

  const login = useCallback(
    async ({ email, password }, options = {}) => {
      const redirectTo = options.redirectTo || '/financas';
      try {
        const client = getClientOrThrow();
        const { error } = await client.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        
        await refreshUser();
        router.replace(redirectTo);
        toast.success('Login realizado com sucesso');
      } catch (error) {
        toast.error(error.message);
        throw error;
      }
    },
    [getClientOrThrow, refreshUser, router]
  );

  const register = useCallback(
    async ({ name, email, password }, options = {}) => {
      const redirectTo = options.redirectTo || '/financas';
      try {
        const client = getClientOrThrow();
        const { error } = await client.auth.signUp({
          email,
          password,
          options: {
            data: { name },
          },
        });
        
        if (error) throw error;
        
        await refreshUser();
        router.replace(redirectTo);
        toast.success('Conta criada com sucesso');
      } catch (error) {
        toast.error(error.message);
        throw error;
      }
    },
    [getClientOrThrow, refreshUser, router]
  );

  const logout = useCallback(async () => {
    try {
      const client = getClientOrThrow();
      await client.auth.signOut();
    } finally {
      setUser(null);
      router.replace('/login');
    }
  }, [getClientOrThrow, router]);

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
