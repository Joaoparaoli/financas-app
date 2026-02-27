import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import { toast } from 'sonner'

const AuthContext = createContext({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
})

export function AuthProvider({ children }) {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [supabase, setSupabase] = useState(null)

  // Initialize Supabase client only on client side
  useEffect(() => {
    const initSupabase = async () => {
      try {
        const { createClientComponentClient } = await import('@supabase/auth-helpers-nextjs')
        const client = createClientComponentClient()
        setSupabase(client)
      } catch (error) {
        console.error('Error initializing Supabase:', error)
        setLoading(false)
      }
    }
    
    initSupabase()
  }, [])

  const refreshUser = useCallback(async () => {
    if (!supabase) return
    
    try {
      setLoading(true)
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) {
        console.error('Error getting user:', error)
        setUser(null)
      } else {
        setUser(user)
      }
    } catch (error) {
      console.error('Error in refreshUser:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const handleAuthSuccess = useCallback(
    async (redirectTo = '/financas') => {
      await refreshUser()
      router.replace(redirectTo)
    },
    [refreshUser, router]
  )

  useEffect(() => {
    if (!supabase) return

    refreshUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setUser(session.user)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          router.replace('/login')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [refreshUser, supabase, router])

  const login = useCallback(
    async ({ email, password }, options = {}) => {
      if (!supabase) throw new Error('Supabase not initialized')
      
      const redirectTo = options.redirectTo || '/financas'
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          throw new Error(error.message)
        }

        await handleAuthSuccess(redirectTo)
        toast.success('Login realizado com sucesso')
      } catch (error) {
        toast.error(error.message)
        throw error
      }
    },
    [handleAuthSuccess, supabase]
  )

  const register = useCallback(
    async ({ name, email, password }, options = {}) => {
      if (!supabase) throw new Error('Supabase not initialized')
      
      const redirectTo = options.redirectTo || '/financas'
      try {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name,
            }
          }
        })

        if (error) {
          throw new Error(error.message)
        }

        await handleAuthSuccess(redirectTo)
        toast.success('Conta criada com sucesso')
      } catch (error) {
        toast.error(error.message)
        throw error
      }
    },
    [handleAuthSuccess, supabase]
  )

  const logout = useCallback(async () => {
    if (!supabase) return
    
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Error logging out:', error)
      }
    } finally {
      setUser(null)
      router.replace('/login')
    }
  }, [supabase, router])

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
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
