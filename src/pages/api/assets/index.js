import withTenantPrisma from '@/lib/with-tenant';

const VALID_TYPES = [
  'real_estate_rental',
  'business',
  'stocks_dividends',
  'investment_income',
  'intellectual_property',
  'other_income',
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
    const assets = await prisma.asset.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json(assets);
  } catch (error) {
    console.error('Error fetching assets:', error);
    return res.status(500).json({ error: 'Failed to fetch assets' });
  }
}

async function handlePost(req, res, prisma) {
  try {
    const { type, name, currentValue, monthlyIncome, acquisitionDate, acquisitionValue, notes } =
      req.body;

    if (!type || !name) {
      return res.status(400).json({ error: 'Fields "type" and "name" are required' });
    }

    if (!VALID_TYPES.includes(type)) {
      return res.status(400).json({
        error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}`,
      });
    }

    const asset = await prisma.asset.create({
      data: {
        type,
        name,
        currentValue: currentValue ?? 0,
        monthlyIncome: monthlyIncome ?? 0,
        acquisitionDate: acquisitionDate ? new Date(acquisitionDate) : null,
        acquisitionValue: acquisitionValue ?? null,
        notes: notes ?? null,
      },
    });

    return res.status(201).json(asset);
  } catch (error) {
    console.error('Error creating asset:', error);
    return res.status(500).json({ error: 'Failed to create asset' });
  }
}

export default withTenantPrisma(handler);
