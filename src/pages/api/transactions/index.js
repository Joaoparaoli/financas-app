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
    const { month, year } = req.query

    let query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })

    if (month && year) {
      const monthInt = parseInt(month, 10)
      const yearInt = parseInt(year, 10)

      if (isNaN(monthInt) || monthInt < 1 || monthInt > 12) {
        return res.status(400).json({ error: 'Month must be between 1 and 12' })
      }
      if (isNaN(yearInt) || yearInt < 2000 || yearInt > 2100) {
        return res.status(400).json({ error: 'Year must be a valid number' })
      }

      const startDate = new Date(yearInt, monthInt - 1, 1).toISOString()
      const endDate = new Date(yearInt, monthInt, 0, 23, 59, 59, 999).toISOString()

      query = query
        .gte('date', startDate)
        .lte('date', endDate)
    }

    const { data: transactions, error } = await query

    if (error) {
      console.error('Error fetching transactions:', error)
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json(transactions || [])
  } catch (error) {
    console.error('Error in handleGet:', error)
    return res.status(500).json({ error: 'Failed to fetch transactions' })
  }
}

async function handlePost(req, res, supabase, user) {
  try {
    const { title, amount, type, status, date, category, description } = req.body

    if (!title || !amount || !type || !date) {
      return res.status(400).json({ error: 'Missing required fields: title, amount, type, date' })
    }

    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({ error: 'Type must be "income" or "expense"' })
    }

    if (!['completed', 'predicted'].includes(status)) {
      return res.status(400).json({ error: 'Status must be "completed" or "predicted"' })
    }

    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert({
        title: title.trim(),
        amount: parseFloat(amount),
        type,
        status: status || 'completed',
        date: new Date(date).toISOString(),
        category: category?.trim() || null,
        description: description?.trim() || null,
        user_id: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating transaction:', error)
      return res.status(500).json({ error: error.message })
    }

    return res.status(201).json(transaction)
  } catch (error) {
    console.error('Error in handlePost:', error)
    return res.status(500).json({ error: 'Failed to create transaction' })
  }
}

export default withSupabase(handler)
