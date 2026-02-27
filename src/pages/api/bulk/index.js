import { withSupabase } from '@/lib/supabase-server'

async function getAllData(supabase, user) {
  const [transactions, creditCards, assets, liabilities, financialGoals, subscriptions] = await Promise.all([
    supabase.from('transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
    supabase.from('credit_cards').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
    supabase.from('assets').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
    supabase.from('liabilities').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
    supabase.from('financial_goals').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
    supabase.from('subscriptions').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
  ])

  return {
    transactions: transactions.data || [],
    creditCards: creditCards.data || [],
    assets: assets.data || [],
    liabilities: liabilities.data || [],
    financialGoals: financialGoals.data || [],
    subscriptions: subscriptions.data || [],
  }
}

async function replaceAllData(supabase, user, payload = {}) {
  const {
    transactions = [],
    creditCards = [],
    assets = [],
    liabilities = [],
    financialGoals = [],
    subscriptions = [],
  } = payload

  // Delete all existing data for user
  await Promise.all([
    supabase.from('transactions').delete().eq('user_id', user.id),
    supabase.from('credit_cards').delete().eq('user_id', user.id),
    supabase.from('assets').delete().eq('user_id', user.id),
    supabase.from('liabilities').delete().eq('user_id', user.id),
    supabase.from('financial_goals').delete().eq('user_id', user.id),
    supabase.from('subscriptions').delete().eq('user_id', user.id),
  ])

  // Insert new data with user_id
  const ops = []
  if (transactions.length) {
    ops.push(supabase.from('transactions').insert(transactions.map(item => ({ ...item, user_id: user.id }))))
  }
  if (creditCards.length) {
    ops.push(supabase.from('credit_cards').insert(creditCards.map(item => ({ ...item, user_id: user.id }))))
  }
  if (assets.length) {
    ops.push(supabase.from('assets').insert(assets.map(item => ({ ...item, user_id: user.id }))))
  }
  if (liabilities.length) {
    ops.push(supabase.from('liabilities').insert(liabilities.map(item => ({ ...item, user_id: user.id }))))
  }
  if (financialGoals.length) {
    ops.push(supabase.from('financial_goals').insert(financialGoals.map(item => ({ ...item, user_id: user.id }))))
  }
  if (subscriptions.length) {
    ops.push(supabase.from('subscriptions').insert(subscriptions.map(item => ({ ...item, user_id: user.id }))))
  }

  if (ops.length) {
    await Promise.all(ops)
  }
}

async function handler(req, res) {
  const { supabase, user } = req
  const { method } = req

  if (method === 'GET') {
    try {
      const data = await getAllData(supabase, user)
      return res.status(200).json({
        exportedAt: new Date().toISOString(),
        ...data,
      })
    } catch (error) {
      console.error('[GET /api/bulk]', error)
      return res.status(500).json({ error: 'Falha ao exportar dados' })
    }
  }

  if (method === 'POST') {
    try {
      const { data } = req.body || {}
      if (!data) {
        return res.status(400).json({ error: 'Payload "data" é obrigatório' })
      }
      await replaceAllData(supabase, user, data)
      return res.status(200).json({ message: 'Dados importados com sucesso' })
    } catch (error) {
      console.error('[POST /api/bulk]', error)
      return res.status(500).json({ error: 'Falha ao importar dados' })
    }
  }

  res.setHeader('Allow', ['GET', 'POST'])
  return res.status(405).json({ error: `Method ${method} not allowed` })
}

export default withSupabase(handler)
