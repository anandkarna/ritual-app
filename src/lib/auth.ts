import type { User as SupabaseUser } from '@supabase/supabase-js';

export type AuthAccount = {
  id?: string;
  username: string;
  password: string;
  email: string;
  name?: string;
  age?: number;
  city?: string;
  mobile?: string;
  countryCode?: string;
  gender?: string;
  habitFocus?: string;
  profileComplete?: boolean;
  profileSetupSkipped?: boolean;
  starterOnboardingPending?: boolean;
};

export type SupabaseProfile = {
  id: string;
  username: string | null;
  name: string | null;
  email: string | null;
  avatar_emoji?: string | null;
  dark_theme?: boolean | null;
  haptics_enabled?: boolean | null;
  push_enabled?: boolean | null;
  age?: number | null;
  city?: string | null;
  mobile?: string | null;
  country_code?: string | null;
  gender?: string | null;
  habit_focus?: string | null;
  profile_complete?: boolean | null;
  profile_setup_skipped?: boolean | null;
  flo_tone?: string | null;
};

export function normalizeUsername(value: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return normalized || `ritual_${Date.now()}`;
}

export function buildAuthAccountFromUser(user: SupabaseUser, profile?: Partial<SupabaseProfile> | null): AuthAccount {
  const email = user.email ?? profile?.email ?? '';
  const name = profile?.name || user.user_metadata?.full_name || '';
  const username = name || profile?.username || user.user_metadata?.username || email.split('@')[0] || 'Rituals user';
  const profileComplete = profile?.profile_complete ?? false;
  const profileSetupSkipped = profile?.profile_setup_skipped ?? false;
  return {
    id: user.id,
    username,
    email,
    password: '',
    name: name || username,
    age: typeof profile?.age === 'number' ? profile.age : undefined,
    city: profile?.city ?? undefined,
    mobile: profile?.mobile ?? undefined,
    countryCode: profile?.country_code || '+91',
    gender: profile?.gender ?? undefined,
    habitFocus: profile?.habit_focus ?? undefined,
    profileComplete,
    profileSetupSkipped,
    starterOnboardingPending: !profileComplete && !profileSetupSkipped,
  };
}

export function isAuthNetworkError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return /fetch failed|network request failed|sslhandshake|certificate|trust anchor|failed to fetch/i.test(message);
}

export function cleanAuthError(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : String(error ?? '');
  if (/fetch failed|network request failed|sslhandshake|certificate|trust anchor|failed to fetch/i.test(message)) {
    return 'Secure connection to Supabase failed on this device. Check the device date/time, update the emulator system image or use the Vercel web app, then try again.';
  }
  return error instanceof Error && error.message ? error.message : fallback;
}

export function buildLocalAuthAccount(username: string, password: string, email: string, name?: string): AuthAccount {
  return {
    id: `local-${Date.now()}`,
    username,
    password,
    email,
    name: name || username,
    profileComplete: false,
    profileSetupSkipped: false,
    starterOnboardingPending: true,
  };
}

export async function lookupProfileForUser(supabaseClient: any, user: SupabaseUser) {
  if (!supabaseClient) {
    return null;
  }

  const { data, error } = await supabaseClient
    .from('profiles')
    .select('id,username,name,email,avatar_emoji,dark_theme,haptics_enabled,push_enabled,age,city,mobile,country_code,gender,habit_focus,profile_complete,profile_setup_skipped')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    return null;
  }

  return data as SupabaseProfile | null;
}

export async function upsertUserProfile(supabaseClient: any, user: SupabaseUser, username: string, name: string, email: string) {
  if (!supabaseClient) {
    return null;
  }

  const { data, error } = await supabaseClient
    .from('profiles')
    .upsert(
      {
        id: user.id,
        username,
        name,
        email,
      },
      { onConflict: 'id' },
    )
    .select('id,username,name,email,avatar_emoji,dark_theme,haptics_enabled,push_enabled,age,city,mobile,country_code,gender,habit_focus,profile_complete,profile_setup_skipped')
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as SupabaseProfile;
}

export async function resolveIdentifierEmail(supabaseClient: any, identifier: string) {
  if (!supabaseClient) {
    return identifier.trim().toLowerCase();
  }

  const normalized = identifier.trim().toLowerCase();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return normalized;
  }

  const { data, error } = await supabaseClient.rpc('email_for_username', { lookup_username: normalized });
  if (error || typeof data !== 'string' || !data) {
    throw new Error('Account not found. Use your email or correct username.');
  }

  return data;
}
