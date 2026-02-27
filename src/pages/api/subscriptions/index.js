import { withSupabase } from '@/lib/supabase-server'

const VALID_FREQUENCIES = ['monthly', 'bimonthly', 'quarterly', 'semiannual', 'annual']

async function handler(req, res) {
  const { supabase, user } = req
  const { method } = req

  switch (method) {
    case 'GET':
      return handleGet(req, res, supabase, user)
    case 'POST':
      return handlePost(req, res, supabase, user)
    default:
      res.setHeader('Allow', ['GET', 'POST'])
      return res.status(405).json({ error: `Method ${method} not allowed` })
  }
}

async function handleGet(req, res, supabase, user) {
  try {
    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching subscriptions:', error)
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json(subscriptions || [])
  } catch (error) {
    console.error('Error fetching subscriptions:', error)
    return res.status(500).json({ error: 'Failed to fetch subscriptions' })
  }
}

async function handlePost(req, res, supabase, user) {
  try {
    const { name, amount, frequency, notes, isActive } = req.body

    if (!name || amount === undefined || amount === null || !frequency) {
      return res.status(400).json({
        error: 'Fields "name", "amount", and "frequency" are required',
      })
    }

    if (!VALID_FREQUENCIES.includes(frequency)) {
      return res.status(400).json({
        error: `Invalid frequency. Must be one of: ${VALID_FREQUENCIES.join(', ')}`,
      })
    }

    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: user.id,
        name,
        amount,
        frequency,
        notes: notes ?? null,
        is_active: isActive !== undefined ? isActive : true,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating subscription:', error)
      return res.status(500).json({ error: error.message })
    }

    return res.status(201).json(subscription)
  } catch (error) {
    console.error('Error creating subscription:', error)
    return res.status(500).json({ error: 'Failed to create subscription' })
  }
}

export default withSupabase(handler)
