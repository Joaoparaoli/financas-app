import withTenantPrisma from '@/lib/with-tenant';

const VALID_FREQUENCIES = ['monthly', 'bimonthly', 'quarterly', 'semiannual', 'annual'];

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
    const subscription = await prisma.subscription.findUnique({ where: { id } });

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    return res.status(200).json(subscription);
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return res.status(500).json({ error: 'Failed to fetch subscription' });
  }
}

async function handlePut(id, req, res, prisma) {
  try {
    const existing = await prisma.subscription.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    const { name, amount, frequency, notes, isActive } = req.body;

    if (frequency && !VALID_FREQUENCIES.includes(frequency)) {
      return res.status(400).json({
        error: `Invalid frequency. Must be one of: ${VALID_FREQUENCIES.join(', ')}`,
      });
    }

    const data = {};
    if (name !== undefined) data.name = name;
    if (amount !== undefined) data.amount = amount;
    if (frequency !== undefined) data.frequency = frequency;
    if (notes !== undefined) data.notes = notes;
    if (isActive !== undefined) data.isActive = isActive;

    const subscription = await prisma.subscription.update({
      where: { id },
      data,
    });

    return res.status(200).json(subscription);
  } catch (error) {
    console.error('Error updating subscription:', error);
    return res.status(500).json({ error: 'Failed to update subscription' });
  }
}

async function handleDelete(id, res, prisma) {
  try {
    const existing = await prisma.subscription.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    await prisma.subscription.delete({ where: { id } });

    return res.status(200).json({ message: 'Subscription deleted successfully' });
  } catch (error) {
    console.error('Error deleting subscription:', error);
    return res.status(500).json({ error: 'Failed to delete subscription' });
  }
}

export default withTenantPrisma(handler);
