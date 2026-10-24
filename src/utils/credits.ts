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
 * Reads credit state from localStorage and resets credits to 3 if 24h midnight rolled over
 */
export function getCreditsState(): CreditState {
  try {
    const isPro = localStorage.getItem(IS_PRO_STORAGE_KEY) === 'true';
    const today = getTodayDateString();
    const storedDate = localStorage.getItem(LAST_RESET_STORAGE_KEY);
    const storedCredits = localStorage.getItem(CREDITS_STORAGE_KEY);

    // If new user or a new day has arrived (midnight passed), reset to MAX_DAILY_CREDITS
    if (!storedDate || storedDate !== today || storedCredits === null) {
      localStorage.setItem(LAST_RESET_STORAGE_KEY, today);
      localStorage.setItem(CREDITS_STORAGE_KEY, String(MAX_DAILY_CREDITS));
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
 * Deducts 1 credit if available or if user is Pro
 * Returns true if successful, false if blocked (0 credits)
 */
export function deductCredit(): boolean {
  try {
    const state = getCreditsState();
    if (state.isPro) {
      return true;
    }

    if (state.credits <= 0) {
      return false;
    }

    const nextCredits = state.credits - 1;
    localStorage.setItem(CREDITS_STORAGE_KEY, String(nextCredits));
    return true;
  } catch (e) {
    console.error('Failed to deduct credit:', e);
    return false;
  }
}

/**
 * Upgrades user to Pro plan (unlimited credits)
 */
export function setProPlan(isPro: boolean): void {
  try {
    localStorage.setItem(IS_PRO_STORAGE_KEY, isPro ? 'true' : 'false');
  } catch (e) {
    console.error('Failed to set Pro plan in localStorage:', e);
  }
}
