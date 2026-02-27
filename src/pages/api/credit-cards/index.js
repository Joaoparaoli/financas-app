import withTenantPrisma from '@/lib/with-tenant';

async function handler(req, res, prisma) {
  switch (req.method) {
    case 'GET':
      return handleGet(res, prisma);
    case 'POST':
      return handlePost(req, res, prisma);
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }
}

async function handleGet(res, prisma) {
  try {
    const creditCards = await prisma.creditCard.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json(creditCards);
  } catch (error) {
    console.error('Error fetching credit cards:', error);
    return res.status(500).json({ error: 'Failed to fetch credit cards' });
  }
}

async function handlePost(req, res, prisma) {
  try {
    const { name, institution, closingDay, dueDay, creditLimit, color } = req.body;

    if (!name || !institution) {
      return res.status(400).json({
        error: 'Missing required fields: name, institution',
      });
    }

    if (closingDay !== undefined && closingDay !== null) {
      const day = parseInt(closingDay, 10);
      if (isNaN(day) || day < 1 || day > 31) {
        return res.status(400).json({ error: 'Closing day must be between 1 and 31' });
      }
    }

    if (dueDay !== undefined && dueDay !== null) {
      const day = parseInt(dueDay, 10);
      if (isNaN(day) || day < 1 || day > 31) {
        return res.status(400).json({ error: 'Due day must be between 1 and 31' });
      }
    }

    const creditCard = await prisma.creditCard.create({
      data: {
        name,
        institution,
        closingDay: closingDay != null ? parseInt(closingDay, 10) : null,
        dueDay: dueDay != null ? parseInt(dueDay, 10) : null,
        creditLimit: creditLimit != null ? parseFloat(creditLimit) : null,
        color: color || '#6366f1',
      },
    });

    return res.status(201).json(creditCard);
  } catch (error) {
    console.error('Error creating credit card:', error);
    return res.status(500).json({ error: 'Failed to create credit card' });
  }
}

export default withTenantPrisma(handler);
