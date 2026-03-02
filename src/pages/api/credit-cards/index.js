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
    const { data: creditCards, error } = await supabase
      .from('credit_cards')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching credit cards:', error)
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json((creditCards || []).map(serializeCreditCard))
  } catch (error) {
    console.error('Error fetching credit cards:', error)
    return res.status(500).json({ error: 'Failed to fetch credit cards' })
  }
}

async function handlePost(req, res, supabase, user) {
  try {
    const { name, institution, closingDay, dueDay, creditLimit, color } = req.body

    if (!name) {
      return res.status(400).json({ error: 'Field "name" is required' })
    }

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

    if (parsedClosingDay !== null && (isNaN(parsedClosingDay) || parsedClosingDay < 1 || parsedClosingDay > 31)) {
      return res.status(400).json({ error: 'Closing day must be between 1 and 31' })
    }
    if (parsedDueDay !== null && (isNaN(parsedDueDay) || parsedDueDay < 1 || parsedDueDay > 31)) {
      return res.status(400).json({ error: 'Due day must be between 1 and 31' })
    }
    if (parsedCreditLimit !== null && (isNaN(parsedCreditLimit) || parsedCreditLimit < 0)) {
      return res.status(400).json({ error: 'Credit limit must be a non-negative number' })
    }

    const { data: creditCard, error } = await supabase
      .from('credit_cards')
      .insert({
        user_id: user.id,
        name: String(name).trim(),
        institution: institution ? String(institution).trim() : null,
        closing_day: parsedClosingDay,
        due_day: parsedDueDay,
        credit_limit: parsedCreditLimit,
        color: color || '#6366f1',
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating credit card:', error)
      return res.status(500).json({ error: error.message })
    }

    return res.status(201).json(serializeCreditCard(creditCard))
  } catch (error) {
    console.error('Error creating credit card:', error)
    return res.status(500).json({ error: 'Failed to create credit card' })
  }
}

export default withSupabase(handler)
