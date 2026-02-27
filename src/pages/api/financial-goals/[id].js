import withTenantPrisma from '@/lib/with-tenant';

const VALID_CATEGORIES = [
  'emergency_fund',
  'down_payment',
  'debt_payoff',
  'vacation',
  'education',
  'retirement',
  'investment',
  'other',
];

const VALID_STATUSES = ['active', 'completed', 'paused'];

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
    const financialGoal = await prisma.financialGoal.findUnique({ where: { id } });

    if (!financialGoal) {
      return res.status(404).json({ error: 'Financial goal not found' });
    }

    return res.status(200).json(financialGoal);
  } catch (error) {
    console.error('Error fetching financial goal:', error);
    return res.status(500).json({ error: 'Failed to fetch financial goal' });
  }
}

async function handlePut(id, req, res, prisma) {
  try {
    const existing = await prisma.financialGoal.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ error: 'Financial goal not found' });
    }

    const {
      title,
      description,
      targetAmount,
      currentAmount,
      targetDate,
      category,
      status,
      icon,
    } = req.body;

    if (category && !VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({
        error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`,
      });
    }

    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
      });
    }

    const data = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (targetAmount !== undefined) data.targetAmount = targetAmount;
    if (currentAmount !== undefined) data.currentAmount = currentAmount;
    if (targetDate !== undefined) data.targetDate = new Date(targetDate);
    if (category !== undefined) data.category = category;
    if (status !== undefined) data.status = status;
    if (icon !== undefined) data.icon = icon;

    const financialGoal = await prisma.financialGoal.update({
      where: { id },
      data,
    });

    return res.status(200).json(financialGoal);
  } catch (error) {
    console.error('Error updating financial goal:', error);
    return res.status(500).json({ error: 'Failed to update financial goal' });
  }
}

async function handleDelete(id, res, prisma) {
  try {
    const existing = await prisma.financialGoal.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ error: 'Financial goal not found' });
    }

    await prisma.financialGoal.delete({ where: { id } });

    return res.status(200).json({ message: 'Financial goal deleted successfully' });
  } catch (error) {
    console.error('Error deleting financial goal:', error);
    return res.status(500).json({ error: 'Failed to delete financial goal' });
  }
}

export default withTenantPrisma(handler);
