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

    if (month && year) {
      const monthInt = parseInt(month, 10)
      const yearInt = parseInt(year, 10)

      if (isNaN(monthInt) || monthInt < 1 || monthInt > 12) {
        return res.status(400).json({ error: 'Month must be between 1 and 12' })
      }
      if (isNaN(yearInt) || yearInt < 2000 || yearInt > 2100) {
        return res.status(400).json({ error: 'Year must be a valid number' })
      }

      const startOfMonth = new Date(Date.UTC(yearInt, monthInt - 1, 1, 0, 0, 0, 0))
      const endOfMonth = new Date(Date.UTC(yearInt, monthInt, 0, 23, 59, 59, 999))

      query = query
        .gte('date', startOfMonth.toISOString())
        .lte('date', endOfMonth.toISOString())
    }

    const { data: transactions, error } = await query.order('date', { ascending: true })

    if (error) {
      console.error('[GET /api/transactions]', error)
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json(transactions || [])
  } catch (error) {
    console.error('[GET /api/transactions]', error)
    return res.status(500).json({ error: 'Failed to fetch transactions' })
  }
}

async function handlePost(req, res, supabase, user) {
  try {
    const { title, amount, type, status, date, category, description } = req.body

    const missing = []
    if (!title) missing.push('title')
    if (amount === undefined || amount === null || amount === '') missing.push('amount')
    if (!type) missing.push('type')
    if (!status) missing.push('status')
    if (!date) missing.push('date')
    if (!category) missing.push('category')

    if (missing.length > 0) {
      return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` })
    }

    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({ error: 'Type must be "income" or "expense"' })
    }
    if (!['completed', 'predicted'].includes(status)) {
      return res.status(400).json({ error: 'Status must be "completed" or "predicted"' })
    }

    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      return res.status(400).json({ error: 'Amount must be a non-negative number' })
    }

    const parsedDate = new Date(date)
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' })
    }

    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        title: String(title).trim(),
        amount: parsedAmount,
        type,
        status,
        date: parsedDate.toISOString(),
        category: String(category).trim(),
        description: description ? String(description).trim() : null,
      })
      .select()
      .single()

    if (error) {
      console.error('[POST /api/transactions]', error)
      return res.status(500).json({ error: error.message })
    }

    return res.status(201).json(transaction)
  } catch (error) {
    console.error('[POST /api/transactions]', error)
    return res.status(500).json({ error: 'Failed to create transaction' })
  }
}

export default withSupabase(handler)
