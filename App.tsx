import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Fraunces_400Regular } from '@expo-google-fonts/fraunces/400Regular';
import { Fraunces_500Medium } from '@expo-google-fonts/fraunces/500Medium';
import { Fraunces_600SemiBold } from '@expo-google-fonts/fraunces/600SemiBold';
import { Fraunces_700Bold } from '@expo-google-fonts/fraunces/700Bold';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { Inter_800ExtraBold } from '@expo-google-fonts/inter/800ExtraBold';
import { useFonts } from 'expo-font';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import {
  AccessibilityInfo,
  Animated,
  AppState,
  Dimensions,
  Easing,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import {
  GestureHandlerRootView,
  PanGestureHandler,
  State,
  type PanGestureHandlerGestureEvent,
  type PanGestureHandlerStateChangeEvent,
} from 'react-native-gesture-handler';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import Reanimated, {
  cancelAnimation,
  Easing as ReanimatedEasing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  G,
  LinearGradient as SvgLinearGradient,
  Path,
  Stop,
} from 'react-native-svg';
import {
  ArrowRight,
  BarChart3,
  Bell,
  Bot,
  CalendarDays,
  Check,
  ChevronLeft,
  Clock3,
  Eye,
  EyeOff,
  Home,
  Lock,
  LogOut,
  Mail,
  MessageCircle,
  Moon,
  Plus,
  Send,
  Settings,
  Sparkles,
  Sun,
  User,
  Zap,
} from 'lucide-react-native';
import React, { ComponentType, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createClient, processLock, User as SupabaseUser } from '@supabase/supabase-js';

type TabKey = 'today' | 'progress' | 'insights' | 'profile';
type PaletteKey = 'reading' | 'food' | 'focus' | 'water';
type IconComponent = ComponentType<{ size?: number; color?: string; strokeWidth?: number; fill?: string }>;

type HabitPalette = {
  a: string;
  b: string;
  bg: readonly [string, string];
  ink: string;
};

type Ritual = {
  id: string;
  name: string;
  icon: string;
  paletteKey: PaletteKey;
  streakDays: number;
  bestStreakDays: number;
  doneToday: boolean;
  weekly: number[];
  heat: number[];
  createdAt: number;
};

type FlowSettings = {
  pushNotifications: boolean;
  messageAlerts: boolean;
  darkTheme: boolean;
  haptics: boolean;
};

type SavedFlowState = {
  rituals: Ritual[];
  totalActiveRituals: number;
  baseDoneFromOtherHabits: number;
  settings: FlowSettings;
  insight: string;
};

type ToastState = {
  id: number;
  message: string;
};

type BurstParticle = {
  id: string;
  x: number;
  y: number;
  color: string;
  dx: number;
  dy: number;
  duration: number;
};

type AuthMode = 'signIn' | 'createAccount' | 'forgot';

type AuthAccount = {
  id?: string;
  username: string;
  password: string;
  email: string;
};

type StoredAuth = {
  account: AuthAccount;
  signedIn: boolean;
};

type CoachRole = 'assistant' | 'user';

type CoachInsightCard = {
  headline: string;
  body: string;
  bars?: number[];
  metric?: string;
};

type CoachAction = {
  id: string;
  label: string;
  type: 'reschedule_reminder' | 'suggest_new_ritual' | 'generate_weekly_recap';
  payload?: Record<string, unknown>;
};

type CoachMessage = {
  id: string;
  role: CoachRole;
  text: string;
  insightCard?: CoachInsightCard;
  suggestedActions?: CoachAction[];
  pending?: boolean;
};

type SupabaseProfile = {
  id: string;
  username: string | null;
  name: string | null;
  email: string | null;
  avatar_emoji?: string | null;
  dark_theme?: boolean | null;
  haptics_enabled?: boolean | null;
  push_enabled?: boolean | null;
};

type SupabaseHabit = {
  id: string;
  name: string;
  icon: string;
  color: string | null;
  palette_key?: PaletteKey | null;
  created_at: string | null;
};

type SupabaseHabitLog = {
  habit_id: string;
  log_date: string;
};

const STORAGE_KEY = 'flow-liquid-redesign-v4-clean';
const AUTH_STORAGE_KEY = 'flow-auth-v1';
const ASK_FLO_POSITION_STORAGE_KEY = 'ask-flo-launcher-position-v1';
const NAV_HEIGHT = 72;
const NAV_BOTTOM_OFFSET = 16;
const ASK_FLO_WIDTH = 136;
const ASK_FLO_HEIGHT = 48;
const ASK_FLO_EDGE_PADDING = 16;
const ASK_FLO_NAV_GAP = 22;
const ASK_FLO_TAP_THRESHOLD = 6;
const DEFAULT_AUTH_ACCOUNT: AuthAccount = {
  username: 'Pratik',
  password: 'Pratik@16',
  email: 'pratik@rituals.app',
};
const fontBody = 'Inter_500Medium';
const fontBodyRegular = 'Inter_400Regular';
const fontBodySemi = 'Inter_600SemiBold';
const fontBodyBold = 'Inter_700Bold';
const fontBodyExtra = 'Inter_800ExtraBold';
const fontSerif = 'Fraunces_500Medium';
const fontSerifSemi = 'Fraunces_600SemiBold';
const fontSerifBold = 'Fraunces_700Bold';

const colors = {
  page: '#E7EDF5',
  ink: '#1C2B49',
  inkSoft: '#7C8AA6',
  inkFaint: '#A9B4C7',
  cardTop: '#FFFFFF',
  cardBottom: '#F2F6FC',
  cardBorder: 'rgba(255,255,255,0.7)',
  blue1: '#4FA8FF',
  blue2: '#BFE3FF',
  danger: '#FF6A6A',
  track: 'rgba(120,140,180,0.14)',
  line: 'rgba(120,140,180,0.1)',
};

const runtimeExtra = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;
const supabaseUrl = typeof runtimeExtra.supabaseUrl === 'string' ? runtimeExtra.supabaseUrl : undefined;
const supabaseAnonKey = typeof runtimeExtra.supabaseAnonKey === 'string' ? runtimeExtra.supabaseAnonKey : undefined;
const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        ...(Platform.OS !== 'web' ? { storage: AsyncStorage } : {}),
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        lock: processLock,
      },
    })
  : null;

const habitPalette: Record<PaletteKey, HabitPalette> = {
  reading: { a: '#FFB25B', b: '#FFDCA6', bg: ['#FFF6EA', '#FFEBD1'], ink: '#B4600A' },
  food: { a: '#33CBA1', b: '#A9F0DA', bg: ['#EBFBF5', '#D8F7EA'], ink: '#0E8F6A' },
  focus: { a: '#7A79FF', b: '#C9C8FF', bg: ['#F1F0FF', '#E4E2FF'], ink: '#5A4FD6' },
  water: { a: '#4FA8FF', b: '#BFE3FF', bg: ['#EDF6FF', '#DCEDFF'], ink: '#1568C9' },
};

const paletteRotation: PaletteKey[] = ['reading', 'food', 'focus', 'water'];
const iconChoices = ['🧘', '💧', '✍️', '🌙', '🎯'];
const weekLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const seedSettings: FlowSettings = {
  pushNotifications: true,
  messageAlerts: true,
  darkTheme: false,
  haptics: true,
};

const seedRituals: Ritual[] = [];

const defaultState: SavedFlowState = {
  rituals: seedRituals,
  totalActiveRituals: 0,
  baseDoneFromOtherHabits: 0,
  settings: seedSettings,
  insight: '',
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function percentFromWeekly(weekly: number[]) {
  if (!weekly.length) {
    return 0;
  }
  return Math.round((weekly.reduce((sum, value) => sum + value, 0) / weekly.length) * 100);
}

function bestRitual(rituals: Ritual[]) {
  return [...rituals].sort((a, b) => percentFromWeekly(b.weekly) - percentFromWeekly(a.weekly))[0];
}

//hii 
function weakestRitual(rituals: Ritual[]) {
  return [...rituals].sort((a, b) => percentFromWeekly(a.weekly) - percentFromWeekly(b.weekly))[0];
}

function formatTodayLabel() {
  const date = new Date();
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${weekdays[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function normalizeState(parsed: Partial<SavedFlowState>): SavedFlowState {
  const rituals = Array.isArray(parsed.rituals) && parsed.rituals.length ? parsed.rituals : seedRituals;
  return {
    rituals: rituals.map((ritual, index) => ({
      ...ritual,
      paletteKey: ritual.paletteKey && habitPalette[ritual.paletteKey] ? ritual.paletteKey : paletteRotation[index % paletteRotation.length],
      weekly: Array.isArray(ritual.weekly) && ritual.weekly.length === 7 ? ritual.weekly : [0, 0, 0, 0, 0, 0, ritual.doneToday ? 1 : 0],
      heat: Array.isArray(ritual.heat) && ritual.heat.length === 30 ? ritual.heat : Array.from({ length: 30 }, (_, i) => (i === 29 && ritual.doneToday ? 1 : 0)),
      bestStreakDays: ritual.bestStreakDays ?? ritual.streakDays ?? 0,
      createdAt: ritual.createdAt ?? Date.now() + index,
    })),
    totalActiveRituals: parsed.totalActiveRituals ?? rituals.length,
    baseDoneFromOtherHabits: parsed.baseDoneFromOtherHabits ?? 0,
    settings: { ...seedSettings, ...(parsed.settings ?? {}) },
    insight: parsed.insight ?? '',
  };
}

function normalizeAuth(parsed: Partial<StoredAuth> | null): StoredAuth {
  const account = parsed?.account?.username && parsed.account.password
    ? {
        id: parsed.account.id,
        username: parsed.account.username,
        password: parsed.account.password,
        email: parsed.account.email || DEFAULT_AUTH_ACCOUNT.email,
      }
    : DEFAULT_AUTH_ACCOUNT;
  return {
    account,
    signedIn: parsed?.signedIn ?? false,
  };
}

function toUsername(value: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return normalized || `ritual_${Date.now()}`;
}

function authAccountFromUser(user: SupabaseUser, profile?: Partial<SupabaseProfile> | null): AuthAccount {
  const email = user.email ?? profile?.email ?? '';
  const username = profile?.name || profile?.username || user.user_metadata?.full_name || user.user_metadata?.username || email.split('@')[0] || 'Rituals user';
  return {
    id: user.id,
    username,
    email,
    password: '',
  };
}

async function getProfileForUser(user: SupabaseUser) {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id,username,name,email,avatar_emoji,dark_theme,haptics_enabled,push_enabled')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    return null;
  }

  return data as SupabaseProfile | null;
}

async function upsertProfileForUser(user: SupabaseUser, username: string, name: string, email: string) {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      {
        id: user.id,
        username,
        name,
        email,
        avatar_emoji: '🙂',
      },
      { onConflict: 'id' },
    )
    .select('id,username,name,email,avatar_emoji,dark_theme,haptics_enabled,push_enabled')
    .single();

  if (error) {
    throw error;
  }

  return data as SupabaseProfile;
}

async function resolveEmailForIdentifier(identifier: string) {
  if (!supabase) {
    return identifier.trim().toLowerCase();
  }

  const normalized = identifier.trim().toLowerCase();
  if (isValidEmail(normalized)) {
    return normalized;
  }

  const { data, error } = await supabase.rpc('email_for_username', { lookup_username: normalized });
  if (error || typeof data !== 'string' || !data) {
    throw new Error('Account not found. Use your email or correct username.');
  }

  return data;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function isoDaysBack(count: number) {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (count - 1 - index));
    return date.toISOString().slice(0, 10);
  });
}

function paletteToDbColor(paletteKey: PaletteKey) {
  return paletteKey === 'reading' ? 'amber' : paletteKey === 'food' ? 'sky' : paletteKey === 'focus' ? 'violet' : 'sky';
}

function dbColorToPalette(color: string | null | undefined, fallbackIndex: number): PaletteKey {
  if (color === 'amber' || color === 'coral') return 'reading';
  if (color === 'violet') return 'focus';
  if (color === 'sky') return 'water';
  return paletteRotation[fallbackIndex % paletteRotation.length];
}

function currentStreakFromHeat(heat: number[]) {
  let streak = 0;
  for (let index = heat.length - 1; index >= 0; index -= 1) {
    if (!heat[index]) {
      break;
    }
    streak += 1;
  }
  return streak;
}

function longestStreakFromHeat(heat: number[]) {
  let best = 0;
  let current = 0;
  heat.forEach((value) => {
    if (value) {
      current += 1;
      best = Math.max(best, current);
      return;
    }
    current = 0;
  });
  return best;
}

function ritualsFromSupabaseRows(habits: SupabaseHabit[], logs: SupabaseHabitLog[]) {
  const days30 = isoDaysBack(30);
  const days7 = days30.slice(-7);
  const today = todayIso();
  const logsByHabit = new Map<string, Set<string>>();

  logs.forEach((log) => {
    const dates = logsByHabit.get(log.habit_id) ?? new Set<string>();
    dates.add(log.log_date);
    logsByHabit.set(log.habit_id, dates);
  });

  return habits.map((habit, index): Ritual => {
    const dates = logsByHabit.get(habit.id) ?? new Set<string>();
    const heat = days30.map((day) => (dates.has(day) ? 1 : 0));
    const weekly = days7.map((day) => (dates.has(day) ? 1 : 0));
    const paletteKey = habit.palette_key && habitPalette[habit.palette_key] ? habit.palette_key : dbColorToPalette(habit.color, index);
    return {
      id: habit.id,
      name: habit.name,
      icon: habit.icon,
      paletteKey,
      streakDays: currentStreakFromHeat(heat),
      bestStreakDays: longestStreakFromHeat(heat),
      doneToday: dates.has(today),
      weekly,
      heat,
      createdAt: habit.created_at ? Date.parse(habit.created_at) : Date.now() + index,
    };
  });
}

async function loadSupabaseFlowState(userId: string): Promise<Partial<SavedFlowState> | null> {
  if (!supabase) {
    return null;
  }

  const since = isoDaysBack(30)[0];
  const { data: habits, error: habitsError } = await supabase
    .from('habits')
    .select('id,name,icon,color,palette_key,created_at')
    .eq('user_id', userId)
    .eq('is_archived', false)
    .order('created_at', { ascending: true });

  if (habitsError) {
    throw habitsError;
  }

  const { data: logs, error: logsError } = await supabase
    .from('habit_logs')
    .select('habit_id,log_date')
    .eq('user_id', userId)
    .gte('log_date', since);

  if (logsError) {
    throw logsError;
  }

  const profile = await supabase
    .from('profiles')
    .select('dark_theme,haptics_enabled,push_enabled')
    .eq('id', userId)
    .maybeSingle();
  const profileData = profile.data as Pick<SupabaseProfile, 'dark_theme' | 'haptics_enabled' | 'push_enabled'> | null;
  const rituals = ritualsFromSupabaseRows((habits ?? []) as SupabaseHabit[], (logs ?? []) as SupabaseHabitLog[]);

  return {
    rituals,
    totalActiveRituals: rituals.length,
    baseDoneFromOtherHabits: 0,
    settings: {
      ...seedSettings,
      darkTheme: profileData?.dark_theme ?? seedSettings.darkTheme,
      haptics: profileData?.haptics_enabled ?? seedSettings.haptics,
      pushNotifications: profileData?.push_enabled ?? seedSettings.pushNotifications,
    },
  };
}

function useReducedMotion() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setReduceMotion)
      .catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription.remove();
  }, []);

  return reduceMotion;
}

function useEntranceAnimation(trigger: string | number, reduceMotion: boolean) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: reduceMotion ? 1 : 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [progress, reduceMotion, trigger]);

  return {
    opacity: progress,
    transform: [
      {
        translateY: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [14, 0],
        }),
      },
    ],
  };
}

