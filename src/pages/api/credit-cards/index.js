import { withSupabase } from '@/lib/supabase-server'

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

    return res.status(200).json(creditCards || [])
  } catch (error) {
    console.error('Error fetching credit cards:', error)
    return res.status(500).json({ error: 'Failed to fetch credit cards' })
  }
}

async function handlePost(req, res, supabase, user) {
  try {
    const { name, limit, closingDay, dueDay, brand } = req.body

    if (!name || !limit || !closingDay || !dueDay) {
      return res.status(400).json({ error: 'Fields name, limit, closingDay, and dueDay are required' })
    }

    const parsedLimit = parseFloat(limit)
    const parsedClosingDay = parseInt(closingDay, 10)
    const parsedDueDay = parseInt(dueDay, 10)

    if (isNaN(parsedLimit) || parsedLimit <= 0) {
      return res.status(400).json({ error: 'Limit must be a positive number' })
    }
    if (isNaN(parsedClosingDay) || parsedClosingDay < 1 || parsedClosingDay > 31) {
      return res.status(400).json({ error: 'Closing day must be between 1 and 31' })
    }
    if (isNaN(parsedDueDay) || parsedDueDay < 1 || parsedDueDay > 31) {
      return res.status(400).json({ error: 'Due day must be between 1 and 31' })
    }

    const { data: creditCard, error } = await supabase
      .from('credit_cards')
      .insert({
        user_id: user.id,
        name,
        limit: parsedLimit,
        closing_day: parsedClosingDay,
        due_day: parsedDueDay,
        brand: brand || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating credit card:', error)
      return res.status(500).json({ error: error.message })
    }

    return res.status(201).json(creditCard)
  } catch (error) {
    console.error('Error creating credit card:', error)
    return res.status(500).json({ error: 'Failed to create credit card' })
  }
}

export default withSupabase(handler)
