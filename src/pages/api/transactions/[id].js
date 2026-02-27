import { withSupabase } from '@/lib/supabase-server'

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
    const { data: transaction, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !transaction) {
      return res.status(404).json({ error: 'Transaction not found' })
    }

    return res.status(200).json(transaction)
  } catch (error) {
    console.error('Error fetching transaction:', error)
    return res.status(500).json({ error: 'Failed to fetch transaction' })
  }
}

async function handlePut(id, req, res, supabase, user) {
  try {
    const { data: existing, error: fetchError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
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
    if (date !== undefined) data.date = new Date(date).toISOString()
    if (category !== undefined) data.category = category
    if (description !== undefined) data.description = description

    const { data: transaction, error } = await supabase
      .from('transactions')
      .update(data)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating transaction:', error)
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json(transaction)
  } catch (error) {
    console.error('Error updating transaction:', error)
    return res.status(500).json({ error: 'Failed to update transaction' })
  }
}

async function handleDelete(id, res, supabase, user) {
  try {
    const { data: existing, error: fetchError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existing) {
      return res.status(404).json({ error: 'Transaction not found' })
    }

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

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

export default withSupabase(handler)
