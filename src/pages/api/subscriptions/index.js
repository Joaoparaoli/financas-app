import { supabaseAdmin, profileIdToUUID } from '@/lib/supabase'

const ALLOWED_PROFILES = ['profile-1', 'profile-2', 'profile-3', 'profile-4', 'profile-5']

function getProfileId(req) {
  const header = req.headers['x-profile-id']
  if (header && ALLOWED_PROFILES.includes(header)) return profileIdToUUID(header)
  return null
}

function serializeSubscription(row) {
  if (!row) return row

  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    amount: row.amount === null ? null : Number(row.amount),
    frequency: row.frequency,
    notes: row.notes,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

const VALID_FREQUENCIES = ['monthly', 'bimonthly', 'quarterly', 'semiannual', 'annual']

async function handler(req, res) {
  const supabase = supabaseAdmin
  const profileId = getProfileId(req)
  if (!supabase) return res.status(500).json({ error: 'Supabase não configurado' })
  if (!profileId) return res.status(400).json({ error: 'Perfil não informado ou inválido' })
  const { method } = req

  switch (method) {
    case 'GET':
      return handleGet(req, res, supabase, profileId)
    case 'POST':
      return handlePost(req, res, supabase, profileId)
    default:
      res.setHeader('Allow', ['GET', 'POST'])
      return res.status(405).json({ error: `Method ${method} not allowed` })
  }
}

async function handleGet(req, res, supabase, profileId) {
  try {
    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', profileId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching subscriptions:', error)
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json((subscriptions || []).map(serializeSubscription))
  } catch (error) {
    console.error('Error fetching subscriptions:', error)
    return res.status(500).json({ error: 'Failed to fetch subscriptions' })
  }
}

async function handlePost(req, res, supabase, profileId) {
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
        user_id: profileId,
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

    return res.status(201).json(serializeSubscription(subscription))
  } catch (error) {
    console.error('Error creating subscription:', error)
    return res.status(500).json({ error: 'Failed to create subscription' })
  }
}

export default handler
