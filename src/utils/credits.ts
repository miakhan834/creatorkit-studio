import { getCurrentUser } from './auth';

export const MAX_DAILY_CREDITS = 3;
export const CREDITS_STORAGE_KEY = 'creatorkit_credits';
export const LAST_RESET_STORAGE_KEY = 'last_reset_date';
export const IS_PRO_STORAGE_KEY = 'creatorkit_is_pro';

/**
 * Returns today's date formatted as YYYY-MM-DD in local time
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export interface CreditState {
  credits: number;
  maxCredits: number;
  isPro: boolean;
  lastResetDate: string;
}

/**
 * Resolves storage keys for a specific user ID or current user session,
 * falling back to global keys if no user is authenticated.
 */
function getStorageKeys(explicitUserId?: string) {
  const activeUserId = explicitUserId || getCurrentUser()?.id;
  if (activeUserId) {
    return {
      creditsKey: `creatorkit_credits_${activeUserId}`,
      resetDateKey: `last_reset_date_${activeUserId}`,
      proKey: `creatorkit_is_pro_${activeUserId}`,
    };
  }
  return {
    creditsKey: CREDITS_STORAGE_KEY,
    resetDateKey: LAST_RESET_STORAGE_KEY,
    proKey: IS_PRO_STORAGE_KEY,
  };
}

/**
 * Reads credit state from localStorage and resets credits to 3 if 24h midnight rolled over.
 * Credits are per-user when a user is signed in.
 */
export function getCreditsState(userId?: string): CreditState {
  try {
    const { creditsKey, resetDateKey, proKey } = getStorageKeys(userId);
    const isPro = localStorage.getItem(proKey) === 'true';
    const today = getTodayDateString();
    const storedDate = localStorage.getItem(resetDateKey);
    const storedCredits = localStorage.getItem(creditsKey);

    // If new user or a new day has arrived (midnight passed), reset to MAX_DAILY_CREDITS
    if (!storedDate || storedDate !== today || storedCredits === null) {
      localStorage.setItem(resetDateKey, today);
      localStorage.setItem(creditsKey, String(MAX_DAILY_CREDITS));
      // Also keep fallback key in sync if testing globally
      if (!userId && !getCurrentUser()?.id) {
        localStorage.setItem(LAST_RESET_STORAGE_KEY, today);
        localStorage.setItem(CREDITS_STORAGE_KEY, String(MAX_DAILY_CREDITS));
      }
      return {
        credits: MAX_DAILY_CREDITS,
        maxCredits: MAX_DAILY_CREDITS,
        isPro,
        lastResetDate: today,
      };
    }

    const parsedCredits = parseInt(storedCredits, 10);
    const validCredits = isNaN(parsedCredits) ? MAX_DAILY_CREDITS : Math.max(0, parsedCredits);

    return {
      credits: validCredits,
      maxCredits: MAX_DAILY_CREDITS,
      isPro,
      lastResetDate: storedDate,
    };
  } catch (e) {
    console.error('Failed to access localStorage for credits:', e);
    return {
      credits: MAX_DAILY_CREDITS,
      maxCredits: MAX_DAILY_CREDITS,
      isPro: false,
      lastResetDate: getTodayDateString(),
    };
  }
}

/**
 * Deducts 1 credit if available or if user is Pro.
 * Returns true if successful, false if blocked (0 credits).
 */
export function deductCredit(userId?: string): boolean {
  try {
    const { creditsKey } = getStorageKeys(userId);
    const state = getCreditsState(userId);
    if (state.isPro) {
      return true;
    }

    if (state.credits <= 0) {
      return false;
    }

    const nextCredits = state.credits - 1;
    localStorage.setItem(creditsKey, String(nextCredits));
    
    // Also keep fallback key in sync if no explicit/active user
    if (!userId && !getCurrentUser()?.id) {
      localStorage.setItem(CREDITS_STORAGE_KEY, String(nextCredits));
    }
    return true;
  } catch (e) {
    console.error('Failed to deduct credit:', e);
    return false;
  }
}

/**
 * Upgrades user to Pro plan (unlimited credits)
 */
export function setProPlan(isPro: boolean, userId?: string): void {
  try {
    const { proKey } = getStorageKeys(userId);
    const val = isPro ? 'true' : 'false';
    localStorage.setItem(proKey, val);
    
    // Also mirror to global key
    localStorage.setItem(IS_PRO_STORAGE_KEY, val);
  } catch (e) {
    console.error('Failed to set Pro plan in localStorage:', e);
  }
}
