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
    const asset = await prisma.asset.findUnique({ where: { id } });

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    return res.status(200).json(asset);
  } catch (error) {
    console.error('Error fetching asset:', error);
    return res.status(500).json({ error: 'Failed to fetch asset' });
  }
}

async function handlePut(id, req, res, prisma) {
  try {
    const existing = await prisma.asset.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    const { type, name, currentValue, monthlyIncome, acquisitionDate, acquisitionValue, notes } =
      req.body;

    if (type && !VALID_TYPES.includes(type)) {
      return res.status(400).json({
        error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}`,
      });
    }

    const data = {};
    if (type !== undefined) data.type = type;
    if (name !== undefined) data.name = name;
    if (currentValue !== undefined) data.currentValue = currentValue;
    if (monthlyIncome !== undefined) data.monthlyIncome = monthlyIncome;
    if (acquisitionDate !== undefined)
      data.acquisitionDate = acquisitionDate ? new Date(acquisitionDate) : null;
    if (acquisitionValue !== undefined) data.acquisitionValue = acquisitionValue;
    if (notes !== undefined) data.notes = notes;

    const asset = await prisma.asset.update({
      where: { id },
      data,
    });

    return res.status(200).json(asset);
  } catch (error) {
    console.error('Error updating asset:', error);
    return res.status(500).json({ error: 'Failed to update asset' });
  }
}

async function handleDelete(id, res, prisma) {
  try {
    const existing = await prisma.asset.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    await prisma.asset.delete({ where: { id } });

    return res.status(200).json({ message: 'Asset deleted successfully' });
  } catch (error) {
    console.error('Error deleting asset:', error);
    return res.status(500).json({ error: 'Failed to delete asset' });
  }
}

export default withTenantPrisma(handler);
