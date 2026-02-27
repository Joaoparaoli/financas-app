import { withSupabase } from '@/lib/supabase-server'

const VALID_TYPES = [
  'real_estate_rental',
  'business',
  'stocks_dividends',
  'investment_income',
  'intellectual_property',
  'other_income',
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
    const { data: assets, error } = await supabase
      .from('assets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching assets:', error)
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json(assets || [])
  } catch (error) {
    console.error('Error fetching assets:', error)
    return res.status(500).json({ error: 'Failed to fetch assets' })
  }
}

async function handlePost(req, res, supabase, user) {
  try {
    const { type, name, currentValue, monthlyIncome, acquisitionDate, acquisitionValue, notes } = req.body

    if (!type || !name) {
      return res.status(400).json({ error: 'Fields "type" and "name" are required' })
    }

    if (!VALID_TYPES.includes(type)) {
      return res.status(400).json({
        error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}`,
      })
    }

    const { data: asset, error } = await supabase
      .from('assets')
      .insert({
        user_id: user.id,
        type,
        name,
        current_value: currentValue ?? 0,
        monthly_income: monthlyIncome ?? 0,
        acquisition_date: acquisitionDate ? new Date(acquisitionDate).toISOString() : null,
        acquisition_value: acquisitionValue ?? null,
        notes: notes ?? null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating asset:', error)
      return res.status(500).json({ error: error.message })
    }

    return res.status(201).json(asset)
  } catch (error) {
    console.error('Error creating asset:', error)
    return res.status(500).json({ error: 'Failed to create asset' })
  }
}

export default withSupabase(handler)
