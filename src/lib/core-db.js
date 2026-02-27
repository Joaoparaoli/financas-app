import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function createUser(user) {
  return prisma.user.create({
    data: {
      id: user.id,
      name: user.name,
      email: user.email.toLowerCase(),
      passwordHash: user.passwordHash,
    },
  });
}

export async function findUserByEmail(email) {
  if (!email) return null;
  return prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
}

export async function getUserById(id) {
  if (!id) return null;
  return prisma.user.findUnique({
    where: { id },
  });
}

export async function updateUserTimestamp(id) {
  return prisma.user.update({
    where: { id },
    data: { updatedAt: new Date() },
  });
}
