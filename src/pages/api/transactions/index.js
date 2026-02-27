import withTenantPrisma from '@/lib/with-tenant';

async function handler(req, res, prisma) {
  switch (req.method) {
    case 'GET':
      return handleGet(req, res, prisma);
    case 'POST':
      return handlePost(req, res, prisma);
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }
}

async function handleGet(req, res, prisma) {
  try {
    const { month, year } = req.query;

    let where = {};

    if (month && year) {
      const monthInt = parseInt(month, 10);
      const yearInt = parseInt(year, 10);

      if (isNaN(monthInt) || monthInt < 1 || monthInt > 12) {
        return res.status(400).json({ error: 'Month must be between 1 and 12' });
      }
      if (isNaN(yearInt) || yearInt < 2000 || yearInt > 2100) {
        return res.status(400).json({ error: 'Year must be a valid number' });
      }

      // UTC boundaries to avoid timezone drift with SQLite
      const startOfMonth = new Date(Date.UTC(yearInt, monthInt - 1, 1, 0, 0, 0, 0));
      const endOfMonth = new Date(Date.UTC(yearInt, monthInt, 0, 23, 59, 59, 999));

      where.date = {
        gte: startOfMonth,
        lte: endOfMonth,
      };
    }

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { date: 'asc' },
    });

    return res.status(200).json(transactions);
  } catch (error) {
    console.error('[GET /api/transactions]', error);
    const status = error?.message?.includes('não encontrado') ? 404 : 500;
    return res.status(status).json({ error: error?.message || 'Failed to fetch transactions' });
  }
}

async function handlePost(req, res, prisma) {
  try {
    const { title, amount, type, status, date, category, description } = req.body;

    const missing = [];
    if (!title) missing.push('title');
    if (amount === undefined || amount === null || amount === '') missing.push('amount');
    if (!type) missing.push('type');
    if (!status) missing.push('status');
    if (!date) missing.push('date');
    if (!category) missing.push('category');

    if (missing.length > 0) {
      return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
    }

    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({ error: 'Type must be "income" or "expense"' });
    }
    if (!['completed', 'predicted'].includes(status)) {
      return res.status(400).json({ error: 'Status must be "completed" or "predicted"' });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      return res.status(400).json({ error: 'Amount must be a non-negative number' });
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    const transaction = await prisma.transaction.create({
      data: {
        title: String(title).trim(),
        amount: parsedAmount,
        type,
        status,
        date: parsedDate,
        category: String(category).trim(),
        description: description ? String(description).trim() : null,
      },
    });

    return res.status(201).json(transaction);
  } catch (error) {
    console.error('[POST /api/transactions]', error);
    return res.status(500).json({ error: error?.message || 'Failed to create transaction' });
  }
}

export default withTenantPrisma(handler);
