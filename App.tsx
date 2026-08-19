import AsyncStorage from '@react-native-async-storage/async-storage';
import { isRunningInExpoGo } from 'expo';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';
import { StatusBar } from 'expo-status-bar';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import {
  BarChart3,
  Bell,
  Brain,
  CalendarDays,
  Check,
  Clock3,
  CreditCard,
  Crown,
  Fingerprint,
  Flame,
  HelpCircle,
  Home as HomeIcon,
  LogOut,
  Mail,
  MessageCircle,
  Moon,
  Plus,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  User,
  X,
  Zap,
} from 'lucide-react-native';
import React, { ComponentType, useEffect, useMemo, useRef, useState } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type NotificationsApi = typeof import('expo-notifications');

function getNotificationsModule(): NotificationsApi | null {
  if (isRunningInExpoGo()) {
    return null;
  }
  try {
    return require('expo-notifications') as NotificationsApi;
  } catch {
    return null;
  }
}

type ThemeMode = 'light' | 'dark';
type TabKey = 'home' | 'progress' | 'insights' | 'profile';
type AccentKey = 'coral' | 'dark' | 'amber' | 'violet' | 'sky';
type Frequency = 'daily' | 'weekdays' | '3x_week';
type IconComponent = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

type Habit = {
  id: string;
  name: string;
  icon: string;
  color: AccentKey;
  frequency: Frequency;
  reminderTime: string;
  logs: string[];
  notificationIds: string[];
  freezeUsedMonth?: string;
};

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  read: boolean;
};

type SettingsState = {
  darkTheme: boolean;
  hapticsEnabled: boolean;
  pushEnabled: boolean;
  hasSession: boolean;
  bannerSeen: boolean;
  setDarkTheme: (value: boolean) => void;
  setHapticsEnabled: (value: boolean) => void;
  setPushEnabled: (value: boolean) => void;
  setHasSession: (value: boolean) => void;
  setBannerSeen: (value: boolean) => void;
};

const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      darkTheme: false,
      hapticsEnabled: true,
      pushEnabled: true,
      hasSession: false,
      bannerSeen: false,
      setDarkTheme: (value) => set({ darkTheme: value }),
      setHapticsEnabled: (value) => set({ hapticsEnabled: value }),
      setPushEnabled: (value) => set({ pushEnabled: value }),
      setHasSession: (value) => set({ hasSession: value }),
      setBannerSeen: (value) => set({ bannerSeen: value }),
    }),
    {
      name: 'ritual-settings-v1',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

const lightTheme = {
  mode: 'light' as ThemeMode,
  bg: '#F3F1EC',
  card: '#FFFFFF',
  ink: '#15161B',
  inkDim: '#8C8E96',
  inkFaint: '#B7B8BE',
  dark: '#16171C',
  green: '#28C76F',
  greenDeep: '#1BA35B',
  coral: '#FF6B72',
  amber: '#FFB648',
  violet: '#8C7CF6',
  sky: '#4EA8FF',
  gold: '#D4A94E',
  line: 'rgba(21,22,27,0.07)',
};

const darkTheme = {
  ...lightTheme,
  mode: 'dark' as ThemeMode,
  bg: '#0D0E12',
  card: '#181A20',
  ink: '#F1F1F3',
  inkDim: '#9598A2',
  inkFaint: '#646774',
  dark: '#08090C',
  line: 'rgba(255,255,255,0.08)',
};

type Theme = typeof lightTheme;

const accentGradients: Record<AccentKey, readonly [string, string]> = {
  coral: ['#FF8A90', '#FF5963'],
  dark: ['#252833', '#111217'],
  amber: ['#FFD37A', '#FFB648'],
  violet: ['#A99EFF', '#7B68EE'],
  sky: ['#7DC6FF', '#3698F5'],
};

const iconChoices = ['Flame', 'Book', 'Run', 'Water', 'Sleep', 'Focus', 'Gym', 'Meditate', 'Clean', 'Food', 'Code', 'Journal'];
const colorChoices: AccentKey[] = ['coral', 'dark', 'amber', 'violet', 'sky'];
const timeChoices = ['07:00', '08:00', '18:30', '20:00', '21:30'];
const frequencyLabels: Record<Frequency, string> = {
  daily: 'Daily',
  weekdays: 'Weekdays',
  '3x_week': '3x / week',
};

function dayKey(offset = 0) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

function monthKey() {
  return dayKey().slice(0, 7);
}

function makeLogs(daysAgo: number[]) {
  return daysAgo.map((day) => dayKey(-day));
}

const seedHabits: Habit[] = [
  {
    id: 'morning-run',
    name: 'Morning run',
    icon: 'Run',
    color: 'coral',
    frequency: 'daily',
    reminderTime: '07:00',
    logs: makeLogs([0, 1, 2, 3, 4, 5, 6, 7, 8]),
    notificationIds: [],
  },
  {
    id: 'read-pages',
    name: 'Read 20 pages',
    icon: 'Book',
    color: 'amber',
    frequency: 'daily',
    reminderTime: '20:00',
    logs: makeLogs([0, 1, 3, 4, 5, 7, 8, 9]),
    notificationIds: [],
  },
  {
    id: 'deep-work',
    name: 'Deep work block',
    icon: 'Focus',
    color: 'violet',
    frequency: 'weekdays',
    reminderTime: '08:00',
    logs: makeLogs([0, 1, 2, 3, 6, 7, 8, 9, 10, 13]),
    notificationIds: [],
  },
  {
    id: 'hydrate',
    name: 'Drink 2L water',
    icon: 'Water',
    color: 'sky',
    frequency: 'daily',
    reminderTime: '18:30',
    logs: makeLogs([1, 2, 3, 4, 5]),
    notificationIds: [],
  },
  {
    id: 'sleep',
    name: 'Sleep by 11',
    icon: 'Sleep',
    color: 'dark',
    frequency: '3x_week',
    reminderTime: '21:30',
    logs: makeLogs([0, 2, 4, 6, 8, 10]),
    notificationIds: [],
  },
];

const seedNotifications: NotificationItem[] = [
  { id: 'n1', title: '9-day streak', body: 'Morning run is gaining heat.', read: false },
  { id: 'n2', title: 'Weekly insight ready', body: 'Your strongest routine is Deep work block.', read: false },
  { id: 'n3', title: 'Reminder confirmed', body: 'Read 20 pages is scheduled for 8:00 PM.', read: true },
];

function useReducedMotion() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription.remove();
  }, []);

  return reduceMotion;
}

function parseReminderTime(time: string) {
  const [hourText, minuteText] = time.split(':');
  return { hour: Number(hourText), minute: Number(minuteText) };
}

