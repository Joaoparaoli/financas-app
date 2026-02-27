import withTenantPrisma from '@/lib/with-tenant';

const VALID_TYPES = [
  'vehicle',
  'real_estate_own',
  'electronics',
  'luxury_items',
  'subscriptions',
  'personal_items',
  'other_expense',
];

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
    const liability = await prisma.liability.findUnique({ where: { id } });

    if (!liability) {
      return res.status(404).json({ error: 'Liability not found' });
    }

    return res.status(200).json(liability);
  } catch (error) {
    console.error('Error fetching liability:', error);
    return res.status(500).json({ error: 'Failed to fetch liability' });
  }
}

async function handlePut(id, req, res, prisma) {
  try {
    const existing = await prisma.liability.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ error: 'Liability not found' });
    }

    const {
      type,
      name,
      currentValue,
      monthlyExpense,
      acquisitionDate,
      acquisitionValue,
      notes,
    } = req.body;

    if (type && !VALID_TYPES.includes(type)) {
      return res.status(400).json({
        error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}`,
      });
    }

    const data = {};
    if (type !== undefined) data.type = type;
    if (name !== undefined) data.name = name;
    if (currentValue !== undefined) data.currentValue = currentValue;
    if (monthlyExpense !== undefined) data.monthlyExpense = monthlyExpense;
    if (acquisitionDate !== undefined)
      data.acquisitionDate = acquisitionDate ? new Date(acquisitionDate) : null;
    if (acquisitionValue !== undefined) data.acquisitionValue = acquisitionValue;
    if (notes !== undefined) data.notes = notes;

    const liability = await prisma.liability.update({
      where: { id },
      data,
    });

    return res.status(200).json(liability);
  } catch (error) {
    console.error('Error updating liability:', error);
    return res.status(500).json({ error: 'Failed to update liability' });
  }
}

async function handleDelete(id, res, prisma) {
  try {
    const existing = await prisma.liability.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ error: 'Liability not found' });
    }

    await prisma.liability.delete({ where: { id } });

    return res.status(200).json({ message: 'Liability deleted successfully' });
  } catch (error) {
    console.error('Error deleting liability:', error);
    return res.status(500).json({ error: 'Failed to delete liability' });
  }
}

export default withTenantPrisma(handler);
