import { supabaseAdmin, profileIdToUUID } from '@/lib/supabase'

const ALLOWED_PROFILES = ['profile-1', 'profile-2', 'profile-3', 'profile-4', 'profile-5']

function getProfileId(req) {
  const header = req.headers['x-profile-id']
  if (header && ALLOWED_PROFILES.includes(header)) return profileIdToUUID(header)
  return null
}

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
    const { status, category } = req.query
    const query = supabase
      .from('financial_goals')
      .select('*')
      .eq('user_id', profileId)
    if (status) query.eq('status', status)
    if (category) query.eq('category', category)
    query.order('created_at', { ascending: false })

    const { data: financialGoals, error } = await query

    if (error) {
      console.error('Error fetching financial goals:', error)
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json((financialGoals || []).map(serializeFinancialGoal))
  } catch (error) {
    console.error('Error fetching financial goals:', error)
    return res.status(500).json({ error: 'Failed to fetch financial goals' })
  }
}

async function handlePost(req, res, supabase, profileId) {
  try {
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

    if (!title || targetAmount === undefined || targetAmount === null || !targetDate || !category) {
      return res.status(400).json({
        error: 'Fields "title", "targetAmount", "targetDate", and "category" are required',
      })
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({
        error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`,
      })
    }

    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
      })
    }

    const { data: financialGoal, error } = await supabase
      .from('financial_goals')
      .insert({
        user_id: profileId,
        title,
        description: description ?? null,
        target_amount: targetAmount,
        current_amount: currentAmount ?? 0,
        target_date: new Date(targetDate).toISOString(),
        category,
        status: status ?? 'active',
        icon: icon ?? '🎯',
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating financial goal:', error)
      return res.status(500).json({ error: error.message })
    }

    return res.status(201).json(serializeFinancialGoal(financialGoal))
  } catch (error) {
    console.error('Error creating financial goal:', error)
    return res.status(500).json({ error: 'Failed to create financial goal' })
  }
}

export default handler
