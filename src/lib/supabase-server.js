import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function createSupabaseClient(req, res) {
  return createServerSupabaseClient({
    req,
    res,
    options: {
      cookies: {
        getAll() {
          return Object.entries(req.cookies || {}).map(([name, value]) => ({
            name,
            value,
          }))
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            if (res.cookie) {
              res.cookie(name, value, options)
            }
          })
        },
      },
    },
  })
}

export async function getCurrentUser(req, res) {
  const supabase = await createSupabaseClient(req, res)
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

export function withSupabase(handler) {
  return async function supabaseHandler(req, res) {
    try {
      const user = await getCurrentUser(req, res)
      if (!user) {
        return res.status(401).json({ error: 'Não autenticado' })
      }
      const supabase = await createSupabaseClient(req, res)
      req.user = user
      req.supabase = supabase
      return await handler(req, res)
    } catch (error) {
      console.error('[withSupabase]', error)
      if (!res.headersSent) {
        return res.status(500).json({ error: 'Erro interno' })
      }
      return res.end()
    }
  }
}
