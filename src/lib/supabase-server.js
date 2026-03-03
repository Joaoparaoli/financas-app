import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'

function getBearerToken(req) {
  const authHeader = req.headers?.authorization || ''
  if (!authHeader.toLowerCase().startsWith('bearer ')) return null
  return authHeader.slice(7).trim() || null
}

async function getCurrentUserFromBearer(req) {
  const token = getBearerToken(req)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!token || !supabaseUrl || !supabaseKey) return null

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token)

  if (error) return null
  return user
}

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
  const bearerUser = await getCurrentUserFromBearer(req)
  if (bearerUser) {
    return bearerUser
  }

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
        return res.status(500).json({ error: error?.message || 'Erro interno' })
      }
      return res.end()
    }
  }
}
