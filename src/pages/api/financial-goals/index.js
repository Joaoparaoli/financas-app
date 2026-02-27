import { withSupabase } from '@/lib/supabase-server'

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
    const { data: financialGoals, error } = await supabase
      .from('financial_goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching financial goals:', error)
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json(financialGoals || [])
  } catch (error) {
    console.error('Error fetching financial goals:', error)
    return res.status(500).json({ error: 'Failed to fetch financial goals' })
  }
}

async function handlePost(req, res, supabase, user) {
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
        user_id: user.id,
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

    return res.status(201).json(financialGoal)
  } catch (error) {
    console.error('Error creating financial goal:', error)
    return res.status(500).json({ error: 'Failed to create financial goal' })
  }
}

export default withSupabase(handler)
