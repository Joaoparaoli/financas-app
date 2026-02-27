import withTenantPrisma from '@/lib/with-tenant'

async function getAllData(prisma) {
  const [transactions, creditCards, assets, liabilities, financialGoals, subscriptions] = await Promise.all([
    prisma.transaction.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.creditCard.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.asset.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.liability.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.financialGoal.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.subscription.findMany({ orderBy: { createdAt: 'asc' } }),
  ])

  return {
    transactions,
    creditCards,
    assets,
    liabilities,
    financialGoals,
    subscriptions,
  }
}

async function replaceAllData(prisma, payload = {}) {
  const {
    transactions = [],
    creditCards = [],
    assets = [],
    liabilities = [],
    financialGoals = [],
    subscriptions = [],
  } = payload

  await prisma.$transaction([
    prisma.transaction.deleteMany(),
    prisma.creditCard.deleteMany(),
    prisma.asset.deleteMany(),
    prisma.liability.deleteMany(),
    prisma.financialGoal.deleteMany(),
    prisma.subscription.deleteMany(),
  ])

  const ops = []
  if (transactions.length) {
    ops.push(prisma.transaction.createMany({ data: transactions.map(stripMeta) }))
  }
  if (creditCards.length) {
    ops.push(prisma.creditCard.createMany({ data: creditCards.map(stripMeta) }))
  }
  if (assets.length) {
    ops.push(prisma.asset.createMany({ data: assets.map(stripMeta) }))
  }
  if (liabilities.length) {
    ops.push(prisma.liability.createMany({ data: liabilities.map(stripMeta) }))
  }
  if (financialGoals.length) {
    ops.push(prisma.financialGoal.createMany({ data: financialGoals.map(stripMeta) }))
  }
  if (subscriptions.length) {
    ops.push(prisma.subscription.createMany({ data: subscriptions.map(stripMeta) }))
  }

  if (ops.length) {
    await prisma.$transaction(ops)
  }
}

function stripMeta(record = {}) {
  const { createdAt, updatedAt, ...rest } = record
  return rest
}

async function handler(req, res, prisma) {
  if (req.method === 'GET') {
    try {
      const data = await getAllData(prisma)
      return res.status(200).json({
        exportedAt: new Date().toISOString(),
        ...data,
      })
    } catch (error) {
      console.error('[GET /api/bulk]', error)
      return res.status(500).json({ error: 'Falha ao exportar dados' })
    }
  }

  if (req.method === 'POST') {
    try {
      const { data } = req.body || {}
      if (!data) {
        return res.status(400).json({ error: 'Payload "data" é obrigatório' })
      }
      await replaceAllData(prisma, data)
      return res.status(200).json({ message: 'Dados importados com sucesso' })
    } catch (error) {
      console.error('[POST /api/bulk]', error)
      return res.status(500).json({ error: 'Falha ao importar dados' })
    }
  }

  res.setHeader('Allow', ['GET', 'POST'])
  return res.status(405).json({ error: `Method ${req.method} not allowed` })
}

export default withTenantPrisma(handler)