function AppRoot() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Fraunces_400Regular,
    Fraunces_500Medium,
    Fraunces_600SemiBold,
    Fraunces_700Bold,
  });

  if (!fontsLoaded) {
    return <View style={styles.loadingRoot} />;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AuthenticatedApp />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default AppRoot;

function AuthenticatedApp() {
  const [ready, setReady] = useState(false);
  const [account, setAccount] = useState(DEFAULT_AUTH_ACCOUNT);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    let mounted = true;

    const hydrate = async () => {
      if (supabase) {
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) {
          const profile = await getProfileForUser(data.session.user);
          if (mounted) {
            setAccount(authAccountFromUser(data.session.user, profile));
            setSignedIn(true);
          }
        }
        if (mounted) {
          setReady(true);
        }
        return;
      }

      const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      const parsed = stored ? normalizeAuth(JSON.parse(stored) as Partial<StoredAuth>) : normalizeAuth(null);
      if (mounted) {
        setAccount(parsed.account);
        setSignedIn(parsed.signedIn);
        setReady(true);
      }
    };

    hydrate().catch(() => {
      if (mounted) {
        setReady(true);
      }
    });

    const authSubscription = supabase?.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) {
        return;
      }
      if (event === 'SIGNED_OUT' || !session?.user) {
        setSignedIn(false);
        return;
      }
      const profile = await getProfileForUser(session.user);
      if (mounted) {
        setAccount(authAccountFromUser(session.user, profile));
        setSignedIn(true);
      }
    }).data.subscription;

    const appStateSubscription = supabase && Platform.OS !== 'web'
      ? AppState.addEventListener('change', (state) => {
          if (state === 'active') {
            supabase.auth.startAutoRefresh();
          } else {
            supabase.auth.stopAutoRefresh();
          }
        })
      : null;

    return () => {
      mounted = false;
      authSubscription?.unsubscribe();
      appStateSubscription?.remove();
    };
  }, []);

  const saveLocalAuth = useCallback((nextAccount: AuthAccount, nextSignedIn: boolean) => {
    setAccount(nextAccount);
    setSignedIn(nextSignedIn);
    AsyncStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({ account: nextAccount, signedIn: nextSignedIn }),
    ).catch(() => undefined);
  }, []);

  if (!ready) {
    return <View style={styles.loadingRoot} />;
  }

  if (!signedIn) {
    return (
      <AuthGate
        account={account}
        onLogin={(nextAccount) => {
          setAccount(nextAccount);
          setSignedIn(true);
          if (!supabase) {
            saveLocalAuth(nextAccount, true);
          }
        }}
        onCreate={(nextAccount) => {
          setAccount(nextAccount);
          setSignedIn(true);
          if (!supabase) {
            saveLocalAuth(nextAccount, true);
          }
        }}
        onResetPassword={(nextAccount) => {
          setAccount(nextAccount);
          if (!supabase) {
            saveLocalAuth(nextAccount, false);
          }
        }}
      />
    );
  }

  return (
    <FlowApp
      userId={account.id}
      username={account.username}
      onLogout={() => {
        if (supabase) {
          supabase.auth.signOut().catch(() => undefined);
          setSignedIn(false);
          return;
        }
        saveLocalAuth(account, false);
      }}
    />
  );
}

function AuthGate({
  account,
  onLogin,
  onCreate,
  onResetPassword,
}: {
  account: AuthAccount;
  onLogin: (account: AuthAccount) => void;
  onCreate: (account: AuthAccount) => void;
  onResetPassword: (account: AuthAccount) => void;
}) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const [mode, setMode] = useState<AuthMode>('signIn');
  const [identifier, setIdentifier] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const cardAnim = useEntranceAnimation(mode, reduceMotion);
  const contentMaxWidth = width >= 720 ? 440 : undefined;
  const emailIsInvalid = email.length > 0 && !isValidEmail(email);
  const strength = getPasswordStrength(password);

  const clearFeedback = () => {
    setError('');
    setMessage('');
  };

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setPassword('');
    setConfirmPassword('');
    setPasswordVisible(false);
    setTermsAccepted(false);
    clearFeedback();
  };

  const matchesAccount = (candidate: AuthAccount) => {
    const normalizedIdentifier = identifier.trim().toLowerCase();
    return (
      (normalizedIdentifier === candidate.username.toLowerCase() || normalizedIdentifier === candidate.email.toLowerCase()) &&
      password === candidate.password
    );
  };

  const submitSignIn = async () => {
    clearFeedback();
    if (!identifier.trim() || !password) {
      setError('Enter your email or username and password.');
      return;
    }
    if (supabase) {
      if (matchesAccount(DEFAULT_AUTH_ACCOUNT)) {
        onLogin(DEFAULT_AUTH_ACCOUNT);
        return;
      }
      try {
        setSubmitting(true);
        const email = await resolveEmailForIdentifier(identifier);
        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError || !data.user) {
          setError(signInError?.message ?? 'Email/username or password is incorrect.');
          return;
        }
        const profile = await getProfileForUser(data.user);
        onLogin(authAccountFromUser(data.user, profile));
      } catch (authError) {
        setError(authError instanceof Error ? authError.message : 'Unable to sign in.');
      } finally {
        setSubmitting(false);
      }
      return;
    }
    if (matchesAccount(account)) {
      onLogin(account);
      return;
    }
    if (matchesAccount(DEFAULT_AUTH_ACCOUNT)) {
      onLogin(DEFAULT_AUTH_ACCOUNT);
      return;
    }
    setError('Email/username or password is incorrect.');
  };

  const submitCreate = async () => {
    clearFeedback();
    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const username = toUsername(trimmedName);
    if (trimmedName.length < 2) {
      setError('Enter your full name.');
      return;
    }
    if (!isValidEmail(trimmedEmail)) {
      setError('Enter a valid email address.');
      return;
    }
    if (strength.score < 2) {
      setError('Use a stronger password before creating an account.');
      return;
    }
    if (!termsAccepted) {
      setError('Agree to the Terms of Service and Privacy Policy to continue.');
      return;
    }
    if (supabase) {
      try {
        setSubmitting(true);
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            data: {
              username,
              full_name: trimmedName,
            },
          },
        });
        if (signUpError || !data.user) {
          setError(signUpError?.message ?? 'Unable to create account.');
          return;
        }
        const profile = data.session
          ? await upsertProfileForUser(data.user, username, trimmedName, trimmedEmail)
          : null;
        if (!data.session) {
          setMessage('Account created. Check your email to confirm, then sign in.');
          setMode('signIn');
          setIdentifier(trimmedEmail);
          setPassword('');
          return;
        }
        onCreate(authAccountFromUser(data.user, profile));
      } catch (authError) {
        setError(authError instanceof Error ? authError.message : 'Unable to create account.');
      } finally {
        setSubmitting(false);
      }
      return;
    }
    onCreate({
      username,
      password,
      email: trimmedEmail,
    });
  };

  const submitReset = async () => {
    clearFeedback();
    const normalizedIdentifier = identifier.trim().toLowerCase();
    if (supabase) {
      if (!normalizedIdentifier) {
        setError('Enter your email or username.');
        return;
      }
      try {
        setSubmitting(true);
        const resetEmail = await resolveEmailForIdentifier(normalizedIdentifier);
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(resetEmail);
        if (resetError) {
          setError(resetError.message);
          return;
        }
        setMode('signIn');
        setIdentifier(resetEmail);
        setMessage('Password reset email sent. Open the link from your inbox.');
      } catch (authError) {
        setError(authError instanceof Error ? authError.message : 'Unable to send reset email.');
      } finally {
        setSubmitting(false);
      }
      return;
    }
    const knownAccount = normalizedIdentifier === account.username.toLowerCase() || normalizedIdentifier === account.email.toLowerCase()
      ? account
      : normalizedIdentifier === DEFAULT_AUTH_ACCOUNT.username.toLowerCase() || normalizedIdentifier === DEFAULT_AUTH_ACCOUNT.email.toLowerCase()
        ? DEFAULT_AUTH_ACCOUNT
        : null;

    if (!knownAccount) {
      setError('Account not found on this device.');
      return;
    }
    if (password.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    onResetPassword({ ...knownAccount, password });
    setMode('signIn');
    setMessage('Password updated. Sign in with the new password.');
    setPassword('');
    setConfirmPassword('');
  };

  const submit = () => {
    if (submitting) {
      return;
    }
    if (mode === 'signIn') {
      submitSignIn().catch(() => setError('Unable to sign in.'));
      return;
    }
    if (mode === 'createAccount') {
      submitCreate().catch(() => setError('Unable to create account.'));
      return;
    }
    submitReset().catch(() => setError('Unable to reset password.'));
  };

  const isCreate = mode === 'createAccount';
  const isReset = mode === 'forgot';
  const usesSupabaseAuth = Boolean(supabase);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <LinearGradient colors={['#EEF1F4', colors.page]} style={styles.stage}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.authKeyboard}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.authScroll,
              {
                paddingTop: Math.max(insets.top, 10),
                paddingBottom: insets.bottom + 34,
                maxWidth: contentMaxWidth,
              },
            ]}
          >
            {isCreate || isReset ? (
              <PressScale reduceMotion={reduceMotion} onPress={() => switchMode('signIn')} style={styles.authBackButton}>
                <ChevronLeft size={18} color={colors.ink} strokeWidth={2.6} />
              </PressScale>
            ) : null}

            <AuthHero mode={mode} reduceMotion={reduceMotion} />

            <Animated.View style={[styles.authCardWrap, cardAnim]}>
              <GradientCard style={[styles.authCard, isCreate && styles.authCardCreate]}>
                {isCreate ? (
                  <>
                    <AuthInput
                      icon={User}
                      label="Username"
                      value={fullName}
                      onChangeText={(value) => {
                        setFullName(value);
                        clearFeedback();
                      }}
                      placeholder="Pratik"
                      returnKeyType="next"
                    />
                    <AuthInput
                      icon={Mail}
                      label="Email"
                      value={email}
                      onChangeText={(value) => {
                        setEmail(value);
                        clearFeedback();
                      }}
                      placeholder="you@rituals.app"
                      keyboardType="email-address"
                      returnKeyType="next"
                      error={emailIsInvalid}
                      helperText={emailIsInvalid ? 'Enter a valid email address' : undefined}
                    />
                    <AuthInput
                      icon={Lock}
                      label="Password"
                      value={password}
                      onChangeText={(value) => {
                        setPassword(value);
                        clearFeedback();
                      }}
                      placeholder="Create a password"
                      secureTextEntry={!passwordVisible}
                      trailing={(
                        <Pressable accessibilityRole="button" onPress={() => setPasswordVisible((current) => !current)} hitSlop={8}>
                          {passwordVisible ? <EyeOff size={18} color={colors.inkFaint} /> : <Eye size={18} color={colors.inkFaint} />}
                        </Pressable>
                      )}
                    />
                    <PasswordStrengthMeter strength={strength} />
                    <TermsAgreement
                      checked={termsAccepted}
                      onToggle={() => {
                        setTermsAccepted((current) => !current);
                        clearFeedback();
                      }}
                      onOpenTerms={() => setMessage('Terms of Service will open after the policy screen is connected.')}
                      onOpenPrivacy={() => setMessage('Privacy Policy will open after the policy screen is connected.')}
                      required={!termsAccepted && Boolean(error)}
                    />
                  </>
                ) : (
                  <>
                    <Text style={styles.authCardTitle}>{isReset ? 'Reset password' : 'Welcome back'}</Text>
                    <Text style={styles.authCardSub}>{isReset ? 'Send a reset link to your Supabase account email' : 'Sign in to keep your streaks flowing'}</Text>
                    <AuthInput
                      icon={Mail}
                      label="Email or username"
                      value={identifier}
                      onChangeText={(value) => {
                        setIdentifier(value);
                        clearFeedback();
                      }}
                      placeholder="Pratik or pratik@rituals.app"
                      returnKeyType="next"
                    />
                    {isReset && usesSupabaseAuth ? null : (
                      <AuthInput
                        icon={Lock}
                        label={isReset ? 'New password' : 'Password'}
                        value={password}
                        onChangeText={(value) => {
                          setPassword(value);
                          clearFeedback();
                        }}
                        placeholder={isReset ? 'Minimum 6 characters' : 'Enter your password'}
                        secureTextEntry={!passwordVisible}
                        returnKeyType={isReset ? 'next' : 'done'}
                        onSubmitEditing={isReset ? undefined : submit}
                        trailing={(
                          <Pressable accessibilityRole="button" onPress={() => setPasswordVisible((current) => !current)} hitSlop={8}>
                            {passwordVisible ? <EyeOff size={18} color={colors.inkFaint} /> : <Eye size={18} color={colors.inkFaint} />}
                          </Pressable>
                        )}
                      />
                    )}
                    {isReset && !usesSupabaseAuth ? (
                      <AuthInput
                        icon={Lock}
                        label="Confirm password"
                        value={confirmPassword}
                        onChangeText={(value) => {
                          setConfirmPassword(value);
                          clearFeedback();
                        }}
                        placeholder="Re-enter password"
                        secureTextEntry={!passwordVisible}
                        returnKeyType="done"
                        onSubmitEditing={submit}
                      />
                    ) : (
                      <View style={styles.authBetweenRow}>
                        <CheckLine checked={rememberMe} onPress={() => setRememberMe((current) => !current)} label="Remember me" compact />
                        <Pressable accessibilityRole="button" onPress={() => switchMode('forgot')}>
                          <Text style={styles.authInlineLink}>Forgot password?</Text>
                        </Pressable>
                      </View>
                    )}
                  </>
                )}

                {error ? <Text style={styles.authError}>{error}</Text> : null}
                {message ? <Text style={styles.authMessage}>{message}</Text> : null}

                <PressScale reduceMotion={reduceMotion} onPress={submit} style={styles.authPrimaryButton}>
                  <Text style={styles.authPrimaryText}>
                    {submitting ? 'Please wait' : isCreate ? 'Create account' : isReset ? usesSupabaseAuth ? 'Send reset link' : 'Update password' : 'Sign in'}
                  </Text>
                  <ArrowRight size={16} color="#FFFFFF" strokeWidth={2.7} />
                </PressScale>

                {!isReset ? (
                  <>
                    <View style={styles.authDivider}>
                      <View style={styles.authDividerLine} />
                      <Text style={styles.authDividerText}>{isCreate ? 'or sign up with' : 'or continue with'}</Text>
                      <View style={styles.authDividerLine} />
                    </View>
                    <View style={styles.authSocialRow}>
                      <SocialButton label="Google" reduceMotion={reduceMotion} onPress={() => setMessage('Google sign-in will connect after Supabase Auth setup.')} />
                      <SocialButton label="Apple" reduceMotion={reduceMotion} onPress={() => setMessage('Apple sign-in will connect after Supabase Auth setup.')} />
                    </View>
                  </>
                ) : null}

                <View style={styles.authFooterLine}>
                  <Text style={styles.authFooterMuted}>
                    {isCreate || isReset ? 'Already have an account? ' : 'New to Rituals? '}
                  </Text>
                  <Pressable accessibilityRole="button" onPress={() => switchMode(isCreate || isReset ? 'signIn' : 'createAccount')}>
                    <Text style={styles.authFooterLink}>{isCreate || isReset ? 'Sign in' : 'Create account'}</Text>
                  </Pressable>
                </View>
              </GradientCard>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function getPasswordStrength(value: string) {
  if (!value) {
    return { score: 0, label: 'Use 8+ characters with a number', color: colors.inkFaint };
  }
  let score = 0;
  if (value.length >= 8) score += 1;
  if (/[0-9]/.test(value) && /[a-zA-Z]/.test(value)) score += 1;
  if (value.length >= 12 && /[^a-zA-Z0-9]/.test(value)) score += 1;
  if (score <= 1) {
    return { score: 1, label: 'Weak - add a number and more characters', color: colors.danger };
  }
  if (score === 2) {
    return { score: 2, label: 'Good - a symbol makes it stronger', color: habitPalette.reading.a };
  }
  return { score: 3, label: 'Strong password', color: habitPalette.food.a };
}

function AuthHero({ mode, reduceMotion }: { mode: AuthMode; reduceMotion: boolean }) {
  const isCreate = mode === 'createAccount';
  return (
    <View style={[styles.authHero, isCreate && styles.authHeroCompact]}>
      <AnimatedWaveBackground reduceMotion={reduceMotion} compact={isCreate || mode === 'forgot'} />
      <View style={styles.authHeroContent}>
        <LogoMark size={isCreate || mode === 'forgot' ? 52 : 64} reduceMotion={reduceMotion} />
        <Text style={isCreate ? styles.authCreateTitle : styles.authWordmark}>{isCreate ? 'Start your ritual' : 'Rituals'}</Text>
        <Text style={styles.authHeroSubtitle}>
          {isCreate ? 'Create an account to build streaks that stick' : mode === 'forgot' ? 'Reset your ritual flow' : 'Small rituals. Steady flow.'}
        </Text>
      </View>
    </View>
  );
}

