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
  const { id } = req.query
  const { method } = req

  switch (method) {
    case 'GET':
      return handleGet(id, res, supabase, user)
    case 'PUT':
      return handlePut(id, req, res, supabase, user)
    case 'DELETE':
      return handleDelete(id, res, supabase, user)
    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
      return res.status(405).json({ error: `Method ${method} not allowed` })
  }
}

async function handleGet(id, res, supabase, user) {
  try {
    const { data: asset, error } = await supabase
      .from('assets')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !asset) {
      return res.status(404).json({ error: 'Asset not found' })
    }

    return res.status(200).json(asset)
  } catch (error) {
    console.error('Error fetching asset:', error)
    return res.status(500).json({ error: 'Failed to fetch asset' })
  }
}

async function handlePut(id, req, res, supabase, user) {
  try {
    const { data: existing, error: fetchError } = await supabase
      .from('assets')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existing) {
      return res.status(404).json({ error: 'Asset not found' })
    }

    const { type, name, currentValue, monthlyIncome, acquisitionDate, acquisitionValue, notes } = req.body

    if (type && !VALID_TYPES.includes(type)) {
      return res.status(400).json({
        error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}`,
      })
    }

    const data = {}
    if (type !== undefined) data.type = type
    if (name !== undefined) data.name = name
    if (currentValue !== undefined) data.current_value = currentValue
    if (monthlyIncome !== undefined) data.monthly_income = monthlyIncome
    if (acquisitionDate !== undefined)
      data.acquisition_date = acquisitionDate ? new Date(acquisitionDate).toISOString() : null
    if (acquisitionValue !== undefined) data.acquisition_value = acquisitionValue
    if (notes !== undefined) data.notes = notes

    const { data: asset, error } = await supabase
      .from('assets')
      .update(data)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating asset:', error)
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json(asset)
  } catch (error) {
    console.error('Error updating asset:', error)
    return res.status(500).json({ error: 'Failed to update asset' })
  }
}

async function handleDelete(id, res, supabase, user) {
  try {
    const { data: existing, error: fetchError } = await supabase
      .from('assets')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existing) {
      return res.status(404).json({ error: 'Asset not found' })
    }

    const { error } = await supabase
      .from('assets')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting asset:', error)
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json({ message: 'Asset deleted successfully' })
  } catch (error) {
    console.error('Error deleting asset:', error)
    return res.status(500).json({ error: 'Failed to delete asset' })
  }
}

export default withSupabase(handler)
