import { supabaseAdmin, profileIdToUUID } from '@/lib/supabase'

const ALLOWED_PROFILES = ['profile-1', 'profile-2', 'profile-3', 'profile-4', 'profile-5']

function getProfileId(req) {
  const header = req.headers['x-profile-id']
  if (header && ALLOWED_PROFILES.includes(header)) return profileIdToUUID(header)
  return null
}

function serializeTransaction(row) {
  if (!row) return row
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    amount: row.amount === null ? null : Number(row.amount),
    type: row.type,
    status: row.status,
    date: row.date,
    category: row.category,
    description: row.description,
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
    const { data: transaction, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .eq('user_id', profileId)
      .single()

    if (error || !transaction) {
      return res.status(404).json({ error: 'Transaction not found' })
    }

    return res.status(200).json(serializeTransaction(transaction))
  } catch (error) {
    console.error('Error fetching transaction:', error)
    return res.status(500).json({ error: 'Failed to fetch transaction' })
  }
}

async function handlePut(id, req, res, supabase, profileId) {
  try {
    const { data: existing, error: fetchError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .eq('user_id', profileId)
      .single()

    if (fetchError || !existing) {
      return res.status(404).json({ error: 'Transaction not found' })
    }

    const { title, amount, type, status, date, category, description } = req.body

    if (type && !['income', 'expense'].includes(type)) {
      return res.status(400).json({ error: 'Type must be "income" or "expense"' })
    }
    if (status && !['completed', 'predicted'].includes(status)) {
      return res.status(400).json({ error: 'Status must be "completed" or "predicted"' })
    }

    const data = {}
    if (title !== undefined) data.title = title
    if (amount !== undefined) data.amount = parseFloat(amount)
    if (type !== undefined) data.type = type
    if (status !== undefined) data.status = status
    if (date !== undefined) data.date = date ? new Date(date).toISOString() : null
    if (category !== undefined) data.category = category
    if (description !== undefined) data.description = description

    const { data: transaction, error } = await supabase
      .from('transactions')
      .update(data)
      .eq('id', id)
      .eq('user_id', profileId)
      .select()
      .single()

    if (error) {
      console.error('Error updating transaction:', error)
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json(serializeTransaction(transaction))
  } catch (error) {
    console.error('Error updating transaction:', error)
    return res.status(500).json({ error: 'Failed to update transaction' })
  }
}

async function handleDelete(id, res, supabase, profileId) {
  try {
    const { data: existing, error: fetchError } = await supabase
      .from('transactions')
      .select('id')
      .eq('id', id)
      .eq('user_id', profileId)
      .single()

    if (fetchError || !existing) {
      return res.status(404).json({ error: 'Transaction not found' })
    }

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', profileId)

    if (error) {
      console.error('Error deleting transaction:', error)
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json({ message: 'Transaction deleted successfully' })
  } catch (error) {
    console.error('Error deleting transaction:', error)
    return res.status(500).json({ error: 'Failed to delete transaction' })
  }
}

export default handler
