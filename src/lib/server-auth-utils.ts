import 'server-only';
import { getCurrentUser } from './auth';

// Get client key from database (server-side only)
export async function getClientKeyFromDatabase(): Promise<string | null> {
  try {
    const user = await getCurrentUser();
    return user?.clientKey || null;
  } catch (error) {
    console.error('Error getting client key from database:', error);
    return null;
  }
}