function AnimatedWaveBackground({ reduceMotion, compact }: { reduceMotion: boolean; compact: boolean }) {
  const drift = useSharedValue(0);
  const width = 420;

  useEffect(() => {
    if (reduceMotion) {
      cancelAnimation(drift);
      drift.value = 0;
      return;
    }
    drift.value = withRepeat(
      withTiming(-width, { duration: compact ? 7000 : 6800, easing: ReanimatedEasing.linear }),
      -1,
      false,
    );
    return () => cancelAnimation(drift);
  }, [compact, drift, reduceMotion, width]);

  const waveStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: drift.value }],
  }));

  return (
    <View style={[styles.authWaveHost, compact && styles.authWaveHostCompact]}>
      <LinearGradient colors={['#F5FAFF', colors.blue2]} style={StyleSheet.absoluteFill} />
      <Reanimated.View style={[styles.authWaveSvgWrap, { width: width * 2 }, waveStyle]}>
        <Svg width={width * 2} height={compact ? 96 : 170} viewBox={`0 0 ${width * 2} ${compact ? 96 : 170}`} preserveAspectRatio="none">
          <Defs>
            <SvgLinearGradient id="authWaveGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={colors.blue2} />
              <Stop offset="100%" stopColor={colors.blue1} />
            </SvgLinearGradient>
          </Defs>
          <Path
            d={compact
              ? `M0 44 Q 52 24 105 44 T 210 44 T 315 44 T 420 44 T 525 44 T 630 44 T 735 44 T 840 44 V96 H0 Z`
              : `M0 78 Q 52 48 105 78 T 210 78 T 315 78 T 420 78 T 525 78 T 630 78 T 735 78 T 840 78 V170 H0 Z`}
            fill="url(#authWaveGrad)"
          />
        </Svg>
      </Reanimated.View>
    </View>
  );
}

function LogoMark({ size, reduceMotion, palette = habitPalette.water }: { size: number; reduceMotion: boolean; palette?: HabitPalette }) {
  const drift = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      cancelAnimation(drift);
      drift.value = 0;
      return;
    }
    drift.value = withRepeat(withTiming(-30, { duration: 3400, easing: ReanimatedEasing.linear }), -1, false);
    return () => cancelAnimation(drift);
  }, [drift, reduceMotion]);

  const waveStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: drift.value }],
  }));

  return (
    <View style={[styles.logoMark, { width: size, height: size, borderRadius: size / 2 }]}>
      <Svg width={size} height={size} viewBox="0 0 64 64" style={StyleSheet.absoluteFill}>
        <Defs>
          <SvgLinearGradient id="logoArcGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor={palette.b} />
            <Stop offset="100%" stopColor={palette.a} />
          </SvgLinearGradient>
        </Defs>
        <Circle cx="32" cy="32" r="29" stroke="rgba(120,140,180,0.16)" strokeWidth="4" fill="none" />
        <Circle
          cx="32"
          cy="32"
          r="29"
          stroke="url(#logoArcGrad)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="182.2"
          strokeDashoffset="46"
          fill="none"
          transform="rotate(-90 32 32)"
        />
        <Circle cx="32" cy="32" r="24" fill="#FFFFFF" />
      </Svg>
      <View style={styles.logoClip}>
        <Reanimated.View style={[styles.logoWaveLayer, waveStyle]}>
          <Svg width={110} height={64} viewBox="-20 0 110 64" preserveAspectRatio="none">
            <Defs>
              <SvgLinearGradient id="logoFillGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor={palette.b} />
                <Stop offset="100%" stopColor={palette.a} />
              </SvgLinearGradient>
            </Defs>
            <Path d="M-20 26 Q -12 18 -4 26 T 12 26 T 28 26 T 44 26 T 60 26 T 76 26 V64 H-20 Z" fill="url(#logoFillGrad)" />
          </Svg>
        </Reanimated.View>
      </View>
    </View>
  );
}

function AuthInput({
  icon: Icon,
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  returnKeyType,
  onSubmitEditing,
  trailing,
  error,
  helperText,
}: {
  icon: IconComponent;
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address';
  returnKeyType?: 'done' | 'next';
  onSubmitEditing?: () => void;
  trailing?: ReactNode;
  error?: boolean;
  helperText?: string;
}) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  return (
    <View style={styles.authField}>
      <Text style={styles.authFieldLabel}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => inputRef.current?.focus()}
        style={[styles.authInputShell, focused && styles.authInputShellFocused, error && styles.authInputShellError]}
      >
        <Icon size={18} color={colors.inkFaint} strokeWidth={2.3} />
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.inkFaint}
          secureTextEntry={secureTextEntry}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType={keyboardType}
          returnKeyType={returnKeyType}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onSubmitEditing={onSubmitEditing}
          blurOnSubmit={returnKeyType === 'done'}
          textContentType={secureTextEntry ? 'password' : keyboardType === 'email-address' ? 'emailAddress' : 'username'}
          autoComplete={secureTextEntry ? 'password' : keyboardType === 'email-address' ? 'email' : 'username'}
          importantForAutofill="yes"
          style={styles.authInput}
        />
        {trailing}
      </Pressable>
      {helperText ? <Text style={styles.authHelperError}>{helperText}</Text> : null}
    </View>
  );
}

function PasswordStrengthMeter({ strength }: { strength: { score: number; label: string; color: string } }) {
  return (
    <View style={styles.strengthBlock}>
      <View style={styles.strengthRow}>
        {[1, 2, 3].map((index) => (
          <View key={index} style={[styles.strengthSegment, index <= strength.score && { backgroundColor: strength.color }]} />
        ))}
      </View>
      <Text style={[styles.strengthLabel, strength.score > 0 && { color: strength.color }]}>{strength.label}</Text>
    </View>
  );
}

function CheckLine({
  checked,
  onPress,
  label,
  compact = false,
  required = false,
}: {
  checked: boolean;
  onPress: () => void;
  label: string;
  compact?: boolean;
  required?: boolean;
}) {
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked }} onPress={onPress} style={[compact ? styles.authCheckCompact : styles.authCheckLine]}>
      <View style={[styles.authCheckbox, checked && styles.authCheckboxChecked, required && styles.authCheckboxRequired]}>
        {checked ? (
          <LinearGradient colors={[colors.blue1, '#2E8FE8']} style={styles.authCheckboxGradient}>
            <Check size={12} color="#FFFFFF" strokeWidth={3} />
          </LinearGradient>
        ) : null}
      </View>
      <Text style={[styles.authCheckText, compact && styles.authCheckTextCompact]}>{label}</Text>
    </Pressable>
  );
}

function TermsAgreement({
  checked,
  onToggle,
  onOpenTerms,
  onOpenPrivacy,
  required,
}: {
  checked: boolean;
  onToggle: () => void;
  onOpenTerms: () => void;
  onOpenPrivacy: () => void;
  required: boolean;
}) {
  return (
    <View style={styles.authCheckLine}>
      <Pressable accessibilityRole="checkbox" accessibilityState={{ checked }} onPress={onToggle} style={[styles.authCheckbox, checked && styles.authCheckboxChecked, required && styles.authCheckboxRequired]}>
        {checked ? (
          <LinearGradient colors={[colors.blue1, '#2E8FE8']} style={styles.authCheckboxGradient}>
            <Check size={12} color="#FFFFFF" strokeWidth={3} />
          </LinearGradient>
        ) : null}
      </Pressable>
      <Text style={styles.authCheckText} onPress={onToggle}>
        I agree to the{' '}
        <Text style={styles.authFooterLink} onPress={onOpenTerms}>
          Terms of Service
        </Text>{' '}
        and{' '}
        <Text style={styles.authFooterLink} onPress={onOpenPrivacy}>
          Privacy Policy
        </Text>
      </Text>
    </View>
  );
}

function SocialButton({ label, reduceMotion, onPress }: { label: 'Google' | 'Apple'; reduceMotion: boolean; onPress: () => void }) {
  const isApple = label === 'Apple';
  return (
    <PressScale
      reduceMotion={reduceMotion}
      onPress={onPress}
      style={[styles.authSocialButton, isApple ? styles.authSocialButtonApple : styles.authSocialButtonGoogle]}
    >
      {isApple ? <AppleGlyph /> : <GoogleGMark />}
      <Text style={[styles.authSocialText, isApple ? styles.authSocialTextApple : styles.authSocialTextGoogle]}>
        Continue with {label}
      </Text>
    </PressScale>
  );
}

function GoogleGMark() {
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18" accessibilityLabel="Google">
      <Path d="M17.64 9.204c0-.638-.057-1.252-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.616Z" fill="#4285F4" />
      <Path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.583-5.036-3.71H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853" />
      <Path d="M3.964 10.712A5.41 5.41 0 0 1 3.682 9c0-.594.102-1.17.282-1.712V4.956H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.044l3.007-2.332Z" fill="#FBBC05" />
      <Path d="M9 3.58c1.322 0 2.508.454 3.44 1.346l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.956l3.007 2.332C4.672 5.161 6.656 3.58 9 3.58Z" fill="#EA4335" />
    </Svg>
  );
}

function AppleGlyph() {
  return (
    <Svg width={16} height={18} viewBox="0 0 16 18" accessibilityLabel="Apple">
      <Path
        d="M12.94 9.55c-.02-1.86 1.52-2.75 1.59-2.8-.87-1.27-2.21-1.44-2.68-1.46-1.14-.12-2.23.67-2.81.67-.58 0-1.47-.65-2.42-.63-1.25.02-2.4.73-3.04 1.85-1.3 2.25-.33 5.58.93 7.4.62.9 1.36 1.91 2.33 1.87.93-.04 1.29-.6 2.41-.6 1.12 0 1.44.6 2.42.58 1-.02 1.64-.91 2.25-1.81.71-1.04 1-2.04 1.02-2.09-.02-.01-1.98-.76-2-2.98ZM11.1 4.09c.51-.62.86-1.49.76-2.35-.74.03-1.64.49-2.17 1.11-.48.56-.9 1.45-.79 2.31.83.06 1.68-.42 2.2-1.07Z"
        fill="#FFFFFF"
      />
    </Svg>
  );
}

function PressScale({
  children,
  onPress,
  style,
  reduceMotion,
}: {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  reduceMotion: boolean;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = reduceMotion ? 1 : withTiming(0.97, { duration: 120 });
      }}
      onPressOut={() => {
        scale.value = reduceMotion ? 1 : withSpring(1, { damping: 14, stiffness: 260 });
      }}
    >
      <Reanimated.View style={[style, animatedStyle]}>{children}</Reanimated.View>
    </Pressable>
  );
}

