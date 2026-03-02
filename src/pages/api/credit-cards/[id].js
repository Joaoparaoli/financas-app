import { withSupabase } from '@/lib/supabase-server'

function serializeCreditCard(row) {
  if (!row) return row

  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    institution: row.institution,
    closingDay: row.closing_day,
    dueDay: row.due_day,
    creditLimit: row.credit_limit === null ? null : Number(row.credit_limit),
    color: row.color,
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
    const { data: creditCard, error } = await supabase
      .from('credit_cards')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !creditCard) {
      return res.status(404).json({ error: 'Credit card not found' })
    }

    return res.status(200).json(serializeCreditCard(creditCard))
  } catch (error) {
    console.error('Error fetching credit card:', error)
    return res.status(500).json({ error: 'Failed to fetch credit card' })
  }
}

async function handlePut(id, req, res, supabase, user) {
  try {
    const { data: existing, error: fetchError } = await supabase
      .from('credit_cards')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existing) {
      return res.status(404).json({ error: 'Credit card not found' })
    }

    const { name, institution, closingDay, dueDay, creditLimit, color } = req.body

    const parsedClosingDay =
      closingDay === undefined || closingDay === null || closingDay === ''
        ? null
        : parseInt(closingDay, 10)
    const parsedDueDay =
      dueDay === undefined || dueDay === null || dueDay === ''
        ? null
        : parseInt(dueDay, 10)
    const parsedCreditLimit =
      creditLimit === undefined || creditLimit === null || creditLimit === ''
        ? null
        : parseFloat(creditLimit)

    if (closingDay !== undefined && parsedClosingDay !== null && (isNaN(parsedClosingDay) || parsedClosingDay < 1 || parsedClosingDay > 31)) {
      return res.status(400).json({ error: 'Closing day must be between 1 and 31' })
    }

    if (dueDay !== undefined && parsedDueDay !== null && (isNaN(parsedDueDay) || parsedDueDay < 1 || parsedDueDay > 31)) {
      return res.status(400).json({ error: 'Due day must be between 1 and 31' })
    }

    if (creditLimit !== undefined && parsedCreditLimit !== null && (isNaN(parsedCreditLimit) || parsedCreditLimit < 0)) {
      return res.status(400).json({ error: 'Credit limit must be a non-negative number' })
    }

    const data = {}
    if (name !== undefined) data.name = name ? String(name).trim() : null
    if (institution !== undefined) data.institution = institution ? String(institution).trim() : null
    if (closingDay !== undefined) data.closing_day = parsedClosingDay
    if (dueDay !== undefined) data.due_day = parsedDueDay
    if (creditLimit !== undefined) data.credit_limit = parsedCreditLimit
    if (color !== undefined) data.color = color

    const { data: creditCard, error } = await supabase
      .from('credit_cards')
      .update(data)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating credit card:', error)
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json(serializeCreditCard(creditCard))
  } catch (error) {
    console.error('Error updating credit card:', error)
    return res.status(500).json({ error: 'Failed to update credit card' })
  }
}

async function handleDelete(id, res, supabase, user) {
  try {
    const { data: existing, error: fetchError } = await supabase
      .from('credit_cards')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existing) {
      return res.status(404).json({ error: 'Credit card not found' })
    }

    const { error } = await supabase
      .from('credit_cards')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting credit card:', error)
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json({ message: 'Credit card deleted successfully' })
  } catch (error) {
    console.error('Error deleting credit card:', error)
    return res.status(500).json({ error: 'Failed to delete credit card' })
  }
}

export default withSupabase(handler)
