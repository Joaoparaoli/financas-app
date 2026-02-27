import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs'

export function withSupabase(handler) {
  return async function (req, res) {
    // Create Supabase client
    const supabase = createServerSupabaseClient({ req, res })

    // Get user from Supabase
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Add supabase and user to request
    req.supabase = supabase
    req.user = user

    // Call the original handler
    return handler(req, res)
  }
}