function FlowApp({ userId, username, onLogout }: { userId?: string; username: string; onLogout: () => void }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const [activeTab, setActiveTab] = useState<TabKey>('today');
  const [rituals, setRituals] = useState(defaultState.rituals);
  const [totalActiveRituals, setTotalActiveRituals] = useState(defaultState.totalActiveRituals);
  const [baseDoneFromOtherHabits, setBaseDoneFromOtherHabits] = useState(defaultState.baseDoneFromOtherHabits);
  const [settings, setSettings] = useState(defaultState.settings);
  const [insight, setInsight] = useState(defaultState.insight);
  const [selectedRitualId, setSelectedRitualId] = useState(defaultState.rituals[0]?.id ?? '');
  const [addOpen, setAddOpen] = useState(false);
  const [coachOpen, setCoachOpen] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [particles, setParticles] = useState<BurstParticle[]>([]);
  const [newRitualId, setNewRitualId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const isTablet = width >= 720;
  const storageKey = useMemo(() => (userId ? `${STORAGE_KEY}:${userId}` : STORAGE_KEY), [userId]);

  useEffect(() => {
    let mounted = true;
    setHydrated(false);

    const applyState = (state: SavedFlowState) => {
      setRituals(state.rituals);
      setTotalActiveRituals(state.totalActiveRituals);
      setBaseDoneFromOtherHabits(state.baseDoneFromOtherHabits);
      setSettings(state.settings);
      setInsight(state.insight);
      setSelectedRitualId(state.rituals[0]?.id ?? '');
    };

    const loadLocal = async () => {
      const stored = await AsyncStorage.getItem(storageKey);
      return stored ? normalizeState(JSON.parse(stored) as Partial<SavedFlowState>) : defaultState;
    };

    const hydrate = async () => {
      if (supabase && userId) {
        try {
          const remote = await loadSupabaseFlowState(userId);
          if (remote) {
            const state = normalizeState({ ...defaultState, ...remote });
            if (mounted) {
              applyState(state);
            }
            await AsyncStorage.setItem(storageKey, JSON.stringify(state));
            return;
          }
        } catch {
          const local = await loadLocal();
          if (mounted) {
            applyState(local);
          }
          return;
        }
      }

      const local = await loadLocal();
      if (mounted) {
        applyState(local);
      }
    };

    hydrate()
      .catch(() => undefined)
      .finally(() => {
        if (mounted) {
          setHydrated(true);
        }
      });

    return () => {
      mounted = false;
    };
  }, [storageKey, userId]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    const state: SavedFlowState = {
      rituals,
      totalActiveRituals,
      baseDoneFromOtherHabits,
      settings,
      insight,
    };
    AsyncStorage.setItem(storageKey, JSON.stringify(state)).catch(() => undefined);
  }, [baseDoneFromOtherHabits, hydrated, insight, rituals, settings, storageKey, totalActiveRituals]);

  const doneCount = useMemo(
    () => baseDoneFromOtherHabits + rituals.filter((ritual) => ritual.doneToday).length,
    [baseDoneFromOtherHabits, rituals],
  );
  const heroPercent = totalActiveRituals ? Math.round((doneCount / totalActiveRituals) * 100) : 0;
  const selectedRitual = rituals.find((ritual) => ritual.id === selectedRitualId) ?? rituals[0];

  useEffect(() => {
    if (!selectedRitual && rituals[0]) {
      setSelectedRitualId(rituals[0].id);
    }
  }, [rituals, selectedRitual]);

  const showToast = useCallback((message: string) => {
    setToast({ id: Date.now(), message });
  }, []);

  const clearToast = useCallback(() => {
    setToast(null);
  }, []);

  const fireBurst = useCallback((x: number, y: number, palette: HabitPalette) => {
    if (reduceMotion) {
      return;
    }
    const created = Array.from({ length: 14 }).map((_, index) => {
      const angle = (Math.PI * 2 * index) / 14;
      const distance = 40 + ((index * 17) % 30);
      return {
        id: `${Date.now()}-${index}`,
        x,
        y,
        color: [palette.a, palette.b, '#FFB25B'][index % 3],
        dx: Math.cos(angle) * distance,
        dy: Math.sin(angle) * distance,
        duration: 600 + ((index * 31) % 280),
      };
    });
    setParticles((current) => [...current, ...created]);
  }, [reduceMotion]);

  const removeParticle = useCallback((id: string) => {
    setParticles((current) => current.filter((particle) => particle.id !== id));
  }, []);

  const impact = useCallback(() => {
    if (!settings.haptics) {
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
  }, [settings.haptics]);

  const toggleRitual = (ritualId: string, x: number, y: number) => {
    const target = rituals.find((ritual) => ritual.id === ritualId);
    if (!target) {
      return;
    }
    const nextDoneToday = !target.doneToday;
    let toastMessage = '';
    let burstPalette: HabitPalette | null = null;

    setRituals((current) =>
      current.map((ritual) => {
        if (ritual.id !== ritualId) {
          return ritual;
        }
        const doneToday = nextDoneToday;
        const streakDays = Math.max(0, ritual.streakDays + (doneToday ? 1 : -1));
        const weekly = [...ritual.weekly];
        weekly[weekly.length - 1] = doneToday ? 1 : 0;
        const heat = [...ritual.heat];
        heat[heat.length - 1] = doneToday ? 1 : 0;
        const next = {
          ...ritual,
          doneToday,
          streakDays,
          bestStreakDays: Math.max(ritual.bestStreakDays, streakDays),
          weekly,
          heat,
        };
        toastMessage = doneToday ? `✓ ${ritual.name} complete - streak ${streakDays} days` : `${ritual.name} unmarked`;
        burstPalette = doneToday ? habitPalette[ritual.paletteKey] : null;
        return next;
      }),
    );

    impact();
    if (burstPalette) {
      fireBurst(x, y, burstPalette);
    }
    showToast(toastMessage);

    if (supabase && userId) {
      const logDate = todayIso();
      const write = nextDoneToday
        ? supabase.from('habit_logs').upsert(
            {
              habit_id: ritualId,
              user_id: userId,
              log_date: logDate,
              completed_at: new Date().toISOString(),
              freeze_used: false,
            },
            { onConflict: 'habit_id,log_date' },
          )
        : supabase
            .from('habit_logs')
            .delete()
            .eq('habit_id', ritualId)
            .eq('user_id', userId)
            .eq('log_date', logDate);

      write.then(({ error: writeError }) => {
        if (writeError) {
          showToast(`Database save failed: ${writeError.message}`);
        }
      });
    }
  };

  const addRitual = async (name: string, icon: string) => {
    const paletteKey = paletteRotation[rituals.length % paletteRotation.length];
    let id = `ritual-${Date.now()}`;
    let createdAt = Date.now();

    if (supabase && userId) {
      const { data, error: insertError } = await supabase
        .from('habits')
        .insert({
          user_id: userId,
          name,
          icon,
          color: paletteToDbColor(paletteKey),
          palette_key: paletteKey,
          frequency: 'daily',
        })
        .select('id,created_at')
        .single();

      if (insertError || !data) {
        showToast(`Database save failed: ${insertError?.message ?? 'Unable to add ritual'}`);
        return;
      }

      id = data.id;
      createdAt = data.created_at ? Date.parse(data.created_at) : createdAt;
    }

    const next: Ritual = {
      id,
      name,
      icon,
      paletteKey,
      streakDays: 0,
      bestStreakDays: 0,
      doneToday: false,
      weekly: [0, 0, 0, 0, 0, 0, 0],
      heat: Array.from({ length: 30 }, () => 0),
      createdAt,
    };
    setRituals((current) => [...current, next]);
    setSelectedRitualId(id);
    setTotalActiveRituals((current) => current + 1);
    setNewRitualId(id);
    setActiveTab('today');
    showToast(`✓ ${name} added to your rituals`);
    impact();
    setTimeout(() => setNewRitualId(null), 650);
  };

  const updateSetting = (key: keyof FlowSettings, value: boolean) => {
    setSettings((current) => ({ ...current, [key]: value }));
    showToast(value ? 'Setting enabled' : 'Setting disabled');
    impact();

    if (supabase && userId) {
      const column = key === 'darkTheme' ? 'dark_theme' : key === 'haptics' ? 'haptics_enabled' : key === 'pushNotifications' ? 'push_enabled' : null;
      if (column) {
        supabase
          .from('profiles')
          .update({ [column]: value })
          .eq('id', userId)
          .then(({ error: writeError }) => {
            if (writeError) {
              showToast(`Database save failed: ${writeError.message}`);
            }
          });
      }
    }
  };

  const generateInsight = (coachText?: string) => {
    if (!rituals.length) {
      showToast('Create a ritual first');
      return;
    }
    const strong = bestRitual(rituals);
    const weak = weakestRitual(rituals);
    const nextInsight = `${strong?.name ?? 'Your strongest ritual'} is carrying the week. Stack ${weak?.name ?? 'your lowest ritual'} immediately after it tomorrow and keep the reminder within the same hour.`;
    setInsight(coachText ?? nextInsight);
    const screen = Dimensions.get('window');
    fireBurst(screen.width / 2, Math.max(220, insets.top + 210), habitPalette.water);
    showToast('✨ Weekly insight ready');
    impact();
  };

  const screenStyle = useEntranceAnimation(activeTab, reduceMotion);
  const contentMaxWidth = isTablet ? 520 : undefined;

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <LinearGradient colors={['#EEF1F4', colors.page]} style={styles.stage}>
        <Animated.View
          key={activeTab}
          style={[
            styles.screenHost,
            {
              paddingTop: Math.max(insets.top, 12),
              paddingBottom: insets.bottom + 112,
              maxWidth: contentMaxWidth,
            },
            screenStyle,
          ]}
        >
          {activeTab === 'today' ? (
            <TodayScreen
              username={username}
              rituals={rituals}
              totalActiveRituals={totalActiveRituals}
              doneCount={doneCount}
              heroPercent={heroPercent}
              newRitualId={newRitualId}
              reduceMotion={reduceMotion}
              onToggleRitual={toggleRitual}
              onOpenProfile={() => setActiveTab('profile')}
            />
          ) : null}
          {activeTab === 'progress' ? (
            <ProgressScreen
              rituals={rituals}
              selectedRitual={selectedRitual}
              selectedRitualId={selectedRitualId}
              totalActiveRituals={totalActiveRituals}
              reduceMotion={reduceMotion}
              onSelectRitual={setSelectedRitualId}
            />
          ) : null}
          {activeTab === 'insights' ? (
            <InsightsScreen rituals={rituals} insight={insight} reduceMotion={reduceMotion} onGenerate={generateInsight} />
          ) : null}
          {activeTab === 'profile' ? (
            <ProfileScreen rituals={rituals} settings={settings} username={username} onSettingChange={updateSetting} onLogout={onLogout} />
          ) : null}
        </Animated.View>

        <BottomNav activeTab={activeTab} bottomInset={insets.bottom} onChange={setActiveTab} onAdd={() => setAddOpen(true)} />
        <AskFloLauncher userId={userId} bottomInset={insets.bottom} topInset={insets.top} reduceMotion={reduceMotion} onOpen={() => setCoachOpen(true)} />
        <CoachChatSheet open={coachOpen} rituals={rituals} reduceMotion={reduceMotion} onClose={() => setCoachOpen(false)} onAddRitual={addRitual} />
        <AddRitualSheet open={addOpen} onClose={() => setAddOpen(false)} onAdd={addRitual} reduceMotion={reduceMotion} />
        <Toast toast={toast} bottomInset={insets.bottom} reduceMotion={reduceMotion} onDone={clearToast} />
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          {particles.map((particle) => (
            <ParticleDot key={particle.id} particle={particle} onDone={removeParticle} />
          ))}
        </View>
      </LinearGradient>
    </View>
  );
}

function TodayScreen({
  username,
  rituals,
  totalActiveRituals,
  doneCount,
  heroPercent,
  newRitualId,
  reduceMotion,
  onToggleRitual,
  onOpenProfile,
}: {
  username: string;
  rituals: Ritual[];
  totalActiveRituals: number;
  doneCount: number;
  heroPercent: number;
  newRitualId: string | null;
  reduceMotion: boolean;
  onToggleRitual: (id: string, x: number, y: number) => void;
  onOpenProfile: () => void;
}) {
  const todayLabel = useMemo(() => formatTodayLabel(), []);
  const statusRows = useMemo(
    () =>
      rituals.map((ritual) => ({
        icon: ritual.icon,
        name: ritual.name,
        sub: `${ritual.streakDays} day streak`,
        pct: `${percentFromWeekly(ritual.weekly)}%`,
        palette: habitPalette[ritual.paletteKey],
      })),
    [rituals],
  );

  return (
    <ScrollView contentContainerStyle={styles.screenScroll} showsVerticalScrollIndicator={false}>
      <View style={styles.topRow}>
        <Pressable accessibilityRole="button" accessibilityLabel="Open profile" onPress={onOpenProfile} style={styles.avatar}>
          <Text style={styles.avatarText}>🙂</Text>
        </Pressable>
        <View style={styles.greetingBlock}>
          <Text style={styles.greetingSub}>Today · {todayLabel}</Text>
          <Text style={styles.greetingName}>{username}</Text>
        </View>
        <View style={styles.bellButton}>
          <Bell size={19} color={colors.ink} strokeWidth={2.3} />
          <View style={styles.dotBadge} />
        </View>
      </View>

      <GradientCard style={styles.hero}>
        <Text style={styles.heroHead}>
          Today's rituals · <Text style={styles.heroHeadStrong}>{doneCount}/{totalActiveRituals}</Text> done
        </Text>
        <LiquidRing percent={heroPercent} size={220} variant="hero" palette={habitPalette.water} reduceMotion={reduceMotion} />
        <View style={styles.goalPill}>
          <DropletIcon />
          <Text style={styles.goalPillText}>{heroPercent}% of daily rituals</Text>
        </View>
      </GradientCard>

      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>Today's rituals</Text>
        <Text style={styles.sectionMeta}>{totalActiveRituals} active</Text>
      </View>

      <View style={styles.ritualGrid}>
        {rituals.length ? (
          rituals.map((ritual) => (
            <RitualCard
              key={ritual.id}
              ritual={ritual}
              entering={ritual.id === newRitualId}
              reduceMotion={reduceMotion}
              onToggle={onToggleRitual}
            />
          ))
        ) : (
          <View style={styles.fullWidth}>
            <EmptyCard title="No rituals yet" body="Create your first ritual to start tracking today." icon="💧" />
          </View>
        )}
      </View>

      {statusRows.length ? (
        <>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Overall status</Text>
          </View>

          <View style={styles.statusCard}>
            {statusRows.map((row) => (
              <StatusRow key={row.name} icon={row.icon} name={row.name} sub={row.sub} pct={row.pct} palette={row.palette} />
            ))}
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

function RitualCard({
  ritual,
  entering,
  reduceMotion,
  onToggle,
}: {
  ritual: Ritual;
  entering: boolean;
  reduceMotion: boolean;
  onToggle: (id: string, x: number, y: number) => void;
}) {
  const palette = habitPalette[ritual.paletteKey];
  const enter = useRef(new Animated.Value(entering ? 0 : 1)).current;
  const pressScale = useRef(new Animated.Value(1)).current;
  const checkScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!entering) {
      enter.setValue(1);
      return;
    }
    Animated.timing(enter, {
      toValue: 1,
      duration: reduceMotion ? 1 : 400,
      easing: Easing.out(Easing.back(1.2)),
      useNativeDriver: true,
    }).start();
  }, [enter, entering, reduceMotion]);

  const toggle = (x: number, y: number) => {
    Animated.sequence([
      Animated.timing(checkScale, {
        toValue: 0.85,
        duration: reduceMotion ? 1 : 75,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(checkScale, {
        toValue: 1,
        speed: 22,
        bounciness: 8,
        useNativeDriver: true,
      }),
    ]).start();
    onToggle(ritual.id, x, y);
  };

  return (
    <Animated.View
      style={[
        styles.ritualCell,
        {
          opacity: enter,
          transform: [
            {
              translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }),
            },
            {
              scale: Animated.multiply(
                pressScale,
                enter.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }),
              ),
            },
          ],
        },
      ]}
    >
      <Pressable
        onPressIn={() => {
          Animated.timing(pressScale, {
            toValue: 0.97,
            duration: reduceMotion ? 1 : 120,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }).start();
        }}
        onPressOut={() => {
          Animated.spring(pressScale, {
            toValue: 1,
            speed: 28,
            bounciness: 6,
            useNativeDriver: true,
          }).start();
        }}
        style={styles.ritualPress}
      >
        <LinearGradient colors={palette.bg} style={styles.ritualCard}>
          <View style={styles.ritualTop}>
            <LiquidRing
              percent={ritual.doneToday ? 100 : 42}
              size={46}
              variant="mini"
              palette={palette}
              reduceMotion={reduceMotion}
              centerIcon={ritual.icon}
            />
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: ritual.doneToday }}
              accessibilityLabel={`${ritual.doneToday ? 'Unmark' : 'Complete'} ${ritual.name}`}
              hitSlop={10}
              onPress={(event) => toggle(event.nativeEvent.pageX, event.nativeEvent.pageY)}
            >
              <Animated.View style={[styles.ritualCheck, { transform: [{ scale: checkScale }] }]}>
                {ritual.doneToday ? (
                  <LinearGradient colors={[palette.a, palette.b]} style={styles.ritualCheckFill}>
                    <Check size={16} color="#FFFFFF" strokeWidth={3.2} />
                  </LinearGradient>
                ) : (
                  <View style={styles.ritualCheckEmpty}>
                    <Check size={15} color="#FFFFFF" strokeWidth={3} />
                  </View>
                )}
              </Animated.View>
            </Pressable>
          </View>
          <View>
            <Text numberOfLines={2} style={styles.ritualName}>{ritual.name}</Text>
            <View style={styles.ritualStreakRow}>
              <Text style={[styles.ritualStreak, { color: palette.ink }]}>🔥 {ritual.streakDays} day streak</Text>
            </View>
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

