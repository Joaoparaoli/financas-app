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

function serializeLiability(row) {
  if (!row) return row

  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    name: row.name,
    currentValue: row.current_value === null ? null : Number(row.current_value),
    monthlyExpense: row.monthly_expense === null ? null : Number(row.monthly_expense),
    acquisitionDate: row.acquisition_date,
    acquisitionValue: row.acquisition_value === null ? null : Number(row.acquisition_value),
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

async function handler(req, res) {
  const { id } = req.query
  const { supabase, user } = req
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
    const { data: liability, error } = await supabase
      .from('liabilities')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !liability) {
      return res.status(404).json({ error: 'Liability not found' })
    }

    return res.status(200).json(serializeLiability(liability))
  } catch (error) {
    console.error('Error fetching liability:', error)
    return res.status(500).json({ error: 'Failed to fetch liability' })
  }
}

async function handlePut(id, req, res, supabase, user) {
  try {
    const { data: existing, error: fetchError } = await supabase
      .from('liabilities')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existing) {
      return res.status(404).json({ error: 'Liability not found' })
    }

    const {
      type,
      name,
      currentValue,
      monthlyExpense,
      acquisitionDate,
      acquisitionValue,
      notes,
    } = req.body

    if (type && !VALID_TYPES.includes(type)) {
      return res.status(400).json({
        error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}`,
      })
    }

    const data = {}
    if (type !== undefined) data.type = type
    if (name !== undefined) data.name = name
    if (currentValue !== undefined) data.current_value = currentValue
    if (monthlyExpense !== undefined) data.monthly_expense = monthlyExpense
    if (acquisitionDate !== undefined)
      data.acquisition_date = acquisitionDate ? new Date(acquisitionDate).toISOString() : null
    if (acquisitionValue !== undefined) data.acquisition_value = acquisitionValue
    if (notes !== undefined) data.notes = notes

    const { data: liability, error } = await supabase
      .from('liabilities')
      .update(data)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating liability:', error)
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json(serializeLiability(liability))
  } catch (error) {
    console.error('Error updating liability:', error)
    return res.status(500).json({ error: 'Failed to update liability' })
  }
}

async function handleDelete(id, res, supabase, user) {
  try {
    const { data: existing, error: fetchError } = await supabase
      .from('liabilities')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existing) {
      return res.status(404).json({ error: 'Liability not found' })
    }

    const { error } = await supabase
      .from('liabilities')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting liability:', error)
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json({ message: 'Liability deleted successfully' })
  } catch (error) {
    console.error('Error deleting liability:', error)
    return res.status(500).json({ error: 'Failed to delete liability' })
  }
}

export default withSupabase(handler)
