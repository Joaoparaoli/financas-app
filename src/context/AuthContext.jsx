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

  const refreshUser = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user: supabaseUser }, error } = await supabase.auth.getUser();
      if (error) throw error;
      setUser(supabaseUser);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
    
    // Listener para mudanças de auth
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
        const { error } = await supabase.auth.signInWithPassword({
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
    [refreshUser, router]
  );

  const register = useCallback(
    async ({ name, email, password }, options = {}) => {
      const redirectTo = options.redirectTo || '/financas';
      try {
        const { error } = await supabase.auth.signUp({
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
    [refreshUser, router]
  );

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
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