function ProgressScreen({
  rituals,
  selectedRitual,
  selectedRitualId,
  totalActiveRituals,
  reduceMotion,
  onSelectRitual,
}: {
  rituals: Ritual[];
  selectedRitual?: Ritual;
  selectedRitualId: string;
  totalActiveRituals: number;
  reduceMotion: boolean;
  onSelectRitual: (id: string) => void;
}) {
  if (!selectedRitual) {
    return (
      <ScrollView contentContainerStyle={styles.screenScroll} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Progress" icon={Settings} />
        <EmptyCard title="No progress yet" body="Create a ritual and complete it to see stats." icon="💧" />
      </ScrollView>
    );
  }

  const palette = habitPalette[selectedRitual.paletteKey];
  const weekPercent = percentFromWeekly(selectedRitual.weekly);

  return (
    <ScrollView contentContainerStyle={styles.screenScroll} showsVerticalScrollIndicator={false}>
      <ScreenHeader title="Progress" icon={Settings} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {rituals.map((ritual) => (
          <Pressable
            key={ritual.id}
            accessibilityRole="button"
            accessibilityState={{ selected: ritual.id === selectedRitualId }}
            onPress={() => onSelectRitual(ritual.id)}
            style={[styles.chip, ritual.id === selectedRitualId && styles.chipActive]}
          >
            <Text style={[styles.chipText, ritual.id === selectedRitualId && styles.chipTextActive]}>{ritual.name}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.statGrid}>
        <GradientCard style={styles.statCard}>
          <CountUpText value={selectedRitual.streakDays} trigger={selectedRitual.id} style={styles.statNum} />
          <Text style={styles.statLabel}>Current streak</Text>
        </GradientCard>
        <GradientCard style={styles.statCard}>
          <CountUpText value={selectedRitual.bestStreakDays} trigger={selectedRitual.id} style={styles.statNum} />
          <Text style={styles.statLabel}>Best streak</Text>
        </GradientCard>
      </View>

      <GradientCard style={styles.weekCard}>
        <View style={styles.weekHead}>
          <Text style={styles.weekTitle}>{selectedRitual.name}</Text>
          <View style={styles.pillPct}>
            <Text style={styles.pillPctText}>{weekPercent}%</Text>
          </View>
        </View>
        <Text style={styles.weekSub}>This week's completions</Text>
        <View style={styles.bars}>
          {selectedRitual.weekly.map((done, index) => (
            <BarColumn
              key={`${selectedRitual.id}-${index}`}
              day={weekLabels[index]}
              filled={done > 0}
              height={done > 0 ? 70 : 6}
              palette={palette}
              delay={index * 55}
              reduceMotion={reduceMotion}
              trigger={selectedRitual.id}
            />
          ))}
        </View>
      </GradientCard>

      <GradientCard style={styles.heatCard}>
        <Text style={styles.weekTitle}>Completion heat</Text>
        <View style={styles.heatGrid}>
          {selectedRitual.heat.map((done, index) => (
            <HeatCell
              key={`${selectedRitual.id}-heat-${index}`}
              active={done > 0}
              newest={index === selectedRitual.heat.length - 1}
              palette={palette}
              delay={index * 18}
              reduceMotion={reduceMotion}
              trigger={selectedRitual.id}
            />
          ))}
        </View>
        <Text style={styles.heatNote}>Compared against {totalActiveRituals} active rituals.</Text>
      </GradientCard>

      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>All rituals</Text>
      </View>
      <View style={styles.statusCard}>
        {rituals.map((ritual) => (
          <Pressable key={ritual.id} onPress={() => onSelectRitual(ritual.id)}>
            <StatusRow
              icon={ritual.icon}
              name={ritual.name}
              sub={`${ritual.streakDays} day streak`}
              pct={`${percentFromWeekly(ritual.weekly)}%`}
              palette={habitPalette[ritual.paletteKey]}
            />
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

async function requestCoachReply(message: string, history: CoachMessage[], rituals: Ritual[]) {
  if (supabase) {
    const { data, error } = await supabase.functions.invoke('coach-chat', {
      body: {
        message,
        conversationHistory: history.map((item) => ({ role: item.role, text: item.text })),
      },
    });
    if (!error && data?.text) {
      return data as { text: string; insightCard?: CoachInsightCard; suggestedActions?: CoachAction[] };
    }
  }
  return buildLocalCoachReply(message, rituals);
}

function buildLocalCoachReply(message: string, rituals: Ritual[]): { text: string; insightCard?: CoachInsightCard; suggestedActions?: CoachAction[] } {
  if (!rituals.length) {
    return {
      text: 'Create your first ritual and I can start coaching from your real completion data.',
      suggestedActions: [{ id: 'new-water', label: 'Add a 2-minute water ritual', type: 'suggest_new_ritual', payload: { name: 'Water break', icon: '💧' } }],
    };
  }
  const sorted = [...rituals].sort((a, b) => percentFromWeekly(b.weekly) - percentFromWeekly(a.weekly));
  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];
  const strongestRate = percentFromWeekly(strongest.weekly);
  const weakestRate = percentFromWeekly(weakest.weekly);
  const broken = rituals.find((ritual) => !ritual.doneToday && ritual.streakDays >= 3);
  const lower = message.toLowerCase();

  if (lower.includes('break') || lower.includes('streak')) {
    const target = broken ?? weakest;
    return {
      text: `${target.name} is the ritual to inspect. Its current streak is ${target.streakDays} days and this week is ${percentFromWeekly(target.weekly)}% complete, so the next best move is a smaller cue today.`,
      insightCard: {
        headline: `${target.name} needs a tighter cue.`,
        body: `${target.name} has ${target.weekly.reduce((sum, value) => sum + value, 0)}/7 completions this week. That concrete miss pattern is why I would move it earlier.`,
        bars: target.weekly,
        metric: `${percentFromWeekly(target.weekly)}% weekly completion`,
      },
      suggestedActions: [{ id: `reschedule-${target.id}`, label: `Move ${target.name} reminder to 7pm`, type: 'reschedule_reminder', payload: { ritualId: target.id, reminderTime: '19:00' } }],
    };
  }

  if (lower.includes('suggest')) {
    return {
      text: `Based on ${strongest.name} at ${strongestRate}% this week, add one tiny ritual immediately after it. Keep it under two minutes so it does not compete with your current streak.`,
      suggestedActions: [{ id: 'suggest-breath', label: 'Add 2-minute breathing', type: 'suggest_new_ritual', payload: { name: '2-minute breathing', icon: '🧘' } }],
    };
  }

  return {
    text: `${strongest.name} is your strongest ritual at ${strongestRate}% this week. ${weakest.name} is the lowest at ${weakestRate}%, so your best next action is to anchor ${weakest.name} after ${strongest.name}.`,
    insightCard: {
      headline: `${strongest.name} is carrying the week.`,
      body: `${strongest.name}: ${strongestRate}% completion. ${weakest.name}: ${weakestRate}% completion. That gap is the reason for the anchor suggestion.`,
      bars: strongest.weekly,
      metric: `${strongestRate}% completion`,
    },
    suggestedActions: [{ id: 'weekly-recap', label: 'Generate weekly recap', type: 'generate_weekly_recap' }],
  };
}

function CoachScreen({
  rituals,
  reduceMotion,
  onAddRitual,
  sheet = false,
}: {
  rituals: Ritual[];
  reduceMotion: boolean;
  onAddRitual: (name: string, icon: string) => void | Promise<void>;
  sheet?: boolean;
}) {
  const [messages, setMessages] = useState<CoachMessage[]>(() => [
    {
      id: 'welcome',
      role: 'assistant',
      text: rituals.length
        ? `I know your current rituals and can reason from their tracked metrics. Ask how this week is going.`
        : 'Create your first ritual, then I can coach from your real data.',
    },
  ]);
  const [composer, setComposer] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef<FlatList<CoachMessage>>(null);
  const quickReplies = useMemo(() => {
    const replies = ['How am I doing this week?', 'Suggest a new ritual'];
    const broken = rituals.some((ritual) => !ritual.doneToday && ritual.streakDays >= 3);
    return broken ? ['Why did I break my streak?', ...replies] : replies;
  }, [rituals]);

  useEffect(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: !reduceMotion }), 60);
  }, [messages, reduceMotion]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) {
      return;
    }
    const userMessage: CoachMessage = { id: `user-${Date.now()}`, role: 'user', text: trimmed };
    const pendingId = `assistant-${Date.now()}`;
    setComposer('');
    setLoading(true);
    setMessages((current) => [...current, userMessage, { id: pendingId, role: 'assistant', text: '', pending: true }]);

    const response = await requestCoachReply(trimmed, [...messages, userMessage], rituals).catch(() => ({
      text: 'I could not reach the coach endpoint. I can still help once Supabase is configured.',
    }));

    if (reduceMotion) {
      setMessages((current) => current.map((item) => (item.id === pendingId ? { ...item, ...response, pending: false } : item)));
      setLoading(false);
      return;
    }

    const words = response.text.split(' ');
    let index = 0;
    const tick = () => {
      index += 1;
      setMessages((current) =>
        current.map((item) =>
          item.id === pendingId
            ? { ...item, text: words.slice(0, index).join(' '), pending: index < words.length }
            : item,
        ),
      );
      if (index < words.length) {
        setTimeout(tick, 28);
      } else {
        setMessages((current) =>
          current.map((item) =>
            item.id === pendingId
              ? { ...item, ...response, pending: false }
              : item,
          ),
        );
        setLoading(false);
      }
    };
    tick();
  };

  const confirmAction = (action: CoachAction) => {
    if (action.type === 'suggest_new_ritual') {
      const name = typeof action.payload?.name === 'string' ? action.payload.name : 'New ritual';
      const icon = typeof action.payload?.icon === 'string' ? action.payload.icon : '🎯';
      Promise.resolve(onAddRitual(name, icon)).catch(() => undefined);
      setMessages((current) => [
        ...current,
        { id: `confirm-${Date.now()}`, role: 'assistant', text: `${name} was added after your confirmation.` },
      ]);
      return;
    }
    setMessages((current) => [
      ...current,
      { id: `confirm-${Date.now()}`, role: 'assistant', text: `Confirmed: ${action.label}. This will write to Supabase after you connect the backend mutation.` },
    ]);
  };

  return (
    <View style={[styles.coachScreen, sheet && styles.coachScreenSheet]}>
      <View style={styles.coachHeader}>
        <LogoMark size={46} reduceMotion={reduceMotion} palette={habitPalette.focus} />
        <View style={styles.statusCopy}>
          <Text style={styles.coachTitle}>Coach</Text>
          <View style={styles.coachStatusRow}>
            <View style={styles.coachStatusDot} />
            <Text style={styles.coachStatus}>Knows your last 30 days</Text>
          </View>
        </View>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.coachList}
        renderItem={({ item }) => (
          <CoachBubble message={item} reduceMotion={reduceMotion} onConfirmAction={confirmAction} />
        )}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickReplyRow}>
        {quickReplies.map((reply) => (
          <Pressable key={reply} onPress={() => sendMessage(reply)} style={styles.quickReplyChip}>
            <Text style={styles.quickReplyText}>{reply}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.composerRow}>
        <TextInput
          value={composer}
          onChangeText={setComposer}
          placeholder="Ask your coach"
          placeholderTextColor={colors.inkFaint}
          style={styles.composerInput}
          returnKeyType="send"
          onSubmitEditing={() => sendMessage(composer)}
        />
        <PressScale reduceMotion={reduceMotion} onPress={() => sendMessage(composer)} style={styles.sendButton}>
          <Send size={20} color="#FFFFFF" strokeWidth={2.5} />
        </PressScale>
      </View>
    </View>
  );
}

function CoachBubble({
  message,
  reduceMotion,
  onConfirmAction,
}: {
  message: CoachMessage;
  reduceMotion: boolean;
  onConfirmAction: (action: CoachAction) => void;
}) {
  const enter = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    enter.value = reduceMotion ? 1 : withTiming(1, { duration: 200, easing: ReanimatedEasing.out(ReanimatedEasing.cubic) });
  }, [enter, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [{ translateY: (1 - enter.value) * 8 }],
  }));

  const assistant = message.role === 'assistant';
  return (
    <Reanimated.View style={[styles.coachMessageRow, assistant ? styles.coachMessageLeft : styles.coachMessageRight, animatedStyle]}>
      {assistant ? <View style={styles.coachMiniAvatar}><Bot size={15} color={habitPalette.focus.ink} /></View> : null}
      <View style={[assistant ? styles.aiBubble : styles.userBubble]}>
        {message.pending && !message.text ? (
          reduceMotion ? <Text style={styles.aiBubbleText}>Thinking...</Text> : <TypingDots />
        ) : (
          <Text style={assistant ? styles.aiBubbleText : styles.userBubbleText}>{message.text}</Text>
        )}
        {message.insightCard ? <CoachInsightCardView card={message.insightCard} /> : null}
        {message.suggestedActions?.map((action) => (
          <Pressable key={action.id} onPress={() => onConfirmAction(action)} style={styles.actionConfirm}>
            <Text style={styles.actionConfirmText}>{action.label}? Confirm</Text>
          </Pressable>
        ))}
      </View>
    </Reanimated.View>
  );
}

function TypingDots() {
  return (
    <View style={styles.typingDots}>
      {[0, 1, 2].map((item) => (
        <View key={item} style={styles.typingDot} />
      ))}
    </View>
  );
}

function CoachInsightCardView({ card }: { card: CoachInsightCard }) {
  return (
    <LinearGradient colors={habitPalette.focus.bg} style={styles.coachInsightCard}>
      <Text style={styles.coachInsightLabel}>Pattern found</Text>
      <Text style={styles.coachInsightTitle}>{card.headline}</Text>
      {card.bars ? (
        <View style={styles.coachMiniBars}>
          {card.bars.map((value, index) => (
            <View key={index} style={[styles.coachMiniBar, { height: value ? 26 : 6, backgroundColor: value ? habitPalette.focus.a : 'rgba(122,121,255,0.18)' }]} />
          ))}
        </View>
      ) : null}
      <Text style={styles.coachInsightBody}>{card.body}</Text>
      {card.metric ? <Text style={styles.coachInsightMetric}>{card.metric}</Text> : null}
    </LinearGradient>
  );
}