function formatReminder(time: string) {
  const { hour, minute } = parseReminderTime(time);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${String(minute).padStart(2, '0')} ${suffix}`;
}

async function ensureNotificationAccess() {
  const Notifications = getNotificationsModule();
  if (!Notifications) {
    return false;
  }

  const permissions = await Notifications.getPermissionsAsync();
  if (permissions.granted || permissions.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    return true;
  }
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted || requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

async function scheduleHabitReminders(habit: Habit, pushEnabled: boolean) {
  const Notifications = getNotificationsModule();
  if (!pushEnabled) {
    return [];
  }
  if (!Notifications) {
    return [];
  }
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  const allowed = await ensureNotificationAccess();
  if (!allowed) {
    return [];
  }

  const { hour, minute } = parseReminderTime(habit.reminderTime);
  const content = {
    title: `${habit.name}`,
    body: `Time for your ${habit.name.toLowerCase()} ritual.`,
    data: { habitId: habit.id },
  };

  if (habit.frequency === 'daily') {
    const id = await Notifications.scheduleNotificationAsync({
      content,
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
    });
    return [id];
  }

  const weekdays = habit.frequency === 'weekdays' ? [2, 3, 4, 5, 6] : [2, 4, 6];
  const ids = await Promise.all(
    weekdays.map((weekday) =>
      Notifications.scheduleNotificationAsync({
        content,
        trigger: { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday, hour, minute },
      }),
    ),
  );
  return ids;
}

function currentStreak(habit: Habit) {
  const logSet = new Set(habit.logs);
  let streak = 0;
  let freezeAvailable = habit.freezeUsedMonth !== monthKey();
  for (let offset = 0; offset < 370; offset += 1) {
    if (logSet.has(dayKey(-offset))) {
      streak += 1;
      continue;
    }
    if (freezeAvailable && offset > 0) {
      freezeAvailable = false;
      streak += 1;
      continue;
    }
    break;
  }
  return streak;
}

function bestStreak(habit: Habit) {
  const sorted = [...new Set(habit.logs)].sort();
  if (sorted.length === 0) {
    return 0;
  }

  let best = 1;
  let run = 1;
  for (let index = 1; index < sorted.length; index += 1) {
    const previous = new Date(`${sorted[index - 1]}T12:00:00`);
    previous.setDate(previous.getDate() + 1);
    if (previous.toISOString().slice(0, 10) === sorted[index]) {
      run += 1;
      best = Math.max(best, run);
    } else {
      run = 1;
    }
  }
  return best;
}

function weeklyCompletionRate(habit: Habit) {
  const logSet = new Set(habit.logs);
  const completed = Array.from({ length: 7 }).filter((_, index) => logSet.has(dayKey(-index))).length;
  return completed / 7;
}

function todayCompleted(habit: Habit) {
  return habit.logs.includes(dayKey());
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function friendlyDate() {
  return new Intl.DateTimeFormat('en', { weekday: 'long', month: 'short', day: 'numeric' }).format(new Date());
}

function IconGlyph({ name, size = 22, color }: { name: string; size?: number; color: string }) {
  const map: Record<string, IconComponent> = {
    Flame,
    Book: CalendarDays,
    Run: Zap,
    Water: Sparkles,
    Sleep: Moon,
    Focus: Brain,
    Gym: Trophy,
    Meditate: ShieldCheck,
    Clean: Sparkles,
    Food: Star,
    Code: Settings,
    Journal: Mail,
  };
  const Icon = map[name] ?? Flame;
  return <Icon size={size} color={color} strokeWidth={2.5} />;
}

function ProgressRing({
  progress,
  size,
  stroke,
  color,
  trackColor,
  children,
}: {
  progress: number;
  size: number;
  stroke: number;
  color: string;
  trackColor: string;
  children?: React.ReactNode;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - Math.max(0, Math.min(1, progress)));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={trackColor} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      {children}
    </View>
  );
}

function EmberBar({ streak, theme }: { streak: number; theme: Theme }) {
  const fill = Math.min(1, streak / 30);
  return (
    <View style={[styles.emberTrack, { backgroundColor: theme.line }]}>
      <LinearGradient
        colors={['#FFD37A', '#FF6B72', '#28C76F']}
        style={[styles.emberFill, { height: `${Math.max(8, fill * 100)}%` }]}
      />
    </View>
  );
}

function Pill({
  label,
  selected,
  onPress,
  theme,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  theme: Theme;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.pill,
        {
          backgroundColor: selected ? theme.dark : theme.card,
          borderColor: theme.line,
        },
      ]}
    >
      <Text style={[styles.pillText, { color: selected ? '#FFFFFF' : theme.ink }]}>{label}</Text>
    </Pressable>
  );
}

function AppButton({
  label,
  icon: Icon,
  onPress,
  theme,
  tone = 'green',
}: {
  label: string;
  icon?: IconComponent;
  onPress: () => void;
  theme: Theme;
  tone?: 'green' | 'dark' | 'ghost';
}) {
  const backgroundColor = tone === 'green' ? theme.green : tone === 'dark' ? theme.dark : 'transparent';
  const color = tone === 'ghost' ? theme.ink : '#FFFFFF';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.button, { backgroundColor, borderColor: tone === 'ghost' ? theme.line : backgroundColor }]}
    >
      {Icon ? <Icon size={17} color={color} strokeWidth={2.5} /> : null}
      <Text style={[styles.buttonText, { color }]}>{label}</Text>
    </Pressable>
  );
}

function SignInScreen({ theme, reduceMotion }: { theme: Theme; reduceMotion: boolean }) {
  const setHasSession = useSettingsStore((state) => state.setHasSession);
  const setBannerSeen = useSettingsStore((state) => state.setBannerSeen);
  const [email, setEmail] = useState('bhang@example.com');
  const [password, setPassword] = useState('ritual');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const drift = useRef(new Animated.Value(0)).current;
  const shake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) {
      return;
    }
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, {
          toValue: 1,
          duration: 5200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(drift, {
          toValue: 0,
          duration: 5200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [drift, reduceMotion]);

  const fail = () => {
    setError('Enter your email and password to continue.');
    Animated.sequence([
      Animated.timing(shake, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -1, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const signIn = () => {
    if (!email.trim() || !password.trim()) {
      fail();
      return;
    }
    setLoading(true);
    setError('');
    setTimeout(() => {
      setLoading(false);
      setBannerSeen(false);
      setHasSession(true);
    }, reduceMotion ? 0 : 600);
  };

  const biometric = async () => {
    const available = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!available || !enrolled) {
      setError('Biometric unlock is not enrolled on this device.');
      return;
    }
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock Ritual',
      fallbackLabel: 'Use password',
    });
    if (result.success) {
      setBannerSeen(false);
      setHasSession(true);
    }
  };

  return (
    <LinearGradient colors={['#08090C', '#16171C', '#25213C']} style={styles.signInRoot}>
      <StatusBar style="light" />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.blob,
          styles.blobGreen,
          { transform: [{ translateY: drift.interpolate({ inputRange: [0, 1], outputRange: [0, 34] }) }] },
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.blob,
          styles.blobViolet,
          { transform: [{ translateX: drift.interpolate({ inputRange: [0, 1], outputRange: [0, -26] }) }] },
        ]}
      />
      <View style={styles.signInContent}>
        <View style={styles.brandBlock}>
          <LinearGradient colors={['#FFF0B6', theme.gold, '#FFFFFF']} style={styles.brandBadge}>
            <Flame size={32} color="#16171C" strokeWidth={2.7} />
          </LinearGradient>
          <Text style={styles.brandTitle}>Ritual</Text>
          <Text style={styles.brandTagline}>Small rituals. Big momentum.</Text>
        </View>

        <Animated.View
          style={[
            styles.loginCard,
            {
              transform: [
                {
                  translateX: shake.interpolate({ inputRange: [-1, 0, 1], outputRange: [-8, 0, 8] }),
                },
              ],
            },
          ]}
        >
          <InputRow icon={Mail} value={email} onChangeText={setEmail} placeholder="Email" secure={false} />
          <InputRow icon={ShieldCheck} value={password} onChangeText={setPassword} placeholder="Password" secure />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <AppButton label={loading ? 'Signing in' : 'Sign In'} icon={loading ? Check : Flame} onPress={signIn} theme={theme} />
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>
          <Pressable accessibilityRole="button" onPress={biometric} style={styles.biometricButton}>
            <Fingerprint size={18} color={theme.gold} strokeWidth={2.5} />
            <Text style={styles.biometricText}>Face ID / fingerprint</Text>
          </Pressable>
          <View style={styles.trustRow}>
            <Star size={15} color={theme.gold} fill={theme.gold} />
            <Text style={styles.trustText}>4.9 rated by 18k momentum builders</Text>
          </View>
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

function InputRow({
  icon: Icon,
  value,
  onChangeText,
  placeholder,
  secure,
}: {
  icon: IconComponent;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  secure: boolean;
}) {
  return (
    <View style={styles.inputWrap}>
      <Icon size={18} color="rgba(255,255,255,0.68)" strokeWidth={2.4} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="rgba(255,255,255,0.44)"
        secureTextEntry={secure}
        autoCapitalize="none"
        style={styles.input}
      />
    </View>
  );
}

export default function App() {
  const darkThemeEnabled = useSettingsStore((state) => state.darkTheme);
  const theme = darkThemeEnabled ? darkTheme : lightTheme;
  const hasSession = useSettingsStore((state) => state.hasSession);
  const reduceMotion = useReducedMotion();

  return hasSession ? <MainShell theme={theme} reduceMotion={reduceMotion} /> : <SignInScreen theme={theme} reduceMotion={reduceMotion} />;
}

function MainShell({ theme, reduceMotion }: { theme: Theme; reduceMotion: boolean }) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [habits, setHabits] = useState<Habit[]>(seedHabits);
  const [selectedHabitId, setSelectedHabitId] = useState(seedHabits[0]?.id ?? '');
  const [addOpen, setAddOpen] = useState(false);
  const [notifications, setNotifications] = useState(seedNotifications);
  const [celebration, setCelebration] = useState<string | null>(null);
  const pushEnabled = useSettingsStore((state) => state.pushEnabled);
  const bannerSeen = useSettingsStore((state) => state.bannerSeen);
  const setBannerSeen = useSettingsStore((state) => state.setBannerSeen);
  const bannerAnim = useRef(new Animated.Value(-120)).current;

  useEffect(() => {
    AsyncStorage.getItem('ritual-habits-v1')
      .then((stored) => {
        if (stored) {
          const parsed = JSON.parse(stored) as Habit[];
          setHabits(parsed);
          setSelectedHabitId(parsed[0]?.id ?? '');
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('ritual-habits-v1', JSON.stringify(habits)).catch(() => undefined);
  }, [habits]);

  useEffect(() => {
    if (bannerSeen) {
      return;
    }
    Animated.sequence([
      Animated.timing(bannerAnim, {
        toValue: 0,
        duration: reduceMotion ? 0 : 360,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.delay(reduceMotion ? 500 : 3600),
      Animated.timing(bannerAnim, {
        toValue: -120,
        duration: reduceMotion ? 0 : 280,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => setBannerSeen(true));
  }, [bannerAnim, bannerSeen, reduceMotion, setBannerSeen]);

  const selectedHabit = habits.find((habit) => habit.id === selectedHabitId) ?? habits[0];

  const toggleHabit = async (habitId: string) => {
    const nextHabits = habits.map((habit) => {
      if (habit.id !== habitId) {
        return habit;
      }
      const done = todayCompleted(habit);
      const logs = done ? habit.logs.filter((log) => log !== dayKey()) : [...habit.logs, dayKey()];
      return { ...habit, logs };
    });
    setHabits(nextHabits);

    const updatedHabit = nextHabits.find((habit) => habit.id === habitId);
    if (updatedHabit && todayCompleted(updatedHabit)) {
      const streak = currentStreak(updatedHabit);
      if ([7, 30, 100].includes(streak)) {
        setCelebration(`${streak}-day streak`);
      }
    }

    if (useSettingsStore.getState().hapticsEnabled) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    }
  };

  const addHabit = async (habit: Habit) => {
    const notificationIds = await scheduleHabitReminders(habit, pushEnabled).catch(() => []);
    const savedHabit = { ...habit, notificationIds };
    setHabits((current) => [...current, savedHabit]);
    setSelectedHabitId(savedHabit.id);
    setNotifications((current) => [
      {
        id: `n-${Date.now()}`,
        title: 'Reminder scheduled',
        body: `${savedHabit.name} is set for ${formatReminder(savedHabit.reminderTime)}.`,
        read: false,
      },
      ...current,
    ]);
  };

  const markAllRead = () => setNotifications((current) => current.map((item) => ({ ...item, read: true })));

  const content = (
    <View style={[styles.appBody, isTablet && styles.tabletBody]}>
      {activeTab === 'home' ? (
        <HomeScreen
          theme={theme}
          habits={habits}
          isTablet={isTablet}
          notifications={notifications}
          onToggleHabit={toggleHabit}
          onOpenAdd={() => setAddOpen(true)}
          onOpenProgress={() => setActiveTab('progress')}
          onOpenProfile={() => setActiveTab('profile')}
          onMarkAllRead={markAllRead}
        />
      ) : null}
      {activeTab === 'progress' ? (
        <ProgressScreen
          theme={theme}
          habits={habits}
          selectedHabit={selectedHabit}
          selectedHabitId={selectedHabitId}
          onSelectHabit={setSelectedHabitId}
          isTablet={isTablet}
        />
      ) : null}
      {activeTab === 'insights' ? <InsightsScreen theme={theme} habits={habits} /> : null}
      {activeTab === 'profile' ? <ProfileScreen theme={theme} habits={habits} /> : null}
    </View>
  );

  return (
    <View style={[styles.root, styles.androidSafeTop, { backgroundColor: theme.bg }]}>
      <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
      <View style={[styles.shell, isTablet && styles.tabletShell]}>
        {isTablet ? <NavRail activeTab={activeTab} onChange={setActiveTab} theme={theme} /> : null}
        {content}
      </View>
      {!isTablet ? <BottomNav activeTab={activeTab} onChange={setActiveTab} theme={theme} /> : null}
      <Pressable accessibilityRole="button" accessibilityLabel="Add ritual" onPress={() => setAddOpen(true)} style={[styles.fab, { backgroundColor: theme.green }]}>
        <Plus size={28} color="#FFFFFF" strokeWidth={2.8} />
      </Pressable>
      <AddRitualModal open={addOpen} onClose={() => setAddOpen(false)} onAdd={addHabit} theme={theme} isTablet={isTablet} habits={habits} />
      <Animated.View style={[styles.previewBanner, { transform: [{ translateY: bannerAnim }] }]}>
        <Bell size={20} color="#FFFFFF" strokeWidth={2.5} />
        <View style={styles.bannerCopy}>
          <Text style={styles.bannerTitle}>Ritual reminder</Text>
          <Text style={styles.bannerBody}>Tonight at 8:00 PM: keep the streak warm.</Text>
        </View>
      </Animated.View>
      <CelebrationOverlay label={celebration} onClose={() => setCelebration(null)} theme={theme} />
    </View>
  );
}

function HomeScreen({
  theme,
  habits,
  isTablet,
  notifications,
  onToggleHabit,
  onOpenAdd,
  onOpenProgress,
  onOpenProfile,
  onMarkAllRead,
}: {
  theme: Theme;
  habits: Habit[];
  isTablet: boolean;
  notifications: NotificationItem[];
  onToggleHabit: (habitId: string) => void;
  onOpenAdd: () => void;
  onOpenProgress: () => void;
  onOpenProfile: () => void;
  onMarkAllRead: () => void;
}) {
  const [notifOpen, setNotifOpen] = useState(false);
  const doneCount = habits.filter(todayCompleted).length;
  const completion = habits.length ? doneCount / habits.length : 0;
  const topHabits = [...habits].sort((a, b) => currentStreak(b) - currentStreak(a)).slice(0, 3);

  const hero = (
    <LinearGradient colors={['#16171C', '#090A0D']} style={styles.heroCard}>
      <View style={styles.heroCopy}>
        <Text style={styles.heroDate}>{friendlyDate()}</Text>
        <Text style={styles.heroTitle}>{doneCount} of {habits.length} rituals done today</Text>
        <Text style={styles.heroSub}>Keep the ember alive with one clean tap.</Text>
        <AppButton label="View full progress" icon={BarChart3} onPress={onOpenProgress} theme={theme} />
      </View>
      <ProgressRing progress={completion} size={112} stroke={10} color={theme.green} trackColor="rgba(255,255,255,0.12)">
        <Text style={styles.heroPercent}>{Math.round(completion * 100)}%</Text>
      </ProgressRing>
    </LinearGradient>
  );

  return (
    <ScrollView contentContainerStyle={[styles.screen, isTablet && styles.tabletScreen]} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.kicker, { color: theme.inkDim }]}>{greeting()}</Text>
          <Text style={[styles.screenTitle, { color: theme.ink }]}>Bhang</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable accessibilityRole="button" accessibilityLabel="Open notifications" onPress={() => setNotifOpen((open) => !open)} style={[styles.iconButton, { backgroundColor: theme.card }]}>
            <Bell size={21} color={theme.ink} />
            {notifications.some((item) => !item.read) ? <View style={[styles.unreadDot, { backgroundColor: theme.coral }]} /> : null}
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Open profile" onPress={onOpenProfile} style={[styles.avatarButton, { backgroundColor: theme.dark }]}>
            <User size={21} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      {notifOpen ? <NotificationDropdown theme={theme} notifications={notifications} onMarkAllRead={onMarkAllRead} /> : null}

      {isTablet ? (
        <View style={styles.homeGrid}>
          <View style={styles.homeMainColumn}>
            {hero}
            <Text style={[styles.sectionTitle, { color: theme.ink }]}>Today&apos;s rituals</Text>
            <View style={styles.tabletTileGrid}>
              {habits.map((habit) => (
                <HabitTile key={habit.id} habit={habit} theme={theme} onToggle={onToggleHabit} wide />
              ))}
              <AddTile theme={theme} onPress={onOpenAdd} />
            </View>
          </View>
          <View style={styles.homeSideColumn}>
            <OverallStatus theme={theme} habits={topHabits} />
            <UpcomingReminders theme={theme} habits={habits} />
          </View>
        </View>
      ) : (
        <>
          {hero}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.ink }]}>Today&apos;s rituals</Text>
            <Text style={[styles.sectionMeta, { color: theme.inkDim }]}>{habits.length} active</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel}>
            {habits.map((habit) => (
              <HabitTile key={habit.id} habit={habit} theme={theme} onToggle={onToggleHabit} />
            ))}
            <AddTile theme={theme} onPress={onOpenAdd} />
          </ScrollView>
          <OverallStatus theme={theme} habits={topHabits} />
        </>
      )}
    </ScrollView>
  );
}

function HabitTile({
  habit,
  theme,
  onToggle,
  wide = false,
}: {
  habit: Habit;
  theme: Theme;
  onToggle: (habitId: string) => void;
  wide?: boolean;
}) {
  const completed = todayCompleted(habit);
  const burst = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    burst.setValue(0);
    Animated.timing(burst, { toValue: 1, duration: 550, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    onToggle(habit.id);
  };

  return (
    <LinearGradient colors={accentGradients[habit.color]} style={[styles.habitTile, wide && styles.habitTileWide]}>
      <View style={styles.tileTop}>
        <View style={styles.tileIcon}>
          <IconGlyph name={habit.icon} color="#FFFFFF" />
        </View>
        <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: completed }} accessibilityLabel={`${completed ? 'Uncomplete' : 'Complete'} ${habit.name}`} onPress={toggle} style={[styles.completeCircle, completed && { backgroundColor: '#FFFFFF' }]}>
          {completed ? <Check size={18} color={theme.greenDeep} strokeWidth={3} /> : null}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.burst,
              {
                opacity: burst.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] }),
                transform: [{ scale: burst.interpolate({ inputRange: [0, 1], outputRange: [0.2, 2] }) }],
              },
            ]}
          />
        </Pressable>
      </View>
      <Text style={styles.tileName}>{habit.name}</Text>
      <View style={styles.tileFooter}>
        <Flame size={17} color="#FFFFFF" fill="#FFFFFF" />
        <Text style={styles.tileStreak}>{currentStreak(habit)} day streak</Text>
      </View>
    </LinearGradient>
  );
}

function AddTile({ theme, onPress }: { theme: Theme; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Add ritual" onPress={onPress} style={[styles.addTile, { backgroundColor: theme.card, borderColor: theme.line }]}>
      <View style={[styles.addTileIcon, { backgroundColor: theme.green }]}>
        <Plus size={24} color="#FFFFFF" strokeWidth={2.8} />
      </View>
      <Text style={[styles.addTileText, { color: theme.ink }]}>Add Ritual</Text>
    </Pressable>
  );
}

function OverallStatus({ theme, habits }: { theme: Theme; habits: Habit[] }) {
  return (
    <View style={[styles.card, { backgroundColor: theme.card }]}>
      <Text style={[styles.sectionTitle, { color: theme.ink }]}>Overall status</Text>
      {habits.length ? (
        habits.map((habit) => {
          const rate = weeklyCompletionRate(habit);
          return (
            <View key={habit.id} style={styles.statusRow}>
              <EmberBar streak={currentStreak(habit)} theme={theme} />
              <ProgressRing progress={rate} size={44} stroke={5} color={rate >= 0.6 ? theme.green : theme.coral} trackColor={theme.line}>
                <IconGlyph name={habit.icon} size={16} color={theme.ink} />
              </ProgressRing>
              <View style={styles.flexOne}>
                <Text style={[styles.rowTitle, { color: theme.ink }]}>{habit.name}</Text>
                <Text style={[styles.rowMeta, { color: theme.inkDim }]}>{currentStreak(habit)} days current streak</Text>
              </View>
              <Text style={[styles.rateText, { color: rate >= 0.6 ? theme.greenDeep : theme.coral }]}>{Math.round(rate * 100)}%</Text>
            </View>
          );
        })
      ) : (
        <EmptyState theme={theme} title="No rituals yet" body="Add the first one to start today&apos;s ring." />
      )}
    </View>
  );
}

function UpcomingReminders({ theme, habits }: { theme: Theme; habits: Habit[] }) {
  return (
    <View style={[styles.card, { backgroundColor: theme.card }]}>
      <Text style={[styles.sectionTitle, { color: theme.ink }]}>Upcoming reminders</Text>
      {habits.slice(0, 4).map((habit) => (
        <View key={habit.id} style={styles.reminderRow}>
          <Clock3 size={17} color={theme.gold} />
          <Text style={[styles.rowTitle, { color: theme.ink, flex: 1 }]}>{habit.name}</Text>
          <Text style={[styles.rowMeta, { color: theme.inkDim }]}>{formatReminder(habit.reminderTime)}</Text>
        </View>
      ))}
    </View>
  );
}

function NotificationDropdown({
  theme,
  notifications,
  onMarkAllRead,
}: {
  theme: Theme;
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
}) {
  return (
    <View style={[styles.notificationDropdown, { backgroundColor: theme.card, borderColor: theme.line }]}>
      <View style={styles.dropdownHead}>
        <Text style={[styles.sectionTitle, { color: theme.ink }]}>Notifications</Text>
        <Pressable accessibilityRole="button" onPress={onMarkAllRead}>
          <Text style={[styles.linkText, { color: theme.greenDeep }]}>Mark all read</Text>
        </Pressable>
      </View>
      {notifications.length ? (
        notifications.map((item) => (
          <View key={item.id} style={styles.notificationRow}>
            <View style={[styles.notificationBullet, { backgroundColor: item.read ? theme.line : theme.green }]} />
            <View style={styles.flexOne}>
              <Text style={[styles.rowTitle, { color: theme.ink }]}>{item.title}</Text>
              <Text style={[styles.rowMeta, { color: theme.inkDim }]}>{item.body}</Text>
            </View>
          </View>
        ))
      ) : (
        <EmptyState theme={theme} title="Quiet for now" body="Milestones and reminders will land here." />
      )}
    </View>
  );
}

function ProgressScreen({
  theme,
  habits,
  selectedHabit,
  selectedHabitId,
  onSelectHabit,
  isTablet,
}: {
  theme: Theme;
  habits: Habit[];
  selectedHabit?: Habit;
  selectedHabitId: string;
  onSelectHabit: (id: string) => void;
  isTablet: boolean;
}) {
  if (!selectedHabit) {
    return (
      <ScrollView contentContainerStyle={styles.screen}>
        <EmptyState theme={theme} title="No progress yet" body="Create a ritual and complete it to see stats." />
      </ScrollView>
    );
  }

  const detail = <ProgressDetail habit={selectedHabit} habits={habits} theme={theme} />;

  return (
    <View style={[styles.screen, isTablet && styles.tabletProgress]}>
      <Text style={[styles.screenTitle, { color: theme.ink }]}>Progress</Text>
      {isTablet ? (
        <View style={styles.masterDetail}>
          <View style={[styles.masterList, { backgroundColor: theme.card }]}>
            <FlatList
              data={habits}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <HabitListItem habit={item} theme={theme} selected={item.id === selectedHabitId} onPress={() => onSelectHabit(item.id)} />
              )}
            />
          </View>
          <ScrollView showsVerticalScrollIndicator={false} style={styles.detailPane}>
            {detail}
          </ScrollView>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {habits.map((habit) => (
              <Pill key={habit.id} label={habit.name} selected={habit.id === selectedHabitId} onPress={() => onSelectHabit(habit.id)} theme={theme} />
            ))}
          </ScrollView>
          {detail}
          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.ink }]}>All rituals</Text>
            {habits.map((habit) => (
              <HabitListItem key={habit.id} habit={habit} theme={theme} selected={habit.id === selectedHabitId} onPress={() => onSelectHabit(habit.id)} />
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function ProgressDetail({ habit, habits, theme }: { habit: Habit; habits: Habit[]; theme: Theme }) {
  const rate = weeklyCompletionRate(habit);
  const bars = Array.from({ length: 7 }).map((_, index) => {
    const key = dayKey(index - 6);
    return habit.logs.includes(key);
  });

  return (
    <>
      <View style={styles.statGrid}>
        <View style={[styles.statCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.statNumber, { color: theme.ink }]}>{currentStreak(habit)}</Text>
          <Text style={[styles.rowMeta, { color: theme.inkDim }]}>Current streak</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.statNumber, { color: theme.ink }]}>{Math.max(bestStreak(habit), currentStreak(habit))}</Text>
          <Text style={[styles.rowMeta, { color: theme.inkDim }]}>Best streak</Text>
        </View>
      </View>
      <LinearGradient colors={['#16171C', '#08090C']} style={styles.chartCard}>
        <View style={styles.chartHead}>
          <View>
            <Text style={styles.chartTitle}>{habit.name}</Text>
            <Text style={styles.chartSub}>This week&apos;s completions</Text>
          </View>
          <View style={styles.rateBadge}>
            <Text style={styles.rateBadgeText}>{Math.round(rate * 100)}%</Text>
          </View>
        </View>
        <View style={styles.barsRow}>
          {bars.map((done, index) => (
            <View key={`${habit.id}-${index}`} style={styles.barSlot}>
              <View style={[styles.bar, { height: done ? 108 : 28, backgroundColor: done ? theme.green : 'rgba(255,255,255,0.14)' }]} />
              <Text style={styles.barLabel}>{['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>
      <View style={[styles.card, { backgroundColor: theme.card }]}>
        <Text style={[styles.sectionTitle, { color: theme.ink }]}>Completion heat</Text>
        <View style={styles.heatGrid}>
          {Array.from({ length: 35 }).map((_, index) => {
            const done = habit.logs.includes(dayKey(index - 34));
            return <View key={`heat-${index}`} style={[styles.heatCell, { backgroundColor: done ? theme.green : theme.line }]} />;
          })}
        </View>
        <Text style={[styles.rowMeta, { color: theme.inkDim }]}>Compared against {habits.length} active rituals.</Text>
      </View>
    </>
  );
}

function HabitListItem({
  habit,
  theme,
  selected,
  onPress,
}: {
  habit: Habit;
  theme: Theme;
  selected: boolean;
  onPress: () => void;
}) {
  const rate = weeklyCompletionRate(habit);
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={[styles.listItem, selected && { backgroundColor: theme.line }]}>
      <EmberBar streak={currentStreak(habit)} theme={theme} />
      <ProgressRing progress={rate} size={44} stroke={5} color={rate >= 0.6 ? theme.green : theme.coral} trackColor={theme.line}>
        <IconGlyph name={habit.icon} size={16} color={theme.ink} />
      </ProgressRing>
      <View style={styles.flexOne}>
        <Text style={[styles.rowTitle, { color: theme.ink }]}>{habit.name}</Text>
        <Text style={[styles.rowMeta, { color: theme.inkDim }]}>{frequencyLabels[habit.frequency]} at {formatReminder(habit.reminderTime)}</Text>
      </View>
      <Text style={[styles.rateText, { color: theme.ink }]}>{currentStreak(habit)}</Text>
    </Pressable>
  );
}

function InsightsScreen({ theme, habits }: { theme: Theme; habits: Habit[] }) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState('');
  const strongest = [...habits].sort((a, b) => weeklyCompletionRate(b) - weeklyCompletionRate(a))[0];
  const weakest = [...habits].sort((a, b) => weeklyCompletionRate(a) - weeklyCompletionRate(b))[0];

  const generate = () => {
    setLoading(true);
    setTimeout(() => {
      setSummary(
        `${strongest?.name ?? 'Your top ritual'} is carrying the week. Stack ${weakest?.name ?? 'your lowest ritual'} immediately after it for the next three days and keep the reminder within the same hour.`,
      );
      setLoading(false);
    }, 900);
  };

  return (
    <ScrollView contentContainerStyle={styles.screen} showsVerticalScrollIndicator={false}>
      <Text style={[styles.screenTitle, { color: theme.ink }]}>Insights</Text>
      <LinearGradient colors={['#A99EFF', '#7B68EE']} style={styles.insightHero}>
        <Sparkles size={28} color="#FFFFFF" />
        <Text style={styles.insightTitle}>Generate this week&apos;s insight</Text>
        <Text style={styles.insightBody}>The production path is Supabase Edge Function to Claude, cached per week. This build computes from local habit logs.</Text>
        <AppButton label={loading ? 'Reading patterns' : 'Generate insight'} icon={Brain} onPress={generate} theme={theme} tone="dark" />
      </LinearGradient>
      {summary ? (
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.ink }]}>Weekly summary</Text>
          <Text style={[styles.bodyText, { color: theme.inkDim }]}>{summary}</Text>
        </View>
      ) : (
        <EmptyState theme={theme} title="No insight yet" body="Tap generate to build the weekly coaching card." />
      )}
      <View style={[styles.card, { backgroundColor: theme.card }]}>
        <Text style={[styles.sectionTitle, { color: theme.ink }]}>Patterns noticed</Text>
        <PatternRow icon={Clock3} title="Best time" body="Morning rituals complete 22% more often." theme={theme} />
        <PatternRow icon={Zap} title="Stacking effect" body={`${strongest?.name ?? 'A strong habit'} is the best anchor for a new ritual.`} theme={theme} />
        <PatternRow icon={CalendarDays} title="Weekend dip" body={`${weakest?.name ?? 'One habit'} drops most on Saturdays.`} theme={theme} />
      </View>
    </ScrollView>
  );
}

function PatternRow({ icon: Icon, title, body, theme }: { icon: IconComponent; title: string; body: string; theme: Theme }) {
  return (
    <View style={styles.patternRow}>
      <View style={[styles.patternIcon, { backgroundColor: theme.line }]}>
        <Icon size={18} color={theme.violet} />
      </View>
      <View style={styles.flexOne}>
        <Text style={[styles.rowTitle, { color: theme.ink }]}>{title}</Text>
        <Text style={[styles.rowMeta, { color: theme.inkDim }]}>{body}</Text>
      </View>
    </View>
  );
}

function ProfileScreen({ theme, habits }: { theme: Theme; habits: Habit[] }) {
  const darkThemeEnabled = useSettingsStore((state) => state.darkTheme);
  const hapticsEnabled = useSettingsStore((state) => state.hapticsEnabled);
  const pushEnabled = useSettingsStore((state) => state.pushEnabled);
  const setDarkTheme = useSettingsStore((state) => state.setDarkTheme);
  const setHapticsEnabled = useSettingsStore((state) => state.setHapticsEnabled);
  const setPushEnabled = useSettingsStore((state) => state.setPushEnabled);
  const setHasSession = useSettingsStore((state) => state.setHasSession);
  const best = habits.reduce((max, habit) => Math.max(max, bestStreak(habit), currentStreak(habit)), 0);

  return (
    <ScrollView contentContainerStyle={styles.screen} showsVerticalScrollIndicator={false}>
      <Text style={[styles.screenTitle, { color: theme.ink }]}>Profile</Text>
      <View style={[styles.profileCard, { backgroundColor: theme.card }]}>
        <View style={[styles.profileAvatar, { backgroundColor: theme.dark }]}>
          <Flame size={34} color={theme.green} fill={theme.green} />
        </View>
        <View style={styles.flexOne}>
          <View style={styles.profileNameRow}>
            <Text style={[styles.profileName, { color: theme.ink }]}>Bhang</Text>
            <View style={[styles.premiumBadge, { backgroundColor: theme.gold }]}>
              <Crown size={12} color="#16171C" fill="#16171C" />
              <Text style={styles.premiumText}>Premium</Text>
            </View>
          </View>
          <Text style={[styles.rowMeta, { color: theme.inkDim }]}>bhang@example.com</Text>
        </View>
      </View>
      <View style={styles.statGrid}>
        <View style={[styles.statCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.statNumber, { color: theme.ink }]}>{habits.length}</Text>
          <Text style={[styles.rowMeta, { color: theme.inkDim }]}>Total rituals</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.statNumber, { color: theme.ink }]}>{best}</Text>
          <Text style={[styles.rowMeta, { color: theme.inkDim }]}>Best streak</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.statNumber, { color: theme.ink }]}>42</Text>
          <Text style={[styles.rowMeta, { color: theme.inkDim }]}>Days active</Text>
        </View>
      </View>
      <SettingsCard title="Notifications" theme={theme}>
        <ToggleRow icon={Bell} label="Push notifications" value={pushEnabled} onValueChange={setPushEnabled} theme={theme} />
        <InfoRow icon={Clock3} label="Daily reminder time" value="Editable per ritual" theme={theme} />
        <ToggleRow icon={MessageCircle} label="Message alerts" value={pushEnabled} onValueChange={setPushEnabled} theme={theme} />
      </SettingsCard>
      <SettingsCard title="Appearance" theme={theme}>
        <ToggleRow icon={Moon} label="Dark theme" value={darkThemeEnabled} onValueChange={setDarkTheme} theme={theme} />
        <ToggleRow icon={Zap} label="Haptics" value={hapticsEnabled} onValueChange={setHapticsEnabled} theme={theme} />
      </SettingsCard>
      <SettingsCard title="Account" theme={theme}>
        <InfoRow icon={CreditCard} label="Manage subscription" value="$4.99/mo" theme={theme} />
        <InfoRow icon={HelpCircle} label="Help & feedback" value="Send note" theme={theme} />
      </SettingsCard>
      <Pressable accessibilityRole="button" onPress={() => setHasSession(false)} style={[styles.logoutButton, { borderColor: theme.line }]}>
        <LogOut size={18} color={theme.coral} />
        <Text style={[styles.logoutText, { color: theme.coral }]}>Log out</Text>
      </Pressable>
    </ScrollView>
  );
}

function SettingsCard({ title, theme, children }: { title: string; theme: Theme; children: React.ReactNode }) {
  return (
    <View style={[styles.card, { backgroundColor: theme.card }]}>
      <Text style={[styles.sectionTitle, { color: theme.ink }]}>{title}</Text>
      {children}
    </View>
  );
}

function ToggleRow({
  icon: Icon,
  label,
  value,
  onValueChange,
  theme,
}: {
  icon: IconComponent;
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  theme: Theme;
}) {
  return (
    <View style={styles.settingRow}>
      <Icon size={18} color={theme.ink} />
      <Text style={[styles.rowTitle, { color: theme.ink, flex: 1 }]}>{label}</Text>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ true: theme.green, false: theme.line }} thumbColor="#FFFFFF" />
    </View>
  );
}

function InfoRow({ icon: Icon, label, value, theme }: { icon: IconComponent; label: string; value: string; theme: Theme }) {
  return (
    <View style={styles.settingRow}>
      <Icon size={18} color={theme.ink} />
      <Text style={[styles.rowTitle, { color: theme.ink, flex: 1 }]}>{label}</Text>
      <Text style={[styles.rowMeta, { color: theme.inkDim }]}>{value}</Text>
    </View>
  );
}

function AddRitualModal({
  open,
  onClose,
  onAdd,
  theme,
  isTablet,
  habits,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (habit: Habit) => void;
  theme: Theme;
  isTablet: boolean;
  habits: Habit[];
}) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('Flame');
  const [color, setColor] = useState<AccentKey>('coral');
  const [frequency, setFrequency] = useState<Frequency>('daily');
  const [reminderTime, setReminderTime] = useState('20:00');
  const anchorHabit = habits.find((habit) => currentStreak(habit) >= 7);

  const save = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    onAdd({
      id: `habit-${Date.now()}`,
      name: trimmed,
      icon,
      color,
      frequency,
      reminderTime,
      logs: [],
      notificationIds: [],
    });
    setName('');
    setIcon('Flame');
    setColor('coral');
    setFrequency('daily');
    setReminderTime('20:00');
    onClose();
  };

  return (
    <Modal visible={open} transparent animationType={isTablet ? 'fade' : 'slide'} onRequestClose={onClose}>
      <View style={[styles.modalBackdrop, isTablet ? styles.modalCenter : styles.modalBottom]}>
        <View style={[styles.addPanel, isTablet && styles.addPanelTablet, { backgroundColor: theme.card }]}>
          <View style={styles.panelHead}>
            <Text style={[styles.screenTitle, { color: theme.ink }]}>Add Ritual</Text>
            <Pressable accessibilityRole="button" onPress={onClose} style={[styles.iconButton, { backgroundColor: theme.line }]}>
              <X size={20} color={theme.ink} />
            </Pressable>
          </View>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Ritual name"
            placeholderTextColor={theme.inkFaint}
            style={[styles.sheetInput, { color: theme.ink, borderColor: theme.line, backgroundColor: theme.bg }]}
          />
          {anchorHabit ? (
            <View style={[styles.stackSuggestion, { backgroundColor: theme.line }]}>
              <Sparkles size={16} color={theme.violet} />
              <Text style={[styles.rowMeta, { color: theme.ink }]}>Stack it after {anchorHabit.name} at {formatReminder(anchorHabit.reminderTime)}.</Text>
            </View>
          ) : null}
          <Text style={[styles.sheetLabel, { color: theme.ink }]}>Icon</Text>
          <View style={styles.wrapRow}>
            {iconChoices.map((choice) => (
              <Pressable key={choice} onPress={() => setIcon(choice)} style={[styles.choiceButton, { backgroundColor: icon === choice ? theme.dark : theme.bg, borderColor: theme.line }]}>
                <IconGlyph name={choice} size={17} color={icon === choice ? '#FFFFFF' : theme.ink} />
                <Text style={[styles.choiceText, { color: icon === choice ? '#FFFFFF' : theme.ink }]}>{choice}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={[styles.sheetLabel, { color: theme.ink }]}>Color</Text>
          <View style={styles.wrapRow}>
            {colorChoices.map((choice) => (
              <Pressable key={choice} accessibilityRole="button" accessibilityState={{ selected: color === choice }} onPress={() => setColor(choice)} style={[styles.swatchOuter, color === choice && { borderColor: theme.ink }]}>
                <LinearGradient colors={accentGradients[choice]} style={styles.swatch} />
              </Pressable>
            ))}
          </View>
          <Text style={[styles.sheetLabel, { color: theme.ink }]}>Frequency</Text>
          <View style={styles.wrapRow}>
            {(Object.keys(frequencyLabels) as Frequency[]).map((choice) => (
              <Pill key={choice} label={frequencyLabels[choice]} selected={frequency === choice} onPress={() => setFrequency(choice)} theme={theme} />
            ))}
          </View>
          <Text style={[styles.sheetLabel, { color: theme.ink }]}>Reminder time</Text>
          <View style={styles.wrapRow}>
            {timeChoices.map((choice) => (
              <Pill key={choice} label={formatReminder(choice)} selected={reminderTime === choice} onPress={() => setReminderTime(choice)} theme={theme} />
            ))}
          </View>
          <AppButton label="Save ritual" icon={Check} onPress={save} theme={theme} />
        </View>
      </View>
    </Modal>
  );
}

function BottomNav({ activeTab, onChange, theme }: { activeTab: TabKey; onChange: (tab: TabKey) => void; theme: Theme }) {
  return (
    <View style={[styles.bottomNav, { backgroundColor: theme.dark }]}>
      <NavButton tab="home" label="Today" icon={HomeIcon} activeTab={activeTab} onChange={onChange} theme={theme} />
      <NavButton tab="progress" label="Progress" icon={BarChart3} activeTab={activeTab} onChange={onChange} theme={theme} />
      <NavButton tab="insights" label="Insights" icon={Sparkles} activeTab={activeTab} onChange={onChange} theme={theme} />
      <NavButton tab="profile" label="Profile" icon={User} activeTab={activeTab} onChange={onChange} theme={theme} />
    </View>
  );
}

function NavRail({ activeTab, onChange, theme }: { activeTab: TabKey; onChange: (tab: TabKey) => void; theme: Theme }) {
  return (
    <View style={[styles.navRail, { backgroundColor: theme.dark }]}>
      <View style={[styles.railLogo, { backgroundColor: theme.green }]}>
        <Flame size={24} color="#FFFFFF" fill="#FFFFFF" />
      </View>
      <NavButton tab="home" label="Today" icon={HomeIcon} activeTab={activeTab} onChange={onChange} theme={theme} vertical />
      <NavButton tab="progress" label="Progress" icon={BarChart3} activeTab={activeTab} onChange={onChange} theme={theme} vertical />
      <NavButton tab="insights" label="Insights" icon={Sparkles} activeTab={activeTab} onChange={onChange} theme={theme} vertical />
      <NavButton tab="profile" label="Profile" icon={User} activeTab={activeTab} onChange={onChange} theme={theme} vertical />
    </View>
  );
}

function NavButton({
  tab,
  label,
  icon: Icon,
  activeTab,
  onChange,
  theme,
  vertical = false,
}: {
  tab: TabKey;
  label: string;
  icon: IconComponent;
  activeTab: TabKey;
  onChange: (tab: TabKey) => void;
  theme: Theme;
  vertical?: boolean;
}) {
  const active = activeTab === tab;
  return (
    <Pressable accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={() => onChange(tab)} style={[vertical ? styles.railButton : styles.navButton, active && { backgroundColor: 'rgba(255,255,255,0.12)' }]}>
      <Icon size={21} color={active ? theme.green : 'rgba(255,255,255,0.66)'} strokeWidth={2.5} />
      <Text style={[vertical ? styles.railLabel : styles.navLabel, { color: active ? '#FFFFFF' : 'rgba(255,255,255,0.62)' }]}>{label}</Text>
    </Pressable>
  );
}

function EmptyState({ theme, title, body }: { theme: Theme; title: string; body: string }) {
  return (
    <View style={[styles.emptyState, { borderColor: theme.line }]}>
      <Flame size={22} color={theme.inkFaint} />
      <Text style={[styles.rowTitle, { color: theme.ink }]}>{title}</Text>
      <Text style={[styles.rowMeta, { color: theme.inkDim }]}>{body}</Text>
    </View>
  );
}

function CelebrationOverlay({ label, onClose, theme }: { label: string | null; onClose: () => void; theme: Theme }) {
  if (!label) {
    return null;
  }
  return (
    <Pressable accessibilityRole="button" onPress={onClose} style={styles.celebrationOverlay}>
      {Array.from({ length: 28 }).map((_, index) => (
        <View
          key={`confetti-${index}`}
          style={[
            styles.confetti,
            {
              left: `${(index * 37) % 100}%`,
              top: `${(index * 19) % 72}%`,
              backgroundColor: [theme.green, theme.coral, theme.amber, theme.violet, theme.sky][index % 5],
            },
          ]}
        />
      ))}
      <View style={[styles.celebrationCard, { backgroundColor: theme.card }]}>
        <Trophy size={42} color={theme.gold} fill={theme.gold} />
        <Text style={[styles.celebrationTitle, { color: theme.ink }]}>{label}</Text>
        <Text style={[styles.bodyText, { color: theme.inkDim }]}>Milestone unlocked. Tap anywhere to continue.</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  androidSafeTop: {
    paddingTop: Platform.OS === 'android' ? 22 : 0,
  },
  shell: {
    flex: 1,
  },
  tabletShell: {
    flexDirection: 'row',
  },
  appBody: {
    flex: 1,
    paddingBottom: 94,
  },
  tabletBody: {
    paddingBottom: 0,
  },
  screen: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 126,
    gap: 18,
  },
  tabletScreen: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 1100,
    paddingHorizontal: 28,
    paddingBottom: 36,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 58,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  kicker: {
    fontSize: 12,
    fontWeight: '700',
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  sectionMeta: {
    fontSize: 12,
    fontWeight: '700',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  heroCard: {
    minHeight: 194,
    borderRadius: 26,
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },
  heroCopy: {
    flex: 1,
    gap: 10,
  },
  heroDate: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 12,
    fontWeight: '700',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 23,
    lineHeight: 28,
    fontWeight: '800',
  },
  heroSub: {
    color: 'rgba(255,255,255,0.68)',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  heroPercent: {
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: '800',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  carousel: {
    gap: 14,
    paddingRight: 20,
  },
  habitTile: {
    width: 184,
    minHeight: 178,
    borderRadius: 24,
    padding: 18,
    justifyContent: 'space-between',
  },
  habitTileWide: {
    width: '100%',
    minHeight: 170,
  },
  tileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tileIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  completeCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  burst: {
    position: 'absolute',
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  tileName: {
    color: '#FFFFFF',
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '800',
  },
  tileFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  tileStreak: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  addTile: {
    width: 156,
    minHeight: 178,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  addTileIcon: {
    width: 50,
    height: 50,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTileText: {
    fontSize: 14,
    fontWeight: '800',
  },
  homeGrid: {
    flexDirection: 'row',
    gap: 22,
  },
  homeMainColumn: {
    flex: 1.55,
    gap: 18,
  },
  homeSideColumn: {
    flex: 1,
    gap: 18,
  },
  tabletTileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  card: {
    borderRadius: 24,
    padding: 18,
    gap: 14,
    shadowColor: '#15161B',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.1,
    shadowRadius: 22,
    elevation: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 58,
  },
  flexOne: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  rowMeta: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
  },
  rateText: {
    fontSize: 13,
    fontWeight: '800',
  },
  emberTrack: {
    width: 7,
    height: 52,
    borderRadius: 10,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  emberFill: {
    width: '100%',
    borderRadius: 10,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 38,
  },
  notificationDropdown: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
    gap: 12,
    zIndex: 4,
  },
  dropdownHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  linkText: {
    fontSize: 12,
    fontWeight: '800',
  },
  notificationRow: {
    flexDirection: 'row',
    gap: 10,
  },
  notificationBullet: {
    width: 9,
    height: 9,
    borderRadius: 5,
    marginTop: 5,
  },
  tabletProgress: {
    flex: 1,
    paddingBottom: 28,
  },
  masterDetail: {
    flex: 1,
    flexDirection: 'row',
    gap: 18,
  },
  masterList: {
    width: 310,
    borderRadius: 24,
    padding: 12,
  },
  detailPane: {
    flex: 1,
  },
  chips: {
    gap: 10,
    paddingBottom: 16,
  },
  pill: {
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  statGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 22,
    padding: 18,
    minHeight: 92,
    justifyContent: 'center',
  },
  statNumber: {
    fontSize: 30,
    fontWeight: '800',
  },
  chartCard: {
    borderRadius: 26,
    padding: 20,
    gap: 18,
    marginTop: 14,
    marginBottom: 14,
  },
  chartHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chartTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  chartSub: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 12,
    fontWeight: '700',
  },
  rateBadge: {
    backgroundColor: 'rgba(40,199,111,0.16)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  rateBadgeText: {
    color: '#28C76F',
    fontSize: 12,
    fontWeight: '800',
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 144,
  },
  barSlot: {
    alignItems: 'center',
    gap: 8,
    width: 28,
  },
  bar: {
    width: 18,
    borderRadius: 10,
  },
  barLabel: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 11,
    fontWeight: '800',
  },
  heatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  heatCell: {
    width: 22,
    height: 22,
    borderRadius: 7,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: 18,
    minHeight: 64,
  },
  insightHero: {
    borderRadius: 26,
    padding: 22,
    gap: 14,
  },
  insightTitle: {
    color: '#FFFFFF',
    fontSize: 23,
    lineHeight: 29,
    fontWeight: '800',
  },
  insightBody: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
  patternRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 54,
  },
  patternIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCard: {
    borderRadius: 26,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  profileAvatar: {
    width: 66,
    height: 66,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  profileName: {
    fontSize: 21,
    fontWeight: '800',
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  premiumText: {
    color: '#16171C',
    fontSize: 11,
    fontWeight: '800',
  },
  settingRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoutButton: {
    borderWidth: 1,
    borderRadius: 18,
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '800',
  },
  button: {
    minHeight: 46,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    alignSelf: 'flex-start',
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '800',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.48)',
    padding: 16,
  },
  modalBottom: {
    justifyContent: 'flex-end',
  },
  modalCenter: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPanel: {
    borderRadius: 26,
    padding: 18,
    gap: 13,
    maxHeight: '92%',
  },
  addPanelTablet: {
    width: 480,
  },
  panelHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetInput: {
    borderWidth: 1,
    borderRadius: 16,
    minHeight: 52,
    paddingHorizontal: 14,
    fontSize: 15,
    fontWeight: '700',
  },
  sheetLabel: {
    fontSize: 13,
    fontWeight: '800',
  },
  wrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  choiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  choiceText: {
    fontSize: 12,
    fontWeight: '800',
  },
  swatchOuter: {
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 17,
    padding: 3,
  },
  swatch: {
    width: 38,
    height: 38,
    borderRadius: 13,
  },
  stackSuggestion: {
    borderRadius: 14,
    padding: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fab: {
    position: 'absolute',
    right: 22,
    bottom: 100,
    width: 60,
    height: 60,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#15161B',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 5,
  },
  bottomNav: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 20,
    height: 70,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  navButton: {
    flex: 1,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '800',
  },
  navRail: {
    width: 88,
    alignItems: 'center',
    paddingTop: 22,
    gap: 12,
  },
  railLogo: {
    width: 48,
    height: 48,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  railButton: {
    width: 76,
    minHeight: 66,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  railLabel: {
    fontSize: 10,
    fontWeight: '800',
  },
  previewBanner: {
    position: 'absolute',
    top: Platform.select({ ios: 58, android: 28, default: 28 }),
    left: 18,
    right: 18,
    backgroundColor: '#16171C',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 20,
  },
  bannerCopy: {
    flex: 1,
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  bannerBody: {
    color: 'rgba(255,255,255,0.68)',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
    gap: 8,
  },
  celebrationOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.56)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 40,
  },
  celebrationCard: {
    width: '82%',
    maxWidth: 380,
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  celebrationTitle: {
    fontSize: 26,
    fontWeight: '800',
  },
  confetti: {
    position: 'absolute',
    width: 10,
    height: 16,
    borderRadius: 4,
    transform: [{ rotate: '18deg' }],
  },
  signInRoot: {
    flex: 1,
  },
  signInContent: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    gap: 28,
  },
  brandBlock: {
    alignItems: 'center',
    gap: 9,
  },
  brandBadge: {
    width: 66,
    height: 66,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 42,
    fontWeight: '800',
  },
  brandTagline: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 15,
    fontWeight: '700',
  },
  loginCard: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 28,
    padding: 18,
    gap: 13,
  },
  inputWrap: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 13,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  errorText: {
    color: '#FF8A90',
    fontSize: 12,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  dividerText: {
    color: 'rgba(255,255,255,0.46)',
    fontSize: 12,
    fontWeight: '800',
  },
  biometricButton: {
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(212,169,78,0.36)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  biometricText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  trustText: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 12,
    fontWeight: '700',
  },
  blob: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    opacity: 0.42,
  },
  blobGreen: {
    left: -54,
    top: 90,
    backgroundColor: '#28C76F',
  },
  blobViolet: {
    right: -64,
    bottom: 160,
    backgroundColor: '#8C7CF6',
  },
});
