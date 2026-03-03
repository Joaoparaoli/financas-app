import { supabaseAdmin } from '@/lib/supabase'

const VALID_FREQUENCIES = ['monthly', 'bimonthly', 'quarterly', 'semiannual', 'annual']
const ALLOWED_PROFILES = ['profile-1', 'profile-2', 'profile-3', 'profile-4', 'profile-5']

function getProfileId(req) {
  const header = req.headers['x-profile-id']
  if (header && ALLOWED_PROFILES.includes(header)) return header
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

async function handler(req, res) {
  const { id } = req.query
  const supabase = supabaseAdmin
  const profileId = getProfileId(req)
  if (!supabase) return res.status(500).json({ error: 'Supabase não configurado' })
  if (!profileId) return res.status(400).json({ error: 'Perfil não informado ou inválido' })
  const { method } = req

  switch (method) {
    case 'GET':
      return handleGet(id, res, supabase, profileId)
    case 'PUT':
      return handlePut(id, req, res, supabase, profileId)
    case 'DELETE':
      return handleDelete(id, res, supabase, profileId)
    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
      return res.status(405).json({ error: `Method ${method} not allowed` })
  }
}

async function handleGet(id, res, supabase, profileId) {
  try {
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', id)
      .eq('user_id', profileId)
      .single()

    if (error || !subscription) {
      return res.status(404).json({ error: 'Subscription not found' })
    }

    return res.status(200).json(serializeSubscription(subscription))
  } catch (error) {
    console.error('Error fetching subscription:', error)
    return res.status(500).json({ error: 'Failed to fetch subscription' })
  }
}

async function handlePut(id, req, res, supabase, profileId) {
  try {
    const { data: existing, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', id)
      .eq('user_id', profileId)
      .single()

    if (fetchError || !existing) {
      return res.status(404).json({ error: 'Subscription not found' })
    }

    const { name, amount, frequency, notes, isActive } = req.body

    if (frequency && !VALID_FREQUENCIES.includes(frequency)) {
      return res.status(400).json({
        error: `Invalid frequency. Must be one of: ${VALID_FREQUENCIES.join(', ')}`,
      })
    }

    const data = {}
    if (name !== undefined) data.name = name
    if (amount !== undefined) data.amount = amount
    if (frequency !== undefined) data.frequency = frequency
    if (notes !== undefined) data.notes = notes
    if (isActive !== undefined) data.is_active = isActive

    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .update(data)
      .eq('id', id)
      .eq('user_id', profileId)
      .select()
      .single()

    if (error) {
      console.error('Error updating subscription:', error)
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json(serializeSubscription(subscription))
  } catch (error) {
    console.error('Error updating subscription:', error)
    return res.status(500).json({ error: 'Failed to update subscription' })
  }
}

async function handleDelete(id, res, supabase, profileId) {
  try {
    const { data: existing, error: fetchError } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('id', id)
      .eq('user_id', profileId)
      .single()

    if (fetchError || !existing) {
      return res.status(404).json({ error: 'Subscription not found' })
    }

    const { error } = await supabase
      .from('subscriptions')
      .delete()
      .eq('id', id)
      .eq('user_id', profileId)

    if (error) {
      console.error('Error deleting subscription:', error)
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json({ message: 'Subscription deleted successfully' })
  } catch (error) {
    console.error('Error deleting subscription:', error)
    return res.status(500).json({ error: 'Failed to delete subscription' })
  }
}

export default handler
