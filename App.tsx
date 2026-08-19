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
import {
  AccessibilityInfo,
  Animated,
  Dimensions,
  Easing,
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
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, {
  Circle,
  Defs,
  G,
  LinearGradient as SvgLinearGradient,
  Path,
  Stop,
} from 'react-native-svg';
import {
  BarChart3,
  Bell,
  CalendarDays,
  Check,
  Clock3,
  Home,
  Lock,
  LogOut,
  Mail,
  MessageCircle,
  Moon,
  Plus,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  User,
  Zap,
} from 'lucide-react-native';
import React, { ComponentType, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';

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

type AuthMode = 'login' | 'create' | 'forgot';

type AuthAccount = {
  username: string;
  password: string;
  email: string;
};

type StoredAuth = {
  account: AuthAccount;
  signedIn: boolean;
};

const STORAGE_KEY = 'flow-liquid-redesign-v4-clean';
const AUTH_STORAGE_KEY = 'flow-auth-v1';
const DEFAULT_AUTH_ACCOUNT: AuthAccount = {
  username: 'Pratik',
  password: 'Pratik@16',
  email: 'pratik@example.com',
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
    <SafeAreaProvider>
      <AuthenticatedApp />
    </SafeAreaProvider>
  );
}

export default AppRoot;

function AuthenticatedApp() {
  const [ready, setReady] = useState(false);
  const [account, setAccount] = useState(DEFAULT_AUTH_ACCOUNT);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(AUTH_STORAGE_KEY)
      .then((stored) => {
        const parsed = stored ? normalizeAuth(JSON.parse(stored) as Partial<StoredAuth>) : normalizeAuth(null);
        setAccount(parsed.account);
        setSignedIn(parsed.signedIn);
      })
      .catch(() => undefined)
      .finally(() => setReady(true));
  }, []);

  const saveAuth = useCallback((nextAccount: AuthAccount, nextSignedIn: boolean) => {
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
        onLogin={(nextAccount) => saveAuth(nextAccount, true)}
        onCreate={(nextAccount) => saveAuth(nextAccount, true)}
        onResetPassword={(nextAccount) => saveAuth(nextAccount, false)}
      />
    );
  }

  return <FlowApp username={account.username} onLogout={() => saveAuth(account, false)} />;
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
  const [mode, setMode] = useState<AuthMode>('login');
  const [username, setUsername] = useState(DEFAULT_AUTH_ACCOUNT.username);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const cardAnim = useEntranceAnimation(mode, reduceMotion);
  const contentMaxWidth = width >= 720 ? 440 : undefined;

  const clearFeedback = () => {
    setError('');
    setMessage('');
  };

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setPassword('');
    setConfirmPassword('');
    setEmail('');
    clearFeedback();
  };

  const matchesAccount = (candidate: AuthAccount) =>
    username.trim() === candidate.username && password === candidate.password;

  const submitLogin = () => {
    clearFeedback();
    if (!username.trim() || !password) {
      setError('Enter username and password.');
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
    setError('Username or password is incorrect.');
  };

  const submitCreate = () => {
    clearFeedback();
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();
    if (trimmedUsername.length < 2) {
      setError('Username must be at least 2 characters.');
      return;
    }
    if (trimmedEmail && !trimmedEmail.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    onCreate({
      username: trimmedUsername,
      password,
      email: trimmedEmail || `${trimmedUsername.toLowerCase()}@example.com`,
    });
  };

  const submitReset = () => {
    clearFeedback();
    const trimmedUsername = username.trim();
    const knownUser = trimmedUsername === account.username || trimmedUsername === DEFAULT_AUTH_ACCOUNT.username;
    if (!knownUser) {
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
    const targetAccount = trimmedUsername === account.username ? account : DEFAULT_AUTH_ACCOUNT;
    onResetPassword({ ...targetAccount, password });
    setMode('login');
    setMessage('Password updated. Sign in with the new password.');
    setPassword('');
    setConfirmPassword('');
  };

  const submit = () => {
    if (mode === 'login') {
      submitLogin();
      return;
    }
    if (mode === 'create') {
      submitCreate();
      return;
    }
    submitReset();
  };

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
                paddingTop: Math.max(insets.top + 20, 36),
                paddingBottom: insets.bottom + 32,
                maxWidth: contentMaxWidth,
              },
            ]}
          >
            <Animated.View style={[styles.authCardWrap, cardAnim]}>
              <GradientCard style={styles.authCard}>
                <View style={styles.authLogoWrap}>
                  <LinearGradient colors={[colors.blue1, colors.blue2]} style={styles.authLogo}>
                    <ShieldCheck size={30} color="#FFFFFF" strokeWidth={2.6} />
                  </LinearGradient>
                </View>
                <Text style={styles.authTitle}>Flow</Text>
                <Text style={styles.authSubtitle}>
                  {mode === 'login' ? 'Sign in to start today clean.' : mode === 'create' ? 'Create your local Flow account.' : 'Reset your local password.'}
                </Text>

                <View style={styles.authModeRow}>
                  <AuthModeButton label="Login" active={mode === 'login'} onPress={() => switchMode('login')} />
                  <AuthModeButton label="Create" active={mode === 'create'} onPress={() => switchMode('create')} />
                  <AuthModeButton label="Reset" active={mode === 'forgot'} onPress={() => switchMode('forgot')} />
                </View>

                <AuthInput
                  icon={User}
                  label="Username"
                  value={username}
                  onChangeText={(value) => {
                    setUsername(value);
                    clearFeedback();
                  }}
                  placeholder="Pratik"
                  returnKeyType="next"
                />
                {mode === 'create' ? (
                  <AuthInput
                    icon={Mail}
                    label="Email"
                    value={email}
                    onChangeText={(value) => {
                      setEmail(value);
                      clearFeedback();
                    }}
                    placeholder="name@example.com"
                    keyboardType="email-address"
                    returnKeyType="next"
                  />
                ) : null}
                <AuthInput
                  icon={Lock}
                  label={mode === 'forgot' ? 'New password' : 'Password'}
                  value={password}
                  onChangeText={(value) => {
                    setPassword(value);
                    clearFeedback();
                  }}
                  placeholder={mode === 'login' ? 'Password' : 'Minimum 6 characters'}
                  secureTextEntry
                  returnKeyType={mode === 'login' ? 'done' : 'next'}
                  onSubmitEditing={mode === 'login' ? submit : undefined}
                />
                {mode !== 'login' ? (
                  <AuthInput
                    icon={Lock}
                    label="Confirm password"
                    value={confirmPassword}
                    onChangeText={(value) => {
                      setConfirmPassword(value);
                      clearFeedback();
                    }}
                    placeholder="Re-enter password"
                    secureTextEntry
                    returnKeyType="done"
                    onSubmitEditing={submit}
                  />
                ) : null}

                {error ? <Text style={styles.authError}>{error}</Text> : null}
                {message ? <Text style={styles.authMessage}>{message}</Text> : null}

                <Pressable accessibilityRole="button" onPress={submit} style={styles.authPrimaryButton}>
                  <Text style={styles.authPrimaryText}>
                    {mode === 'login' ? 'Sign in' : mode === 'create' ? 'Create account' : 'Update password'}
                  </Text>
                </Pressable>

                {mode === 'login' ? (
                  <Pressable accessibilityRole="button" onPress={() => switchMode('forgot')} style={styles.authLinkButton}>
                    <Text style={styles.authLinkText}>Forgot password?</Text>
                  </Pressable>
                ) : (
                  <Pressable accessibilityRole="button" onPress={() => switchMode('login')} style={styles.authLinkButton}>
                    <Text style={styles.authLinkText}>Back to login</Text>
                  </Pressable>
                )}
              </GradientCard>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}

function AuthModeButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: active }} onPress={onPress} style={[styles.authModeButton, active && styles.authModeButtonActive]}>
      <Text style={[styles.authModeText, active && styles.authModeTextActive]}>{label}</Text>
    </Pressable>
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
}) {
  return (
    <View style={styles.authField}>
      <Text style={styles.authFieldLabel}>{label}</Text>
      <View style={styles.authInputShell}>
        <Icon size={18} color={colors.inkSoft} strokeWidth={2.3} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.inkFaint}
          secureTextEntry={secureTextEntry}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType={keyboardType}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          style={styles.authInput}
        />
      </View>
    </View>
  );
}

function FlowApp({ username, onLogout }: { username: string; onLogout: () => void }) {
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
  const [toast, setToast] = useState<ToastState | null>(null);
  const [particles, setParticles] = useState<BurstParticle[]>([]);
  const [newRitualId, setNewRitualId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const isTablet = width >= 720;

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (!stored) {
          return;
        }
        const parsed = normalizeState(JSON.parse(stored) as Partial<SavedFlowState>);
        setRituals(parsed.rituals);
        setTotalActiveRituals(parsed.totalActiveRituals);
        setBaseDoneFromOtherHabits(parsed.baseDoneFromOtherHabits);
        setSettings(parsed.settings);
        setInsight(parsed.insight);
        setSelectedRitualId(parsed.rituals[0]?.id ?? '');
      })
      .catch(() => undefined)
      .finally(() => setHydrated(true));
  }, []);

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
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => undefined);
  }, [baseDoneFromOtherHabits, hydrated, insight, rituals, settings, totalActiveRituals]);

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
    let toastMessage = '';
    let burstPalette: HabitPalette | null = null;

    setRituals((current) =>
      current.map((ritual) => {
        if (ritual.id !== ritualId) {
          return ritual;
        }
        const doneToday = !ritual.doneToday;
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
  };

  const addRitual = (name: string, icon: string) => {
    const paletteKey = paletteRotation[rituals.length % paletteRotation.length];
    const id = `ritual-${Date.now()}`;
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
      createdAt: Date.now(),
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
  };

  const generateInsight = () => {
    if (!rituals.length) {
      showToast('Create a ritual first');
      return;
    }
    const strong = bestRitual(rituals);
    const weak = weakestRitual(rituals);
    const nextInsight = `${strong?.name ?? 'Your strongest ritual'} is carrying the week. Stack ${weak?.name ?? 'your lowest ritual'} immediately after it tomorrow and keep the reminder within the same hour.`;
    setInsight(nextInsight);
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

function InsightsScreen({
  rituals,
  insight,
  reduceMotion,
  onGenerate,
}: {
  rituals: Ritual[];
  insight: string;
  reduceMotion: boolean;
  onGenerate: () => void;
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
    setTimeout(() => {
      onGenerate();
      setLoading(false);
    }, reduceMotion ? 120 : 900);
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
    <View style={[styles.navPill, { bottom: bottomInset + 16 }]}>
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
  onAdd: (name: string, icon: string) => void;
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

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setHasError(true);
      return;
    }
    onAdd(trimmed, selectedIcon);
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
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  authCardWrap: {
    width: '100%',
  },
  authCard: {
    borderRadius: 32,
    padding: 22,
  },
  authLogoWrap: {
    alignItems: 'center',
    marginBottom: 12,
  },
  authLogo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.blue1,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.34,
    shadowRadius: 18,
    elevation: 8,
  },
  authTitle: {
    fontFamily: fontSerifBold,
    fontSize: 34,
    color: colors.ink,
    textAlign: 'center',
  },
  authSubtitle: {
    fontFamily: fontBody,
    fontSize: 13,
    lineHeight: 19,
    color: colors.inkSoft,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 18,
  },
  authModeRow: {
    flexDirection: 'row',
    gap: 8,
    borderRadius: 18,
    padding: 5,
    backgroundColor: '#F3F6FB',
    borderWidth: 1,
    borderColor: 'rgba(120,140,180,0.16)',
    marginBottom: 16,
  },
  authModeButton: {
    flex: 1,
    minHeight: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authModeButtonActive: {
    backgroundColor: colors.blue1,
    shadowColor: colors.blue1,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 12,
    elevation: 4,
  },
  authModeText: {
    fontFamily: fontBodyBold,
    fontSize: 12.5,
    color: colors.inkSoft,
  },
  authModeTextActive: {
    color: '#FFFFFF',
  },
  authField: {
    marginBottom: 13,
  },
  authFieldLabel: {
    fontFamily: fontBodyBold,
    fontSize: 12,
    color: colors.inkSoft,
    marginBottom: 6,
  },
  authInputShell: {
    minHeight: 48,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(120,140,180,0.2)',
    backgroundColor: '#F3F6FB',
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  authInput: {
    flex: 1,
    minWidth: 0,
    fontFamily: fontBodyRegular,
    fontSize: 14,
    color: colors.ink,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
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
    minHeight: 48,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.blue1,
    shadowColor: colors.blue1,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.32,
    shadowRadius: 16,
    elevation: 6,
  },
  authPrimaryText: {
    fontFamily: fontBodyExtra,
    fontSize: 14,
    color: '#FFFFFF',
  },
  authLinkButton: {
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 6,
  },
  authLinkText: {
    fontFamily: fontBodyBold,
    fontSize: 13,
    color: colors.blue1,
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
  navPill: {
    position: 'absolute',
    left: 14,
    right: 14,
    height: 72,
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
