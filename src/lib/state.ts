import type { AuthAccount } from './auth';

export function normalizeStoredAuth(
  parsed: { account?: Partial<AuthAccount>; signedIn?: boolean } | null,
  fallbackAccount: AuthAccount,
): { account: AuthAccount; signedIn: boolean } {
  const parsedAccount = parsed?.account;
  const account = parsedAccount?.username && parsedAccount.password
    ? {
        id: parsedAccount.id,
        username: parsedAccount.username,
        password: parsedAccount.password,
        email: parsedAccount.email || fallbackAccount.email,
        name: parsedAccount.name,
        age: parsedAccount.age,
        city: parsedAccount.city,
        mobile: parsedAccount.mobile,
        countryCode: parsedAccount.countryCode || fallbackAccount.countryCode || '+91',
        gender: parsedAccount.gender,
        habitFocus: parsedAccount.habitFocus,
        profileComplete: parsedAccount.profileComplete ?? true,
        profileSetupSkipped: parsedAccount.profileSetupSkipped ?? false,
        starterOnboardingPending: parsedAccount.starterOnboardingPending ?? false,
      }
    : fallbackAccount;

  return {
    account,
    signedIn: parsed?.signedIn ?? false,
  };
}

export function usernameFromValue(value: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return normalized || `ritual_${Date.now()}`;
}
