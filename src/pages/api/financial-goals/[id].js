import { supabaseAdmin, profileIdToUUID } from '@/lib/supabase'

const ALLOWED_PROFILES = ['profile-1', 'profile-2', 'profile-3', 'profile-4', 'profile-5']

function getProfileId(req) {
  const header = req.headers['x-profile-id']
  if (header && ALLOWED_PROFILES.includes(header)) return profileIdToUUID(header)
  return null
}

const VALID_CATEGORIES = [
  'emergency_fund',
  'down_payment',
  'debt_payoff',
  'vacation',
  'education',
  'retirement',
  'investment',
  'other',
]

const VALID_STATUSES = ['active', 'completed', 'paused']

function serializeFinancialGoal(row) {
  if (!row) return row

  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    targetAmount: row.target_amount === null ? null : Number(row.target_amount),
    currentAmount: row.current_amount === null ? null : Number(row.current_amount),
    targetDate: row.target_date,
    category: row.category,
    status: row.status,
    icon: row.icon,
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
    const { data: financialGoal, error } = await supabase
      .from('financial_goals')
      .select('*')
      .eq('id', id)
      .eq('user_id', profileId)
      .single()

    if (error || !financialGoal) {
      return res.status(404).json({ error: 'Financial goal not found' })
    }

    return res.status(200).json(serializeFinancialGoal(financialGoal))
  } catch (error) {
    console.error('Error fetching financial goal:', error)
    return res.status(500).json({ error: 'Failed to fetch financial goal' })
  }
}

async function handlePut(id, req, res, supabase, profileId) {
  try {
    const { data: existing, error: fetchError } = await supabase
      .from('financial_goals')
      .select('*')
      .eq('id', id)
      .eq('user_id', profileId)
      .single()

    if (fetchError || !existing) {
      return res.status(404).json({ error: 'Financial goal not found' })
    }

    const {
      title,
      description,
      targetAmount,
      currentAmount,
      targetDate,
      category,
      status,
      icon,
    } = req.body

    if (category && !VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({
        error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`,
      })
    }

    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
      });
    }

    const data = {}
    if (title !== undefined) data.title = title
    if (description !== undefined) data.description = description
    if (targetAmount !== undefined) data.target_amount = targetAmount
    if (currentAmount !== undefined) data.current_amount = currentAmount
    if (targetDate !== undefined) data.target_date = targetDate ? new Date(targetDate).toISOString() : null
    if (category !== undefined) data.category = category
    if (status !== undefined) data.status = status
    if (icon !== undefined) data.icon = icon

    const { data: financialGoal, error } = await supabase
      .from('financial_goals')
      .update(data)
      .eq('id', id)
      .eq('user_id', profileId)
      .select()
      .single()

    if (error) {
      console.error('Error updating financial goal:', error)
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json(serializeFinancialGoal(financialGoal))
  } catch (error) {
    console.error('Error updating financial goal:', error)
    return res.status(500).json({ error: 'Failed to update financial goal' })
  }
}

async function handleDelete(id, res, supabase, profileId) {
  try {
    const { data: existing, error: fetchError } = await supabase
      .from('financial_goals')
      .select('id')
      .eq('id', id)
      .eq('user_id', profileId)
      .single()

    if (fetchError || !existing) {
      return res.status(404).json({ error: 'Financial goal not found' })
    }

    const { error } = await supabase
      .from('financial_goals')
      .delete()
      .eq('id', id)
      .eq('user_id', profileId)

    if (error) {
      console.error('Error deleting financial goal:', error)
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json({ message: 'Financial goal deleted successfully' })
  } catch (error) {
    console.error('Error deleting financial goal:', error)
    return res.status(500).json({ error: 'Failed to delete financial goal' })
  }
}

export default handler
