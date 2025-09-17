import { auth } from '@clerk/nextjs/server';
import { prisma } from './prisma';

export async function getCurrentUser() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  try {
    const user = await prisma.user.findUnique({
      where: {
        clerkId: userId,
      },
    });

    return user;
  } catch (error) {
    console.error('Error fetching current user:', error);
    return null;
  }
}

export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  return user;
}