import { User } from '../types/auth';

export const USER_STORAGE_KEY = 'creatorkit_user';
export const REGISTERED_USERS_KEY = 'creatorkit_registered_users';

/**
 * Retrieve currently logged in user session from localStorage
 */
export function getCurrentUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    const user = JSON.parse(raw) as User;
    if (user && user.id && user.email) {
      return user;
    }
    return null;
  } catch (e) {
    console.error('Failed to read current user session:', e);
    return null;
  }
}

/**
 * Persist user session to localStorage
 */
export function saveUserSession(user: User): void {
  try {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } catch (e) {
    console.error('Failed to save user session:', e);
  }
}

/**
 * Remove user session from localStorage
 */
export function logoutUser(): void {
  try {
    localStorage.removeItem(USER_STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear user session:', e);
  }
}

/**
 * Helper to generate user id from email
 */
export function generateUserId(email: string): string {
  const clean = email.toLowerCase().replace(/[^a-z0-9]/g, '_');
  return `usr_${clean}`;
}

/**
 * Sign up with email & password
 */
export async function signupWithEmail(
  email: string,
  _password: string,
  name?: string
): Promise<User> {
  const trimmedEmail = email.trim().toLowerCase();
  const displayName = name?.trim() || trimmedEmail.split('@')[0] || 'Creator';
  
  const user: User = {
    id: generateUserId(trimmedEmail),
    email: trimmedEmail,
    name: displayName,
    provider: 'email',
    createdAt: Date.now(),
  };

  saveUserSession(user);
  return user;
}

/**
 * Log in with email & password
 */
export async function loginWithEmail(
  email: string,
  _password: string
): Promise<User> {
  const trimmedEmail = email.trim().toLowerCase();
  const displayName = trimmedEmail.split('@')[0] || 'Creator';

  const user: User = {
    id: generateUserId(trimmedEmail),
    email: trimmedEmail,
    name: displayName,
    provider: 'email',
    createdAt: Date.now(),
  };

  saveUserSession(user);
  return user;
}

/**
 * Log in with Google
 */
export async function loginWithGoogle(customEmail?: string): Promise<User> {
  const email = (customEmail || 'creator.google@gmail.com').trim().toLowerCase();
  const name = email.split('@')[0].replace('.', ' ') || 'Google Creator';

  const user: User = {
    id: generateUserId(email),
    email,
    name: name.charAt(0).toUpperCase() + name.slice(1),
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    provider: 'google',
    createdAt: Date.now(),
  };

  saveUserSession(user);
  return user;
}
