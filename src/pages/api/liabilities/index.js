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
    const liabilities = await prisma.liability.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json(liabilities);
  } catch (error) {
    console.error('Error fetching liabilities:', error);
    return res.status(500).json({ error: 'Failed to fetch liabilities' });
  }
}

async function handlePost(req, res, prisma) {
  try {
    const {
      type,
      name,
      currentValue,
      monthlyExpense,
      acquisitionDate,
      acquisitionValue,
      notes,
    } = req.body;

    if (!type || !name) {
      return res.status(400).json({ error: 'Fields "type" and "name" are required' });
    }

    if (!VALID_TYPES.includes(type)) {
      return res.status(400).json({
        error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}`,
      });
    }

    const liability = await prisma.liability.create({
      data: {
        type,
        name,
        currentValue: currentValue ?? 0,
        monthlyExpense: monthlyExpense ?? 0,
        acquisitionDate: acquisitionDate ? new Date(acquisitionDate) : null,
        acquisitionValue: acquisitionValue ?? null,
        notes: notes ?? null,
      },
    });

    return res.status(201).json(liability);
  } catch (error) {
    console.error('Error creating liability:', error);
    return res.status(500).json({ error: 'Failed to create liability' });
  }
}

export default withTenantPrisma(handler);