function InsightsScreen({
  rituals,
  insight,
  reduceMotion,
  onGenerate,
}: {
  rituals: Ritual[];
  insight: string;
  reduceMotion: boolean;
  onGenerate: (text?: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const strongest = bestRitual(rituals);
  const weakest = weakestRitual(rituals);

  const generate = () => {
    if (loading) {
      return;
    }
    if (!rituals.length) {
      onGenerate();
      return;
    }
    setLoading(true);
    requestCoachReply('Generate weekly recap', [], rituals).then((response) => {
      onGenerate(response.insightCard?.body ?? response.text);
      setLoading(false);
    }).catch(() => {
      onGenerate();
      setLoading(false);
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.screenScroll} showsVerticalScrollIndicator={false}>
      <ScreenHeader title="Insights" icon={Settings} />
      <LinearGradient colors={['#4FA8FF', '#7A79FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.insightCta}>
        <Text style={styles.insightSpark}>✨</Text>
        <Text style={styles.insightTitle}>Generate this week's insight</Text>
        <Text style={styles.insightBody}>The production path is Supabase Edge Function to Claude, cached per week. This build computes from local habit logs.</Text>
        <Pressable accessibilityRole="button" onPress={generate} style={styles.insightButton}>
          <SpinIcon loading={loading} reduceMotion={reduceMotion} />
          <Text style={styles.insightButtonText}>{insight ? 'Regenerate insight' : 'Generate insight'}</Text>
        </Pressable>
      </LinearGradient>

      <Animated.View style={[loading && { opacity: 0.4 }]}>
        {insight ? (
          <EmptyCard title="Your streaks run hottest before 9am" body={insight} icon="✨" solid />
        ) : (
          <EmptyCard title="No insight yet" body="Tap generate to build the weekly coaching card." icon="💧" />
        )}
      </Animated.View>

      {rituals.length ? (
        <>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Patterns noticed</Text>
          </View>
          <View style={styles.patternCard}>
            <PatternRow icon={Clock3} title="Best time" body="Your strongest completion window will appear after tracking." palette={habitPalette.water} />
            <PatternRow icon={Zap} title="Stacking effect" body={`${strongest?.name ?? 'A strong ritual'} is the best anchor for a new ritual.`} palette={habitPalette.reading} />
            <PatternRow icon={CalendarDays} title="Weekend rhythm" body={`${weakest?.name ?? 'One ritual'} needs the most consistency this week.`} palette={habitPalette.focus} />
          </View>
        </>
      ) : (
        <EmptyCard title="No patterns yet" body="Create and complete rituals to unlock weekly patterns." icon="✨" />
      )}
    </ScrollView>
  );
}

function ProfileScreen({
  rituals,
  settings,
  username,
  onSettingChange,
  onLogout,
}: {
  rituals: Ritual[];
  settings: FlowSettings;
  username: string;
  onSettingChange: (key: keyof FlowSettings, value: boolean) => void;
  onLogout: () => void;
}) {
  const best = rituals.reduce((max, ritual) => Math.max(max, ritual.bestStreakDays, ritual.streakDays), 0);
  const daysActive = rituals.reduce((sum, ritual) => sum + ritual.heat.filter(Boolean).length, 0);
  const todayLabel = useMemo(() => formatTodayLabel(), []);

  return (
    <ScrollView contentContainerStyle={styles.screenScroll} showsVerticalScrollIndicator={false}>
      <ScreenHeader title="Profile" icon={Settings} />
      <View style={styles.profileCard}>
        <View style={styles.profileAvatar}>
          <Text style={styles.profileAvatarText}>🙂</Text>
        </View>
        <View style={styles.profileCopy}>
          <View style={styles.profileNameRow}>
            <Text style={styles.profileName}>{username}</Text>
            <LinearGradient colors={['#FFB25B', '#FFD59E']} style={styles.premium}>
              <Text style={styles.premiumText}>Today</Text>
            </LinearGradient>
          </View>
          <Text style={styles.profileEmail}>Started {todayLabel}</Text>
        </View>
      </View>

      <View style={styles.pstatGrid}>
        <ProfileStat value={rituals.length} label="Total rituals" />
        <ProfileStat value={best} label="Best streak" />
        <ProfileStat value={daysActive} label="Days active" />
      </View>

      <View style={styles.settingsCard}>
        <Text style={styles.settingsLabel}>Notifications</Text>
        <ToggleRow icon={Bell} label="Push notifications" value={settings.pushNotifications} onChange={(value) => onSettingChange('pushNotifications', value)} />
        <InfoRow icon={Clock3} label="Daily reminder time" value="Editable per ritual" />
        <ToggleRow icon={MessageCircle} label="Message alerts" value={settings.messageAlerts} onChange={(value) => onSettingChange('messageAlerts', value)} />
      </View>

      <View style={styles.settingsCard}>
        <Text style={styles.settingsLabel}>Appearance</Text>
        <ToggleRow icon={Moon} label="Dark theme" value={settings.darkTheme} onChange={(value) => onSettingChange('darkTheme', value)} />
        <ToggleRow icon={Zap} label="Haptics" value={settings.haptics} onChange={(value) => onSettingChange('haptics', value)} />
      </View>

      <View style={styles.settingsCard}>
        <Text style={styles.settingsLabel}>Account</Text>
        <Pressable accessibilityRole="button" onPress={onLogout} style={styles.settingRow}>
          <View style={styles.settingIcon}>
            <LogOut size={17} color={colors.danger} strokeWidth={2.3} />
          </View>
          <Text style={[styles.settingName, { color: colors.danger }]}>Sign out</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function LiquidRing({
  percent,
  size,
  variant,
  palette,
  reduceMotion,
  centerIcon,
}: {
  percent: number;
  size: number;
  variant: 'hero' | 'mini';
  palette: HabitPalette;
  reduceMotion: boolean;
  centerIcon?: string;
}) {
  const stroke = variant === 'hero' ? 10 : 0;
  const ringId = useRef(`ring${Math.random().toString(36).slice(2)}`).current;
  const visualPercent = clamp(percent, 4, 96);
  const liquidInset = variant === 'hero' ? 22 : 0;
  const liquidSize = size - liquidInset * 2;
  const radius = size / 2 - stroke * 2;
  const circumference = 2 * Math.PI * radius;
  const drift = useRef(new Animated.Value(0)).current;
  const level = useRef(new Animated.Value(((100 - visualPercent) / 100) * liquidSize)).current;
  const arcOffset = useRef(new Animated.Value(circumference)).current;
  const numberValue = useRef(new Animated.Value(percent)).current;
  const [displayPercent, setDisplayPercent] = useState(percent);

  useEffect(() => {
    Animated.timing(level, {
      toValue: ((100 - visualPercent) / 100) * liquidSize,
      duration: reduceMotion ? 140 : 1000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [level, liquidSize, reduceMotion, visualPercent]);

  useEffect(() => {
    if (variant !== 'hero') {
      return;
    }
    Animated.timing(arcOffset, {
      toValue: circumference * (1 - clamp(percent, 0, 100) / 100),
      duration: reduceMotion ? 140 : 1000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    const listener = numberValue.addListener(({ value }) => setDisplayPercent(Math.round(value)));
    Animated.timing(numberValue, {
      toValue: percent,
      duration: reduceMotion ? 120 : 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        setDisplayPercent(percent);
      }
      numberValue.removeListener(listener);
    });
    return () => numberValue.removeListener(listener);
  }, [arcOffset, circumference, numberValue, percent, reduceMotion, variant]);

  useEffect(() => {
    if (reduceMotion) {
      drift.stopAnimation();
      drift.setValue(0);
      return;
    }
    drift.setValue(0);
    const animation = Animated.loop(
      Animated.timing(drift, {
        toValue: -liquidSize,
        duration: 3400,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      { resetBeforeIteration: true },
    );
    animation.start();
    return () => animation.stop();
  }, [drift, liquidSize, reduceMotion]);

  const marker = useMemo(() => {
    const angle = (clamp(percent, 0, 100) / 100) * 360 - 90;
    const rad = (angle * Math.PI) / 180;
    const center = size / 2;
    return {
      left: center + radius * Math.cos(rad) - 7,
      top: center + radius * Math.sin(rad) - 7,
    };
  }, [percent, radius, size]);

  return (
    <View style={[styles.ringStack, { width: size, height: size }]}>
      {variant === 'hero' ? (
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={StyleSheet.absoluteFill}>
          <Defs>
            <SvgLinearGradient id={`arc-${ringId}`} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor={colors.blue1} />
              <Stop offset="100%" stopColor="#8FD3FF" />
            </SvgLinearGradient>
          </Defs>
          <Circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={colors.track} strokeWidth={stroke} />
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`url(#arc-${ringId})`}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={arcOffset as unknown as number}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
      ) : null}
      <View
        style={[
          styles.liquidWrap,
          {
            left: liquidInset,
            right: liquidInset,
            top: liquidInset,
            bottom: liquidInset,
            borderRadius: liquidSize / 2,
          },
          variant === 'mini' && styles.miniLiquidWrap,
        ]}
      >
        <Animated.View
          style={[
            styles.waveLayer,
            {
              width: liquidSize * 2,
              height: liquidSize * 1.24,
              transform: [{ translateX: drift }, { translateY: level }],
            },
          ]}
        >
          <Svg width={liquidSize * 2} height={liquidSize * 1.24} viewBox="-50 0 200 110" preserveAspectRatio="none">
            <Defs>
              <SvgLinearGradient id={`wave-${ringId}`} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor={palette.b} />
                <Stop offset="100%" stopColor={palette.a} />
              </SvgLinearGradient>
            </Defs>
            <G>
              <Path
                d="M-50 6 Q -37.5 -2 -25 6 T 0 6 T 25 6 T 50 6 T 75 6 T100 6 T125 6 T150 6 V110 H-50 Z"
                fill={`url(#wave-${ringId})`}
              />
            </G>
          </Svg>
        </Animated.View>
      </View>
      {variant === 'hero' ? (
        <>
          <View style={styles.liquidLabel}>
            <Text style={styles.liquidNum}>
              {displayPercent}
              <Text style={styles.liquidNumSuffix}>%</Text>
            </Text>
            <Text style={styles.liquidSub}>of daily goal</Text>
          </View>
          <View style={[styles.markerDot, marker]} />
        </>
      ) : (
        <View style={styles.miniRingIconWrap}>
          <Text style={styles.miniRingIcon}>{centerIcon}</Text>
        </View>
      )}
    </View>
  );
}

function GradientCard({ children, style }: { children: ReactNode; style?: object }) {
  return (
    <LinearGradient colors={[colors.cardTop, colors.cardBottom]} start={{ x: 0.25, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.glassCard, style]}>
      {children}
    </LinearGradient>
  );
}

function ScreenHeader({ title, icon: Icon }: { title: string; icon: IconComponent }) {
  return (
    <View style={styles.topRow}>
      <Text style={styles.screenTitle}>{title}</Text>
      <View style={styles.bellButton}>
        <Icon size={19} color={colors.ink} strokeWidth={2.3} />
      </View>
    </View>
  );
}

function StatusRow({
  icon,
  name,
  sub,
  pct,
  palette,
}: {
  icon: string;
  name: string;
  sub: string;
  pct: string;
  palette: HabitPalette;
}) {
  return (
    <View style={styles.statusRow}>
      <View style={[styles.statusIcon, { backgroundColor: `${palette.a}24` }]}>
        <Text style={styles.statusIconText}>{icon}</Text>
      </View>
      <View style={styles.statusCopy}>
        <Text numberOfLines={1} style={styles.statusName}>{name}</Text>
        <Text numberOfLines={1} style={styles.statusSub}>{sub}</Text>
      </View>
      <Text style={[styles.statusPct, { color: palette.ink }]}>{pct}</Text>
    </View>
  );
}

function BarColumn({
  day,
  filled,
  height,
  palette,
  delay,
  reduceMotion,
  trigger,
}: {
  day: string;
  filled: boolean;
  height: number;
  palette: HabitPalette;
  delay: number;
  reduceMotion: boolean;
  trigger: string;
}) {
  const animatedHeight = useRef(new Animated.Value(6)).current;

  useEffect(() => {
    animatedHeight.setValue(6);
    Animated.timing(animatedHeight, {
      toValue: height,
      delay: reduceMotion ? 0 : delay,
      duration: reduceMotion ? 1 : 1000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [animatedHeight, delay, height, reduceMotion, trigger]);

  return (
    <View style={styles.barCol}>
      {filled ? (
        <Animated.View style={[styles.bar, { height: animatedHeight }]}>
          <LinearGradient colors={[palette.a, palette.b]} style={StyleSheet.absoluteFill} />
        </Animated.View>
      ) : (
        <Animated.View style={[styles.bar, styles.barEmpty, { height: animatedHeight }]} />
      )}
      <Text style={styles.barDay}>{day}</Text>
    </View>
  );
}

function HeatCell({
  active,
  newest,
  palette,
  delay,
  reduceMotion,
  trigger,
}: {
  active: boolean;
  newest: boolean;
  palette: HabitPalette;
  delay: number;
  reduceMotion: boolean;
  trigger: string;
}) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      delay: reduceMotion ? 0 : delay,
      duration: reduceMotion ? 1 : 350,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [delay, progress, reduceMotion, trigger]);

  return (
    <Animated.View
      style={[
        styles.heatCell,
        {
          opacity: progress,
          transform: [{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }],
          backgroundColor: active ? `${palette.a}2E` : 'rgba(120,140,180,0.12)',
        },
      ]}
    >
      {newest && active ? <LinearGradient colors={[palette.a, palette.b]} style={StyleSheet.absoluteFill} /> : null}
    </Animated.View>
  );
}

function CountUpText({
  value,
  trigger,
  style,
}: {
  value: number;
  trigger: string | number;
  style: object;
}) {
  const progress = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    progress.setValue(0);
    const listener = progress.addListener(({ value: next }) => setDisplay(Math.round(next)));
    Animated.timing(progress, {
      toValue: value,
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(() => progress.removeListener(listener));
  }, [progress, trigger, value]);

  return <Text style={style}>{display}</Text>;
}

function PatternRow({
  icon: Icon,
  title,
  body,
  palette,
}: {
  icon: IconComponent;
  title: string;
  body: string;
  palette: HabitPalette;
}) {
  return (
    <View style={styles.patternRow}>
      <View style={[styles.patternIcon, { backgroundColor: `${palette.a}24` }]}>
        <Icon size={17} color={palette.ink} strokeWidth={2.4} />
      </View>
      <View style={styles.statusCopy}>
        <Text style={styles.patternTitle}>{title}</Text>
        <Text style={styles.patternSub}>{body}</Text>
      </View>
    </View>
  );
}

function EmptyCard({
  title,
  body,
  icon,
  solid = false,
}: {
  title: string;
  body: string;
  icon: string;
  solid?: boolean;
}) {
  return (
    <View style={[styles.emptyCard, solid && styles.emptyCardSolid]}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySub}>{body}</Text>
    </View>
  );
}

function ProfileStat({ value, label }: { value: number; label: string }) {
  return (
    <GradientCard style={styles.pstat}>
      <CountUpText value={value} trigger={`${label}-${value}`} style={styles.pstatNum} />
      <Text style={styles.pstatLabel}>{label}</Text>
    </GradientCard>
  );
}

function ToggleRow({
  icon: Icon,
  label,
  value,
  onChange,
}: {
  icon: IconComponent;
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingIcon}>
        <Icon size={17} color={colors.ink} strokeWidth={2.3} />
      </View>
      <Text style={styles.settingName}>{label}</Text>
      <Toggle value={value} onChange={onChange} />
    </View>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: IconComponent;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingIcon}>
        <Icon size={17} color={colors.ink} strokeWidth={2.3} />
      </View>
      <Text style={styles.settingName}>{label}</Text>
      <Text style={styles.settingSub}>{value}</Text>
    </View>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (value: boolean) => void }) {
  const x = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(x, {
      toValue: value ? 1 : 0,
      duration: 200,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [value, x]);

  const left = x.interpolate({ inputRange: [0, 1], outputRange: [3, 21] });
  const bg = value ? colors.blue1 : 'rgba(120,140,180,0.22)';

  return (
    <Pressable accessibilityRole="switch" accessibilityState={{ checked: value }} onPress={() => onChange(!value)} style={[styles.toggle, { backgroundColor: bg }]}>
      <Animated.View style={[styles.toggleKnob, { left }]} />
    </Pressable>
  );
}

function AskFloLauncher({
  userId,
  bottomInset,
  topInset,
  reduceMotion,
  onOpen,
}: {
  userId?: string;
  bottomInset: number;
  topInset: number;
  reduceMotion: boolean;
  onOpen: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const dragOrigin = useRef({ x: 0, y: 0 });
  const blockNextPress = useRef(false);
  const openedFromGesture = useRef(false);
  const blockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const positionKey = useMemo(
    () => `${ASK_FLO_POSITION_STORAGE_KEY}:${userId ?? 'local'}`,
    [userId],
  );
  const bounds = useMemo(() => {
    const minX = ASK_FLO_EDGE_PADDING;
    const minY = Math.max(topInset + ASK_FLO_EDGE_PADDING, ASK_FLO_EDGE_PADDING);
    const maxX = Math.max(minX, width - ASK_FLO_WIDTH - ASK_FLO_EDGE_PADDING);
    const navTop = height - bottomInset - NAV_BOTTOM_OFFSET - NAV_HEIGHT;
    const maxY = Math.max(minY, navTop - ASK_FLO_NAV_GAP - ASK_FLO_HEIGHT);
    return { minX, minY, maxX, maxY };
  }, [bottomInset, height, topInset, width]);

  const snapToCorner = useCallback((rawX: number, rawY: number) => {
    const clampedX = clamp(rawX, bounds.minX, bounds.maxX);
    const clampedY = clamp(rawY, bounds.minY, bounds.maxY);
    const finalX = clampedX <= (bounds.minX + bounds.maxX) / 2 ? bounds.minX : bounds.maxX;
    const finalY = clampedY <= (bounds.minY + bounds.maxY) / 2 ? bounds.minY : bounds.maxY;
    return { x: finalX, y: finalY };
  }, [bounds.maxX, bounds.maxY, bounds.minX, bounds.minY]);

  useEffect(() => {
    let mounted = true;
    const defaultPosition = snapToCorner(bounds.maxX, bounds.maxY);

    AsyncStorage.getItem(positionKey)
      .then((stored) => {
        if (!mounted) {
          return;
        }
        if (!stored) {
          translateX.value = defaultPosition.x;
          translateY.value = defaultPosition.y;
          return;
        }
        const parsed = JSON.parse(stored) as Partial<{ x: number; y: number }>;
        const savedX = typeof parsed.x === 'number' ? parsed.x : defaultPosition.x;
        const savedY = typeof parsed.y === 'number' ? parsed.y : defaultPosition.y;
        const next = snapToCorner(savedX, savedY);
        translateX.value = next.x;
        translateY.value = next.y;
      })
      .catch(() => {
        if (mounted) {
          translateX.value = defaultPosition.x;
          translateY.value = defaultPosition.y;
        }
      });

    return () => {
      mounted = false;
      if (blockTimer.current) {
        clearTimeout(blockTimer.current);
      }
    };
  }, [bounds.maxX, bounds.maxY, positionKey, snapToCorner, translateX, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
  }));

  const handleGestureEvent = (event: PanGestureHandlerGestureEvent) => {
    const { translationX, translationY } = event.nativeEvent;
    translateX.value = clamp(dragOrigin.current.x + translationX, bounds.minX, bounds.maxX);
    translateY.value = clamp(dragOrigin.current.y + translationY, bounds.minY, bounds.maxY);
  };

  const handleGestureStateChange = (event: PanGestureHandlerStateChangeEvent) => {
    const { state, translationX, translationY } = event.nativeEvent;
    if (state === State.BEGAN) {
      dragOrigin.current = { x: translateX.value, y: translateY.value };
      return;
    }
    const completed = state === State.END;
    if (!completed && state !== State.CANCELLED && state !== State.FAILED) {
      return;
    }

    const moved = Math.max(Math.abs(translationX), Math.abs(translationY));
    const next = snapToCorner(dragOrigin.current.x + translationX, dragOrigin.current.y + translationY);
    translateX.value = reduceMotion ? next.x : withSpring(next.x, { damping: 17, stiffness: 170 });
    translateY.value = reduceMotion ? next.y : withSpring(next.y, { damping: 17, stiffness: 170 });

    if (moved < ASK_FLO_TAP_THRESHOLD) {
      if (!completed) {
        return;
      }
      openedFromGesture.current = true;
      onOpen();
      if (blockTimer.current) {
        clearTimeout(blockTimer.current);
      }
      blockTimer.current = setTimeout(() => {
        openedFromGesture.current = false;
      }, 260);
      return;
    }

    if (completed) {
      blockNextPress.current = true;
      if (blockTimer.current) {
        clearTimeout(blockTimer.current);
      }
      blockTimer.current = setTimeout(() => {
        blockNextPress.current = false;
      }, 260);
      AsyncStorage.setItem(positionKey, JSON.stringify(next)).catch(() => undefined);
    }
  };

  const handlePress = () => {
    if (openedFromGesture.current) {
      openedFromGesture.current = false;
      return;
    }
    if (blockNextPress.current) {
      blockNextPress.current = false;
      return;
    }
    onOpen();
  };

  return (
    <PanGestureHandler
      minDist={0}
      onGestureEvent={handleGestureEvent}
      onHandlerStateChange={handleGestureStateChange}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Reanimated.View style={[styles.askFloLauncher, animatedStyle]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Ask Flo" onPress={handlePress} style={styles.askFloPressable}>
          <View style={styles.askFloLabel}>
            <Text style={styles.askFloLabelText}>Ask Flo ✨</Text>
          </View>
          <LinearGradient colors={[colors.blue1, '#2E8FE8']} start={{ x: 0.15, y: 0 }} end={{ x: 1, y: 1 }} style={styles.askFloButton}>
            <MessageCircle size={21} color="#FFFFFF" strokeWidth={2.4} />
          </LinearGradient>
        </Pressable>
      </Reanimated.View>
    </PanGestureHandler>
  );
}

function CoachChatSheet({
  open,
  rituals,
  reduceMotion,
  onClose,
  onAddRitual,
}: {
  open: boolean;
  rituals: Ritual[];
  reduceMotion: boolean;
  onClose: () => void;
  onAddRitual: (name: string, icon: string) => void | Promise<void>;
}) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  return (
    <Modal transparent visible={open} animationType="slide" onRequestClose={onClose}>
      <View style={styles.coachSheetRoot}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close Ask Flo" onPress={onClose} style={styles.coachSheetOverlay} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.coachSheetKeyboard}>
          <View
            style={[
              styles.coachSheet,
              {
                maxHeight: Math.max(420, height - insets.top - 28),
                paddingBottom: Math.max(insets.bottom, 12) + 12,
              },
            ]}
          >
            <View style={styles.modalHandle} />
            <CoachScreen rituals={rituals} reduceMotion={reduceMotion} onAddRitual={onAddRitual} sheet />
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function BottomNav({
  activeTab,
  bottomInset,
  onChange,
  onAdd,
}: {
  activeTab: TabKey;
  bottomInset: number;
  onChange: (tab: TabKey) => void;
  onAdd: () => void;
}) {
  return (
    <View style={[styles.navPill, { bottom: bottomInset + NAV_BOTTOM_OFFSET }]}>
      <NavItem tab="today" label="Today" icon={Home} activeTab={activeTab} onChange={onChange} />
      <NavItem tab="progress" label="Progress" icon={BarChart3} activeTab={activeTab} onChange={onChange} />
      <Pressable accessibilityRole="button" accessibilityLabel="Add ritual" onPress={onAdd} style={styles.navCenter}>
        <Plus size={28} color="#FFFFFF" strokeWidth={2.7} />
      </Pressable>
      <NavItem tab="insights" label="Insights" icon={Sun} activeTab={activeTab} onChange={onChange} />
      <NavItem tab="profile" label="Profile" icon={User} activeTab={activeTab} onChange={onChange} />
    </View>
  );
}

function NavItem({
  tab,
  label,
  icon: Icon,
  activeTab,
  onChange,
}: {
  tab: TabKey;
  label: string;
  icon: IconComponent;
  activeTab: TabKey;
  onChange: (tab: TabKey) => void;
}) {
  const active = tab === activeTab;
  return (
    <Pressable accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={() => onChange(tab)} style={styles.navItem}>
      <Icon size={20} color={active ? colors.blue1 : colors.inkFaint} strokeWidth={2.5} />
      <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
    </Pressable>
  );
}

function AddRitualSheet({
  open,
  onClose,
  onAdd,
  reduceMotion,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (name: string, icon: string) => void | Promise<void>;
  reduceMotion: boolean;
}) {
  const [mounted, setMounted] = useState(open);
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(iconChoices[0]);
  const [hasError, setHasError] = useState(false);
  const overlay = useRef(new Animated.Value(0)).current;
  const sheetY = useRef(new Animated.Value(420)).current;

  useEffect(() => {
    if (open) {
      setMounted(true);
      Animated.parallel([
        Animated.timing(overlay, {
          toValue: 1,
          duration: reduceMotion ? 1 : 250,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(sheetY, {
          toValue: 0,
          duration: reduceMotion ? 1 : 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }
    Animated.parallel([
      Animated.timing(overlay, {
        toValue: 0,
        duration: reduceMotion ? 1 : 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(sheetY, {
        toValue: 420,
        duration: reduceMotion ? 1 : 260,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => setMounted(false));
  }, [open, overlay, reduceMotion, sheetY]);

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setHasError(true);
      return;
    }
    await onAdd(trimmed, selectedIcon);
    setName('');
    setSelectedIcon(iconChoices[0]);
    setHasError(false);
    onClose();
  };

  if (!mounted) {
    return null;
  }

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalRoot}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
          <Animated.View style={[styles.modalOverlay, { opacity: overlay }]} />
        </Pressable>
        <Animated.View style={[styles.modalSheet, { transform: [{ translateY: sheetY }] }]}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>New ritual</Text>
          <Text style={styles.fieldLabel}>Name</Text>
          <TextInput
            value={name}
            onChangeText={(value) => {
              setName(value);
              if (hasError) {
                setHasError(false);
              }
            }}
            placeholder={hasError ? 'Enter a name first' : 'Evening stretch'}
            placeholderTextColor={hasError ? colors.danger : colors.inkFaint}
            style={[styles.fieldInput, hasError && styles.fieldInputError]}
            returnKeyType="done"
            onSubmitEditing={submit}
          />
          <Text style={styles.fieldLabel}>Icon</Text>
          <View style={styles.iconPickRow}>
            {iconChoices.map((icon) => (
              <Pressable
                key={icon}
                accessibilityRole="button"
                accessibilityState={{ selected: icon === selectedIcon }}
                onPress={() => setSelectedIcon(icon)}
                style={[styles.iconPick, icon === selectedIcon && styles.iconPickSelected]}
              >
                <Text style={styles.iconPickText}>{icon}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.modalActions}>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.btnSecondary}>
              <Text style={styles.btnSecondaryText}>Cancel</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={submit} style={styles.btnPrimary}>
              <Text style={styles.btnPrimaryText}>Add ritual</Text>
            </Pressable>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Toast({
  toast,
  bottomInset,
  reduceMotion,
  onDone,
}: {
  toast: ToastState | null;
  bottomInset: number;
  reduceMotion: boolean;
  onDone: () => void;
}) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!toast) {
      return undefined;
    }
    progress.setValue(0);
    Animated.sequence([
      Animated.timing(progress, {
        toValue: 1,
        duration: reduceMotion ? 1 : 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.delay(2200),
      Animated.timing(progress, {
        toValue: 0,
        duration: reduceMotion ? 1 : 300,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(onDone);
    return undefined;
  }, [onDone, progress, reduceMotion, toast]);

  if (!toast) {
    return null;
  }

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.toast,
        {
          bottom: bottomInset + 98,
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }),
            },
          ],
        },
      ]}
    >
      <Text numberOfLines={1} style={styles.toastText}>{toast.message}</Text>
    </Animated.View>
  );
}

function ParticleDot({ particle, onDone }: { particle: BurstParticle; onDone: (id: string) => void }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: particle.duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => onDone(particle.id));
  }, [onDone, particle.duration, particle.id, progress]);

  return (
    <Animated.View
      style={[
        styles.burstParticle,
        {
          left: particle.x - 2.5,
          top: particle.y - 2.5,
          backgroundColor: particle.color,
          shadowColor: particle.color,
          opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
          transform: [
            { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, particle.dx] }) },
            { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, particle.dy] }) },
            { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) },
          ],
        },
      ]}
    />
  );
}

function SpinIcon({ loading, reduceMotion }: { loading: boolean; reduceMotion: boolean }) {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!loading || reduceMotion) {
      spin.stopAnimation();
      spin.setValue(0);
      return;
    }
    const animation = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 3500,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [loading, reduceMotion, spin]);

  return (
    <Animated.View
      style={{
        transform: [
          {
            rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }),
          },
        ],
      }}
    >
      <Sparkles size={16} color={colors.blue1} strokeWidth={2.5} />
    </Animated.View>
  );
}

function DropletIcon() {
  return (
    <Svg width={16} height={18} viewBox="0 0 16 18">
      <Defs>
        <SvgLinearGradient id="droplet" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor={colors.blue1} />
          <Stop offset="100%" stopColor={colors.blue2} />
        </SvgLinearGradient>
      </Defs>
      <Path
        d="M8 1 C8 1 14 8 14 12 C14 15.4 11.4 17 8 17 C4.6 17 2 15.4 2 12 C2 8 8 1 8 1 Z"
        fill="url(#droplet)"
      />
    </Svg>
  );
}

const shadow = {
  shadowColor: '#4060A0',
  shadowOffset: { width: 0, height: 20 },
  shadowOpacity: 0.18,
  shadowRadius: 30,
  elevation: 10,
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.page,
  },
  loadingRoot: {
    flex: 1,
    backgroundColor: colors.page,
  },
  stage: {
    flex: 1,
  },
  authKeyboard: {
    flex: 1,
  },
  authScroll: {
    flexGrow: 1,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  authBackButton: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(120,140,180,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 6,
    ...shadow,
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  authHero: {
    minHeight: 300,
    marginHorizontal: -20,
    marginTop: -10,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  authHeroCompact: {
    minHeight: 210,
    marginTop: 0,
  },
  authWaveHost: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    overflow: 'hidden',
  },
  authWaveHostCompact: {
    top: 76,
    height: 96,
  },
  authWaveSvgWrap: {
    position: 'absolute',
    left: 0,
    bottom: 0,
  },
  authHeroContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingTop: 28,
  },
  logoMark: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: colors.blue1,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.32,
    shadowRadius: 18,
    elevation: 7,
  },
  logoClip: {
    width: '75%',
    height: '75%',
    borderRadius: 999,
    overflow: 'hidden',
  },
  logoWaveLayer: {
    position: 'absolute',
    left: 0,
    bottom: 0,
  },
  authWordmark: {
    fontFamily: fontSerifBold,
    fontSize: 28,
    color: colors.ink,
    textAlign: 'center',
  },
  authCreateTitle: {
    fontFamily: fontSerifBold,
    fontSize: 24,
    color: colors.ink,
    textAlign: 'center',
  },
  authHeroSubtitle: {
    fontFamily: fontBody,
    fontSize: 13.5,
    color: colors.inkSoft,
    textAlign: 'center',
    marginTop: 4,
  },
  authCardWrap: {
    width: '100%',
    marginTop: -46,
  },
  authCard: {
    borderRadius: 32,
    padding: 22,
  },
  authCardCreate: {
    marginTop: 30,
  },
  authCardTitle: {
    fontFamily: fontSerifSemi,
    fontSize: 20,
    color: colors.ink,
    marginBottom: 4,
  },
  authCardSub: {
    fontFamily: fontBody,
    fontSize: 12.5,
    color: colors.inkSoft,
    marginBottom: 22,
  },
  authField: {
    marginBottom: 14,
  },
  authFieldLabel: {
    fontFamily: fontBodyBold,
    fontSize: 11.5,
    color: colors.inkSoft,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 7,
    paddingLeft: 4,
  },
  authInputShell: {
    minHeight: 50,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(120,140,180,0.16)',
    backgroundColor: '#F5F8FC',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  authInputShellFocused: {
    borderColor: colors.blue1,
    backgroundColor: '#FFFFFF',
    shadowColor: colors.blue1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 2,
  },
  authInputShellError: {
    borderColor: colors.danger,
    backgroundColor: '#FFF5F5',
  },
  authInput: {
    flex: 1,
    minWidth: 0,
    fontFamily: fontBodyRegular,
    fontSize: 14,
    color: colors.ink,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
  },
  authHelperError: {
    fontFamily: fontBodySemi,
    fontSize: 11.5,
    color: colors.danger,
    marginTop: 6,
    marginLeft: 4,
  },
  authBetweenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
    marginBottom: 22,
    gap: 12,
  },
  authInlineLink: {
    fontFamily: fontBodyBold,
    fontSize: 12.5,
    color: colors.blue1,
  },
  authCheckLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    marginTop: 2,
    marginBottom: 20,
  },
  authCheckCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flexShrink: 1,
  },
  authCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.inkFaint,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  authCheckboxChecked: {
    borderColor: 'transparent',
  },
  authCheckboxRequired: {
    borderColor: colors.danger,
  },
  authCheckboxGradient: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authCheckText: {
    flex: 1,
    fontFamily: fontBody,
    fontSize: 12,
    lineHeight: 18,
    color: colors.inkSoft,
  },
  authCheckTextCompact: {
    flex: 0,
    fontSize: 12.5,
    fontFamily: fontBodySemi,
  },
  strengthBlock: {
    marginTop: -6,
    marginBottom: 18,
  },
  strengthRow: {
    flexDirection: 'row',
    gap: 5,
    marginHorizontal: 2,
  },
  strengthSegment: {
    flex: 1,
    height: 4,
    borderRadius: 3,
    backgroundColor: 'rgba(120,140,180,0.18)',
  },
  strengthLabel: {
    fontFamily: fontBodySemi,
    fontSize: 11,
    color: colors.inkFaint,
    marginTop: 6,
    marginHorizontal: 2,
  },
  authError: {
    fontFamily: fontBodyBold,
    fontSize: 12,
    lineHeight: 17,
    color: colors.danger,
    marginTop: 2,
    marginBottom: 12,
  },
  authMessage: {
    fontFamily: fontBodyBold,
    fontSize: 12,
    lineHeight: 17,
    color: habitPalette.food.ink,
    marginTop: 2,
    marginBottom: 12,
  },
  authPrimaryButton: {
    minHeight: 52,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    backgroundColor: colors.blue1,
    shadowColor: colors.blue1,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 8,
  },
  authPrimaryText: {
    fontFamily: fontBodyExtra,
    fontSize: 13.5,
    color: '#FFFFFF',
  },
  authDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
    marginBottom: 16,
  },
  authDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(120,140,180,0.2)',
  },
  authDividerText: {
    fontFamily: fontBodySemi,
    fontSize: 11.5,
    color: colors.inkFaint,
  },
  authSocialRow: {
    flexDirection: 'column',
    gap: 10,
    marginBottom: 22,
  },
  authSocialButton: {
    width: '100%',
    height: 48,
    borderRadius: 16,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  authSocialButtonGoogle: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DADCE0',
  },
  authSocialButtonApple: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  authSocialText: {
    fontFamily: fontBodyBold,
    fontSize: 13.5,
  },
  authSocialTextGoogle: {
    color: '#3C4043',
  },
  authSocialTextApple: {
    color: '#FFFFFF',
  },
  authFooterLine: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  authFooterMuted: {
    fontFamily: fontBodySemi,
    fontSize: 12.5,
    color: colors.inkSoft,
  },
  authFooterLink: {
    fontFamily: fontBodyExtra,
    fontSize: 12.5,
    color: colors.blue1,
  },
  coachScreen: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 94,
  },
  coachScreenSheet: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 4,
  },
  coachSheetRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  coachSheetOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(20,30,50,0.34)',
  },
  coachSheetKeyboard: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  coachSheet: {
    height: '82%',
    backgroundColor: colors.page,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 18,
    paddingTop: 12,
    shadowColor: '#1E325A',
    shadowOffset: { width: 0, height: -18 },
    shadowOpacity: 0.18,
    shadowRadius: 32,
    elevation: 24,
  },
  coachHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 62,
    marginBottom: 10,
  },
  coachTitle: {
    fontFamily: fontSerifSemi,
    fontSize: 18,
    color: colors.ink,
  },
  coachStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  coachStatusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: habitPalette.food.a,
  },
  coachStatus: {
    fontFamily: fontBodyBold,
    fontSize: 11.5,
    color: habitPalette.food.ink,
  },
  coachList: {
    paddingTop: 10,
    paddingBottom: 16,
    gap: 12,
  },
  coachMessageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    maxWidth: '100%',
  },
  coachMessageLeft: {
    alignSelf: 'flex-start',
    paddingRight: 24,
  },
  coachMessageRight: {
    alignSelf: 'flex-end',
    justifyContent: 'flex-end',
    paddingLeft: 54,
  },
  coachMiniAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: habitPalette.focus.bg[0],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    borderWidth: 1,
    borderColor: 'rgba(122,121,255,0.18)',
  },
  aiBubble: {
    maxWidth: 286,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    borderBottomLeftRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.86)',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingVertical: 12,
    paddingHorizontal: 14,
    ...shadow,
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  userBubble: {
    maxWidth: 286,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 6,
    backgroundColor: colors.blue1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: colors.blue1,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.26,
    shadowRadius: 14,
    elevation: 5,
  },
  aiBubbleText: {
    fontFamily: fontBodyRegular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.ink,
  },
  userBubbleText: {
    fontFamily: fontBodyBold,
    fontSize: 14,
    lineHeight: 20,
    color: '#FFFFFF',
  },
  coachInsightCard: {
    borderRadius: 18,
    padding: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(122,121,255,0.2)',
  },
  coachInsightLabel: {
    fontFamily: fontBodyExtra,
    fontSize: 10.5,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: habitPalette.focus.a,
    marginBottom: 6,
  },
  coachInsightTitle: {
    fontFamily: fontSerifSemi,
    fontSize: 15,
    lineHeight: 20,
    color: colors.ink,
  },
  coachMiniBars: {
    height: 36,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    marginTop: 10,
    marginBottom: 8,
  },
  coachMiniBar: {
    width: 24,
    borderRadius: 6,
  },
  coachInsightBody: {
    fontFamily: fontBodyRegular,
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.inkSoft,
  },
  coachInsightMetric: {
    fontFamily: fontBodyExtra,
    fontSize: 11.5,
    color: habitPalette.focus.ink,
    marginTop: 8,
  },
  actionConfirm: {
    alignSelf: 'flex-start',
    marginTop: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(79,168,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(79,168,255,0.26)',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  actionConfirmText: {
    fontFamily: fontBodyExtra,
    fontSize: 12,
    color: colors.blue1,
  },
  typingDots: {
    flexDirection: 'row',
    gap: 5,
    paddingVertical: 5,
  },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.inkFaint,
  },
  quickReplyRow: {
    gap: 8,
    paddingVertical: 8,
    paddingRight: 18,
  },
  quickReplyChip: {
    minHeight: 34,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(120,140,180,0.16)',
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickReplyText: {
    fontFamily: fontBodyBold,
    fontSize: 12.5,
    color: colors.ink,
  },
  composerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 8,
  },
  composerInput: {
    flex: 1,
    minHeight: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(120,140,180,0.16)',
    paddingHorizontal: 16,
    fontFamily: fontBodyRegular,
    fontSize: 14,
    color: colors.ink,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.blue1,
    shadowColor: colors.blue1,
    shadowOffset: { width: 0, height: 9 },
    shadowOpacity: 0.32,
    shadowRadius: 12,
    elevation: 6,
  },
  screenHost: {
    alignSelf: 'center',
    width: '100%',
    flex: 1,
  },
  screenScroll: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 18,
  },
  topRow: {
    minHeight: 52,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.blue1,
    ...shadow,
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  avatarText: {
    fontSize: 19,
  },
  greetingBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  greetingSub: {
    fontFamily: fontBody,
    fontSize: 12,
    color: colors.inkSoft,
    textAlign: 'center',
  },
  greetingName: {
    fontFamily: fontBodyBold,
    fontSize: 16,
    color: colors.ink,
    marginTop: 2,
  },
  bellButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(120,140,180,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  dotBadge: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.danger,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  glassCard: {
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
    ...shadow,
  },
  hero: {
    borderRadius: 32,
    paddingTop: 22,
    paddingHorizontal: 20,
    paddingBottom: 20,
    marginBottom: 22,
  },
  heroHead: {
    textAlign: 'center',
    fontFamily: fontBody,
    fontSize: 13,
    color: colors.inkSoft,
    marginBottom: 6,
  },
  heroHeadStrong: {
    fontFamily: fontBodyBold,
    color: colors.ink,
  },
  ringStack: {
    alignSelf: 'center',
    position: 'relative',
    overflow: 'visible',
  },
  liquidWrap: {
    position: 'absolute',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#3C64AA',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 5,
  },
  miniLiquidWrap: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 0,
  },
  waveLayer: {
    position: 'absolute',
    left: 0,
    top: -6,
  },
  liquidLabel: {
    position: 'absolute',
    inset: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniRingIconWrap: {
    position: 'absolute',
    inset: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniRingIcon: {
    fontSize: 18,
    lineHeight: 22,
  },
  liquidNum: {
    fontFamily: fontSerifBold,
    fontSize: 36,
    lineHeight: 39,
    color: colors.ink,
  },
  liquidNumSuffix: {
    fontFamily: fontSerifSemi,
    fontSize: 16,
    color: colors.inkSoft,
  },
  liquidSub: {
    fontFamily: fontBody,
    fontSize: 12,
    color: colors.inkSoft,
    marginTop: 4,
  },
  markerDot: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: colors.blue1,
    shadowColor: colors.blue1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.55,
    shadowRadius: 8,
    elevation: 4,
  },
  goalPill: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(120,140,180,0.14)',
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 18,
    ...shadow,
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
  },
  goalPillText: {
    fontFamily: fontBodyBold,
    fontSize: 12.5,
    color: colors.ink,
  },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 22,
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: fontSerifSemi,
    fontSize: 16.5,
    color: colors.ink,
  },
  sectionMeta: {
    fontFamily: fontBody,
    fontSize: 12,
    color: colors.inkSoft,
  },
  ritualGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  fullWidth: {
    width: '100%',
  },
  ritualCell: {
    width: '48%',
    minWidth: 150,
    flexGrow: 1,
  },
  ritualPress: {
    width: '100%',
  },
  ritualCard: {
    width: '100%',
    minHeight: 158,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    justifyContent: 'space-between',
    overflow: 'hidden',
    ...shadow,
  },
  ritualTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  ritualCheck: {
    width: 26,
    height: 26,
    borderRadius: 13,
    overflow: 'hidden',
  },
  ritualCheckFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ritualCheckEmpty: {
    flex: 1,
    backgroundColor: 'rgba(120,140,180,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ritualName: {
    fontFamily: fontSerif,
    fontSize: 16.5,
    color: colors.ink,
    marginTop: 10,
  },
  ritualStreakRow: {
    marginTop: 5,
  },
  ritualStreak: {
    fontFamily: fontBodySemi,
    fontSize: 11.5,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    ...shadow,
  },
  statusRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  statusIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusIconText: {
    fontSize: 16,
  },
  statusCopy: {
    flex: 1,
    minWidth: 0,
  },
  statusName: {
    fontFamily: fontBodyBold,
    fontSize: 14,
    color: colors.ink,
  },
  statusSub: {
    fontFamily: fontBody,
    fontSize: 11.5,
    color: colors.inkSoft,
    marginTop: 2,
  },
  statusPct: {
    marginLeft: 'auto',
    fontFamily: fontBodyExtra,
    fontSize: 13,
  },
  screenTitle: {
    fontFamily: fontSerif,
    fontSize: 22,
    color: colors.ink,
  },
  chipRow: {
    gap: 8,
    paddingVertical: 4,
    paddingBottom: 18,
  },
  chip: {
    paddingVertical: 9,
    paddingHorizontal: 15,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(120,140,180,0.16)',
    backgroundColor: '#FFFFFF',
  },
  chipActive: {
    backgroundColor: colors.blue1,
    borderColor: 'transparent',
    shadowColor: colors.blue1,
    shadowOpacity: 0.28,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 14,
    elevation: 4,
  },
  chipText: {
    fontFamily: fontBodyBold,
    fontSize: 12.5,
    color: colors.inkSoft,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  statGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 22,
    padding: 16,
  },
  statNum: {
    fontFamily: fontSerifBold,
    fontSize: 30,
    color: colors.ink,
  },
  statLabel: {
    fontFamily: fontBody,
    fontSize: 12,
    color: colors.inkSoft,
    marginTop: 2,
  },
  weekCard: {
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
  },
  weekHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  weekTitle: {
    fontFamily: fontBodyExtra,
    fontSize: 14.5,
    color: colors.ink,
  },
  pillPct: {
    backgroundColor: 'rgba(79,168,255,0.12)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillPctText: {
    fontFamily: fontBodyExtra,
    fontSize: 12,
    color: '#1568C9',
  },
  weekSub: {
    fontFamily: fontBody,
    fontSize: 12,
    color: colors.inkSoft,
    marginBottom: 14,
  },
  bars: {
    height: 90,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  bar: {
    width: 11,
    borderRadius: 6,
    overflow: 'hidden',
  },
  barEmpty: {
    backgroundColor: 'rgba(120,140,180,0.15)',
  },
  barDay: {
    fontFamily: fontBodySemi,
    fontSize: 11,
    color: colors.inkSoft,
  },
  heatCard: {
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
  },
  heatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 14,
    marginBottom: 10,
  },
  heatCell: {
    width: '8.2%',
    aspectRatio: 1,
    borderRadius: 6,
    overflow: 'hidden',
  },
  heatNote: {
    fontFamily: fontBody,
    fontSize: 12,
    color: colors.inkSoft,
  },
  insightCta: {
    borderRadius: 26,
    padding: 22,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
    ...shadow,
  },
  insightSpark: {
    fontSize: 20,
  },
  insightTitle: {
    fontFamily: fontSerif,
    fontSize: 20,
    color: '#FFFFFF',
    marginTop: 12,
    marginBottom: 8,
  },
  insightBody: {
    fontFamily: fontBodyRegular,
    fontSize: 13,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 16,
  },
  insightButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    paddingVertical: 11,
    paddingHorizontal: 18,
  },
  insightButtonText: {
    fontFamily: fontBodyExtra,
    fontSize: 13.5,
    color: '#1568C9',
  },
  emptyCard: {
    borderRadius: 22,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(120,140,180,0.3)',
    backgroundColor: '#FFFFFF',
    marginBottom: 20,
  },
  emptyCardSolid: {
    borderStyle: 'solid',
    borderColor: 'rgba(79,168,255,0.3)',
  },
  emptyIcon: {
    fontSize: 26,
    marginBottom: 10,
  },
  emptyTitle: {
    fontFamily: fontBodyExtra,
    fontSize: 14.5,
    color: colors.ink,
    textAlign: 'center',
  },
  emptySub: {
    fontFamily: fontBody,
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.inkSoft,
    textAlign: 'center',
    marginTop: 4,
  },
  patternCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 6,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    ...shadow,
  },
  patternRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  patternIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  patternTitle: {
    fontFamily: fontBodyExtra,
    fontSize: 13.5,
    color: colors.ink,
  },
  patternSub: {
    fontFamily: fontBody,
    fontSize: 12,
    lineHeight: 17,
    color: colors.inkSoft,
    marginTop: 2,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 24,
    padding: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: 16,
    ...shadow,
  },
  profileAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.blue1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: {
    fontSize: 22,
  },
  profileCopy: {
    flex: 1,
    minWidth: 0,
  },
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  profileName: {
    fontFamily: fontSerif,
    fontSize: 17,
    color: colors.ink,
  },
  premium: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  premiumText: {
    fontFamily: fontBodyExtra,
    fontSize: 10.5,
    color: '#8A4A00',
  },
  profileEmail: {
    fontFamily: fontBody,
    fontSize: 12.5,
    color: colors.inkSoft,
    marginTop: 3,
  },
  pstatGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  pstat: {
    flex: 1,
    borderRadius: 18,
    padding: 12,
    alignItems: 'center',
  },
  pstatNum: {
    fontFamily: fontSerifBold,
    fontSize: 20,
    color: colors.ink,
  },
  pstatLabel: {
    fontFamily: fontBody,
    fontSize: 11,
    color: colors.inkSoft,
    marginTop: 2,
    textAlign: 'center',
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 6,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: 16,
    ...shadow,
  },
  settingsLabel: {
    fontFamily: fontBodyBold,
    fontSize: 12,
    color: colors.inkSoft,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    paddingTop: 12,
    paddingHorizontal: 12,
    paddingBottom: 4,
  },
  settingRow: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(79,168,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingName: {
    flex: 1,
    fontFamily: fontBodyBold,
    fontSize: 13.5,
    color: colors.ink,
  },
  settingSub: {
    fontFamily: fontBody,
    fontSize: 11.5,
    color: colors.inkSoft,
  },
  toggle: {
    width: 44,
    height: 26,
    borderRadius: 999,
    position: 'relative',
  },
  toggleKnob: {
    position: 'absolute',
    top: 3,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 2,
  },
  askFloLauncher: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: ASK_FLO_WIDTH,
    height: ASK_FLO_HEIGHT,
    zIndex: 55,
    elevation: 14,
  },
  askFloPressable: {
    width: ASK_FLO_WIDTH,
    height: ASK_FLO_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
  },
  askFloLabel: {
    height: 40,
    minWidth: ASK_FLO_WIDTH - ASK_FLO_HEIGHT + 2,
    paddingLeft: 16,
    paddingRight: 12,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    backgroundColor: '#1C2B49',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1C2B49',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 8,
  },
  askFloLabelText: {
    fontFamily: fontBodyExtra,
    fontSize: 13,
    color: '#FFFFFF',
  },
  askFloButton: {
    width: ASK_FLO_HEIGHT,
    height: ASK_FLO_HEIGHT,
    borderRadius: ASK_FLO_HEIGHT / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    marginLeft: -1,
    shadowColor: '#2E8FE8',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.42,
    shadowRadius: 14,
    elevation: 11,
  },
  navPill: {
    position: 'absolute',
    left: 14,
    right: 14,
    height: NAV_HEIGHT,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    ...shadow,
    zIndex: 40,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 62,
  },
  navLabel: {
    fontFamily: fontBodyBold,
    fontSize: 10.5,
    color: colors.inkFaint,
  },
  navLabelActive: {
    color: colors.blue1,
  },
  navCenter: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.blue1,
    marginTop: -40,
    borderWidth: 5,
    borderColor: '#EEF1F4',
    shadowColor: '#3C8CFF',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.48,
    shadowRadius: 18,
    elevation: 12,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(20,30,50,0.35)',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 26,
    shadowColor: '#1E325A',
    shadowOffset: { width: 0, height: -20 },
    shadowOpacity: 0.18,
    shadowRadius: 34,
    elevation: 24,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 99,
    backgroundColor: 'rgba(120,140,180,0.3)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: fontSerif,
    fontSize: 19,
    color: colors.ink,
    marginBottom: 14,
  },
  fieldLabel: {
    fontFamily: fontBodyBold,
    fontSize: 12,
    color: colors.inkSoft,
    marginBottom: 6,
  },
  fieldInput: {
    height: 46,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: 'rgba(120,140,180,0.2)',
    backgroundColor: '#F3F6FB',
    paddingHorizontal: 14,
    fontFamily: fontBodyRegular,
    fontSize: 14,
    color: colors.ink,
    marginBottom: 16,
  },
  fieldInputError: {
    borderColor: colors.danger,
  },
  iconPickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  iconPick: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F3F6FB',
    borderWidth: 1,
    borderColor: 'rgba(120,140,180,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPickSelected: {
    borderColor: colors.blue1,
    backgroundColor: 'rgba(79,168,255,0.12)',
    transform: [{ scale: 1.05 }],
  },
  iconPickText: {
    fontSize: 19,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  btnSecondary: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    backgroundColor: '#F3F6FB',
    borderWidth: 1,
    borderColor: 'rgba(120,140,180,0.2)',
  },
  btnPrimary: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    backgroundColor: colors.blue1,
    shadowColor: colors.blue1,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.32,
    shadowRadius: 14,
    elevation: 5,
  },
  btnSecondaryText: {
    fontFamily: fontBodyExtra,
    fontSize: 13.5,
    color: colors.ink,
  },
  btnPrimaryText: {
    fontFamily: fontBodyExtra,
    fontSize: 13.5,
    color: '#FFFFFF',
  },
  toast: {
    position: 'absolute',
    left: 24,
    right: 24,
    alignItems: 'center',
    zIndex: 70,
  },
  toastText: {
    overflow: 'hidden',
    borderRadius: 16,
    backgroundColor: colors.ink,
    color: '#FFFFFF',
    fontFamily: fontBodyBold,
    fontSize: 12.5,
    paddingVertical: 11,
    paddingHorizontal: 18,
    shadowColor: '#000000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 14 },
    shadowRadius: 20,
    elevation: 8,
  },
  burstParticle: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 12,
  },
});
