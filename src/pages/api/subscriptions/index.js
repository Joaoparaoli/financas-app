import withTenantPrisma from '@/lib/with-tenant';

const VALID_FREQUENCIES = ['monthly', 'bimonthly', 'quarterly', 'semiannual', 'annual'];

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
    const subscriptions = await prisma.subscription.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json(subscriptions);
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
}

async function handlePost(req, res, prisma) {
  try {
    const { name, amount, frequency, notes, isActive } = req.body;

    if (!name || amount === undefined || amount === null || !frequency) {
      return res.status(400).json({
        error: 'Fields "name", "amount", and "frequency" are required',
      });
    }

    if (!VALID_FREQUENCIES.includes(frequency)) {
      return res.status(400).json({
        error: `Invalid frequency. Must be one of: ${VALID_FREQUENCIES.join(', ')}`,
      });
    }

    const subscription = await prisma.subscription.create({
      data: {
        name,
        amount,
        frequency,
        notes: notes ?? null,
        isActive: isActive ?? true,
      },
    });

    return res.status(201).json(subscription);
  } catch (error) {
    console.error('Error creating subscription:', error);
    return res.status(500).json({ error: 'Failed to create subscription' });
  }
}
