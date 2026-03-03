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
  const supabase = supabaseAdmin
  const profileId = getProfileId(req)
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase não configurado' })
  }
  if (!profileId) {
    return res.status(400).json({ error: 'Perfil não informado ou inválido' })
  }
  const { method } = req

  switch (method) {
    case 'GET':
      return handleGet(req, res, supabase, profileId)
    case 'POST':
      return handlePost(req, res, supabase, profileId)
    default:
      res.setHeader('Allow', ['GET', 'POST'])
      return res.status(405).json({ error: `Method ${method} not allowed` })
  }
}

async function handleGet(req, res, supabase, profileId) {
  try {
    const { month, year } = req.query

    let query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', profileId)

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

    return res.status(200).json((transactions || []).map(serializeTransaction))
  } catch (error) {
    console.error('[GET /api/transactions]', error)
    return res.status(500).json({ error: error?.message || 'Failed to fetch transactions' })
  }
}

async function handlePost(req, res, supabase, profileId) {
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
        user_id: profileId,
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
      console.error('[POST /api/transactions] supabase error', error)
      return res.status(500).json({ error: error.message })
    }

    return res.status(201).json(transaction)
  } catch (error) {
    console.error('[POST /api/transactions] unexpected', error)
    return res.status(500).json({ error: error?.message || 'Failed to create transaction' })
  }
}

export default handler
