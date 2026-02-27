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
    const creditCard = await prisma.creditCard.findUnique({
      where: { id },
    });

    if (!creditCard) {
      return res.status(404).json({ error: 'Credit card not found' });
    }

    return res.status(200).json(creditCard);
  } catch (error) {
    console.error('Error fetching credit card:', error);
    return res.status(500).json({ error: 'Failed to fetch credit card' });
  }
}

async function handlePut(id, req, res, prisma) {
  try {
    const existing = await prisma.creditCard.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Credit card not found' });
    }

    const { name, institution, closingDay, dueDay, creditLimit, color } = req.body;

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

    const data = {};
    if (name !== undefined) data.name = name;
    if (institution !== undefined) data.institution = institution;
    if (closingDay !== undefined) data.closingDay = closingDay != null ? parseInt(closingDay, 10) : null;
    if (dueDay !== undefined) data.dueDay = dueDay != null ? parseInt(dueDay, 10) : null;
    if (creditLimit !== undefined) data.creditLimit = creditLimit != null ? parseFloat(creditLimit) : null;
    if (color !== undefined) data.color = color;

    const creditCard = await prisma.creditCard.update({
      where: { id },
      data,
    });

    return res.status(200).json(creditCard);
  } catch (error) {
    console.error('Error updating credit card:', error);
    return res.status(500).json({ error: 'Failed to update credit card' });
  }
}

async function handleDelete(id, res, prisma) {
  try {
    const existing = await prisma.creditCard.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Credit card not found' });
    }

    await prisma.creditCard.delete({
      where: { id },
    });

    return res.status(200).json({ message: 'Credit card deleted successfully' });
  } catch (error) {
    console.error('Error deleting credit card:', error);
    return res.status(500).json({ error: 'Failed to delete credit card' });
  }
}

export default withTenantPrisma(handler);
