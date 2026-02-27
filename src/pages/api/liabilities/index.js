import { withSupabase } from '@/lib/supabase-server'

const VALID_TYPES = [
  'vehicle',
  'real_estate_own',
  'electronics',
  'luxury_items',
  'subscriptions',
  'personal_items',
  'other_expense',
]

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
    const { data: liabilities, error } = await supabase
      .from('liabilities')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching liabilities:', error)
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json(liabilities || [])
  } catch (error) {
    console.error('Error fetching liabilities:', error)
    return res.status(500).json({ error: 'Failed to fetch liabilities' })
  }
}

async function handlePost(req, res, supabase, user) {
  try {
    const {
      type,
      name,
      currentValue,
      monthlyExpense,
      acquisitionDate,
      acquisitionValue,
      notes,
    } = req.body

    if (!type || !name) {
      return res.status(400).json({ error: 'Fields "type" and "name" are required' })
    }

    if (!VALID_TYPES.includes(type)) {
      return res.status(400).json({
        error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}`,
      })
    }

    const { data: liability, error } = await supabase
      .from('liabilities')
      .insert({
        user_id: user.id,
        type,
        name,
        current_value: currentValue ?? 0,
        monthly_expense: monthlyExpense ?? 0,
        acquisition_date: acquisitionDate ? new Date(acquisitionDate).toISOString() : null,
        acquisition_value: acquisitionValue ?? null,
        notes: notes ?? null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating liability:', error)
      return res.status(500).json({ error: error.message })
    }

    return res.status(201).json(liability)
  } catch (error) {
    console.error('Error creating liability:', error)
    return res.status(500).json({ error: 'Failed to create liability' })
  }
}

export default withSupabase(handler)
