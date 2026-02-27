import withTenantPrisma from '@/lib/with-tenant';

async function handler(req, res, prisma) {
  const { id } = req.query;

  switch (req.method) {
    case 'GET':
      return handleGet(id, res, prisma);
    case 'PUT':
      return handlePut(id, req, res, prisma);
    case 'DELETE':
      return handleDelete(id, res, prisma);
    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }
}

async function handleGet(id, res, prisma) {
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    return res.status(200).json(transaction);
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return res.status(500).json({ error: 'Failed to fetch transaction' });
  }
}

async function handlePut(id, req, res, prisma) {
  try {
    const existing = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const { title, amount, type, status, date, category, description } = req.body;

    if (type && !['income', 'expense'].includes(type)) {
      return res.status(400).json({ error: 'Type must be "income" or "expense"' });
    }

    if (status && !['completed', 'predicted'].includes(status)) {
      return res.status(400).json({ error: 'Status must be "completed" or "predicted"' });
    }

    const data = {};
    if (title !== undefined) data.title = title;
    if (amount !== undefined) data.amount = parseFloat(amount);
    if (type !== undefined) data.type = type;
    if (status !== undefined) data.status = status;
    if (date !== undefined) data.date = new Date(date);
    if (category !== undefined) data.category = category;
    if (description !== undefined) data.description = description;

    const transaction = await prisma.transaction.update({
      where: { id },
      data,
    });

    return res.status(200).json(transaction);
  } catch (error) {
    console.error('Error updating transaction:', error);
    return res.status(500).json({ error: 'Failed to update transaction' });
  }
}

async function handleDelete(id, res, prisma) {
  try {
    const existing = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    await prisma.transaction.delete({
      where: { id },
    });

    return res.status(200).json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return res.status(500).json({ error: 'Failed to delete transaction' });
  }
}
