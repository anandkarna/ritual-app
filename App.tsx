import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Fraunces_400Regular } from '@expo-google-fonts/fraunces/400Regular';
import { Fraunces_500Medium } from '@expo-google-fonts/fraunces/500Medium';
import { Fraunces_600SemiBold } from '@expo-google-fonts/fraunces/600SemiBold';
import { PlusJakartaSans_400Regular } from '@expo-google-fonts/plus-jakarta-sans/400Regular';
import { PlusJakartaSans_500Medium } from '@expo-google-fonts/plus-jakarta-sans/500Medium';
import { PlusJakartaSans_600SemiBold } from '@expo-google-fonts/plus-jakarta-sans/600SemiBold';
import { useFonts } from 'expo-font';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { NavigationBar } from 'expo-navigation-bar';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import DateTimePicker from '@react-native-community/datetimepicker';
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
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
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
  MapPin,
  MessageCircle,
  Moon,
  Pencil,
  PieChart,
  Phone,
  Plus,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  Trash2,
  User,
  Zap,
} from 'lucide-react-native';
import React, { ComponentType, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createClient, User as SupabaseUser } from '@supabase/supabase-js';

type TabKey = 'today' | 'progress' | 'insights' | 'profile';
type PaletteKey =
  | 'water'
  | 'running'
  | 'gym'
  | 'meditate'
  | 'reading'
  | 'focus'
  | 'work'
  | 'food'
  | 'sleep'
  | 'journal'
  | 'creative'
  | 'music'
  | 'cycling'
  | 'skincare'
  | 'noPhone';
type GoalUnit = 'liters' | 'minutes' | 'hours' | 'pages' | 'reps' | 'glasses';
type IconComponent = ComponentType<{ size?: number; color?: string; strokeWidth?: number; fill?: string }>;

type HabitPalette = {
  a: string;
  b: string;
  bg: readonly [string, string];
  ink: string;
};

type HeroThemeKey = 'morning' | 'afternoon' | 'evening' | 'night';

type HeroTheme = {
  key: HeroThemeKey;
  backdrop: readonly [string, string, string];
  wave: readonly [string, string];
  accent: string;
  inkOnHero: string;
  greeting: string;
};

type Ritual = {
  id: string;
  name: string;
  icon: string;
  paletteKey: PaletteKey;
  why?: string;
  goalAmount?: number;
  goalUnit?: GoalUnit;
  reminderTime?: string;
  completedAt?: number | null;
  streakDays: number;
  bestStreakDays: number;
  doneToday: boolean;
  weekly: number[];
  heat: number[];
  createdAt: number;
};

type CreateRitualInput = {
  name: string;
  icon: string;
  paletteKey: PaletteKey;
  why?: string;
  goalAmount?: number;
  goalUnit?: GoalUnit;
  reminderTime?: string;
};

type FloTone = 'gentle' | 'direct' | 'coach';
type CheckinCategory = 'aligned_tradeoff' | 'circumstantial' | 'drift' | 'pattern';

type FlowSettings = {
  pushNotifications: boolean;
  messageAlerts: boolean;
  darkTheme: boolean;
  haptics: boolean;
  floTone: FloTone;
};

type RitualCheckin = {
  id: string;
  ritualId: string;
  date: string;
  scheduledWindow: string;
  userReasonRaw: string;
  category: CheckinCategory;
  floMessage: string;
  streakProtected: boolean;
  suggestedAction: string | null;
  resolvedAt?: number;
};

type SavedFlowState = {
  rituals: Ritual[];
  checkins: RitualCheckin[];
  totalActiveRituals: number;
  baseDoneFromOtherHabits: number;
  overallStreak: number;
  rhythmPoints: number;
  graceHearts: number;
  onboardingDream?: DreamId | null;
  settings: FlowSettings;
  insight: string;
  stateDate?: string;
};

type ToastState = {
  id: number;
  message: string;
};

type HeaderMetric = {
  id: 'streak' | 'points' | 'hearts';
  icon: string;
  value: number;
  label: string;
  color: string;
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
type OnboardingStep = 'dream' | 'starters';
type DreamId = 'maintain' | 'dedication' | 'calm' | 'strength' | 'mind' | 'rest';

type AuthAccount = {
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
};

type ProfileSetupData = {
  name: string;
  age: number;
  city: string;
  mobile: string;
  countryCode: string;
  gender: string;
  habitFocus: string;
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
  age?: number | null;
  city?: string | null;
  mobile?: string | null;
  country_code?: string | null;
  gender?: string | null;
  habit_focus?: string | null;
  profile_complete?: boolean | null;
  profile_setup_skipped?: boolean | null;
  flo_tone?: FloTone | null;
};

type SupabaseHabit = {
  id: string;
  name: string;
  icon: string;
  color: string | null;
  palette_key?: PaletteKey | null;
  why?: string | null;
  goal_amount?: number | null;
  goal_unit?: GoalUnit | null;
  reminder_time?: string | null;
  created_at: string | null;
};

type SupabaseHabitLog = {
  habit_id: string;
  log_date: string;
  completed_at?: string | null;
};

type SupabaseRitualCheckin = {
  id: string;
  habit_id?: string | null;
  ritual_id?: string | null;
  checkin_date?: string | null;
  date?: string | null;
  scheduled_window?: string | null;
  user_reason_raw?: string | null;
  category?: CheckinCategory | null;
  flo_message?: string | null;
  streak_protected?: boolean | null;
  suggested_action?: string | null;
  created_at?: string | null;
};

type ReminderScheduleRecord = Record<string, { notificationId: string; reminderTime: string; body: string }>;

const STORAGE_KEY = 'flow-liquid-redesign-v4-clean';
const AUTH_STORAGE_KEY = 'flow-auth-v1';
const ASK_FLO_POSITION_STORAGE_KEY = 'ask-flo-launcher-position-v1';
const HERO_THEME_OVERRIDE_STORAGE_KEY = 'rituals-hero-theme-override-v1';
const REMINDER_NOTIFICATION_STORAGE_KEY = 'ritual-reminder-notifications-v1';
const DEFAULT_COUNTRY_CODE = '+91';
const DEFAULT_COUNTRY_FLAG = '🇮🇳';
const PROFILE_SELECT = 'id,username,name,email,avatar_emoji,dark_theme,haptics_enabled,push_enabled,age,city,mobile,country_code,gender,habit_focus,profile_complete,profile_setup_skipped';
const NAV_HEIGHT = 72;
const NAV_BOTTOM_OFFSET = 0;
const ASK_FLO_WIDTH = 136;
const ASK_FLO_HEIGHT = 48;
const ASK_FLO_EDGE_PADDING = 16;
const ASK_FLO_NAV_GAP = 22;
const ASK_FLO_TAP_THRESHOLD = 6;
const TABLET_MIN_WIDTH = 720;
const WIDE_TABLET_MIN_WIDTH = 900;
const AUTH_SINGLE_MAX_WIDTH = 600;
const AUTH_SPLIT_MAX_WIDTH = 1040;
const PROFILE_SETUP_MAX_WIDTH = 720;
const APP_CONTENT_MAX_WIDTH = 1040;
const NAV_TABLET_MAX_WIDTH = 680;
const SHEET_TABLET_MAX_WIDTH = 680;
const DEFAULT_AUTH_ACCOUNT: AuthAccount = {
  username: 'Pratik',
  password: 'Pratik@16',
  email: 'pratik@rituals.app',
  name: 'Pratik',
  countryCode: DEFAULT_COUNTRY_CODE,
  profileComplete: true,
  profileSetupSkipped: false,
};
const fontBody = 'PlusJakartaSans_500Medium';
const fontBodyRegular = 'PlusJakartaSans_400Regular';
const fontBodySemi = 'PlusJakartaSans_600SemiBold';
const fontBodyBold = 'PlusJakartaSans_600SemiBold';
const fontBodyExtra = 'PlusJakartaSans_600SemiBold';
const fontSerif = 'Fraunces_500Medium';
const fontSerifSemi = 'Fraunces_600SemiBold';
const fontSerifBold = 'Fraunces_600SemiBold';

function responsiveMaxWidth(width: number, maxWidth: number, horizontalPadding: number) {
  return Math.min(maxWidth, Math.max(0, width - horizontalPadding * 2));
}

const colors = {
  page: '#EFF3FA',
  ink: '#1C2B49',
  inkSoft: '#7C8AA6',
  inkFaint: '#A9B4C7',
  cardTop: '#FFFFFF',
  cardBottom: '#F2F6FC',
  cardBorder: 'rgba(255,255,255,0.7)',
  blue1: '#4FA8FF',
  blue2: '#BFE3FF',
  green: '#33CBA1',
  orange: '#FF9F43',
  pink: '#FF6A96',
  indigo: '#7A79FF',
  danger: '#FF6A6A',
  track: 'rgba(120,140,180,0.14)',
  line: 'rgba(120,140,180,0.1)',
};

const runtimeExtra = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;
const supabaseUrl = typeof runtimeExtra.supabaseUrl === 'string' ? runtimeExtra.supabaseUrl : undefined;
const supabaseAnonKey = typeof runtimeExtra.supabaseAnonKey === 'string' ? runtimeExtra.supabaseAnonKey : undefined;
const nvidiaApiKey = typeof runtimeExtra.nvidiaApiKey === 'string' ? runtimeExtra.nvidiaApiKey : undefined;
const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        ...(Platform.OS !== 'web' ? { storage: AsyncStorage } : {}),
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;

function isExpoGoRuntime() {
  return Constants.appOwnership === 'expo';
}

function getNotificationsModule() {
  if (Platform.OS === 'web' || isExpoGoRuntime()) {
    return null;
  }
  try {
    // Dynamic require keeps Expo Go from initializing expo-notifications on Android.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('expo-notifications') as typeof import('expo-notifications');
  } catch {
    return null;
  }
}

const notificationsModule = getNotificationsModule();

SplashScreen.preventAutoHideAsync().catch(() => undefined);

notificationsModule?.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const habitPalette: Record<PaletteKey, HabitPalette> = {
  water: { a: '#4FA8FF', b: '#BFE3FF', bg: ['#EDF6FF', '#DCEDFF'], ink: '#1568C9' },
  running: { a: '#FF6A6A', b: '#FFD3D3', bg: ['#FFF1F1', '#FFE2E2'], ink: '#C33A3A' },
  gym: { a: '#5D6B82', b: '#D3DAE6', bg: ['#F3F6FA', '#E6EBF3'], ink: '#3B4658' },
  meditate: { a: '#7A79FF', b: '#C9C8FF', bg: ['#F1F0FF', '#E4E2FF'], ink: '#5A4FD6' },
  reading: { a: '#FFB25B', b: '#FFDCA6', bg: ['#FFF6EA', '#FFEBD1'], ink: '#B4600A' },
  focus: { a: '#7A79FF', b: '#C9C8FF', bg: ['#F1F0FF', '#E4E2FF'], ink: '#5A4FD6' },
  work: { a: '#2F80ED', b: '#B8D7FF', bg: ['#EEF6FF', '#DDEBFF'], ink: '#1E5EAF' },
  food: { a: '#33CBA1', b: '#A9F0DA', bg: ['#EBFBF5', '#D8F7EA'], ink: '#0E8F6A' },
  sleep: { a: '#8E8CF5', b: '#D9D8FF', bg: ['#F4F3FF', '#E8E7FF'], ink: '#5D59D6' },
  journal: { a: '#F0A332', b: '#FFE1A8', bg: ['#FFF8EA', '#FFEFD0'], ink: '#A56611' },
  creative: { a: '#FF6A96', b: '#FFC8D8', bg: ['#FFF1F5', '#FFE0E8'], ink: '#B53762' },
  music: { a: '#9B5CFF', b: '#DCC7FF', bg: ['#F6F0FF', '#EBDEFF'], ink: '#7036D0' },
  cycling: { a: '#1EB980', b: '#B5F0D6', bg: ['#ECFBF4', '#DDF7EC'], ink: '#087B55' },
  skincare: { a: '#FF9FBC', b: '#FFE0EA', bg: ['#FFF3F7', '#FFE8F0'], ink: '#B64C70' },
  noPhone: { a: '#3A4459', b: '#C8D0DE', bg: ['#F2F4F8', '#E4E9F1'], ink: '#263044' },
};

const heroThemes: Record<HeroThemeKey, HeroTheme> = {
  morning: {
    key: 'morning',
    backdrop: ['#FFF6EA', '#FFE3C2', '#FFCB8A'],
    wave: ['#FFDCA6', '#FFB25B'],
    accent: '#FF9F43',
    inkOnHero: '#7A4A12',
    greeting: 'Good Morning',
  },
  afternoon: {
    key: 'afternoon',
    backdrop: ['#F5FAFF', '#DCEEFF', '#BFE3FF'],
    wave: ['#BFE3FF', '#4FA8FF'],
    accent: '#4FA8FF',
    inkOnHero: '#1C2B49',
    greeting: 'Good Afternoon',
  },
  evening: {
    key: 'evening',
    backdrop: ['#FFF1F5', '#FFD3E0', '#FFAAC0'],
    wave: ['#FFC8D8', '#FF6A96'],
    accent: '#FF6A96',
    inkOnHero: '#7A2947',
    greeting: 'Good Evening',
  },
  night: {
    key: 'night',
    backdrop: ['#1B2445', '#232A5C', '#33357A'],
    wave: ['#8483FF', '#5A57E8'],
    accent: '#7A79FF',
    inkOnHero: '#E4E2FF',
    greeting: 'Good Night',
  },
};

const heroThemeOrder: HeroThemeKey[] = ['morning', 'afternoon', 'evening', 'night'];

const nightStars = Array.from({ length: 26 }, (_, index) => ({
  id: `star-${index}`,
  left: `${8 + ((index * 37) % 84)}%` as `${number}%`,
  top: `${10 + ((index * 53) % 68)}%` as `${number}%`,
  delay: (index * 173) % 2300,
  opacity: 0.22 + ((index * 11) % 28) / 100,
}));

const paletteRotation: PaletteKey[] = ['water', 'running', 'gym', 'meditate', 'reading', 'focus', 'work', 'food', 'sleep', 'journal', 'creative', 'music', 'cycling', 'skincare', 'noPhone'];
const ritualIconLibrary: Array<{ key: PaletteKey; icon: string; label: string }> = [
  { key: 'water', icon: '💧', label: 'Water' },
  { key: 'running', icon: '🏃', label: 'Running' },
  { key: 'gym', icon: '🏋️', label: 'Gym' },
  { key: 'meditate', icon: '🧘', label: 'Meditate' },
  { key: 'reading', icon: '📖', label: 'Reading' },
  { key: 'focus', icon: '🎯', label: 'Focus' },
  { key: 'work', icon: '💼', label: 'Work' },
  { key: 'food', icon: '🥗', label: 'Food' },
  { key: 'sleep', icon: '🌙', label: 'Sleep' },
  { key: 'journal', icon: '✍️', label: 'Journal' },
  { key: 'creative', icon: '🎨', label: 'Creative' },
  { key: 'music', icon: '🎵', label: 'Music' },
  { key: 'cycling', icon: '🚴', label: 'Cycling' },
  { key: 'skincare', icon: '🧴', label: 'Skincare' },
  { key: 'noPhone', icon: '📵', label: 'No Phone' },
];
const goalUnits: GoalUnit[] = ['liters', 'minutes', 'hours', 'pages', 'reps', 'glasses'];
const reminderPresets = [
  { label: '8:00 AM', value: '08:00' },
  { label: '1:00 PM', value: '13:00' },
  { label: '8:00 PM', value: '20:00' },
];
const ritualTemplates: Array<{ label: string; name: string; iconKey: PaletteKey; goalAmount: number; goalUnit: GoalUnit; reminderTime: string }> = [
  { label: 'Water 4L', name: 'Water 4L', iconKey: 'water', goalAmount: 4, goalUnit: 'liters', reminderTime: '20:00' },
  { label: 'Run 30min', name: 'Run 30min', iconKey: 'running', goalAmount: 30, goalUnit: 'minutes', reminderTime: '08:00' },
  { label: 'Meditate 10min', name: 'Meditate 10min', iconKey: 'meditate', goalAmount: 10, goalUnit: 'minutes', reminderTime: '08:00' },
  { label: 'Read 20 pages', name: 'Read 20 pages', iconKey: 'reading', goalAmount: 20, goalUnit: 'pages', reminderTime: '20:00' },
  { label: 'Gym session', name: 'Gym session', iconKey: 'gym', goalAmount: 45, goalUnit: 'minutes', reminderTime: '13:00' },
];
const dreamOptions: Array<{ id: DreamId; icon: string; title: string; description: string; paletteKey: PaletteKey }> = [
  { id: 'maintain', icon: '🌿', title: 'Maintain yourself', description: 'Small daily care, consistently', paletteKey: 'food' },
  { id: 'dedication', icon: '🔥', title: 'Build dedication', description: 'Show up, no matter what', paletteKey: 'running' },
  { id: 'calm', icon: '🧘', title: 'Find calm', description: 'Slow down and reset', paletteKey: 'meditate' },
  { id: 'strength', icon: '💪', title: 'Get stronger', description: 'Move your body daily', paletteKey: 'gym' },
  { id: 'mind', icon: '📖', title: 'Grow my mind', description: 'Read, learn, focus', paletteKey: 'reading' },
  { id: 'rest', icon: '🌙', title: 'Rest better', description: 'Sleep as a ritual too', paletteKey: 'sleep' },
];
const starterRitualsByDream: Record<DreamId, Array<{ name: string; icon: string; paletteKey: PaletteKey; goalAmount?: number; goalUnit?: GoalUnit; reminderTime: string }>> = {
  maintain: [
    { name: 'Water Intake', icon: '💧', paletteKey: 'water', goalAmount: 4, goalUnit: 'liters', reminderTime: '08:00' },
    { name: 'Skincare', icon: '🧴', paletteKey: 'skincare', reminderTime: '20:00' },
    { name: 'Stretch', icon: '🤸', paletteKey: 'gym', goalAmount: 10, goalUnit: 'minutes', reminderTime: '08:00' },
  ],
  dedication: [
    { name: 'Morning Routine', icon: '🌅', paletteKey: 'work', reminderTime: '08:00' },
    { name: 'No-Excuse Journal', icon: '✍️', paletteKey: 'journal', goalAmount: 10, goalUnit: 'minutes', reminderTime: '20:00' },
    { name: 'Cold Shower', icon: '🚿', paletteKey: 'water', reminderTime: '08:00' },
  ],
  calm: [
    { name: 'Meditate', icon: '🧘', paletteKey: 'meditate', goalAmount: 10, goalUnit: 'minutes', reminderTime: '08:00' },
    { name: 'Gratitude Journal', icon: '📝', paletteKey: 'journal', reminderTime: '20:00' },
    { name: 'Evening Wind-down', icon: '🌙', paletteKey: 'sleep', reminderTime: '20:00' },
  ],
  strength: [
    { name: 'Workout', icon: '🏋️', paletteKey: 'gym', goalAmount: 45, goalUnit: 'minutes', reminderTime: '13:00' },
    { name: 'Run 30min', icon: '🏃', paletteKey: 'running', goalAmount: 30, goalUnit: 'minutes', reminderTime: '08:00' },
    { name: 'Protein Intake', icon: '🥩', paletteKey: 'food', reminderTime: '13:00' },
  ],
  mind: [
    { name: 'Read 20 Pages', icon: '📖', paletteKey: 'reading', goalAmount: 20, goalUnit: 'pages', reminderTime: '20:00' },
    { name: 'Learn a Skill', icon: '🎯', paletteKey: 'focus', goalAmount: 30, goalUnit: 'minutes', reminderTime: '13:00' },
    { name: 'Deep Work Block', icon: '💻', paletteKey: 'work', goalAmount: 45, goalUnit: 'minutes', reminderTime: '13:00' },
  ],
  rest: [
    { name: 'Sleep 6hrs', icon: '🌙', paletteKey: 'sleep', goalAmount: 6, goalUnit: 'hours', reminderTime: '20:00' },
    { name: 'No Screens After 9pm', icon: '📵', paletteKey: 'noPhone', reminderTime: '20:00' },
    { name: 'Wind-down Routine', icon: '🕯️', paletteKey: 'sleep', reminderTime: '20:00' },
  ],
};
const weekLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const genderOptions = ['Female', 'Male', 'Other'];
const habitFocusOptions = ['Reading', 'Fitness', 'Mindfulness', 'Sleep', 'Hydration', 'Food'];

const seedSettings: FlowSettings = {
  pushNotifications: true,
  messageAlerts: true,
  darkTheme: false,
  haptics: true,
  floTone: 'gentle',
};

const seedRituals: Ritual[] = [];

const defaultState: SavedFlowState = {
  rituals: seedRituals,
  checkins: [],
  totalActiveRituals: 0,
  baseDoneFromOtherHabits: 0,
  overallStreak: 0,
  rhythmPoints: 0,
  graceHearts: 5,
  onboardingDream: null,
  settings: seedSettings,
  insight: '',
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

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

function formatTodayLabel(date = new Date()) {
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${weekdays[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function formatLiveDateTime(date = new Date()) {
  return `Today · ${formatTodayLabel(date)} · ${formatClockTime(date)}`;
}

function formatClockTime(date = new Date()) {
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function nowHour(date = new Date()) {
  return date.getHours() + date.getMinutes() / 60;
}

function fmtHour(hourValue: number) {
  const hh = Math.floor(hourValue);
  const mm = Math.round((hourValue - hh) * 60);
  const period = hh >= 12 ? 'PM' : 'AM';
  const h12 = hh % 12 || 12;
  return `${h12}:${String(mm).padStart(2, '0')} ${period}`;
}

function hourToPercent(hourValue: number) {
  const start = 6;
  const end = 24;
  const adjusted = hourValue < start ? hourValue + 24 : hourValue;
  const clamped = clamp(adjusted, start, end);
  return ((clamped - start) / (end - start)) * 100;
}

const COLLISION_PCT = 6.5;

type TimelineEntry = {
  ritual: Ritual;
  pct: number;
};

function groupIntoClusters(sortedEntries: TimelineEntry[]) {
  const clusters: Array<{ items: TimelineEntry[] }> = [];
  sortedEntries.forEach((entry) => {
    const last = clusters[clusters.length - 1];
    if (last && entry.pct - last.items[last.items.length - 1].pct < COLLISION_PCT) {
      last.items.push(entry);
      return;
    }
    clusters.push({ items: [entry] });
  });
  return clusters;
}

function hourFloatFromIso(value?: string | null) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return nowHour(date);
}

function useMinuteNow() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const sync = () => setNow(new Date());
    sync();
    const timer = setInterval(sync, 30000);
    return () => clearInterval(timer);
  }, []);

  return now;
}

function getHeroThemeKey(date = new Date()): HeroThemeKey {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) {
    return 'morning';
  }
  if (hour >= 12 && hour < 17) {
    return 'afternoon';
  }
  if (hour >= 17 && hour < 21) {
    return 'evening';
  }
  return 'night';
}

function isHeroThemeKey(value: string | null): value is HeroThemeKey {
  return value === 'morning' || value === 'afternoon' || value === 'evening' || value === 'night';
}

function isFloTone(value: unknown): value is FloTone {
  return value === 'gentle' || value === 'direct' || value === 'coach';
}

function isCheckinCategory(value: unknown): value is CheckinCategory {
  return value === 'aligned_tradeoff' || value === 'circumstantial' || value === 'drift' || value === 'pattern';
}

function isGoalUnit(value: unknown): value is GoalUnit {
  return value === 'liters' || value === 'minutes' || value === 'hours' || value === 'pages' || value === 'reps' || value === 'glasses';
}

function isPaletteKey(value: unknown): value is PaletteKey {
  return typeof value === 'string' && value in habitPalette;
}

function isDreamId(value: unknown): value is DreamId {
  return typeof value === 'string' && dreamOptions.some((option) => option.id === value);
}

function iconOptionForKey(key: PaletteKey) {
  return ritualIconLibrary.find((option) => option.key === key) ?? ritualIconLibrary[0];
}

function iconOptionForEmoji(icon: string) {
  return ritualIconLibrary.find((option) => option.icon === icon) ?? ritualIconLibrary[0];
}

function starterRitualToRitual(
  starter: { name: string; icon: string; paletteKey: PaletteKey; goalAmount?: number; goalUnit?: GoalUnit; reminderTime: string },
  index: number,
  idPrefix = 'starter',
): Ritual {
  return {
    id: `${idPrefix}-${Date.now()}-${index}`,
    name: starter.name,
    icon: starter.icon,
    paletteKey: starter.paletteKey,
    goalAmount: starter.goalAmount,
    goalUnit: starter.goalUnit,
    reminderTime: starter.reminderTime,
    completedAt: null,
    streakDays: 0,
    bestStreakDays: 0,
    doneToday: false,
    weekly: [0, 0, 0, 0, 0, 0, 0],
    heat: Array.from({ length: 30 }, () => 0),
    createdAt: Date.now() + index,
  };
}

function normalizeCheckins(value: unknown): RitualCheckin[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item, index): RitualCheckin | null => {
      const raw = item as Partial<RitualCheckin>;
      if (!raw.ritualId || !raw.date || !raw.userReasonRaw) {
        return null;
      }
      const normalized: RitualCheckin = {
        id: raw.id || `checkin-${raw.ritualId}-${raw.date}-${index}`,
        ritualId: raw.ritualId,
        date: raw.date,
        scheduledWindow: raw.scheduledWindow || 'Today',
        userReasonRaw: raw.userReasonRaw,
        category: isCheckinCategory(raw.category) ? raw.category : 'drift',
        floMessage: raw.floMessage || 'Thanks for naming what happened. One honest check-in is still part of the ritual.',
        streakProtected: Boolean(raw.streakProtected),
        suggestedAction: typeof raw.suggestedAction === 'string' ? raw.suggestedAction : null,
      };
      if (typeof raw.resolvedAt === 'number') {
        normalized.resolvedAt = raw.resolvedAt;
      }
      return normalized;
    })
    .filter((item): item is RitualCheckin => Boolean(item));
}

function goalLabel(amount?: number, unit?: GoalUnit) {
  if (!amount || !unit) {
    return '';
  }
  const formattedAmount = Number.isInteger(amount) ? String(amount) : String(Number(amount.toFixed(2)));
  const unitLabel = unit === 'liters' ? 'L' : unit === 'minutes' ? 'min' : unit === 'hours' ? 'hrs' : unit;
  return unit === 'liters' || unit === 'minutes' || unit === 'hours' ? `${formattedAmount}${unitLabel}` : `${formattedAmount} ${unitLabel}`;
}

function formatReminderTime(value?: string) {
  if (!value) {
    return '';
  }
  const [hourRaw, minuteRaw] = value.split(':');
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return value;
  }
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${String(minute).padStart(2, '0')} ${suffix}`;
}

function timeValueFromDate(date: Date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function dateFromReminderTime(value: string) {
  const [hourRaw, minuteRaw] = value.split(':');
  const date = new Date();
  date.setHours(Number(hourRaw) || 8, Number(minuteRaw) || 0, 0, 0);
  return date;
}

function nextReminderDate(value: string) {
  const date = dateFromReminderTime(value);
  if (date.getTime() <= Date.now()) {
    date.setDate(date.getDate() + 1);
  }
  return date;
}

function ritualReminderBody(ritual: Pick<Ritual, 'name' | 'goalAmount' | 'goalUnit'>) {
  const name = ritual.name.trim() || 'your ritual';
  const goal = goalLabel(ritual.goalAmount, ritual.goalUnit);
  return goal ? `Still time for your ${goal} today?` : `Still time to check in with ${name} today?`;
}

function ritualReminderExplanation(name: string, goalAmount: number | undefined, goalUnit: GoalUnit | undefined, reminderTime?: string) {
  const displayName = name.trim() || 'this ritual';
  if (!reminderTime) {
    return 'Pick a reminder time if you want Rituals to nudge you when this ritual is still open.';
  }
  const goal = goalLabel(goalAmount, goalUnit);
  const body = goal ? `Still time for your ${goal} today?` : `Still time to check in with ${displayName} today?`;
  return `If ${displayName} isn't marked done by ${formatReminderTime(reminderTime)}, Rituals will send a gentle nudge - "${body}"`;
}

function reminderWindowLabel(reminderTime?: string) {
  if (!reminderTime) {
    return 'Today';
  }
  const start = formatReminderTime(reminderTime);
  const endDate = dateFromReminderTime(reminderTime);
  endDate.setHours(endDate.getHours() + 1);
  return `${start} - ${formatReminderTime(timeValueFromDate(endDate))}`;
}

function reminderWindowClosed(ritual: Ritual, now = new Date()) {
  if (!ritual.reminderTime || ritual.doneToday) {
    return false;
  }
  const close = dateFromReminderTime(ritual.reminderTime);
  close.setHours(close.getHours() + 1);
  return now.getTime() > close.getTime();
}

function recentPatternForReason(checkins: RitualCheckin[], reason: string, date = todayIso()) {
  const normalized = reason.trim().toLowerCase();
  if (!normalized) {
    return false;
  }
  const start = new Date(`${date}T00:00:00`);
  start.setDate(start.getDate() - 6);
  return checkins.filter((checkin) => {
    const checkinTime = new Date(`${checkin.date}T00:00:00`).getTime();
    return checkinTime >= start.getTime() && checkin.userReasonRaw.trim().toLowerCase() === normalized;
  }).length >= 2;
}

function localFloCheckinReply(ritual: Ritual, reason: string, tone: FloTone, hasPattern: boolean) {
  const lower = reason.toLowerCase();
  const aligned = /chose|family|friend|rest|sleep|work|study|health|needed/i.test(lower) && Boolean(ritual.why);
  const circumstantial = /came up|traffic|sick|ill|urgent|emergency|late|travel|meeting/i.test(lower);
  const category: CheckinCategory = hasPattern ? 'pattern' : aligned ? 'aligned_tradeoff' : circumstantial ? 'circumstantial' : 'drift';
  const protect = category === 'aligned_tradeoff' || category === 'circumstantial';
  const suggestedAction = category === 'drift' || category === 'pattern'
    ? tone === 'coach' && ritual.reminderTime ? 'Move to mornings?' : 'Make it smaller tomorrow?'
    : null;
  const whyLine = ritual.why ? ` You started this because it ${ritual.why.replace(/\.$/, '')}.` : '';
  const toneLine = tone === 'direct'
    ? ' Be honest about whether this was a real tradeoff or just drift.'
    : tone === 'coach'
      ? ' Let us make the next version easier to start.'
      : ' That is useful information, not a failure.';
  const patternLine = hasPattern ? ' This same reason has shown up a few times this week, so it may be a pattern worth adjusting.' : '';
  return {
    message: `Thanks for naming it.${whyLine}${patternLine}${toneLine}`,
    category,
    protect_streak: protect,
    suggested_action: suggestedAction,
  };
}

async function generateFloCheckinReply(ritual: Ritual, reason: string, tone: FloTone, hasPattern: boolean) {
  const fallback = localFloCheckinReply(ritual, reason, tone, hasPattern);
  if (!nvidiaApiKey) {
    return fallback;
  }

  try {
    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${nvidiaApiKey}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'moonshotai/kimi-k3',
        max_tokens: 600,
        temperature: 0.7,
        stream: false,
        messages: [
          {
            role: 'system',
            content: 'You are Flo, the companion inside a ritual habit app. A user missed a scheduled ritual and gave a reason. Respond briefly in 2-4 sentences, warm and curious, never a scold. Return strict JSON with message, category, protect_streak, suggested_action. Category must be aligned_tradeoff, circumstantial, drift, or pattern.',
          },
          {
            role: 'user',
            content: JSON.stringify({
              ritual_name: ritual.name,
              scheduled_window: reminderWindowLabel(ritual.reminderTime),
              ritual_why: ritual.why ?? '',
              user_reason: reason,
              recent_pattern: hasPattern ? 'This is the 3rd+ similar miss this week.' : undefined,
              tone_setting: tone,
            }),
          },
        ],
      }),
    });
    const json = await response.json();
    const content = json?.choices?.[0]?.message?.content;
    const parsed = typeof content === 'string' ? JSON.parse(content.replace(/^```json\s*|\s*```$/g, '')) : null;
    if (
      parsed
      && typeof parsed.message === 'string'
      && isCheckinCategory(parsed.category)
      && typeof parsed.protect_streak === 'boolean'
    ) {
      return {
        message: parsed.message,
        category: parsed.category as CheckinCategory,
        protect_streak: parsed.protect_streak,
        suggested_action: typeof parsed.suggested_action === 'string' ? parsed.suggested_action : null,
      };
    }
  } catch {
    return fallback;
  }
  return fallback;
}

function normalizeState(parsed: Partial<SavedFlowState>): SavedFlowState {
  const rituals = Array.isArray(parsed.rituals) && parsed.rituals.length ? parsed.rituals : seedRituals;
  const today = todayIso();
  const dateDistance = daysBetweenIso(parsed.stateDate, today);
  const normalizedRituals = rituals.map((ritual, index) => {
    const rawWeekly = Array.isArray(ritual.weekly) && ritual.weekly.length === 7
      ? ritual.weekly
      : [0, 0, 0, 0, 0, 0, ritual.doneToday ? 1 : 0];
    const rawHeat = Array.isArray(ritual.heat) && ritual.heat.length === 30
      ? ritual.heat
      : Array.from({ length: 30 }, (_, heatIndex) => (heatIndex === 29 && ritual.doneToday ? 1 : 0));
    const missedSinceLastOpen = dateDistance > 1 || (dateDistance === 1 && !ritual.doneToday);
    const nextStreak = dateDistance > 0 && missedSinceLastOpen ? 0 : ritual.streakDays ?? 0;
    return {
      ...ritual,
      paletteKey: ritual.paletteKey && habitPalette[ritual.paletteKey] ? ritual.paletteKey : paletteRotation[index % paletteRotation.length],
      why: typeof ritual.why === 'string' && ritual.why.trim() ? ritual.why.trim() : undefined,
      goalAmount: typeof ritual.goalAmount === 'number' && Number.isFinite(ritual.goalAmount) ? ritual.goalAmount : undefined,
      goalUnit: isGoalUnit(ritual.goalUnit) ? ritual.goalUnit : undefined,
      reminderTime: typeof ritual.reminderTime === 'string' && ritual.reminderTime ? ritual.reminderTime : undefined,
      doneToday: dateDistance > 0 ? false : ritual.doneToday,
      completedAt: dateDistance > 0 ? null : typeof ritual.completedAt === 'number' && Number.isFinite(ritual.completedAt) ? ritual.completedAt : null,
      weekly: shiftBinarySeries(rawWeekly, dateDistance),
      heat: shiftBinarySeries(rawHeat, dateDistance),
      streakDays: nextStreak,
      bestStreakDays: Math.max(ritual.bestStreakDays ?? 0, nextStreak),
      createdAt: ritual.createdAt ?? Date.now() + index,
    };
  });
  const combinedHeat = combinedHeatFromRituals(normalizedRituals);
  const missedAnyFullDay = dateDistance > 1 || (dateDistance === 1 && !rituals.some((ritual) => ritual.doneToday));
  const parsedStreak = typeof parsed.overallStreak === 'number' && Number.isFinite(parsed.overallStreak) ? parsed.overallStreak : currentStreakFromHeat(combinedHeat.map((value) => (value > 0 ? 1 : 0)));
  const lastSevenBeforeTodayAreClean = normalizedRituals.length > 0
    && normalizedRituals.every((ritual) => ritual.heat.slice(-8, -1).length === 7 && ritual.heat.slice(-8, -1).every(Boolean));
  const parsedHearts = typeof parsed.graceHearts === 'number' && Number.isFinite(parsed.graceHearts) ? parsed.graceHearts : 5;
  const nextGraceHearts = dateDistance > 0 && lastSevenBeforeTodayAreClean ? clamp(parsedHearts + 1, 0, 5) : clamp(parsedHearts, 0, 5);
  return {
    rituals: normalizedRituals,
    checkins: normalizeCheckins(parsed.checkins),
    totalActiveRituals: normalizedRituals.length,
    baseDoneFromOtherHabits: dateDistance > 0 ? 0 : parsed.baseDoneFromOtherHabits ?? 0,
    overallStreak: dateDistance > 0 && missedAnyFullDay ? 0 : parsedStreak,
    rhythmPoints: typeof parsed.rhythmPoints === 'number' && Number.isFinite(parsed.rhythmPoints) ? Math.max(0, parsed.rhythmPoints) : 0,
    graceHearts: nextGraceHearts,
    onboardingDream: isDreamId(parsed.onboardingDream) ? parsed.onboardingDream : null,
    settings: { ...seedSettings, ...(parsed.settings ?? {}), floTone: isFloTone(parsed.settings?.floTone) ? parsed.settings.floTone : seedSettings.floTone },
    insight: parsed.insight ?? '',
    stateDate: today,
  };
}

function normalizeAuth(parsed: Partial<StoredAuth> | null): StoredAuth {
  const parsedAccount = parsed?.account;
  const account = parsedAccount?.username && parsedAccount.password
    ? {
        id: parsedAccount.id,
        username: parsedAccount.username,
        password: parsedAccount.password,
        email: parsedAccount.email || DEFAULT_AUTH_ACCOUNT.email,
        name: parsedAccount.name,
        age: parsedAccount.age,
        city: parsedAccount.city,
        mobile: parsedAccount.mobile,
        countryCode: parsedAccount.countryCode || DEFAULT_COUNTRY_CODE,
        gender: parsedAccount.gender,
        habitFocus: parsedAccount.habitFocus,
        profileComplete: parsedAccount.profileComplete ?? true,
        profileSetupSkipped: parsedAccount.profileSetupSkipped ?? false,
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
  const name = profile?.name || user.user_metadata?.full_name || '';
  const username = name || profile?.username || user.user_metadata?.username || email.split('@')[0] || 'Rituals user';
  return {
    id: user.id,
    username,
    email,
    password: '',
    name: name || username,
    age: typeof profile?.age === 'number' ? profile.age : undefined,
    city: profile?.city ?? undefined,
    mobile: profile?.mobile ?? undefined,
    countryCode: profile?.country_code || DEFAULT_COUNTRY_CODE,
    gender: profile?.gender ?? undefined,
    habitFocus: profile?.habit_focus ?? undefined,
    profileComplete: profile?.profile_complete ?? false,
    profileSetupSkipped: profile?.profile_setup_skipped ?? false,
  };
}

function isAuthNetworkError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return /fetch failed|network request failed|sslhandshake|certificate|trust anchor|failed to fetch/i.test(message);
}

function cleanAuthError(error: unknown, fallback: string) {
  if (isAuthNetworkError(error)) {
    return 'Secure connection to Supabase failed on this device. Your account can continue locally now and sync when the device network/certificate trust is fixed.';
  }
  return error instanceof Error && error.message ? error.message : fallback;
}

function localAuthAccount(username: string, password: string, email: string, name?: string): AuthAccount {
  return {
    id: `local-${Date.now()}`,
    username,
    password,
    email,
    name: name || username,
    profileComplete: false,
    profileSetupSkipped: false,
  };
}

async function getProfileForUser(user: SupabaseUser) {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_SELECT)
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
        profile_complete: false,
        profile_setup_skipped: false,
        avatar_emoji: '🙂',
      },
      { onConflict: 'id' },
    )
    .select(PROFILE_SELECT)
    .single();

  if (error) {
    throw error;
  }

  return data as SupabaseProfile;
}

async function saveProfileSetupForAccount(
  account: AuthAccount,
  profile: Partial<ProfileSetupData> & { profileComplete: boolean; profileSetupSkipped: boolean },
) {
  const nextAccount: AuthAccount = {
    ...account,
    username: profile.name?.trim() || account.name || account.username,
    name: profile.name?.trim() || account.name || account.username,
    age: profile.age ?? account.age,
    city: profile.city?.trim() || account.city,
    mobile: profile.mobile || account.mobile,
    countryCode: profile.countryCode || account.countryCode || DEFAULT_COUNTRY_CODE,
    gender: profile.gender?.trim() || account.gender,
    habitFocus: profile.habitFocus?.trim() || account.habitFocus,
    profileComplete: profile.profileComplete,
    profileSetupSkipped: profile.profileSetupSkipped,
  };

  if (!supabase || !account.id) {
    return nextAccount;
  }

  const { error } = await supabase
    .from('profiles')
    .upsert(
      {
        id: account.id,
        username: account.username,
        name: nextAccount.name,
        email: account.email,
        age: nextAccount.age ?? null,
        city: nextAccount.city ?? null,
        mobile: nextAccount.mobile ?? null,
        country_code: nextAccount.countryCode ?? DEFAULT_COUNTRY_CODE,
        gender: nextAccount.gender ?? null,
        habit_focus: nextAccount.habitFocus ?? null,
        profile_complete: nextAccount.profileComplete,
        profile_setup_skipped: nextAccount.profileSetupSkipped,
      },
      { onConflict: 'id' },
    );

  if (error) {
    throw error;
  }

  return nextAccount;
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

function daysBetweenIso(from?: string, to = todayIso()) {
  if (!from) {
    return 0;
  }
  const start = new Date(`${from}T00:00:00.000Z`).getTime();
  const end = new Date(`${to}T00:00:00.000Z`).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return 0;
  }
  return Math.max(0, Math.floor((end - start) / 86400000));
}

function shiftBinarySeries(values: number[], distance: number) {
  if (distance <= 0) {
    return values;
  }
  if (distance >= values.length) {
    return Array.from({ length: values.length }, () => 0);
  }
  return [...values.slice(distance), ...Array.from({ length: distance }, () => 0)];
}

async function ensureReminderPermissions() {
  const notifications = notificationsModule;
  if (!notifications) {
    return false;
  }
  if (Platform.OS === 'android') {
    await notifications.setNotificationChannelAsync('ritual-reminders', {
      name: 'Ritual reminders',
      importance: notifications.AndroidImportance.DEFAULT,
    });
  }
  const existing = await notifications.getPermissionsAsync();
  if (existing.status === 'granted') {
    return true;
  }
  const requested = await notifications.requestPermissionsAsync();
  return requested.status === 'granted';
}

async function readReminderScheduleRecord(): Promise<ReminderScheduleRecord> {
  const stored = await AsyncStorage.getItem(REMINDER_NOTIFICATION_STORAGE_KEY);
  if (!stored) {
    return {};
  }
  try {
    return JSON.parse(stored) as ReminderScheduleRecord;
  } catch {
    return {};
  }
}

async function cancelReminderNotification(record?: { notificationId: string }) {
  if (!record?.notificationId) {
    return;
  }
  await notificationsModule?.cancelScheduledNotificationAsync(record.notificationId).catch(() => undefined);
}

async function syncRitualReminderNotifications(rituals: Ritual[], enabled: boolean) {
  const notifications = notificationsModule;
  if (!notifications) {
    return;
  }

  const stored = await readReminderScheduleRecord();
  const next: ReminderScheduleRecord = {};
  const byId = new Map(rituals.map((ritual) => [ritual.id, ritual]));
  const schedulableRituals = rituals.filter((ritual) => ritual.reminderTime && !ritual.doneToday);

  if (!enabled) {
    await Promise.all(Object.values(stored).map(cancelReminderNotification));
    await AsyncStorage.removeItem(REMINDER_NOTIFICATION_STORAGE_KEY);
    return;
  }

  for (const [ritualId, record] of Object.entries(stored)) {
    const ritual = byId.get(ritualId);
    const body = ritual ? ritualReminderBody(ritual) : '';
    if (!ritual || !ritual.reminderTime || ritual.doneToday || record.reminderTime !== ritual.reminderTime || record.body !== body) {
      await cancelReminderNotification(record);
    } else {
      next[ritualId] = record;
    }
  }

  if (!schedulableRituals.some((ritual) => !next[ritual.id])) {
    await AsyncStorage.setItem(REMINDER_NOTIFICATION_STORAGE_KEY, JSON.stringify(next));
    return;
  }

  const hasPermission = await ensureReminderPermissions();
  if (!hasPermission) {
    return;
  }

  for (const ritual of schedulableRituals) {
    if (!ritual.reminderTime || next[ritual.id]) {
      continue;
    }
    const body = ritualReminderBody(ritual);
    const notificationId = await notifications.scheduleNotificationAsync({
      content: {
        title: `${ritual.name} reminder`,
        body,
        data: { ritualId: ritual.id, screen: 'today' },
      },
      trigger: {
        type: notifications.SchedulableTriggerInputTypes.DATE,
        date: nextReminderDate(ritual.reminderTime),
        channelId: 'ritual-reminders',
      },
    });
    next[ritual.id] = { notificationId, reminderTime: ritual.reminderTime, body };
  }

  await AsyncStorage.setItem(REMINDER_NOTIFICATION_STORAGE_KEY, JSON.stringify(next));
}

function isoDaysBack(count: number) {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (count - 1 - index));
    return date.toISOString().slice(0, 10);
  });
}

function paletteToDbColor(paletteKey: PaletteKey) {
  if (paletteKey === 'reading' || paletteKey === 'journal') return 'amber';
  if (paletteKey === 'focus' || paletteKey === 'meditate' || paletteKey === 'sleep' || paletteKey === 'music') return 'violet';
  if (paletteKey === 'running' || paletteKey === 'creative' || paletteKey === 'skincare') return 'coral';
  if (paletteKey === 'gym' || paletteKey === 'work' || paletteKey === 'noPhone') return 'dark';
  return 'sky';
}

function dbColorToPalette(color: string | null | undefined, fallbackIndex: number): PaletteKey {
  if (color === 'amber') return 'reading';
  if (color === 'coral') return 'running';
  if (color === 'dark') return 'gym';
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

function combinedHeatFromRituals(rituals: Ritual[]) {
  return Array.from({ length: 30 }, (_, index) => {
    if (!rituals.length) {
      return 0;
    }
    return rituals.reduce((sum, ritual) => sum + (ritual.heat[index] ? 1 : 0), 0);
  });
}

function isCompletionInUsualWindow(ritual: Ritual) {
  if (typeof ritual.completedAt !== 'number' || !ritual.reminderTime) {
    return false;
  }
  const [hourRaw, minuteRaw] = ritual.reminderTime.split(':');
  const reminderHour = Number(hourRaw) + (Number(minuteRaw) || 0) / 60;
  if (!Number.isFinite(reminderHour)) {
    return false;
  }
  return Math.abs(ritual.completedAt - reminderHour) <= 1;
}

function derivedHeaderMetrics(overallStreak: number, rhythmPoints: number, graceHearts: number): HeaderMetric[] {

  return [
    {
      id: 'streak',
      icon: '🔥',
      value: overallStreak,
      label: "Streak: Consecutive days you've completed at least one ritual. Resets if a full day passes with nothing logged unless a Grace Heart covers it.",
      color: '#FF9F43',
    },
    {
      id: 'points',
      icon: '💎',
      value: rhythmPoints,
      label: 'Rhythm Points: +10 for every completion, +5 bonus when it lands inside your usual time window.',
      color: '#4FA8FF',
    },
    {
      id: 'hearts',
      icon: '💗',
      value: graceHearts,
      label: 'Grace Hearts: Miss a day? Spend one to protect your streak. Regain 1 per fully clean week, up to 5.',
      color: '#FF6A96',
    },
  ];
}

function ritualsFromSupabaseRows(habits: SupabaseHabit[], logs: SupabaseHabitLog[]) {
  const days30 = isoDaysBack(30);
  const days7 = days30.slice(-7);
  const today = todayIso();
  const logsByHabit = new Map<string, SupabaseHabitLog[]>();

  logs.forEach((log) => {
    const rows = logsByHabit.get(log.habit_id) ?? [];
    rows.push(log);
    logsByHabit.set(log.habit_id, rows);
  });

  return habits.map((habit, index): Ritual => {
    const habitLogs = logsByHabit.get(habit.id) ?? [];
    const dates = new Set(habitLogs.map((log) => log.log_date));
    const todayLog = habitLogs.find((log) => log.log_date === today);
    const heat = days30.map((day) => (dates.has(day) ? 1 : 0));
    const weekly = days7.map((day) => (dates.has(day) ? 1 : 0));
    const paletteKey = isPaletteKey(habit.palette_key) ? habit.palette_key : dbColorToPalette(habit.color, index);
    return {
      id: habit.id,
      name: habit.name,
      icon: habit.icon,
      paletteKey,
      why: typeof habit.why === 'string' && habit.why.trim() ? habit.why.trim() : undefined,
      goalAmount: typeof habit.goal_amount === 'number' && Number.isFinite(habit.goal_amount) ? habit.goal_amount : undefined,
      goalUnit: isGoalUnit(habit.goal_unit) ? habit.goal_unit : undefined,
      reminderTime: typeof habit.reminder_time === 'string' ? habit.reminder_time.slice(0, 5) : undefined,
      completedAt: dates.has(today) ? hourFloatFromIso(todayLog?.completed_at) : null,
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
    .select('id,name,icon,color,palette_key,why,goal_amount,goal_unit,reminder_time,created_at')
    .eq('user_id', userId)
    .eq('is_archived', false)
    .order('created_at', { ascending: true });

  if (habitsError) {
    throw habitsError;
  }

  const { data: logs, error: logsError } = await supabase
    .from('habit_logs')
    .select('habit_id,log_date,completed_at')
    .eq('user_id', userId)
    .gte('log_date', since);

  if (logsError) {
    throw logsError;
  }

  const profile = await supabase
    .from('profiles')
    .select('dark_theme,haptics_enabled,push_enabled,flo_tone')
    .eq('id', userId)
    .maybeSingle();
  const profileData = profile.data as Pick<SupabaseProfile, 'dark_theme' | 'haptics_enabled' | 'push_enabled' | 'flo_tone'> | null;
  let checkins: RitualCheckin[] = [];
  try {
    const { data } = await supabase
      .from('ritual_checkins')
      .select('id,ritual_id,habit_id,checkin_date,date,scheduled_window,user_reason_raw,category,flo_message,streak_protected,suggested_action,created_at')
      .eq('user_id', userId)
      .gte('checkin_date', isoDaysBack(30)[0]);
    checkins = ((data ?? []) as SupabaseRitualCheckin[]).map((row, index) => ({
      id: row.id || `remote-checkin-${index}`,
      ritualId: row.ritual_id || row.habit_id || '',
      date: row.checkin_date || row.date || todayIso(),
      scheduledWindow: row.scheduled_window || 'Today',
      userReasonRaw: row.user_reason_raw || 'Unresolved',
      category: isCheckinCategory(row.category) ? row.category : 'drift',
      floMessage: row.flo_message || 'Thanks for checking in.',
      streakProtected: Boolean(row.streak_protected),
      suggestedAction: row.suggested_action ?? null,
      resolvedAt: row.created_at ? Date.parse(row.created_at) : undefined,
    })).filter((checkin) => Boolean(checkin.ritualId));
  } catch {
    checkins = [];
  }
  const rituals = ritualsFromSupabaseRows((habits ?? []) as SupabaseHabit[], (logs ?? []) as SupabaseHabitLog[]);

  return {
    rituals,
    checkins,
    totalActiveRituals: rituals.length,
    baseDoneFromOtherHabits: 0,
    settings: {
      ...seedSettings,
      darkTheme: profileData?.dark_theme ?? seedSettings.darkTheme,
      haptics: profileData?.haptics_enabled ?? seedSettings.haptics,
      pushNotifications: profileData?.push_enabled ?? seedSettings.pushNotifications,
      floTone: isFloTone(profileData?.flo_tone) ? profileData.flo_tone : seedSettings.floTone,
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
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    Fraunces_400Regular,
    Fraunces_500Medium,
    Fraunces_600SemiBold,
  });
  const reduceMotion = useReducedMotion();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    if (!fontsLoaded) {
      return undefined;
    }
    SplashScreen.hideAsync().catch(() => undefined);
    const timer = setTimeout(() => setShowSplash(false), reduceMotion ? 900 : 2800);
    return () => clearTimeout(timer);
  }, [fontsLoaded, reduceMotion]);

  if (!fontsLoaded) {
    return <View style={styles.loadingRoot} />;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <NavigationBar hidden={false} style="dark" />
        <AuthenticatedApp />
        {showSplash ? <LaunchSplash reduceMotion={reduceMotion} onSkip={() => setShowSplash(false)} /> : null}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default AppRoot;

function LaunchSplash({ reduceMotion, onSkip }: { reduceMotion: boolean; onSkip: () => void }) {
  const opacity = useRef(new Animated.Value(1)).current;
  const copy = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(copy, {
      toValue: 1,
      delay: reduceMotion ? 0 : 1650,
      duration: reduceMotion ? 1 : 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [copy, reduceMotion]);

  const dismiss = () => {
    Animated.timing(opacity, {
      toValue: 0,
      duration: reduceMotion ? 1 : 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(onSkip);
  };

  return (
    <Animated.View style={[styles.launchSplash, { opacity }]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Skip launch animation" onPress={dismiss} style={styles.launchSkip}>
        <Text style={styles.launchSkipText}>Skip</Text>
      </Pressable>
      <RitualsMark size={180} color="#F4F8FF" mode="launch" reduceMotion={reduceMotion} style={styles.launchMarkWrap} />
      <Animated.View
        style={[
          styles.launchCopy,
          {
            opacity: copy,
            transform: [{ translateY: copy.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
          },
        ]}
      >
        <Text style={styles.launchTitle}>Rituals</Text>
        <Text style={styles.launchTagline}>Small rituals · Steady flow</Text>
      </Animated.View>
      <View style={styles.launchLoadingRow}>
        <RitualsMark size={18} color="#7C8AA6" mode="spinner" reduceMotion={reduceMotion} />
        <Text style={styles.launchLoadingText}>Loading your rituals...</Text>
      </View>
    </Animated.View>
  );
}

function RitualsMark({
  size,
  color,
  mode,
  reduceMotion,
  style,
}: {
  size: number;
  color: string;
  mode: 'launch' | 'spinner' | 'static';
  reduceMotion: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const circleDash = useRef(new Animated.Value(mode === 'launch' && !reduceMotion ? 430 : 0)).current;
  const coilLongDash = useRef(new Animated.Value(mode === 'launch' && !reduceMotion ? 520 : 0)).current;
  const coilStubDash = useRef(new Animated.Value(mode === 'launch' && !reduceMotion ? 90 : 0)).current;
  const waveDash = useRef(new Animated.Value(mode === 'launch' && !reduceMotion ? 190 : 0)).current;
  const dotOpacity = useRef(new Animated.Value(mode === 'launch' && !reduceMotion ? 0 : 1)).current;
  const breathe = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    circleDash.stopAnimation();
    coilLongDash.stopAnimation();
    coilStubDash.stopAnimation();
    waveDash.stopAnimation();
    dotOpacity.stopAnimation();
    breathe.stopAnimation();

    if (reduceMotion || mode === 'static') {
      circleDash.setValue(0);
      coilLongDash.setValue(0);
      coilStubDash.setValue(0);
      waveDash.setValue(0);
      dotOpacity.setValue(1);
      breathe.setValue(1);
      return undefined;
    }

    const flowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(waveDash, {
          toValue: -6,
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(waveDash, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
      ]),
    );

    if (mode === 'spinner') {
      circleDash.setValue(0);
      coilLongDash.setValue(0);
      coilStubDash.setValue(0);
      waveDash.setValue(0);
      dotOpacity.setValue(1);
      flowLoop.start();
      return () => flowLoop.stop();
    }

    circleDash.setValue(430);
    coilLongDash.setValue(520);
    coilStubDash.setValue(90);
    waveDash.setValue(190);
    dotOpacity.setValue(0);
    breathe.setValue(1);

    const draw = Animated.parallel([
      Animated.timing(circleDash, {
        toValue: 0,
        duration: 900,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: false,
      }),
      Animated.timing(coilLongDash, {
        toValue: 0,
        delay: 250,
        duration: 800,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: false,
      }),
      Animated.timing(coilStubDash, {
        toValue: 0,
        delay: 950,
        duration: 400,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: false,
      }),
      Animated.timing(waveDash, {
        toValue: 0,
        delay: 700,
        duration: 900,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: false,
      }),
      Animated.timing(dotOpacity, {
        toValue: 1,
        delay: 1550,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    const breatheLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, {
          toValue: 1.035,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(breathe, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    draw.start(() => {
      flowLoop.start();
      breatheLoop.start();
    });

    return () => {
      flowLoop.stop();
      breatheLoop.stop();
    };
  }, [breathe, circleDash, coilLongDash, coilStubDash, dotOpacity, mode, reduceMotion, waveDash]);

  return (
    <Animated.View style={[{ width: size, height: Math.round(size * 1.07), transform: [{ scale: breathe }] }, style]}>
      <Svg width="100%" height="100%" viewBox="0 0 200 214" fill="none">
        <AnimatedPath
          d="M 83,27 A 82,82 0 1 1 72,184"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={520}
          strokeDashoffset={coilLongDash as unknown as number}
        />
        <AnimatedPath
          d="M 65,181 A 82,82 0 0 1 35,158"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={90}
          strokeDashoffset={coilStubDash as unknown as number}
        />
        <AnimatedCircle
          cx="100"
          cy="107"
          r="68"
          stroke={color}
          strokeWidth="7"
          fill="none"
          strokeDasharray={430}
          strokeDashoffset={circleDash as unknown as number}
        />
        <AnimatedPath
          d="M 40,107 C 60,80 80,80 100,107 C 120,134 140,134 160,107"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={190}
          strokeDashoffset={waveDash as unknown as number}
        />
        <AnimatedCircle cx="40" cy="107" r="5" fill={color} opacity={dotOpacity as unknown as number} />
        <AnimatedCircle cx="160" cy="107" r="5" fill={color} opacity={dotOpacity as unknown as number} />
      </Svg>
    </Animated.View>
  );
}

function AuthenticatedApp() {
  const [ready, setReady] = useState(false);
  const [account, setAccount] = useState(DEFAULT_AUTH_ACCOUNT);
  const [signedIn, setSignedIn] = useState(false);
  const [profileSetupSource, setProfileSetupSource] = useState<'create' | 'profile' | null>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    let mounted = true;

    const hydrate = async () => {
      if (supabase) {
        try {
          const { data } = await supabase.auth.getSession();
          if (data.session?.user) {
            const profile = await getProfileForUser(data.session.user);
            const nextAccount = authAccountFromUser(data.session.user, profile);
            if (mounted) {
              setAccount(nextAccount);
              setSignedIn(true);
              setProfileSetupSource(null);
              setReady(true);
            }
            return;
          }
        } catch {
          // Fall through to local auth so emulator/device TLS issues do not block the app.
        }
        const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        const parsed = stored ? normalizeAuth(JSON.parse(stored) as Partial<StoredAuth>) : normalizeAuth(null);
        if (parsed.signedIn) {
          if (mounted) {
            setAccount(parsed.account);
            setSignedIn(true);
            if (parsed.account.profileComplete === false && !parsed.account.profileSetupSkipped) {
              setProfileSetupSource(null);
            }
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
        if (parsed.signedIn && parsed.account.profileComplete === false && !parsed.account.profileSetupSkipped) {
          setProfileSetupSource(null);
        }
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
        setProfileSetupSource(null);
        return;
      }
      const profile = await getProfileForUser(session.user);
      const nextAccount = authAccountFromUser(session.user, profile);
      if (mounted) {
        setAccount(nextAccount);
        setSignedIn(true);
        setProfileSetupSource(null);
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

  const finishProfileSetup = useCallback(async (profile: ProfileSetupData) => {
    const nextAccount = await saveProfileSetupForAccount(account, {
      ...profile,
      profileComplete: true,
      profileSetupSkipped: false,
    });
    setAccount(nextAccount);
    setSignedIn(true);
    setProfileSetupSource(null);
    if (!supabase) {
      saveLocalAuth(nextAccount, true);
    }
  }, [account, saveLocalAuth]);

  const skipProfileSetup = useCallback(async () => {
    const nextAccount = await saveProfileSetupForAccount(account, {
      profileComplete: false,
      profileSetupSkipped: true,
    });
    setAccount(nextAccount);
    setSignedIn(true);
    setProfileSetupSource(null);
    if (!supabase) {
      saveLocalAuth(nextAccount, true);
    }
  }, [account, saveLocalAuth]);

  const backFromProfileSetup = useCallback(() => {
    if (profileSetupSource === 'create') {
      setProfileSetupSource(null);
      if (supabase) {
        supabase.auth.signOut().catch(() => undefined);
      }
      saveLocalAuth(account, false);
      return;
    }
    setProfileSetupSource(null);
  }, [account, profileSetupSource, saveLocalAuth]);

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
          setProfileSetupSource(null);
          saveLocalAuth(nextAccount, true);
        }}
        onCreate={(nextAccount) => {
          const createdAccount = {
            ...nextAccount,
            profileComplete: nextAccount.profileComplete ?? false,
            profileSetupSkipped: false,
          };
          setAccount(createdAccount);
          setSignedIn(true);
          setProfileSetupSource(null);
          saveLocalAuth(createdAccount, true);
        }}
        onResetPassword={(nextAccount) => {
          setAccount(nextAccount);
          saveLocalAuth(nextAccount, false);
        }}
      />
    );
  }

  if (profileSetupSource) {
    return (
      <ProfileSetupScreen
        account={account}
        reduceMotion={reduceMotion}
        onBack={backFromProfileSetup}
        onSkip={skipProfileSetup}
        onComplete={finishProfileSetup}
      />
    );
  }

  return (
    <FlowApp
      userId={account.id}
      username={account.username}
      email={account.email}
      habitFocus={account.habitFocus}
      profileIncomplete={account.profileComplete === false}
      onOpenProfileSetup={() => setProfileSetupSource('profile')}
      onLogout={() => {
        if (supabase) {
          supabase.auth.signOut().catch(() => undefined);
          saveLocalAuth(account, false);
          setSignedIn(false);
          setProfileSetupSource(null);
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
  const { width, height } = useWindowDimensions();
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
  const isTablet = width >= TABLET_MIN_WIDTH;
  const useSplitAuthLayout = width >= WIDE_TABLET_MIN_WIDTH && width > height;
  const authHorizontalPadding = isTablet ? 28 : 20;
  const authTopPadding = Math.max(insets.top + (useSplitAuthLayout ? 16 : 0), useSplitAuthLayout ? 24 : 10);
  const authBottomPadding = Math.max(insets.bottom + 34, useSplitAuthLayout ? 28 : 34);
  const contentMaxWidth = useSplitAuthLayout
    ? responsiveMaxWidth(width, AUTH_SPLIT_MAX_WIDTH, authHorizontalPadding)
    : isTablet
      ? responsiveMaxWidth(width, AUTH_SINGLE_MAX_WIDTH, authHorizontalPadding)
      : undefined;
  const authPanelMinHeight = useSplitAuthLayout
    ? Math.max(500, Math.min(640, height - authTopPadding - authBottomPadding))
    : undefined;
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
    const localMatches = matchesAccount(account);
    const defaultMatches = matchesAccount(DEFAULT_AUTH_ACCOUNT);
    if (defaultMatches) {
      onLogin(DEFAULT_AUTH_ACCOUNT);
      return;
    }
    if (supabase) {
      try {
        setSubmitting(true);
        const email = await resolveEmailForIdentifier(identifier);
        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError || !data.user) {
          if (localMatches) {
            onLogin(account);
            return;
          }
          setError(signInError?.message ?? 'Email/username or password is incorrect.');
          return;
        }
        const profile = await getProfileForUser(data.user);
        onLogin({ ...authAccountFromUser(data.user, profile), password });
      } catch (authError) {
        if (localMatches) {
          onLogin(account);
          return;
        }
        setError(cleanAuthError(authError, 'Unable to sign in.'));
      } finally {
        setSubmitting(false);
      }
      return;
    }
    if (localMatches) {
      onLogin(account);
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
          onCreate({
            ...authAccountFromUser(data.user, null),
            username,
            password,
            email: trimmedEmail,
            name: trimmedName,
            profileComplete: false,
            profileSetupSkipped: false,
          });
          return;
        }
        onCreate({
          ...authAccountFromUser(data.user, profile),
          password,
          profileComplete: false,
          profileSetupSkipped: false,
        });
      } catch (authError) {
        if (isAuthNetworkError(authError)) {
          setMessage('Supabase is unreachable from this device, so Rituals saved this account locally for now.');
          onCreate(localAuthAccount(username, password, trimmedEmail, trimmedName));
          return;
        }
        setError(cleanAuthError(authError, 'Unable to create account.'));
      } finally {
        setSubmitting(false);
      }
      return;
    }
    onCreate(localAuthAccount(username, password, trimmedEmail, trimmedName));
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
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.authKeyboard}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.authScroll,
              useSplitAuthLayout && styles.authScrollSplit,
              {
                paddingTop: authTopPadding,
                paddingBottom: authBottomPadding,
                paddingHorizontal: authHorizontalPadding,
                maxWidth: contentMaxWidth,
              },
            ]}
          >
            {isCreate || isReset ? (
              <PressScale reduceMotion={reduceMotion} onPress={() => switchMode('signIn')} style={styles.authBackButton}>
                <ChevronLeft size={18} color={colors.ink} strokeWidth={2.6} />
              </PressScale>
            ) : null}

            <View style={[styles.authPanel, useSplitAuthLayout && styles.authPanelSplit, authPanelMinHeight ? { minHeight: authPanelMinHeight } : null]}>
              <View style={useSplitAuthLayout && styles.authHeroPane}>
                <AuthHero mode={mode} reduceMotion={reduceMotion} split={useSplitAuthLayout} />
              </View>

              <Animated.View style={[styles.authCardWrap, isCreate && styles.authCardWrapCreate, useSplitAuthLayout && styles.authCardWrapSplit, cardAnim]}>
                <GradientCard
                  style={[
                    styles.authCard,
                    isTablet && styles.authCardTablet,
                    isCreate && styles.authCardCreate,
                    useSplitAuthLayout && isCreate && styles.authCardCreateSplit,
                  ]}
                >
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
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function OnboardingDreamFlow({
  reduceMotion,
  onComplete,
}: {
  reduceMotion: boolean;
  onComplete: (
    dream: DreamId,
    starters: Array<{ name: string; icon: string; paletteKey: PaletteKey; goalAmount?: number; goalUnit?: GoalUnit; reminderTime: string }>,
  ) => void;
}) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= TABLET_MIN_WIDTH;
  const [step, setStep] = useState<OnboardingStep>('dream');
  const [selectedDream, setSelectedDream] = useState<DreamId | null>(null);
  const [enabled, setEnabled] = useState<Record<string, boolean>>({});
  const selectedOption = dreamOptions.find((option) => option.id === selectedDream) ?? null;
  const starters = selectedDream ? starterRitualsByDream[selectedDream] : [];
  const selectedStarters = starters.filter((starter) => enabled[starter.name] !== false);
  const contentMaxWidth = isTablet
    ? responsiveMaxWidth(width, PROFILE_SETUP_MAX_WIDTH, 28)
    : undefined;

  useEffect(() => {
    if (!selectedDream) {
      return;
    }
    setEnabled(Object.fromEntries(starterRitualsByDream[selectedDream].map((starter) => [starter.name, true])));
  }, [selectedDream]);

  const continueToStarters = () => {
    if (selectedDream) {
      setStep('starters');
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <LinearGradient colors={['#EEF1F4', colors.page]} style={styles.stage}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.onboardingScroll,
            {
              paddingTop: Math.max(insets.top + 14, 28),
              paddingBottom: insets.bottom + 36,
              maxWidth: contentMaxWidth,
            },
          ]}
        >
          <View style={styles.onboardingProgress}>
            <LinearGradient colors={[colors.blue1, '#2E8FE8']} style={styles.onboardingProgressDot} />
            <View style={[styles.onboardingProgressDot, step === 'starters' ? styles.onboardingProgressDotActive : styles.onboardingProgressDotEmpty]} />
          </View>

          <View style={styles.onboardingHeader}>
            <LogoMark size={58} reduceMotion={reduceMotion} />
            <Text style={styles.onboardingTitle}>
              {step === 'dream' ? "What's your ritual dream?" : `Starter rituals for "${selectedOption?.title ?? 'your dream'}"`}
            </Text>
            <Text style={styles.onboardingSubtitle}>
              {step === 'dream' ? "We'll shape your first rituals around this." : 'These become your real starting rituals. Keep what fits.'}
            </Text>
          </View>

          {step === 'dream' ? (
            <>
              <View style={styles.dreamGrid}>
                {dreamOptions.map((option) => {
                  const selected = selectedDream === option.id;
                  const palette = habitPalette[option.paletteKey];
                  return (
                    <PressScale
                      key={option.id}
                      reduceMotion={reduceMotion}
                      onPress={() => setSelectedDream(option.id)}
                      style={[
                        styles.dreamCard,
                        selected && {
                          borderColor: colors.blue1,
                          shadowColor: colors.blue1,
                          shadowOpacity: 0.22,
                          elevation: 4,
                        },
                      ]}
                    >
                      <View style={[styles.dreamIcon, { backgroundColor: palette.bg[0] }]}>
                        <Text style={styles.dreamIconText}>{option.icon}</Text>
                      </View>
                      <View style={styles.dreamCopy}>
                        <Text style={styles.dreamTitle}>{option.title}</Text>
                        <Text style={styles.dreamDescription}>{option.description}</Text>
                      </View>
                      {selected ? (
                        <View style={styles.dreamSelected}>
                          <Check size={14} color="#FFFFFF" strokeWidth={3} />
                        </View>
                      ) : null}
                    </PressScale>
                  );
                })}
              </View>

              <View style={styles.onboardingNote}>
                <Sparkles size={16} color={colors.blue1} strokeWidth={2.4} />
                <Text style={styles.onboardingNoteText}>Your choice drives starter suggestions now and helps the coach prioritize future insights.</Text>
              </View>

              <PressScale
                reduceMotion={reduceMotion}
                disabled={!selectedDream}
                onPress={continueToStarters}
                style={[styles.authPrimaryButton, !selectedDream && styles.authPrimaryButtonDisabled]}
              >
                <Text style={styles.authPrimaryText}>Continue</Text>
                <ArrowRight size={16} color="#FFFFFF" strokeWidth={2.7} />
              </PressScale>
            </>
          ) : (
            <>
              <View style={styles.starterList}>
                {starters.map((starter) => {
                  const checked = enabled[starter.name] !== false;
                  const palette = habitPalette[starter.paletteKey];
                  return (
                    <Pressable
                      key={starter.name}
                      accessibilityRole="switch"
                      accessibilityState={{ checked }}
                      onPress={() => setEnabled((current) => ({ ...current, [starter.name]: !checked }))}
                      style={styles.starterRow}
                    >
                      <View style={[styles.starterIcon, { backgroundColor: palette.bg[0] }]}>
                        <Text style={styles.starterIconText}>{starter.icon}</Text>
                      </View>
                      <View style={styles.starterCopy}>
                        <Text style={styles.starterName}>{starter.name}</Text>
                        <Text style={styles.starterMeta}>
                          {[goalLabel(starter.goalAmount, starter.goalUnit), formatReminderTime(starter.reminderTime)].filter(Boolean).join(' · ')}
                        </Text>
                      </View>
                      <View style={[styles.amountSwitch, checked && styles.amountSwitchOn]}>
                        <View style={[styles.amountSwitchKnob, checked && styles.amountSwitchKnobOn]} />
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.modalActions}>
                <Pressable accessibilityRole="button" onPress={() => setStep('dream')} style={styles.btnSecondary}>
                  <Text style={styles.btnSecondaryText}>Back</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  disabled={!selectedDream || !selectedStarters.length}
                  onPress={() => selectedDream && onComplete(selectedDream, selectedStarters)}
                  style={[styles.btnPrimary, (!selectedDream || !selectedStarters.length) && styles.btnPrimaryDisabled]}
                >
                  <Text style={styles.btnPrimaryText}>Start my rituals</Text>
                </Pressable>
              </View>
            </>
          )}
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

function ProfileSetupScreen({
  account,
  reduceMotion,
  onBack,
  onSkip,
  onComplete,
}: {
  account: AuthAccount;
  reduceMotion: boolean;
  onBack: () => void;
  onSkip: () => Promise<void>;
  onComplete: (profile: ProfileSetupData) => Promise<void>;
}) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [name, setName] = useState(account.name || (account.profileComplete ? account.username : ''));
  const [age, setAge] = useState(account.age ? String(account.age) : '');
  const [city, setCity] = useState(account.city || '');
  const [mobile, setMobile] = useState((account.mobile || '').replace(/^\+91/, '').replace(/\D/g, '').slice(0, 10));
  const [gender, setGender] = useState(account.gender || '');
  const [habitFocus, setHabitFocus] = useState(account.habitFocus || '');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const isTablet = width >= TABLET_MIN_WIDTH;
  const profileHorizontalPadding = isTablet ? 28 : 20;
  const contentMaxWidth = isTablet
    ? responsiveMaxWidth(width, PROFILE_SETUP_MAX_WIDTH, profileHorizontalPadding)
    : undefined;
  const parsedAge = Number(age);
  const nameValid = name.trim().length >= 2;
  const ageValid = Number.isInteger(parsedAge) && parsedAge >= 13 && parsedAge <= 120;
  const cityValid = city.trim().length >= 2;
  const mobileValid = /^\d{10}$/.test(mobile);
  const genderValid = genderOptions.includes(gender);
  const habitFocusValid = habitFocusOptions.includes(habitFocus);
  const formValid = nameValid && ageValid && cityValid && mobileValid && genderValid && habitFocusValid;
  const mobileInvalid = mobile.length > 0 && !mobileValid;
  const ageInvalid = age.length > 0 && !ageValid;

  const submit = async () => {
    if (!formValid || submitting) {
      setError('Complete every required field before continuing.');
      return;
    }
    try {
      setSubmitting(true);
      setError('');
      await onComplete({
        name: name.trim(),
        age: parsedAge,
        city: city.trim(),
        countryCode: DEFAULT_COUNTRY_CODE,
        mobile: `${DEFAULT_COUNTRY_CODE}${mobile}`,
        gender,
        habitFocus,
      });
    } catch (profileError) {
      setError(profileError instanceof Error ? profileError.message : 'Unable to save profile.');
    } finally {
      setSubmitting(false);
    }
  };

  const skip = async () => {
    if (submitting) {
      return;
    }
    try {
      setSubmitting(true);
      setError('');
      await onSkip();
    } catch (profileError) {
      setError(profileError instanceof Error ? profileError.message : 'Unable to skip setup.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <LinearGradient colors={['#EEF1F4', colors.page]} style={styles.stage}>
        <ProfileBubbles reduceMotion={reduceMotion} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.authKeyboard}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.profileSetupScroll,
              {
                paddingTop: Math.max(insets.top + 10, 22),
                paddingBottom: insets.bottom + 34,
                paddingHorizontal: profileHorizontalPadding,
                maxWidth: contentMaxWidth,
              },
            ]}
          >
            <View style={styles.profileSetupTopBar}>
              <PressScale reduceMotion={reduceMotion} onPress={onBack} style={styles.profileSetupBackButton}>
                <ChevronLeft size={18} color={colors.ink} strokeWidth={2.6} />
              </PressScale>
              <Pressable accessibilityRole="button" onPress={skip} hitSlop={8}>
                <Text style={styles.profileSetupSkip}>Skip for now</Text>
              </Pressable>
            </View>

            <View style={styles.profileProgress}>
              <LinearGradient colors={[colors.blue1, '#2E8FE8']} style={styles.profileProgressSegment} />
              <LinearGradient colors={[colors.blue1, '#2E8FE8']} style={styles.profileProgressSegment} />
              <View style={[styles.profileProgressSegment, styles.profileProgressSegmentEmpty]} />
            </View>

            <View style={styles.profileSetupHeader}>
              <LogoMark size={60} reduceMotion={reduceMotion} />
              <Text style={styles.profileSetupTitle}>Tell us about you</Text>
              <Text style={styles.profileSetupSubtitle}>A few details so Rituals can personalize your streaks, reminders and coaching.</Text>
            </View>

            <GradientCard style={styles.profileSetupCard}>
              <FloatingProfileInput
                icon={User}
                label="Full name"
                value={name}
                onChangeText={(value) => {
                  setName(value);
                  setError('');
                }}
                reduceMotion={reduceMotion}
                returnKeyType="next"
                error={name.length > 0 && !nameValid}
                helperText={name.length > 0 && !nameValid ? 'Enter your full name' : undefined}
              />

              <View style={styles.profileTwoColumn}>
                <FloatingProfileInput
                  icon={CalendarDays}
                  label="Age"
                  value={age}
                  onChangeText={(value) => {
                    setAge(value.replace(/\D/g, '').slice(0, 3));
                    setError('');
                  }}
                  reduceMotion={reduceMotion}
                  keyboardType="number-pad"
                  returnKeyType="next"
                  error={ageInvalid}
                  helperText={ageInvalid ? 'Age 13-120' : undefined}
                  style={styles.profileHalfField}
                />
                <FloatingProfileInput
                  icon={MapPin}
                  label="City"
                  value={city}
                  onChangeText={(value) => {
                    setCity(value);
                    setError('');
                  }}
                  reduceMotion={reduceMotion}
                  returnKeyType="next"
                  error={city.length > 0 && !cityValid}
                  helperText={city.length > 0 && !cityValid ? 'Enter your city' : undefined}
                  style={styles.profileHalfField}
                />
              </View>

              <FloatingProfileInput
                icon={Phone}
                label="Mobile number"
                value={mobile}
                onChangeText={(value) => {
                  setMobile(value.replace(/\D/g, '').slice(0, 10));
                  setError('');
                }}
                reduceMotion={reduceMotion}
                keyboardType="phone-pad"
                returnKeyType="done"
                onSubmitEditing={submit}
                prefix={(
                  <View style={styles.mobilePrefix}>
                    <Text style={styles.mobileFlag}>{DEFAULT_COUNTRY_FLAG}</Text>
                    <Text style={styles.mobileCode}>{DEFAULT_COUNTRY_CODE}</Text>
                  </View>
                )}
                error={mobileInvalid}
                helperText={mobileInvalid ? 'Enter a valid 10-digit mobile number' : undefined}
              />

              <ProfileChoiceGroup
                label="Gender"
                options={genderOptions}
                value={gender}
                onChange={(value) => {
                  setGender(value);
                  setError('');
                }}
              />

              <ProfileChoiceGroup
                label="Habit to improve"
                options={habitFocusOptions}
                value={habitFocus}
                onChange={(value) => {
                  setHabitFocus(value);
                  setError('');
                }}
              />

              {error ? <Text style={styles.authError}>{error}</Text> : null}

              <PressScale
                reduceMotion={reduceMotion}
                disabled={!formValid || submitting}
                onPress={submit}
                style={[styles.authPrimaryButton, styles.profileContinueButton, (!formValid || submitting) && styles.authPrimaryButtonDisabled]}
              >
                <Text style={styles.authPrimaryText}>{submitting ? 'Saving' : 'Continue'}</Text>
                <ArrowRight size={16} color="#FFFFFF" strokeWidth={2.7} />
              </PressScale>

              <View style={styles.privacyNote}>
                <View style={styles.privacyIcon}>
                  <ShieldCheck size={16} color={habitPalette.food.ink} strokeWidth={2.5} />
                </View>
                <Text style={styles.privacyText}>Your details are private and only used to personalize reminders - never shown to other users.</Text>
              </View>
            </GradientCard>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}

const profileBubbleSeeds = Array.from({ length: 8 }, (_, index) => ({
  id: `profile-bubble-${index}`,
  size: 10 + ((index * 7) % 18),
  left: `${6 + ((index * 29) % 86)}%` as `${number}%`,
  delay: (index * 410) % 2800,
  duration: 5200 + ((index * 390) % 2600),
  opacity: 0.1 + ((index * 5) % 16) / 100,
}));

function ProfileBubbles({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <View pointerEvents="none" style={styles.profileBubbleHost}>
      {profileBubbleSeeds.map((bubble) => (
        <ProfileBubble key={bubble.id} bubble={bubble} reduceMotion={reduceMotion} />
      ))}
    </View>
  );
}

function ProfileBubble({
  bubble,
  reduceMotion,
}: {
  bubble: { size: number; left: `${number}%`; delay: number; duration: number; opacity: number };
  reduceMotion: boolean;
}) {
  const lift = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      cancelAnimation(lift);
      lift.value = 0;
      return;
    }
    lift.value = withDelay(
      bubble.delay,
      withRepeat(withTiming(1, { duration: bubble.duration, easing: ReanimatedEasing.inOut(ReanimatedEasing.quad) }), -1, false),
    );
    return () => cancelAnimation(lift);
  }, [bubble.delay, bubble.duration, lift, reduceMotion]);

  const bubbleStyle = useAnimatedStyle(() => ({
    opacity: reduceMotion ? bubble.opacity : bubble.opacity + lift.value * 0.12,
    transform: [{ translateY: reduceMotion ? 0 : -220 * lift.value }],
  }));

  return (
    <Reanimated.View
      style={[
        styles.profileBubble,
        {
          width: bubble.size,
          height: bubble.size,
          borderRadius: bubble.size / 2,
          left: bubble.left,
        },
        bubbleStyle,
      ]}
    />
  );
}

function FloatingProfileInput({
  icon: Icon,
  label,
  value,
  onChangeText,
  reduceMotion,
  keyboardType = 'default',
  returnKeyType,
  onSubmitEditing,
  prefix,
  error,
  helperText,
  style,
}: {
  icon: IconComponent;
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  reduceMotion: boolean;
  keyboardType?: 'default' | 'email-address' | 'number-pad' | 'phone-pad';
  returnKeyType?: 'done' | 'next';
  onSubmitEditing?: () => void;
  prefix?: ReactNode;
  error?: boolean;
  helperText?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const active = focused || value.length > 0;
  const progress = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(active ? 1 : 0, {
      duration: reduceMotion ? 1 : 150,
      easing: ReanimatedEasing.inOut(ReanimatedEasing.quad),
    });
  }, [active, progress, reduceMotion]);

  const labelStyle = useAnimatedStyle(() => ({
    top: 16 - progress.value * 10,
    fontSize: 13 - progress.value * 2,
    color: interpolateColor(progress.value, [0, 1], [colors.inkFaint, focused ? colors.blue1 : colors.inkSoft]),
  }));

  return (
    <View style={[styles.floatingField, style]}>
      <Pressable
        accessibilityRole="button"
        onPress={() => inputRef.current?.focus()}
        style={[
          styles.floatingInputShell,
          focused && styles.authInputShellFocused,
          error && styles.authInputShellError,
        ]}
      >
        <Icon size={18} color={focused ? colors.blue1 : colors.inkFaint} strokeWidth={2.3} />
        {prefix}
        <View style={styles.floatingInputContent}>
          <Reanimated.Text pointerEvents="none" style={[styles.floatingLabel, labelStyle]}>
            {label}
          </Reanimated.Text>
          <TextInput
            ref={inputRef}
            value={value}
            onChangeText={onChangeText}
            placeholder=""
            secureTextEntry={false}
            autoCorrect={false}
            keyboardType={keyboardType}
            returnKeyType={returnKeyType}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onSubmitEditing={onSubmitEditing}
            blurOnSubmit={returnKeyType === 'done'}
            style={styles.floatingInput}
          />
        </View>
      </Pressable>
      {helperText ? <Text style={styles.authHelperError}>{helperText}</Text> : null}
    </View>
  );
}

function ProfileChoiceGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.profileChoiceGroup}>
      <Text style={styles.profileChoiceLabel}>{label}</Text>
      <View style={styles.profileChoiceRow}>
        {options.map((option) => {
          const selected = value === option;
          return (
            <Pressable
              key={option}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onChange(option)}
              style={[styles.profileChoiceChip, selected && styles.profileChoiceChipSelected]}
            >
              <View style={[styles.profileChoiceDot, selected && styles.profileChoiceDotSelected]} />
              <Text style={[styles.profileChoiceText, selected && styles.profileChoiceTextSelected]}>{option}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
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

function AuthHero({ mode, reduceMotion, split = false }: { mode: AuthMode; reduceMotion: boolean; split?: boolean }) {
  const isCreate = mode === 'createAccount';
  const compact = (isCreate || mode === 'forgot') && !split;
  return (
    <View style={[styles.authHero, compact && styles.authHeroCompact, split && styles.authHeroSplit]}>
      <AnimatedWaveBackground reduceMotion={reduceMotion} compact={compact} />
      <View style={[styles.authHeroContent, compact && styles.authHeroContentCompact, split && styles.authHeroContentSplit]}>
        <LogoMark size={split ? 78 : compact ? 52 : 64} reduceMotion={reduceMotion} />
        <Text style={[isCreate ? styles.authCreateTitle : styles.authWordmark, split && styles.authHeroTitleSplit]}>
          {isCreate ? 'Start your ritual' : 'Rituals'}
        </Text>
        <Text style={[styles.authHeroSubtitle, split && styles.authHeroSubtitleSplit]}>
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

function LogoMark({
  size,
  reduceMotion,
  palette = habitPalette.water,
  style,
}: {
  size: number;
  reduceMotion: boolean;
  palette?: HabitPalette;
  style?: StyleProp<ViewStyle>;
}) {
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
    <View style={[styles.logoMark, { width: size, height: size, borderRadius: size / 2 }, style]}>
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
  disabled = false,
}: {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  reduceMotion: boolean;
  disabled?: boolean;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => {
        if (disabled) {
          return;
        }
        scale.value = reduceMotion ? 1 : withTiming(0.97, { duration: 120 });
      }}
      onPressOut={() => {
        if (disabled) {
          return;
        }
        scale.value = reduceMotion ? 1 : withSpring(1, { damping: 14, stiffness: 260 });
      }}
    >
      <Reanimated.View style={[style, animatedStyle]}>{children}</Reanimated.View>
    </Pressable>
  );
}

function FlowApp({
  userId,
  username,
  email,
  habitFocus,
  profileIncomplete,
  onOpenProfileSetup,
  onLogout,
}: {
  userId?: string;
  username: string;
  email?: string;
  habitFocus?: string;
  profileIncomplete: boolean;
  onOpenProfileSetup: () => void;
  onLogout: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const [activeTab, setActiveTab] = useState<TabKey>('today');
  const [rituals, setRituals] = useState(defaultState.rituals);
  const [checkins, setCheckins] = useState(defaultState.checkins);
  const [totalActiveRituals, setTotalActiveRituals] = useState(defaultState.totalActiveRituals);
  const [baseDoneFromOtherHabits, setBaseDoneFromOtherHabits] = useState(defaultState.baseDoneFromOtherHabits);
  const [overallStreak, setOverallStreak] = useState(defaultState.overallStreak);
  const [rhythmPoints, setRhythmPoints] = useState(defaultState.rhythmPoints);
  const [graceHearts, setGraceHearts] = useState(defaultState.graceHearts);
  const [onboardingDream, setOnboardingDream] = useState<DreamId | null>(defaultState.onboardingDream ?? null);
  const [settings, setSettings] = useState(defaultState.settings);
  const [insight, setInsight] = useState(defaultState.insight);
  const [stateDate, setStateDate] = useState(defaultState.stateDate ?? todayIso());
  const [selectedRitualId, setSelectedRitualId] = useState(defaultState.rituals[0]?.id ?? '');
  const [addOpen, setAddOpen] = useState(false);
  const [editingRitualId, setEditingRitualId] = useState<string | null>(null);
  const [coachOpen, setCoachOpen] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [particles, setParticles] = useState<BurstParticle[]>([]);
  const [newRitualId, setNewRitualId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const isTablet = width >= TABLET_MIN_WIDTH;
  const appHorizontalPadding = isTablet ? 28 : 20;
  const storageKey = useMemo(() => (userId ? `${STORAGE_KEY}:${userId}` : STORAGE_KEY), [userId]);
  const canUseRemote = Boolean(supabase && userId && !userId.startsWith('local-'));

  useEffect(() => {
    let mounted = true;
    setHydrated(false);

    const applyState = (state: SavedFlowState) => {
      setRituals(state.rituals);
      setCheckins(state.checkins);
      setTotalActiveRituals(state.totalActiveRituals);
      setBaseDoneFromOtherHabits(state.baseDoneFromOtherHabits);
      setOverallStreak(state.overallStreak);
      setRhythmPoints(state.rhythmPoints);
      setGraceHearts(state.graceHearts);
      setOnboardingDream(state.onboardingDream ?? null);
      setSettings(state.settings);
      setInsight(state.insight);
      setStateDate(state.stateDate ?? todayIso());
      setSelectedRitualId(state.rituals[0]?.id ?? '');
    };

    const loadLocal = async () => {
      const stored = await AsyncStorage.getItem(storageKey);
      return stored ? normalizeState(JSON.parse(stored) as Partial<SavedFlowState>) : defaultState;
    };

    const hydrate = async () => {
      const local = await loadLocal();
      if (supabase && canUseRemote && userId) {
        try {
          const remote = await loadSupabaseFlowState(userId);
          if (remote) {
            const remoteState = normalizeState({ ...defaultState, ...remote });
            const state = remoteState.rituals.length || !local.rituals.length ? remoteState : local;
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
  }, [canUseRemote, storageKey, userId]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    const state: SavedFlowState = {
      rituals,
      checkins,
      totalActiveRituals,
      baseDoneFromOtherHabits,
      overallStreak,
      rhythmPoints,
      graceHearts,
      onboardingDream,
      settings,
      insight,
      stateDate,
    };
    AsyncStorage.setItem(storageKey, JSON.stringify(state)).catch(() => undefined);
  }, [baseDoneFromOtherHabits, checkins, graceHearts, hydrated, insight, onboardingDream, overallStreak, rhythmPoints, rituals, settings, stateDate, storageKey, totalActiveRituals]);

  useEffect(() => {
    if (!hydrated) {
      return undefined;
    }

    const rolloverIfNeeded = () => {
      if (stateDate === todayIso()) {
        return;
      }
      const next = normalizeState({
        rituals,
        checkins,
        totalActiveRituals,
        baseDoneFromOtherHabits,
        overallStreak,
        rhythmPoints,
        graceHearts,
        onboardingDream,
        settings,
        insight,
        stateDate,
      });
      setRituals(next.rituals);
      setCheckins(next.checkins);
      setTotalActiveRituals(next.totalActiveRituals);
      setBaseDoneFromOtherHabits(next.baseDoneFromOtherHabits);
      setOverallStreak(next.overallStreak);
      setRhythmPoints(next.rhythmPoints);
      setGraceHearts(next.graceHearts);
      setOnboardingDream(next.onboardingDream ?? null);
      setSettings(next.settings);
      setInsight(next.insight);
      setStateDate(next.stateDate ?? todayIso());
    };

    rolloverIfNeeded();
    const timer = setInterval(rolloverIfNeeded, 60000);
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        rolloverIfNeeded();
      }
    });
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, [baseDoneFromOtherHabits, checkins, graceHearts, hydrated, insight, onboardingDream, overallStreak, rhythmPoints, rituals, settings, stateDate, totalActiveRituals]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    syncRitualReminderNotifications(rituals, settings.pushNotifications).catch(() => undefined);
  }, [hydrated, rituals, settings.pushNotifications]);

  const doneCount = useMemo(
    () => baseDoneFromOtherHabits + rituals.filter((ritual) => ritual.doneToday).length,
    [baseDoneFromOtherHabits, rituals],
  );
  const heroPercent = totalActiveRituals ? Math.round((doneCount / totalActiveRituals) * 100) : 0;
  const selectedRitual = rituals.find((ritual) => ritual.id === selectedRitualId) ?? rituals[0];
  const editingRitual = editingRitualId ? rituals.find((ritual) => ritual.id === editingRitualId) ?? null : null;
  const todayCheckinIds = useMemo(
    () => new Set(checkins.filter((checkin) => checkin.date === todayIso()).map((checkin) => checkin.ritualId)),
    [checkins],
  );
  const pendingCheckinRituals = useMemo(
    () => rituals.filter((ritual) => reminderWindowClosed(ritual) && !todayCheckinIds.has(ritual.id)),
    [rituals, todayCheckinIds],
  );
  const weeklyPatternCheckin = useMemo(() => {
    const start = new Date(`${todayIso()}T00:00:00`);
    start.setDate(start.getDate() - 6);
    return checkins.find((checkin) => {
      const checkinTime = new Date(`${checkin.date}T00:00:00`).getTime();
      return checkinTime >= start.getTime() && checkin.category === 'pattern';
    }) ?? null;
  }, [checkins]);

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

  const persistCheckinsRemote = useCallback((records: RitualCheckin[]) => {
    if (!supabase || !canUseRemote || !userId || !records.length) {
      return;
    }
    supabase
      .from('ritual_checkins')
      .upsert(
        records.map((record) => ({
          id: record.id,
          user_id: userId,
          ritual_id: record.ritualId,
          habit_id: record.ritualId,
          checkin_date: record.date,
          scheduled_window: record.scheduledWindow,
          user_reason_raw: record.userReasonRaw,
          category: record.category,
          flo_message: record.floMessage,
          streak_protected: record.streakProtected,
          suggested_action: record.suggestedAction,
        })),
        { onConflict: 'id' },
      )
      .then(() => undefined);
  }, [canUseRemote, userId]);

  const submitCheckin = useCallback(async (reason: string) => {
    const trimmed = reason.trim();
    if (!pendingCheckinRituals.length || !trimmed) {
      return;
    }
    const created: RitualCheckin[] = [];
    for (const ritual of pendingCheckinRituals) {
      const hasPattern = recentPatternForReason(checkins, trimmed);
      const reply = await generateFloCheckinReply(ritual, trimmed, settings.floTone, hasPattern);
      created.push({
        id: `checkin-${ritual.id}-${todayIso()}`,
        ritualId: ritual.id,
        date: todayIso(),
        scheduledWindow: reminderWindowLabel(ritual.reminderTime),
        userReasonRaw: trimmed,
        category: reply.category,
        floMessage: reply.message,
        streakProtected: reply.protect_streak,
        suggestedAction: reply.suggested_action,
        resolvedAt: Date.now(),
      });
    }
    setCheckins((current) => [...created, ...current]);
    persistCheckinsRemote(created);
    showToast('Flo check-in saved');
    impact();
  }, [checkins, impact, pendingCheckinRituals, persistCheckinsRemote, settings.floTone, showToast]);

  const completeOnboarding = async (
    dream: DreamId,
    selectedStarters: Array<{ name: string; icon: string; paletteKey: PaletteKey; goalAmount?: number; goalUnit?: GoalUnit; reminderTime: string }>,
  ) => {
    if (!selectedStarters.length) {
      showToast('Choose at least one starter ritual');
      return;
    }

    let nextRituals = selectedStarters.map((starter, index) => starterRitualToRitual(starter, index, `starter-${dream}`));

    if (supabase && canUseRemote && userId) {
      const { data, error: insertError } = await supabase
        .from('habits')
        .insert(selectedStarters.map((starter) => ({
          user_id: userId,
          name: starter.name,
          icon: starter.icon,
          color: paletteToDbColor(starter.paletteKey),
          palette_key: starter.paletteKey,
          goal_amount: starter.goalAmount ?? null,
          goal_unit: starter.goalUnit ?? null,
          reminder_time: starter.reminderTime ?? null,
          frequency: 'daily',
        })))
        .select('id,created_at')
        .order('created_at', { ascending: true });

      if (insertError) {
        showToast(`Database save failed: ${insertError.message}`);
      } else if (data?.length) {
        nextRituals = nextRituals.map((ritual, index) => ({
          ...ritual,
          id: data[index]?.id ?? ritual.id,
          createdAt: data[index]?.created_at ? Date.parse(data[index].created_at) : ritual.createdAt,
        }));
      }
    }

    setOnboardingDream(dream);
    setRituals(nextRituals);
    setTotalActiveRituals(nextRituals.length);
    setBaseDoneFromOtherHabits(0);
    setSelectedRitualId(nextRituals[0]?.id ?? '');
    setStateDate(todayIso());
    setActiveTab('today');
    setNewRitualId(nextRituals[0]?.id ?? null);
    showToast('Starter rituals saved');
    impact();
    setTimeout(() => setNewRitualId(null), 650);
  };

  const toggleRitual = (ritualId: string, x: number, y: number) => {
    const target = rituals.find((ritual) => ritual.id === ritualId);
    if (!target) {
      return;
    }
    const nextDoneToday = !target.doneToday;
    const completionHour = nextDoneToday ? nowHour() : null;
    const pointDelta = nextDoneToday ? 10 + (isCompletionInUsualWindow({ ...target, completedAt: completionHour }) ? 5 : 0) : -(10 + (isCompletionInUsualWindow(target) ? 5 : 0));
    const hadDoneBeforeToggle = rituals.some((ritual) => ritual.doneToday);
    const hasDoneAfterToggle = rituals.some((ritual) => ritual.id === ritualId ? nextDoneToday : ritual.doneToday);
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
          completedAt: completionHour,
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
    setRhythmPoints((current) => Math.max(0, current + pointDelta));
    if (!hadDoneBeforeToggle && hasDoneAfterToggle) {
      setOverallStreak((current) => current + 1);
    } else if (hadDoneBeforeToggle && !hasDoneAfterToggle && !nextDoneToday) {
      setOverallStreak((current) => Math.max(0, current - 1));
    }

    impact();
    if (burstPalette) {
      fireBurst(x, y, burstPalette);
    }
    showToast(toastMessage);

    if (supabase && canUseRemote && userId) {
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

  const addRitual = async (input: CreateRitualInput) => {
    const name = input.name.trim();
    const icon = input.icon;
    const paletteKey = input.paletteKey;
    const why = input.why?.trim() || undefined;
    const goalAmount = typeof input.goalAmount === 'number' && Number.isFinite(input.goalAmount) ? input.goalAmount : undefined;
    const goalUnit = goalAmount && input.goalUnit ? input.goalUnit : undefined;
    const reminderTime = input.reminderTime;
    let id = `ritual-${Date.now()}`;
    let createdAt = Date.now();

    if (supabase && canUseRemote && userId) {
      const { data, error: insertError } = await supabase
        .from('habits')
        .insert({
          user_id: userId,
          name,
          icon,
          color: paletteToDbColor(paletteKey),
          palette_key: paletteKey,
          why: why ?? null,
          goal_amount: goalAmount ?? null,
          goal_unit: goalUnit ?? null,
          reminder_time: reminderTime ?? null,
          frequency: 'daily',
        })
        .select('id,created_at')
        .single();

      if (insertError || !data) {
        const message = `Database save failed: ${insertError?.message ?? 'Unable to add ritual'}`;
        showToast(message);
        throw new Error(message);
      }

      id = data.id;
      createdAt = data.created_at ? Date.parse(data.created_at) : createdAt;
    }

    const next: Ritual = {
      id,
      name,
      icon,
      paletteKey,
      why,
      goalAmount,
      goalUnit,
      reminderTime,
      completedAt: null,
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

  const updateRitual = async (ritualId: string, input: CreateRitualInput) => {
    const target = rituals.find((ritual) => ritual.id === ritualId);
    if (!target) {
      const message = 'Ritual not found';
      showToast(message);
      throw new Error(message);
    }

    const name = input.name.trim();
    const icon = input.icon;
    const paletteKey = input.paletteKey;
    const why = input.why?.trim() || undefined;
    const goalAmount = typeof input.goalAmount === 'number' && Number.isFinite(input.goalAmount) ? input.goalAmount : undefined;
    const goalUnit = goalAmount && input.goalUnit ? input.goalUnit : undefined;
    const reminderTime = input.reminderTime;

    if (supabase && canUseRemote && userId) {
      const { error: updateError } = await supabase
        .from('habits')
        .update({
          name,
          icon,
          color: paletteToDbColor(paletteKey),
          palette_key: paletteKey,
          why: why ?? null,
          goal_amount: goalAmount ?? null,
          goal_unit: goalUnit ?? null,
          reminder_time: reminderTime ?? null,
        })
        .eq('id', ritualId)
        .eq('user_id', userId);

      if (updateError) {
        const message = `Database save failed: ${updateError.message}`;
        showToast(message);
        throw new Error(message);
      }
    }

    setRituals((current) =>
      current.map((ritual) =>
        ritual.id === ritualId
          ? {
              ...ritual,
              name,
              icon,
              paletteKey,
              why,
              goalAmount,
              goalUnit,
              reminderTime,
            }
          : ritual,
      ),
    );
    showToast(`${name} updated`);
    impact();
  };

  const deleteRitual = async (ritualId: string) => {
    const target = rituals.find((ritual) => ritual.id === ritualId);
    if (!target) {
      const message = 'Ritual not found';
      showToast(message);
      throw new Error(message);
    }

    if (supabase && canUseRemote && userId) {
      const { error: deleteError } = await supabase
        .from('habits')
        .update({ is_archived: true })
        .eq('id', ritualId)
        .eq('user_id', userId);

      if (deleteError) {
        const message = `Database delete failed: ${deleteError.message}`;
        showToast(message);
        throw new Error(message);
      }
    }

    const remainingRituals = rituals.filter((ritual) => ritual.id !== ritualId);
    setRituals(remainingRituals);
    setTotalActiveRituals((current) => Math.max(0, current - 1));
    if (selectedRitualId === ritualId) {
      setSelectedRitualId(remainingRituals[0]?.id ?? '');
    }
    setNewRitualId((current) => (current === ritualId ? null : current));
    showToast(`${target.name} deleted`);
    impact();
  };

  const updateSetting = <K extends keyof FlowSettings>(key: K, value: FlowSettings[K]) => {
    setSettings((current) => ({ ...current, [key]: value }));
    showToast(key === 'floTone' ? `Flo style: ${String(value)}` : value ? 'Setting enabled' : 'Setting disabled');
    impact();

    if (supabase && canUseRemote && userId) {
      const column = key === 'darkTheme' ? 'dark_theme' : key === 'haptics' ? 'haptics_enabled' : key === 'pushNotifications' ? 'push_enabled' : key === 'floTone' ? 'flo_tone' : null;
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
  const contentMaxWidth = isTablet
    ? responsiveMaxWidth(width, APP_CONTENT_MAX_WIDTH, appHorizontalPadding)
    : undefined;

  if (!hydrated) {
    return (
      <View style={styles.root}>
        <StatusBar style="dark" />
        <LinearGradient colors={['#EEF1F4', colors.page]} style={styles.stage}>
          <View style={styles.loadingRoot} />
        </LinearGradient>
      </View>
    );
  }

  if (!onboardingDream && rituals.length === 0) {
    return (
      <OnboardingDreamFlow
        reduceMotion={reduceMotion}
        onComplete={(dream, starters) => completeOnboarding(dream, starters).catch(() => showToast('Unable to save starter rituals'))}
      />
    );
  }

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
              paddingBottom: 0,
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
              overallStreak={overallStreak}
              rhythmPoints={rhythmPoints}
              graceHearts={graceHearts}
              pendingCheckinRituals={pendingCheckinRituals}
              latestCheckins={checkins}
              weeklyPatternCheckin={weeklyPatternCheckin}
              newRitualId={newRitualId}
              reduceMotion={reduceMotion}
              onToggleRitual={toggleRitual}
              onEditRitual={(ritual) => setEditingRitualId(ritual.id)}
              onOpenProfile={() => setActiveTab('profile')}
              onSubmitCheckin={submitCheckin}
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
            <ProfileScreen
              rituals={rituals}
              settings={settings}
              username={username}
              email={email}
              habitFocus={habitFocus}
              reduceMotion={reduceMotion}
              profileIncomplete={profileIncomplete}
              onOpenProfileSetup={onOpenProfileSetup}
              onSettingChange={updateSetting}
              onLogout={onLogout}
            />
          ) : null}
        </Animated.View>

        <BottomNav activeTab={activeTab} bottomInset={insets.bottom} onChange={setActiveTab} onAdd={() => setAddOpen(true)} />
        <AskFloLauncher userId={userId} bottomInset={insets.bottom} topInset={insets.top} reduceMotion={reduceMotion} onOpen={() => setCoachOpen(true)} />
        <CoachChatSheet
          open={coachOpen}
          rituals={rituals}
          reduceMotion={reduceMotion}
          onClose={() => setCoachOpen(false)}
          onAddRitual={(name, icon) => addRitual({ name, icon, paletteKey: iconOptionForEmoji(icon).key })}
        />
        <AddRitualSheet
          open={addOpen || Boolean(editingRitual)}
          editingRitual={editingRitual}
          onClose={() => {
            setAddOpen(false);
            setEditingRitualId(null);
          }}
          onAdd={addRitual}
          onUpdate={updateRitual}
          onDelete={deleteRitual}
          reduceMotion={reduceMotion}
        />
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
  overallStreak,
  rhythmPoints,
  graceHearts,
  pendingCheckinRituals,
  latestCheckins,
  weeklyPatternCheckin,
  newRitualId,
  reduceMotion,
  onToggleRitual,
  onEditRitual,
  onOpenProfile,
  onSubmitCheckin,
}: {
  username: string;
  rituals: Ritual[];
  totalActiveRituals: number;
  doneCount: number;
  heroPercent: number;
  overallStreak: number;
  rhythmPoints: number;
  graceHearts: number;
  pendingCheckinRituals: Ritual[];
  latestCheckins: RitualCheckin[];
  weeklyPatternCheckin: RitualCheckin | null;
  newRitualId: string | null;
  reduceMotion: boolean;
  onToggleRitual: (id: string, x: number, y: number) => void;
  onEditRitual: (ritual: Ritual) => void;
  onOpenProfile: () => void;
  onSubmitCheckin: (reason: string) => void | Promise<void>;
}) {
  const { width } = useWindowDimensions();
  const now = useMinuteNow();
  const todayLabel = useMemo(() => formatLiveDateTime(now), [now]);
  const [themeOverride, setThemeOverride] = useState<HeroThemeKey | null>(null);
  const [activeThemeKey, setActiveThemeKey] = useState<HeroThemeKey>(() => getHeroThemeKey());
  const [activeMetricId, setActiveMetricId] = useState<HeaderMetric['id'] | null>(null);
  const useTabletGrid = width >= TABLET_MIN_WIDTH;
  const headerMetrics = useMemo(() => derivedHeaderMetrics(overallStreak, rhythmPoints, graceHearts), [graceHearts, overallStreak, rhythmPoints]);
  const statusRows = useMemo(
    () =>
      rituals.map((ritual) => ({
        icon: ritual.icon,
        name: ritual.name,
        streakDays: ritual.streakDays,
        done: ritual.doneToday,
        completedAt: ritual.completedAt ?? null,
        pct: ritual.doneToday ? '100%' : `${Math.max(14, percentFromWeekly(ritual.heat.slice(-7)))}%`,
        palette: habitPalette[ritual.paletteKey],
      })),
    [rituals],
  );

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(HERO_THEME_OVERRIDE_STORAGE_KEY)
      .then((stored) => {
        if (!mounted) {
          return;
        }
        if (isHeroThemeKey(stored)) {
          setThemeOverride(stored);
          setActiveThemeKey(stored);
        }
      })
      .catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (themeOverride) {
      setActiveThemeKey(themeOverride);
      return undefined;
    }

    const syncAutoTheme = () => setActiveThemeKey(getHeroThemeKey());
    syncAutoTheme();
    const timer = setInterval(syncAutoTheme, 30000);
    return () => clearInterval(timer);
  }, [themeOverride]);

  useEffect(() => {
    if (!activeMetricId) {
      return undefined;
    }
    const timer = setTimeout(() => setActiveMetricId(null), 1800);
    return () => clearTimeout(timer);
  }, [activeMetricId]);

  const selectThemeOverride = (nextTheme: HeroThemeKey | null) => {
    setThemeOverride(nextTheme);
    setActiveThemeKey(nextTheme ?? getHeroThemeKey());
    const write = nextTheme
      ? AsyncStorage.setItem(HERO_THEME_OVERRIDE_STORAGE_KEY, nextTheme)
      : AsyncStorage.removeItem(HERO_THEME_OVERRIDE_STORAGE_KEY);
    write.catch(() => undefined);
  };

  return (
    <ScrollView contentContainerStyle={styles.screenScroll} showsVerticalScrollIndicator={false}>
      <View style={styles.topRow}>
        <Pressable accessibilityRole="button" accessibilityLabel="Open profile" onPress={onOpenProfile} style={styles.avatar}>
          <LogoMark size={42} reduceMotion={reduceMotion} style={styles.logoMarkInline} />
        </Pressable>
        <View style={styles.greetingBlock}>
          <Text numberOfLines={1} style={styles.greetingSub}>{todayLabel}</Text>
          <Text numberOfLines={1} style={styles.greetingName}>{username}</Text>
        </View>
        <HeaderStats metrics={headerMetrics} activeMetricId={activeMetricId} onToggle={setActiveMetricId} />
      </View>
      {activeMetricId ? (
        <HeaderMetricTooltip metric={headerMetrics.find((metric) => metric.id === activeMetricId) ?? headerMetrics[0]} />
      ) : null}

      <AdaptiveTodayHero
        doneCount={doneCount}
        totalActiveRituals={totalActiveRituals}
        heroPercent={heroPercent}
        activeThemeKey={activeThemeKey}
        reduceMotion={reduceMotion}
      />
      <TodayThemeSwitcher
        activeThemeKey={activeThemeKey}
        themeOverride={themeOverride}
        onSelect={selectThemeOverride}
      />
      <FloCheckinCard rituals={pendingCheckinRituals} latestCheckins={latestCheckins} onSubmit={onSubmitCheckin} />
      {weeklyPatternCheckin ? <FloPatternRecap checkin={weeklyPatternCheckin} rituals={rituals} /> : null}
      <TodayRhythmTimeline rituals={rituals} now={now} />
      {false ? (
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
      ) : null}

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
              cellStyle={useTabletGrid && styles.ritualCellTablet}
              onEdit={onEditRitual}
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
              <StatusRow
                key={row.name}
                icon={row.icon}
                name={row.name}
                streakDays={row.streakDays}
                done={row.done}
                completedAt={row.completedAt}
                pct={row.pct}
                palette={row.palette}
              />
            ))}
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

function AdaptiveTodayHero({
  doneCount,
  totalActiveRituals,
  heroPercent,
  activeThemeKey,
  reduceMotion,
}: {
  doneCount: number;
  totalActiveRituals: number;
  heroPercent: number;
  activeThemeKey: HeroThemeKey;
  reduceMotion: boolean;
}) {
  const [currentKey, setCurrentKey] = useState<HeroThemeKey>(activeThemeKey);
  const [previousKey, setPreviousKey] = useState<HeroThemeKey>(activeThemeKey);
  const fade = useSharedValue(1);

  useEffect(() => {
    setCurrentKey((current) => {
      if (current === activeThemeKey) {
        return current;
      }
      setPreviousKey(current);
      fade.value = 0;
      fade.value = withTiming(1, {
        duration: reduceMotion ? 1 : 900,
        easing: ReanimatedEasing.inOut(ReanimatedEasing.quad),
      });
      return activeThemeKey;
    });
  }, [activeThemeKey, fade, reduceMotion]);

  const currentTheme = heroThemes[currentKey];
  const previousTheme = heroThemes[previousKey];
  const wavePalette = useMemo<HabitPalette>(() => ({
    a: currentTheme.wave[1],
    b: currentTheme.wave[0],
    bg: [currentTheme.backdrop[0], currentTheme.backdrop[2]],
    ink: currentTheme.accent,
  }), [currentTheme]);
  const fadeStyle = useAnimatedStyle(() => ({
    opacity: fade.value,
  }));
  const isNight = currentTheme.key === 'night';
  const complete = totalActiveRituals > 0 && heroPercent >= 100;
  const accent = currentTheme.accent;

  return (
    <View style={[styles.heroAdaptive, complete && { shadowColor: accent, shadowOpacity: 0.24, shadowRadius: 28, elevation: 12 }]}>
      <StatusBar style={isNight ? 'light' : 'dark'} />
      <LinearGradient colors={previousTheme.backdrop} style={StyleSheet.absoluteFill} />
      <Reanimated.View style={[StyleSheet.absoluteFill, fadeStyle]}>
        <LinearGradient colors={currentTheme.backdrop} style={StyleSheet.absoluteFill} />
      </Reanimated.View>
      {isNight ? <NightStarField reduceMotion={reduceMotion} /> : null}
      <View style={styles.heroContent}>
        <View style={styles.themeLabelRow}>
          <View style={[styles.themeDot, { backgroundColor: currentTheme.accent }]} />
          <Text style={[styles.themeLabel, { color: currentTheme.inkOnHero }]}>{currentTheme.greeting}</Text>
        </View>
        <Text style={[styles.heroHead, { color: currentTheme.inkOnHero }]}>
          Today's rituals · <Text style={[styles.heroHeadStrong, { color: currentTheme.inkOnHero }]}>{doneCount}/{totalActiveRituals}</Text> done
        </Text>
        <View style={complete ? [styles.heroCompleteOrb, { shadowColor: accent }] : null}>
          <LiquidRing
            percent={heroPercent}
            size={220}
            variant="hero"
            palette={wavePalette}
            reduceMotion={reduceMotion}
            accent={accent}
            textColor={currentTheme.inkOnHero}
            subTextColor={isNight ? 'rgba(228,226,255,0.72)' : colors.inkSoft}
            trackColor={isNight ? 'rgba(228,226,255,0.18)' : 'rgba(120,140,180,0.18)'}
          />
        </View>
        <View
          style={[
            styles.goalPill,
            {
              backgroundColor: isNight ? 'rgba(255,255,255,0.12)' : '#FFFFFF',
              borderColor: complete ? `${accent}55` : isNight ? 'rgba(255,255,255,0.18)' : 'rgba(120,140,180,0.14)',
            },
          ]}
        >
          <DropletIcon color={accent} />
          <Text style={[styles.goalPillText, { color: currentTheme.inkOnHero }]}>{complete ? 'All done for today ✨' : `${heroPercent}% of daily rituals`}</Text>
        </View>
        {complete ? (
          <View style={[styles.heroCompleteBanner, { backgroundColor: `${accent}22`, borderColor: `${accent}44` }]}>
            <Text style={[styles.heroCompleteText, { color: currentTheme.inkOnHero }]}>All rituals complete! Nice consistency today - see you tomorrow.</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function TodayThemeSwitcher({
  activeThemeKey,
  themeOverride,
  onSelect,
}: {
  activeThemeKey: HeroThemeKey;
  themeOverride: HeroThemeKey | null;
  onSelect: (theme: HeroThemeKey | null) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.themeSwitcherRow}
      style={styles.themeSwitcherScroll}
    >
      <ThemeChip
        label="Auto"
        accent={heroThemes[activeThemeKey].accent}
        selected={themeOverride === null}
        onPress={() => onSelect(null)}
      />
      {heroThemeOrder.map((themeKey) => (
        <ThemeChip
          key={themeKey}
          label={heroThemes[themeKey].greeting.replace('Good ', '')}
          accent={heroThemes[themeKey].accent}
          selected={themeOverride === themeKey || (themeOverride === null && activeThemeKey === themeKey)}
          onPress={() => onSelect(themeKey)}
        />
      ))}
    </ScrollView>
  );
}

function ThemeChip({
  label,
  accent,
  selected,
  onPress,
}: {
  label: string;
  accent: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${label} theme`}
      onPress={onPress}
      style={[
        styles.themeChip,
        selected && {
          borderColor: accent,
          shadowColor: accent,
          shadowOpacity: 0.28,
          elevation: 4,
        },
      ]}
    >
      <View style={[styles.themeChipDot, { backgroundColor: accent }]} />
      <Text style={styles.themeChipText}>{label}</Text>
    </Pressable>
  );
}

function NightStarField({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {nightStars.map((star) => (
        <NightStar key={star.id} star={star} reduceMotion={reduceMotion} />
      ))}
    </View>
  );
}

function NightStar({
  star,
  reduceMotion,
}: {
  star: { left: `${number}%`; top: `${number}%`; delay: number; opacity: number };
  reduceMotion: boolean;
}) {
  const opacity = useSharedValue(star.opacity);

  useEffect(() => {
    if (reduceMotion) {
      cancelAnimation(opacity);
      opacity.value = star.opacity;
      return;
    }
    opacity.value = withDelay(
      star.delay,
      withRepeat(
        withTiming(Math.min(star.opacity + 0.42, 0.82), {
          duration: 2500,
          easing: ReanimatedEasing.inOut(ReanimatedEasing.quad),
        }),
        -1,
        true,
      ),
    );
    return () => cancelAnimation(opacity);
  }, [opacity, reduceMotion, star.delay, star.opacity]);

  const starStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Reanimated.View
      style={[
        styles.nightStar,
        {
          left: star.left,
          top: star.top,
        },
        starStyle,
      ]}
    />
  );
}

function FloCheckinCard({
  rituals,
  latestCheckins,
  onSubmit,
}: {
  rituals: Ritual[];
  latestCheckins: RitualCheckin[];
  onSubmit: (reason: string) => void | Promise<void>;
}) {
  const [customOpen, setCustomOpen] = useState(false);
  const [customReason, setCustomReason] = useState('');
  const latestToday = latestCheckins.find((checkin) => checkin.date === todayIso());
  const quickReplies = ['Something came up', 'Chose something else', "Just didn't get to it"];

  if (!rituals.length && !latestToday) {
    return null;
  }

  const title = rituals.length > 1
    ? `${rituals.length} rituals need a check-in`
    : rituals[0]?.name ?? 'Flo check-in';
  const subtitle = rituals.length
    ? rituals.map((ritual) => `${ritual.icon} ${ritual.name}`).join('  ')
    : 'Thanks for naming what happened today.';

  const submitCustom = async () => {
    const trimmed = customReason.trim();
    if (!trimmed) {
      return;
    }
    await onSubmit(trimmed);
    setCustomReason('');
    setCustomOpen(false);
  };

  return (
    <View style={styles.floCheckinCard}>
      <View style={styles.floCheckinTop}>
        <View style={styles.floCheckinIcon}>
          <Bot size={18} color={colors.blue1} strokeWidth={2.4} />
        </View>
        <View style={styles.floCheckinCopy}>
          <Text style={styles.floCheckinTitle}>{title}</Text>
          <Text numberOfLines={2} style={styles.floCheckinSub}>{subtitle}</Text>
        </View>
      </View>

      {rituals.length ? (
        <>
          <Text style={styles.floQuestion}>What came up?</Text>
          <View style={styles.floChipRow}>
            {quickReplies.map((reply) => (
              <Pressable key={reply} accessibilityRole="button" onPress={() => onSubmit(reply)} style={styles.floReplyChip}>
                <Text style={styles.floReplyText}>{reply}</Text>
              </Pressable>
            ))}
            <Pressable accessibilityRole="button" onPress={() => setCustomOpen((open) => !open)} style={styles.floReplyChip}>
              <Text style={styles.floReplyText}>Type it out</Text>
            </Pressable>
          </View>
          {customOpen ? (
            <View style={styles.floInputRow}>
              <TextInput
                value={customReason}
                onChangeText={setCustomReason}
                placeholder="Tell Flo what happened"
                placeholderTextColor={colors.inkFaint}
                style={styles.floInput}
              />
              <Pressable accessibilityRole="button" onPress={submitCustom} style={styles.floSendButton}>
                <Send size={15} color="#FFFFFF" strokeWidth={2.5} />
              </Pressable>
            </View>
          ) : null}
        </>
      ) : null}

      {latestToday ? (
        <View style={styles.floInlineReply}>
          <Text style={styles.floInlineLabel}>Flo</Text>
          <Text style={styles.floInlineText}>{latestToday.floMessage}</Text>
          {latestToday.suggestedAction ? (
            <Pressable accessibilityRole="button" style={styles.floActionChip}>
              <Text style={styles.floActionText}>{latestToday.suggestedAction}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function FloPatternRecap({ checkin, rituals }: { checkin: RitualCheckin; rituals: Ritual[] }) {
  const ritual = rituals.find((item) => item.id === checkin.ritualId);
  return (
    <View style={styles.floPatternCard}>
      <View style={styles.floPatternIcon}>
        <Sparkles size={16} color={habitPalette.journal.ink} strokeWidth={2.4} />
      </View>
      <View style={styles.floPatternCopy}>
        <Text style={styles.floPatternTitle}>Weekly pattern</Text>
        <Text style={styles.floPatternText}>
          {ritual?.name ?? 'A ritual'} has met the same blocker a few times this week. Flo suggests: {checkin.suggestedAction ?? 'make the next version smaller.'}
        </Text>
      </View>
    </View>
  );
}

function TodayRhythmTimeline({ rituals, now }: { rituals: Ritual[]; now: Date }) {
  const [tooltipId, setTooltipId] = useState<string | null>(null);
  const completed = useMemo(
    () =>
      rituals
        .filter((ritual) => ritual.doneToday && typeof ritual.completedAt === 'number')
        .map((ritual) => ({ ritual, pct: hourToPercent(ritual.completedAt ?? 0) }))
        .sort((a, b) => a.pct - b.pct),
    [rituals],
  );
  const clusters = useMemo(() => groupIntoClusters(completed), [completed]);
  const nowPct = hourToPercent(nowHour(now));

  useEffect(() => {
    if (!tooltipId) {
      return undefined;
    }
    const timer = setTimeout(() => setTooltipId(null), 1500);
    return () => clearTimeout(timer);
  }, [tooltipId]);

  return (
    <View style={styles.rhythmCard}>
      <View style={styles.rhythmHeader}>
        <Text style={styles.rhythmTitle}>Today's Rhythm</Text>
        <Text style={styles.rhythmLogged}>{completed.length} logged</Text>
      </View>
      <View style={styles.rhythmTrackWrap}>
        <View style={styles.rhythmTrack}>
          <LinearGradient colors={['#FFE3C2', '#FFD199']} style={[styles.rhythmSegment, { flex: 6 }]} />
          <LinearGradient colors={['#CFE8FF', '#AFDBFF']} style={[styles.rhythmSegment, { flex: 5 }]} />
          <LinearGradient colors={['#FFD3E1', '#FFB9CF']} style={[styles.rhythmSegment, { flex: 4 }]} />
          <LinearGradient colors={['#DCE1F0', '#C7CEE6']} style={[styles.rhythmSegment, { flex: 3 }]} />
        </View>
        <View pointerEvents="none" style={[styles.rhythmNowTick, { left: `${nowPct}%` }]} />
        {clusters.map((cluster, clusterIndex) => {
          const clusterLeft = cluster.items.reduce((sum, entry) => sum + entry.pct, 0) / cluster.items.length;
          return cluster.items.map((entry, stackIndex) => (
            <TimelineMarker
              key={`${entry.ritual.id}-${entry.ritual.completedAt}`}
              ritual={entry.ritual}
              leftPct={clusterLeft}
              stackIndex={stackIndex}
              clusterSize={cluster.items.length}
              showCount={cluster.items.length > 1 && stackIndex === cluster.items.length - 1}
              visibleTooltip={tooltipId === entry.ritual.id}
              onPress={() => setTooltipId(entry.ritual.id)}
            />
          ));
        })}
      </View>
      <View style={styles.rhythmAxis}>
        {['6a', '12p', '5p', '9p', '12a'].map((label) => (
          <Text key={label} style={styles.rhythmAxisLabel}>{label}</Text>
        ))}
      </View>
    </View>
  );
}

function TimelineMarker({
  ritual,
  leftPct,
  stackIndex,
  clusterSize,
  showCount,
  visibleTooltip,
  onPress,
}: {
  ritual: Ritual;
  leftPct: number;
  stackIndex: number;
  clusterSize: number;
  showCount: boolean;
  visibleTooltip: boolean;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(0)).current;
  const tooltip = useRef(new Animated.Value(0)).current;
  const palette = habitPalette[ritual.paletteKey];
  const markerTop = 41 - stackIndex * 28;
  const stemHeight = stackIndex * 28 + 16;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1,
      speed: 16,
      bounciness: 10,
      useNativeDriver: true,
    }).start();
  }, [scale]);

  useEffect(() => {
    Animated.timing(tooltip, {
      toValue: visibleTooltip ? 1 : 0,
      duration: 160,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [tooltip, visibleTooltip]);

  return (
    <Animated.View style={[styles.timelineMarkerWrap, { left: `${leftPct}%`, top: markerTop, zIndex: 5 + stackIndex, transform: [{ translateX: -16 }, { scale }] }]}>
      {clusterSize > 1 && stackIndex > 0 ? <View style={[styles.timelineStem, { height: stemHeight, backgroundColor: palette.a }]} /> : null}
      <Pressable accessibilityRole="button" accessibilityLabel={`${ritual.name} completed at ${fmtHour(ritual.completedAt ?? 0)}`} onPress={onPress} style={[styles.timelineMarker, { shadowColor: palette.a }]}>
        <Text style={styles.timelineMarkerIcon}>{ritual.icon}</Text>
      </Pressable>
      {showCount ? (
        <View style={[styles.timelineCountBadge, { backgroundColor: palette.a }]}>
          <Text style={styles.timelineCountText}>{clusterSize}</Text>
        </View>
      ) : null}
      <Animated.View pointerEvents="none" style={[styles.timelineTooltip, { opacity: tooltip, transform: [{ translateY: tooltip.interpolate({ inputRange: [0, 1], outputRange: [4, 0] }) }] }]}>
        <Text numberOfLines={1} style={styles.timelineTooltipText}>{ritual.name} · {fmtHour(ritual.completedAt ?? 0)}</Text>
      </Animated.View>
    </Animated.View>
  );
}

function RitualCard({
  ritual,
  entering,
  reduceMotion,
  cellStyle,
  onEdit,
  onToggle,
}: {
  ritual: Ritual;
  entering: boolean;
  reduceMotion: boolean;
  cellStyle?: StyleProp<ViewStyle>;
  onEdit: (ritual: Ritual) => void;
  onToggle: (id: string, x: number, y: number) => void;
}) {
  const palette = habitPalette[ritual.paletteKey];
  const goal = goalLabel(ritual.goalAmount, ritual.goalUnit);
  const enter = useRef(new Animated.Value(entering ? 0 : 1)).current;
  const pressScale = useRef(new Animated.Value(1)).current;
  const checkScale = useRef(new Animated.Value(1)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const previousDone = useRef(ritual.doneToday);

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

  useEffect(() => {
    if (ritual.doneToday && !previousDone.current) {
      pulse.setValue(0);
      Animated.timing(pulse, {
        toValue: 1,
        duration: reduceMotion ? 1 : 480,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
    previousDone.current = ritual.doneToday;
  }, [pulse, reduceMotion, ritual.doneToday]);

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
        cellStyle,
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
        accessibilityRole="checkbox"
        accessibilityState={{ checked: ritual.doneToday }}
        accessibilityLabel={`${ritual.doneToday ? 'Unmark' : 'Complete'} ${ritual.name}`}
        onPress={(event) => toggle(event.nativeEvent.pageX, event.nativeEvent.pageY)}
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
            <View style={styles.ritualActions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Edit ${ritual.name}`}
                hitSlop={8}
                onPress={(event) => {
                  event.stopPropagation();
                  onEdit(ritual);
                }}
                style={styles.ritualEditButton}
              >
                <Pencil size={14} color={palette.ink} strokeWidth={2.5} />
              </Pressable>
              <View style={styles.ritualCheckHost}>
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.ritualPulse,
                    {
                      borderColor: palette.a,
                      opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.42, 0] }),
                      transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.65, 1.9] }) }],
                    },
                  ]}
                />
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
              </View>
            </View>
          </View>
          <View>
            <Text numberOfLines={2} style={styles.ritualName}>{ritual.name}</Text>
            {goal || ritual.reminderTime ? (
              <Text numberOfLines={1} style={[styles.ritualGoal, { color: palette.ink }]}>
                {[goal, ritual.reminderTime ? formatReminderTime(ritual.reminderTime) : ''].filter(Boolean).join(' · ')}
              </Text>
            ) : null}
            {ritual.doneToday && typeof ritual.completedAt === 'number' ? (
              <RitualTimeBadge completedAt={ritual.completedAt} palette={palette} reduceMotion={reduceMotion} />
            ) : null}
            <View style={styles.ritualStreakRow}>
              <Text style={[styles.ritualStreak, { color: palette.ink }]}>🔥 {ritual.streakDays} day streak</Text>
            </View>
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

function RitualTimeBadge({
  completedAt,
  palette,
  reduceMotion,
}: {
  completedAt: number;
  palette: HabitPalette;
  reduceMotion: boolean;
}) {
  const progress = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: reduceMotion ? 1 : 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [progress, reduceMotion]);

  return (
    <Animated.View
      style={[
        styles.ritualTimeBadge,
        {
          opacity: progress,
          transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [4, 0] }) }],
        },
      ]}
    >
      <View style={[styles.ritualTimeDot, { backgroundColor: palette.a }]} />
      <Text style={[styles.ritualTimeText, { color: palette.ink }]}>Done · {fmtHour(completedAt)}</Text>
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
  const [range, setRange] = useState<'week' | 'month'>('week');
  if (!selectedRitual) {
    return (
      <ScrollView contentContainerStyle={styles.screenScroll} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Progress" icon={Settings} />
        <EmptyCard title="No progress yet" body="Create a ritual and complete it to see stats." icon="💧" />
      </ScrollView>
    );
  }

  const palette = habitPalette[selectedRitual.paletteKey];
  const selectedWeekHistory = selectedRitual.heat.slice(-7);
  const selectedCurrentStreak = currentStreakFromHeat(selectedRitual.heat);
  const selectedBestStreak = longestStreakFromHeat(selectedRitual.heat);
  const weekPercent = percentFromWeekly(selectedWeekHistory);
  const monthPercent = selectedRitual.heat.length
    ? Math.round((selectedRitual.heat.reduce((sum, value) => sum + (value ? 1 : 0), 0) / selectedRitual.heat.length) * 100)
    : 0;
  const rangePercent = range === 'week' ? weekPercent : monthPercent;
  const combinedHeat = combinedHeatFromRituals(rituals);
  const activeCount = Math.max(1, totalActiveRituals || rituals.length);

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
          <CountUpText value={selectedCurrentStreak} trigger={selectedRitual.id} style={styles.statNum} />
          <Text style={styles.statLabel}>Current streak</Text>
        </GradientCard>
        <GradientCard style={styles.statCard}>
          <CountUpText value={selectedBestStreak} trigger={selectedRitual.id} style={styles.statNum} />
          <Text style={styles.statLabel}>Best streak</Text>
        </GradientCard>
      </View>

      <GradientCard style={styles.weekCard}>
        <View style={styles.weekHead}>
          <Text style={styles.weekTitle}>{selectedRitual.name}</Text>
          <View style={styles.pillPct}>
            <Text style={styles.pillPctText}>{rangePercent}%</Text>
          </View>
        </View>
        <View style={styles.rangeToggle}>
          {(['week', 'month'] as const).map((option) => (
            <Pressable
              key={option}
              accessibilityRole="button"
              accessibilityState={{ selected: range === option }}
              onPress={() => setRange(option)}
              style={[styles.rangeToggleOption, range === option && { backgroundColor: palette.a }]}
            >
              <Text style={[styles.rangeToggleText, range === option && styles.rangeToggleTextActive]}>
                {option === 'week' ? 'This Week' : 'This Month'}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.weekSub}>{range === 'week' ? "This week's completions" : 'Last 30 days by date'}</Text>
        {range === 'week' ? (
          <View style={styles.bars}>
            {selectedWeekHistory.map((done, index) => (
              <BarColumn
                key={`${selectedRitual.id}-${index}`}
                day={weekLabels[index]}
                filled={done > 0}
                height={done > 0 ? 70 : 6}
                palette={palette}
                delay={index * 55}
                reduceMotion={reduceMotion}
                trigger={`${selectedRitual.id}-${range}`}
              />
            ))}
          </View>
        ) : (
          <View style={styles.monthGrid}>
            {selectedRitual.heat.map((done, index) => (
              <HeatCell
                key={`${selectedRitual.id}-month-${index}`}
                intensity={done ? 1 : 0}
                newest={index === selectedRitual.heat.length - 1}
                palette={palette}
                delay={index * 14}
                reduceMotion={reduceMotion}
                trigger={`${selectedRitual.id}-${range}`}
              />
            ))}
          </View>
        )}
      </GradientCard>

      <GradientCard style={styles.heatCard}>
        <Text style={styles.weekTitle}>Completion heat</Text>
        <View style={styles.heatGrid}>
          {combinedHeat.map((done, index) => (
            <HeatCell
              key={`overall-heat-${index}`}
              intensity={done / activeCount}
              newest={index === combinedHeat.length - 1}
              palette={palette}
              delay={index * 18}
              reduceMotion={reduceMotion}
              trigger={`${rituals.map((ritual) => ritual.id).join('-')}-${done}`}
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
              streakDays={ritual.streakDays}
              done={ritual.doneToday}
              completedAt={ritual.completedAt ?? null}
              pct={ritual.doneToday ? '100%' : `${Math.max(14, percentFromWeekly(ritual.heat.slice(-7)))}%`}
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
        style={styles.coachListFrame}
        contentContainerStyle={styles.coachList}
        renderItem={({ item }) => (
          <CoachBubble message={item} reduceMotion={reduceMotion} onConfirmAction={confirmAction} />
        )}
      />

      <View style={styles.quickReplyWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickReplyScroll} contentContainerStyle={styles.quickReplyRow}>
          {quickReplies.map((reply) => (
            <Pressable key={reply} onPress={() => sendMessage(reply)} style={styles.quickReplyChip}>
              <Text numberOfLines={1} style={styles.quickReplyText}>{reply}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={styles.composerRow}>
        <TextInput
          value={composer}
          onChangeText={setComposer}
          placeholder="Ask about your habits..."
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
  email,
  habitFocus,
  reduceMotion,
  profileIncomplete,
  onOpenProfileSetup,
  onSettingChange,
  onLogout,
}: {
  rituals: Ritual[];
  settings: FlowSettings;
  username: string;
  email?: string;
  habitFocus?: string;
  reduceMotion: boolean;
  profileIncomplete: boolean;
  onOpenProfileSetup: () => void;
  onSettingChange: <K extends keyof FlowSettings>(key: K, value: FlowSettings[K]) => void;
  onLogout: () => void;
}) {
  const best = rituals.reduce((max, ritual) => Math.max(max, ritual.bestStreakDays, ritual.streakDays), 0);
  const daysActive = rituals.reduce((sum, ritual) => sum + ritual.heat.filter(Boolean).length, 0);
  const now = useMinuteNow();
  const todayLabel = useMemo(() => formatTodayLabel(now), [now]);

  return (
    <ScrollView contentContainerStyle={styles.screenScroll} showsVerticalScrollIndicator={false}>
      <ScreenHeader title="Profile" icon={Settings} />
      <View style={styles.profileCard}>
        <View style={styles.profileAvatar}>
          <LogoMark size={52} reduceMotion={reduceMotion} style={styles.logoMarkInline} />
        </View>
        <View style={styles.profileCopy}>
          <View style={styles.profileNameRow}>
            <Text numberOfLines={1} style={styles.profileName}>{username}</Text>
            <LinearGradient colors={['#FFB25B', '#FFD59E']} style={styles.premium}>
              <Text style={styles.premiumText}>Today</Text>
            </LinearGradient>
            <Pressable accessibilityRole="button" accessibilityLabel="Edit profile details" onPress={onOpenProfileSetup} hitSlop={8} style={styles.profileEditButton}>
              <Settings size={13} color={colors.blue1} strokeWidth={2.4} />
            </Pressable>
          </View>
          {email ? <Text numberOfLines={1} style={styles.profileEmail}>{email}</Text> : null}
          <Text numberOfLines={1} style={styles.profileStarted}>Started {todayLabel}</Text>
          {habitFocus ? <Text numberOfLines={1} style={styles.profileFocus}>Focus: {habitFocus}</Text> : null}
        </View>
      </View>

      <View style={styles.pstatGrid}>
        <ProfileStat value={rituals.length} label="Total rituals" />
        <ProfileStat value={best} label="Best streak" />
        <ProfileStat value={daysActive} label="Days active" />
      </View>

      {profileIncomplete ? (
        <LinearGradient colors={habitPalette.food.bg} style={styles.profileSetupPrompt}>
          <View style={styles.profileSetupPromptIcon}>
            <ShieldCheck size={18} color={habitPalette.food.ink} strokeWidth={2.5} />
          </View>
          <View style={styles.profileSetupPromptCopy}>
            <Text style={styles.profileSetupPromptTitle}>Finish profile setup</Text>
            <Text style={styles.profileSetupPromptText}>Add your details so reminders and coaching can stay personal.</Text>
          </View>
          <Pressable accessibilityRole="button" onPress={onOpenProfileSetup} style={styles.profileSetupPromptButton}>
            <Text style={styles.profileSetupPromptButtonText}>Complete</Text>
          </Pressable>
        </LinearGradient>
      ) : null}

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
        <ToneRow value={settings.floTone} onChange={(value) => onSettingChange('floTone', value)} />
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
  accent = colors.blue1,
  trackColor = colors.track,
  textColor = colors.ink,
  subTextColor = colors.inkSoft,
}: {
  percent: number;
  size: number;
  variant: 'hero' | 'mini';
  palette: HabitPalette;
  reduceMotion: boolean;
  centerIcon?: string;
  accent?: string;
  trackColor?: string;
  textColor?: string;
  subTextColor?: string;
}) {
  const stroke = variant === 'hero' ? 10 : 0;
  const ringId = useRef(`ring${Math.random().toString(36).slice(2)}`).current;
  const visualPercent = percent >= 100 ? 100 : clamp(percent, 4, 96);
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

  return (
    <View style={[styles.ringStack, { width: size, height: size }]}>
      {variant === 'hero' ? (
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={StyleSheet.absoluteFill}>
          <Defs>
            <SvgLinearGradient id={`arc-${ringId}`} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor={accent} />
              <Stop offset="100%" stopColor={palette.b} />
            </SvgLinearGradient>
          </Defs>
          <Circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={trackColor} strokeWidth={stroke} />
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
            <Text style={[styles.liquidNum, { color: textColor }]}>
              {displayPercent}
              <Text style={[styles.liquidNumSuffix, { color: subTextColor }]}>%</Text>
            </Text>
            <Text style={[styles.liquidSub, { color: subTextColor }]}>of daily goal</Text>
          </View>
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
  const now = useMinuteNow();
  const todayLabel = useMemo(() => formatLiveDateTime(now), [now]);

  return (
    <View style={styles.topRow}>
      <View style={styles.screenHeaderCopy}>
        <Text style={styles.screenTitle}>{title}</Text>
        <Text numberOfLines={1} style={styles.screenHeaderSub}>{todayLabel}</Text>
      </View>
      <View style={styles.bellButton}>
        <Icon size={19} color={colors.ink} strokeWidth={2.3} />
      </View>
    </View>
  );
}

function HeaderStats({
  metrics,
  activeMetricId,
  onToggle,
}: {
  metrics: HeaderMetric[];
  activeMetricId: HeaderMetric['id'] | null;
  onToggle: (id: HeaderMetric['id'] | null) => void;
}) {
  return (
    <View style={styles.headerStatsRow}>
      {metrics.map((metric) => (
        <Pressable
          key={metric.id}
          accessibilityRole="button"
          accessibilityLabel={metric.label}
          onPress={() => onToggle(activeMetricId === metric.id ? null : metric.id)}
          style={[styles.headerStatPill, activeMetricId === metric.id && { borderColor: metric.color }]}
        >
          <Text style={styles.headerStatIcon}>{metric.icon}</Text>
          <CountUpText value={metric.value} trigger={`${metric.id}-${metric.value}`} style={styles.headerStatValue} />
        </Pressable>
      ))}
    </View>
  );
}

function HeaderMetricTooltip({ metric }: { metric: HeaderMetric }) {
  return (
    <View style={styles.headerTooltip}>
      <Text style={[styles.headerTooltipIcon, { color: metric.color }]}>{metric.icon}</Text>
      <Text style={styles.headerTooltipText}>{metric.label}</Text>
    </View>
  );
}

function StatusRow({
  icon,
  name,
  streakDays,
  done,
  completedAt,
  pct,
  palette,
}: {
  icon: string;
  name: string;
  streakDays: number;
  done: boolean;
  completedAt: number | null;
  pct: string;
  palette: HabitPalette;
}) {
  return (
    <View style={styles.statusRow}>
      <View style={[styles.statusIcon, { backgroundColor: palette.bg[0] }]}>
        <Text style={styles.statusIconText}>{icon}</Text>
      </View>
      <View style={styles.statusCopy}>
        <Text numberOfLines={1} style={styles.statusName}>{name}</Text>
        <Text numberOfLines={1} style={styles.statusSub}>
          {streakDays} day streak
          {done && typeof completedAt === 'number' ? <Text style={{ color: palette.a }}> · ✓ {fmtHour(completedAt)}</Text> : null}
        </Text>
      </View>
      <Text style={[styles.statusPct, { color: done ? habitPalette.food.ink : habitPalette.reading.ink }]}>{pct}</Text>
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
  intensity,
  newest,
  palette,
  delay,
  reduceMotion,
  trigger,
}: {
  intensity: number;
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

  const bucket = clamp(Math.ceil(intensity * 4), 0, 4);
  const active = bucket > 0;
  const activeColor = ['rgba(120,140,180,0.12)', `${palette.a}24`, `${palette.a}44`, `${palette.a}66`, palette.a][bucket];

  return (
    <Animated.View
      style={[
        styles.heatCell,
        {
          opacity: progress,
          transform: [{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }],
          backgroundColor: activeColor,
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

function ToneRow({ value, onChange }: { value: FloTone; onChange: (value: FloTone) => void }) {
  const options: Array<{ value: FloTone; label: string }> = [
    { value: 'gentle', label: 'Gentle' },
    { value: 'direct', label: 'Direct' },
    { value: 'coach', label: 'Coach' },
  ];
  return (
    <View style={styles.settingRowTall}>
      <View style={styles.settingRowTop}>
        <View style={styles.settingIcon}>
          <Bot size={17} color={colors.ink} strokeWidth={2.3} />
        </View>
        <Text style={styles.settingName}>Flo's check-in style</Text>
      </View>
      <View style={styles.toneSegment}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onChange(option.value)}
              style={[styles.toneSegmentButton, selected && styles.toneSegmentButtonActive]}
            >
              <Text style={[styles.toneSegmentText, selected && styles.toneSegmentTextActive]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
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
  const compactLauncher = width >= TABLET_MIN_WIDTH;
  const launcherWidth = compactLauncher ? ASK_FLO_HEIGHT : ASK_FLO_WIDTH;
  const edgePadding = compactLauncher ? 22 : ASK_FLO_EDGE_PADDING;
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
    const minX = edgePadding;
    const minY = Math.max(topInset + edgePadding, edgePadding);
    const maxX = Math.max(minX, width - launcherWidth - edgePadding);
    const navTop = height - bottomInset - NAV_BOTTOM_OFFSET - NAV_HEIGHT;
    const maxY = Math.max(minY, navTop - ASK_FLO_NAV_GAP - ASK_FLO_HEIGHT);
    return { minX, minY, maxX, maxY };
  }, [bottomInset, edgePadding, height, launcherWidth, topInset, width]);

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
      <Reanimated.View style={[styles.askFloLauncher, { width: launcherWidth }, animatedStyle]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Ask Flo" onPress={handlePress} style={[styles.askFloPressable, { width: launcherWidth }, compactLauncher && styles.askFloPressableCompact]}>
          <View style={[styles.askFloLabel, compactLauncher && styles.hidden]}>
            <Text style={styles.askFloLabelText}>Ask Flo ✨</Text>
          </View>
          <LinearGradient colors={[colors.blue1, '#2E8FE8']} start={{ x: 0.15, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.askFloButton, compactLauncher && styles.askFloButtonCompact]}>
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
  const { height, width } = useWindowDimensions();
  const isTablet = width >= TABLET_MIN_WIDTH;
  const sheetMaxWidth = width >= TABLET_MIN_WIDTH
    ? responsiveMaxWidth(width, SHEET_TABLET_MAX_WIDTH, 24)
    : undefined;
  const sheetHeight = isTablet
    ? Math.min(640, height - insets.top - insets.bottom - 48)
    : Math.min(Math.max(520, height * 0.86), height - insets.top - 12);

  return (
    <Modal transparent visible={open} animationType="slide" onRequestClose={onClose}>
      <View style={styles.coachSheetRoot}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close Ask Flo" onPress={onClose} style={styles.coachSheetOverlay} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.coachSheetKeyboard, isTablet && styles.coachSheetKeyboardTablet]}>
          <View
            style={[
              styles.coachSheet,
              isTablet && styles.coachSheetTablet,
              {
                height: sheetHeight,
                maxHeight: sheetHeight,
                maxWidth: sheetMaxWidth,
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
  const { width } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const activeIndex = activeTab === 'today' ? 0 : activeTab === 'progress' ? 1 : activeTab === 'insights' ? 3 : 4;
  const mounted = useRef(new Animated.Value(0)).current;
  const indicator = useRef(new Animated.Value(activeIndex)).current;
  const rimSpin = useRef(new Animated.Value(0)).current;
  const sweep = useRef(new Animated.Value(0)).current;
  const itemWidth = width < 380 ? 44 : 48;
  const gap = width < 380 ? 14 : 18;
  const padX = width < 380 ? 18 : 22;
  const step = itemWidth + gap;
  const navWidth = itemWidth * 5 + gap * 4 + padX * 2;
  const navSideOffset = width >= TABLET_MIN_WIDTH
    ? Math.max(24, (width - NAV_TABLET_MAX_WIDTH) / 2)
    : 14;
  const navBottom = Platform.OS === 'android' ? 24 : Math.max(20, bottomInset + 8);
  const clampedNavWidth = Math.min(navWidth, width - navSideOffset * 2);
  const rimRotation = rimSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const sweepTranslate = sweep.interpolate({
    inputRange: [0, 0.15, 0.5, 0.85, 1],
    outputRange: [-clampedNavWidth * 0.52, -clampedNavWidth * 0.18, clampedNavWidth * 0.38, clampedNavWidth * 0.86, clampedNavWidth * 1.08],
  });
  const sweepOpacity = sweep.interpolate({
    inputRange: [0, 0.15, 0.5, 0.85, 1],
    outputRange: [0, 0.5, 0.5, 0, 0],
  });

  useEffect(() => {
    Animated.timing(mounted, {
      toValue: 1,
      duration: reduceMotion ? 1 : 520,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [mounted, reduceMotion]);

  useEffect(() => {
    Animated.spring(indicator, {
      toValue: activeIndex,
      speed: reduceMotion ? 100 : 18,
      bounciness: reduceMotion ? 0 : 8,
      useNativeDriver: true,
    }).start();
  }, [activeIndex, indicator, reduceMotion]);

  useEffect(() => {
    if (reduceMotion) {
      return undefined;
    }
    const rimLoop = Animated.loop(
      Animated.timing(rimSpin, {
        toValue: 1,
        duration: 11000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    const sweepLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(sweep, {
          toValue: 1,
          duration: 6500,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(sweep, {
          toValue: 0,
          duration: 1,
          useNativeDriver: true,
        }),
      ]),
    );
    rimLoop.start();
    sweepLoop.start();
    return () => {
      rimLoop.stop();
      sweepLoop.stop();
    };
  }, [reduceMotion, rimSpin, sweep]);

  return (
    <Animated.View
      style={[
        styles.glassNavShell,
        {
          bottom: navBottom,
          left: navSideOffset,
          right: navSideOffset,
          opacity: mounted,
          transform: [{ translateY: mounted.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }],
        },
      ]}
    >
      <View style={[styles.glassNavRim, { width: clampedNavWidth }]}>
        <Animated.View pointerEvents="none" style={[styles.glassNavRimSpin, { transform: [{ rotate: rimRotation }] }]}>
          <LinearGradient
            colors={[
              'rgba(255,255,255,0.95)',
              'rgba(255,255,255,0.26)',
              'rgba(210,218,255,0.98)',
              'rgba(255,255,255,0.22)',
              'rgba(255,255,255,0.95)',
            ]}
            locations={[0, 0.24, 0.55, 0.76, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.glassNavRimSpinGradient}
          />
        </Animated.View>
        <LinearGradient
          colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.06)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[styles.glassNavPill, { paddingHorizontal: padX }]}
        >
          <View pointerEvents="none" style={styles.glassNavSheen} />
          <Animated.View
            pointerEvents="none"
            style={[
              styles.glassNavSweep,
              {
                width: clampedNavWidth * 0.4,
                opacity: sweepOpacity,
                transform: [{ translateX: sweepTranslate }, { skewX: '-18deg' }],
              },
            ]}
          >
            <LinearGradient
              colors={['transparent', 'rgba(255,255,255,0.35)', 'transparent']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.glassNavSweepGradient}
            />
          </Animated.View>
          <View style={[styles.glassNavRow, { gap }]}>
            <Animated.View
              pointerEvents="none"
              style={[
                styles.glassNavIndicator,
                {
                  width: itemWidth,
                  transform: [{ translateX: indicator.interpolate({ inputRange: [0, 4], outputRange: [0, step * 4] }) }],
                },
              ]}
            />
            <NavItem tab="today" label="Home" icon={Home} itemWidth={itemWidth} activeTab={activeTab} onChange={onChange} />
            <NavItem tab="progress" label="Progress" icon={Clock3} itemWidth={itemWidth} activeTab={activeTab} onChange={onChange} />
            <Pressable accessibilityRole="button" accessibilityLabel="Add ritual" onPress={onAdd} style={[styles.glassNavItem, { width: itemWidth }]}>
              <LinearGradient colors={['#9D8BF5', '#6653D8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.glassNavAdd}>
                <Plus size={16} color="#FFFFFF" strokeWidth={2.5} />
              </LinearGradient>
              <Text style={styles.glassNavLabel}>Add</Text>
            </Pressable>
            <NavItem tab="insights" label="Insights" icon={PieChart} itemWidth={itemWidth} activeTab={activeTab} onChange={onChange} />
            <NavItem tab="profile" label="Profile" icon={User} itemWidth={itemWidth} activeTab={activeTab} onChange={onChange} />
          </View>
        </LinearGradient>
      </View>
    </Animated.View>
  );
}

function NavItem({
  tab,
  label,
  icon: Icon,
  itemWidth,
  activeTab,
  onChange,
}: {
  tab: TabKey;
  label: string;
  icon: IconComponent;
  itemWidth: number;
  activeTab: TabKey;
  onChange: (tab: TabKey) => void;
}) {
  const active = tab === activeTab;
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      onPress={() => onChange(tab)}
      style={[styles.glassNavItem, { width: itemWidth }, active && styles.glassNavItemActive]}
    >
      <Icon size={20} color={active ? '#FFFFFF' : 'rgba(255,255,255,0.7)'} strokeWidth={active ? 2.35 : 1.9} />
      <Text style={[styles.glassNavLabel, active && styles.glassNavLabelActive]}>{label}</Text>
    </Pressable>
  );
}

function RitualPreviewCard({ ritual, reduceMotion }: { ritual: Ritual; reduceMotion: boolean }) {
  const palette = habitPalette[ritual.paletteKey];
  const goal = goalLabel(ritual.goalAmount, ritual.goalUnit);

  return (
    <View style={styles.ritualPreviewWrap}>
      <Text style={styles.ritualPreviewLabel}>Live preview</Text>
      <LinearGradient colors={palette.bg} style={[styles.ritualCard, styles.ritualPreviewCard]}>
        <View style={styles.ritualTop}>
          <LiquidRing
            percent={ritual.doneToday ? 100 : 42}
            size={46}
            variant="mini"
            palette={palette}
            reduceMotion={reduceMotion}
            centerIcon={ritual.icon}
          />
          <View style={styles.ritualCheck}>
            <View style={styles.ritualCheckEmpty}>
              <Check size={15} color="#FFFFFF" strokeWidth={3} />
            </View>
          </View>
        </View>
        <View>
          <Text numberOfLines={2} style={styles.ritualName}>{ritual.name}</Text>
          {goal || ritual.reminderTime ? (
            <Text numberOfLines={1} style={[styles.ritualGoal, { color: palette.ink }]}>
              {[goal, ritual.reminderTime ? formatReminderTime(ritual.reminderTime) : ''].filter(Boolean).join(' · ')}
            </Text>
          ) : null}
          <View style={styles.ritualStreakRow}>
            <Text style={[styles.ritualStreak, { color: palette.ink }]}>🔥 0 day streak</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

function AddRitualSheet({
  open,
  editingRitual = null,
  onClose,
  onAdd,
  onUpdate,
  onDelete,
  reduceMotion,
}: {
  open: boolean;
  editingRitual?: Ritual | null;
  onClose: () => void;
  onAdd: (input: CreateRitualInput) => void | Promise<void>;
  onUpdate?: (ritualId: string, input: CreateRitualInput) => void | Promise<void>;
  onDelete?: (ritualId: string) => void | Promise<void>;
  reduceMotion: boolean;
}) {
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const isTablet = width >= TABLET_MIN_WIDTH;
  const [mounted, setMounted] = useState(open);
  const [name, setName] = useState('');
  const [why, setWhy] = useState('');
  const [selectedIconKey, setSelectedIconKey] = useState<PaletteKey>('water');
  const [trackAmount, setTrackAmount] = useState(false);
  const [amount, setAmount] = useState('');
  const [goalUnit, setGoalUnit] = useState<GoalUnit>('liters');
  const [reminderTime, setReminderTime] = useState<string | undefined>('20:00');
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const overlay = useRef(new Animated.Value(0)).current;
  const sheetY = useRef(new Animated.Value(420)).current;
  const isEditing = Boolean(editingRitual);
  const selectedIcon = iconOptionForKey(selectedIconKey);
  const parsedAmount = Number(amount.replace(',', '.'));
  const amountValid = !trackAmount || (Number.isFinite(parsedAmount) && parsedAmount > 0);
  const previewName = name.trim() || 'Evening stretch';
  const previewGoalAmount = trackAmount && amountValid ? parsedAmount : undefined;
  const sheetMaxWidth = isTablet
    ? responsiveMaxWidth(width, SHEET_TABLET_MAX_WIDTH, 24)
    : undefined;
  const sheetMaxHeight = isTablet
    ? Math.min(640, height - insets.top - insets.bottom - 48)
    : height - insets.top - 16;
  const previewRitual: Ritual = {
    id: 'preview',
    name: previewName,
    icon: selectedIcon.icon,
    paletteKey: selectedIcon.key,
    why: why.trim() || undefined,
    goalAmount: previewGoalAmount,
    goalUnit: previewGoalAmount ? goalUnit : undefined,
    reminderTime,
    streakDays: 0,
    bestStreakDays: 0,
    doneToday: false,
    weekly: [0, 0, 0, 0, 0, 0, 0],
    heat: Array.from({ length: 30 }, () => 0),
    createdAt: Date.now(),
  };

  useEffect(() => {
    if (!open) {
      return;
    }
    const hasGoal = typeof editingRitual?.goalAmount === 'number' && Number.isFinite(editingRitual.goalAmount);
    setName(editingRitual?.name ?? '');
    setWhy(editingRitual?.why ?? '');
    setSelectedIconKey(editingRitual?.paletteKey ?? 'water');
    setTrackAmount(hasGoal);
    setAmount(hasGoal ? String(editingRitual?.goalAmount) : '');
    setGoalUnit(editingRitual?.goalUnit ?? 'liters');
    setReminderTime(editingRitual?.reminderTime ?? '20:00');
    setTimePickerOpen(false);
    setHasError(false);
    setConfirmDelete(false);
  }, [editingRitual?.id, open]);

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
    if (!trimmed || !amountValid) {
      setHasError(true);
      return;
    }
    const draft: CreateRitualInput = {
      name: trimmed,
      icon: selectedIcon.icon,
      paletteKey: selectedIcon.key,
      why: why.trim() || undefined,
      goalAmount: trackAmount ? parsedAmount : undefined,
      goalUnit: trackAmount ? goalUnit : undefined,
      reminderTime,
    };

    try {
      if (isEditing && editingRitual && onUpdate) {
        await onUpdate(editingRitual.id, draft);
      } else {
        await onAdd(draft);
      }
    } catch {
      return;
    }

    setName('');
    setWhy('');
    setSelectedIconKey('water');
    setTrackAmount(false);
    setAmount('');
    setGoalUnit('liters');
    setReminderTime('20:00');
    setHasError(false);
    setConfirmDelete(false);
    onClose();
  };

  const handleDelete = async () => {
    if (!editingRitual || !onDelete) {
      return;
    }
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    try {
      await onDelete(editingRitual.id);
    } catch {
      return;
    }
    setConfirmDelete(false);
    onClose();
  };

  const applyTemplate = (template: typeof ritualTemplates[number]) => {
    setName(template.name);
    setWhy('');
    setSelectedIconKey(template.iconKey);
    setTrackAmount(true);
    setAmount(String(template.goalAmount));
    setGoalUnit(template.goalUnit);
    setReminderTime(template.reminderTime);
    setHasError(false);
    setConfirmDelete(false);
  };

  const cycleUnit = () => {
    setGoalUnit((current) => goalUnits[(goalUnits.indexOf(current) + 1) % goalUnits.length]);
  };

  if (!mounted) {
    return null;
  }

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.modalRoot, isTablet && styles.modalRootTablet]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
          <Animated.View style={[styles.modalOverlay, { opacity: overlay }]} />
        </Pressable>
        <Animated.View
          style={[
            styles.modalSheet,
            isTablet && styles.modalSheetTablet,
            {
              maxHeight: sheetMaxHeight,
              maxWidth: sheetMaxWidth,
              paddingBottom: Math.max(insets.bottom, 18) + 12,
              transform: [{ translateY: sheetY }],
            },
          ]}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.modalSheetContent}
          >
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>{isEditing ? 'Edit ritual' : 'New ritual'}</Text>

          <RitualPreviewCard ritual={previewRitual} reduceMotion={reduceMotion} />

          {!isEditing ? (
            <>
              <Text style={styles.fieldLabel}>Quick start</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.templateChipRow}>
                {ritualTemplates.map((template) => (
                  <Pressable key={template.label} accessibilityRole="button" onPress={() => applyTemplate(template)} style={styles.templateChip}>
                    <Text style={styles.templateChipText}>{template.label}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </>
          ) : null}

          <Text style={styles.fieldLabel}>Name</Text>
          <TextInput
            value={name}
            onChangeText={(value) => {
              setName(value);
              setConfirmDelete(false);
              if (hasError) {
                setHasError(false);
              }
            }}
            placeholder={hasError ? 'Enter a name first' : isEditing ? 'Ritual name' : 'Evening stretch'}
            placeholderTextColor={hasError ? colors.danger : colors.inkFaint}
            style={[styles.fieldInput, hasError && styles.fieldInputError]}
            returnKeyType="next"
          />
          <Text style={styles.fieldLabel}>Why this ritual?</Text>
          <TextInput
            value={why}
            onChangeText={(value) => {
              setWhy(value.slice(0, 140));
              setConfirmDelete(false);
            }}
            placeholder="helps me disconnect before bed"
            placeholderTextColor={colors.inkFaint}
            style={[styles.fieldInput, styles.fieldInputMultiline]}
            multiline
            returnKeyType="done"
          />
          <Text style={styles.fieldLabel}>Icon</Text>
          <View style={styles.iconLibraryGrid}>
            {ritualIconLibrary.map((option) => {
              const selected = option.key === selectedIconKey;
              const palette = habitPalette[option.key];
              return (
              <Pressable
                key={option.key}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`${option.label} icon`}
                onPress={() => {
                  setSelectedIconKey(option.key);
                  setConfirmDelete(false);
                }}
                style={[styles.iconLibraryTile, selected && { borderColor: palette.a, shadowColor: palette.a, shadowOpacity: 0.25, elevation: 3 }]}
              >
                <Text style={styles.iconLibraryEmoji}>{option.icon}</Text>
                <Text numberOfLines={1} style={styles.iconLibraryLabel}>{option.label}</Text>
              </Pressable>
              );
            })}
          </View>

          <Pressable
            accessibilityRole="switch"
            accessibilityState={{ checked: trackAmount }}
            onPress={() => {
              setTrackAmount((current) => !current);
              setConfirmDelete(false);
            }}
            style={styles.amountToggleRow}
          >
            <View>
              <Text style={styles.amountToggleTitle}>Track a daily amount</Text>
              <Text style={styles.amountToggleSub}>Optional goal or quantity tracking</Text>
            </View>
            <View style={[styles.amountSwitch, trackAmount && styles.amountSwitchOn]}>
              <View style={[styles.amountSwitchKnob, trackAmount && styles.amountSwitchKnobOn]} />
            </View>
          </Pressable>

          {trackAmount ? (
            <View style={styles.amountRow}>
              <TextInput
                value={amount}
                onChangeText={(value) => {
                  setAmount(value.replace(/[^0-9.]/g, '').slice(0, 6));
                  setConfirmDelete(false);
                  if (hasError) {
                    setHasError(false);
                  }
                }}
                placeholder="4"
                placeholderTextColor={colors.inkFaint}
                keyboardType="decimal-pad"
                style={[styles.fieldInput, styles.amountInput, hasError && !amountValid && styles.fieldInputError]}
              />
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  cycleUnit();
                  setConfirmDelete(false);
                }}
                style={styles.unitButton}
              >
                <Text style={styles.unitButtonText}>{goalUnit}</Text>
              </Pressable>
            </View>
          ) : null}

          <Text style={styles.fieldLabel}>Remind me</Text>
          <View style={styles.reminderChipRow}>
            {reminderPresets.map((preset) => (
              <Pressable
                key={preset.value}
                accessibilityRole="button"
                accessibilityState={{ selected: reminderTime === preset.value }}
                onPress={() => {
                  setReminderTime(preset.value);
                  setConfirmDelete(false);
                }}
                style={[styles.reminderChip, reminderTime === preset.value && styles.reminderChipSelected]}
              >
                <Text style={[styles.reminderChipText, reminderTime === preset.value && styles.reminderChipTextSelected]}>{preset.label}</Text>
              </Pressable>
            ))}
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setTimePickerOpen(true);
                setConfirmDelete(false);
              }}
              style={[styles.reminderChip, reminderTime && !reminderPresets.some((preset) => preset.value === reminderTime) && styles.reminderChipSelected]}
            >
              <Text style={[styles.reminderChipText, reminderTime && !reminderPresets.some((preset) => preset.value === reminderTime) && styles.reminderChipTextSelected]}>
                {reminderTime && !reminderPresets.some((preset) => preset.value === reminderTime) ? formatReminderTime(reminderTime) : 'Custom'}
              </Text>
            </Pressable>
          </View>
          <Text style={styles.reminderExplain}>{ritualReminderExplanation(previewName, previewGoalAmount, previewGoalAmount ? goalUnit : undefined, reminderTime)}</Text>
          {timePickerOpen ? (
            <DateTimePicker
              mode="time"
              value={dateFromReminderTime(reminderTime ?? '20:00')}
              display="default"
              onChange={(_, selectedDate) => {
                if (Platform.OS === 'android') {
                  setTimePickerOpen(false);
                }
                if (selectedDate) {
                  setReminderTime(timeValueFromDate(selectedDate));
                  setConfirmDelete(false);
                }
              }}
            />
          ) : null}

          {isEditing ? (
            <Pressable accessibilityRole="button" onPress={handleDelete} style={[styles.deleteRitualButton, confirmDelete && styles.deleteRitualButtonConfirm]}>
              <Trash2 size={16} color={colors.danger} strokeWidth={2.5} />
              <Text style={styles.deleteRitualText}>{confirmDelete ? 'Tap again to delete' : 'Delete ritual'}</Text>
            </Pressable>
          ) : null}

          <View style={styles.modalActions}>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.btnSecondary}>
              <Text style={styles.btnSecondaryText}>Cancel</Text>
            </Pressable>
            <Pressable accessibilityRole="button" disabled={!name.trim() || !amountValid} onPress={submit} style={[styles.btnPrimary, (!name.trim() || !amountValid) && styles.btnPrimaryDisabled]}>
              <Text style={styles.btnPrimaryText}>{isEditing ? 'Save changes' : 'Add ritual'}</Text>
            </Pressable>
          </View>
          </ScrollView>
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

function DropletIcon({ color = colors.blue1 }: { color?: string }) {
  return (
    <Svg width={16} height={18} viewBox="0 0 16 18">
      <Defs>
        <SvgLinearGradient id="droplet" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor={color} />
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
  hidden: {
    display: 'none',
  },
  launchSplash: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 100,
    elevation: 100,
    backgroundColor: '#0B1330',
    alignItems: 'center',
    justifyContent: 'center',
  },
  launchSkip: {
    position: 'absolute',
    top: 24,
    right: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  launchSkipText: {
    fontFamily: fontBodyBold,
    fontSize: 11,
    color: 'rgba(255,255,255,0.56)',
  },
  launchMarkWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  launchCopy: {
    alignItems: 'center',
    marginTop: 22,
  },
  launchTitle: {
    fontFamily: fontSerifSemi,
    fontSize: 30,
    color: '#F4F8FF',
  },
  launchTagline: {
    fontFamily: fontBodyBold,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: '#8FA0C4',
    marginTop: 8,
  },
  launchLoadingRow: {
    position: 'absolute',
    bottom: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  launchLoadingText: {
    fontFamily: fontBodyBold,
    fontSize: 11,
    color: '#7C8AA6',
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
  authScrollSplit: {
    justifyContent: 'center',
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
  authPanel: {
    width: '100%',
  },
  authPanelSplit: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 24,
  },
  authHeroPane: {
    flex: 1.05,
    minWidth: 0,
  },
  authHero: {
    minHeight: 300,
    marginHorizontal: -20,
    marginTop: -10,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  authHeroSplit: {
    flex: 1,
    minHeight: 500,
    marginHorizontal: 0,
    marginTop: 0,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  authHeroCompact: {
    minHeight: 188,
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
    top: 112,
    height: 78,
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
  authHeroContentCompact: {
    justifyContent: 'flex-start',
    paddingTop: 26,
  },
  authHeroContentSplit: {
    flex: 1,
    paddingHorizontal: 36,
    paddingTop: 0,
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
  logoMarkInline: {
    marginBottom: 0,
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
  authHeroTitleSplit: {
    fontSize: 34,
    lineHeight: 40,
  },
  authHeroSubtitleSplit: {
    maxWidth: 300,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
  },
  authCardWrap: {
    width: '100%',
    marginTop: -46,
  },
  authCardWrapCreate: {
    marginTop: 12,
  },
  authCardWrapSplit: {
    flex: 0.95,
    minWidth: 0,
    maxWidth: 470,
    alignSelf: 'center',
    marginTop: 0,
  },
  authCard: {
    borderRadius: 32,
    padding: 22,
  },
  authCardTablet: {
    padding: 24,
  },
  authCardCreate: {
    marginTop: 30,
  },
  authCardCreateSplit: {
    marginTop: 0,
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
  authPrimaryButtonDisabled: {
    opacity: 0.48,
    shadowOpacity: 0.08,
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
  onboardingScroll: {
    flexGrow: 1,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  onboardingProgress: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 22,
  },
  onboardingProgressDot: {
    width: 32,
    height: 6,
    borderRadius: 999,
  },
  onboardingProgressDotActive: {
    backgroundColor: colors.blue1,
  },
  onboardingProgressDotEmpty: {
    backgroundColor: 'rgba(120,140,180,0.18)',
  },
  onboardingHeader: {
    alignItems: 'center',
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  onboardingTitle: {
    fontFamily: fontSerifSemi,
    fontSize: 26,
    lineHeight: 32,
    color: colors.ink,
    textAlign: 'center',
    marginTop: 8,
  },
  onboardingSubtitle: {
    fontFamily: fontBodySemi,
    fontSize: 13,
    lineHeight: 19,
    color: colors.inkSoft,
    textAlign: 'center',
    marginTop: 7,
    maxWidth: 360,
  },
  dreamGrid: {
    gap: 10,
    marginBottom: 14,
  },
  dreamCard: {
    minHeight: 74,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(120,140,180,0.14)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 13,
    shadowColor: '#4060A0',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 2,
  },
  dreamIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dreamIconText: {
    fontSize: 21,
  },
  dreamCopy: {
    flex: 1,
    minWidth: 0,
  },
  dreamTitle: {
    fontFamily: fontSerifSemi,
    fontSize: 15.5,
    color: colors.ink,
  },
  dreamDescription: {
    fontFamily: fontBodySemi,
    fontSize: 12,
    color: colors.inkSoft,
    marginTop: 3,
  },
  dreamSelected: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.blue1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onboardingNote: {
    borderRadius: 18,
    backgroundColor: 'rgba(79,168,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(79,168,255,0.2)',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 13,
    marginBottom: 16,
  },
  onboardingNoteText: {
    flex: 1,
    fontFamily: fontBodySemi,
    fontSize: 12,
    lineHeight: 17,
    color: colors.ink,
  },
  starterList: {
    gap: 10,
    marginBottom: 18,
  },
  starterRow: {
    minHeight: 70,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(120,140,180,0.14)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    ...shadow,
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  starterIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starterIconText: {
    fontSize: 19,
  },
  starterCopy: {
    flex: 1,
    minWidth: 0,
  },
  starterName: {
    fontFamily: fontSerifSemi,
    fontSize: 15,
    color: colors.ink,
  },
  starterMeta: {
    fontFamily: fontBodyBold,
    fontSize: 11.5,
    color: colors.inkSoft,
    marginTop: 3,
  },
  profileSetupScroll: {
    flexGrow: 1,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  profileSetupTopBar: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  profileSetupBackButton: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(120,140,180,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  profileSetupSkip: {
    fontFamily: fontBodyExtra,
    fontSize: 12.5,
    color: colors.blue1,
  },
  profileProgress: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 28,
  },
  profileProgressSegment: {
    flex: 1,
    height: 5,
    borderRadius: 999,
  },
  profileProgressSegmentEmpty: {
    backgroundColor: 'rgba(120,140,180,0.18)',
  },
  profileSetupHeader: {
    alignItems: 'center',
    paddingHorizontal: 10,
    marginBottom: 18,
  },
  profileSetupTitle: {
    fontFamily: fontSerifBold,
    fontSize: 26,
    lineHeight: 31,
    color: colors.ink,
    textAlign: 'center',
  },
  profileSetupSubtitle: {
    fontFamily: fontBody,
    fontSize: 13,
    lineHeight: 19,
    color: colors.inkSoft,
    textAlign: 'center',
    marginTop: 7,
    maxWidth: 350,
  },
  profileSetupCard: {
    borderRadius: 32,
    padding: 22,
  },
  profileTwoColumn: {
    flexDirection: 'row',
    gap: 10,
  },
  profileHalfField: {
    flex: 1,
    minWidth: 0,
  },
  floatingField: {
    marginBottom: 14,
  },
  floatingInputShell: {
    minHeight: 56,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(120,140,180,0.16)',
    backgroundColor: '#F5F8FC',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  floatingInputContent: {
    flex: 1,
    minWidth: 0,
    height: 48,
    justifyContent: 'flex-end',
  },
  floatingLabel: {
    position: 'absolute',
    left: 0,
    fontFamily: fontBodyExtra,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  floatingInput: {
    flex: 1,
    minWidth: 0,
    fontFamily: fontBodyRegular,
    fontSize: 14,
    lineHeight: 19,
    color: colors.ink,
    paddingTop: 18,
    paddingBottom: Platform.OS === 'ios' ? 7 : 3,
  },
  profileChoiceGroup: {
    marginBottom: 14,
  },
  profileChoiceLabel: {
    fontFamily: fontBodyBold,
    fontSize: 11.5,
    color: colors.inkSoft,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 8,
    paddingLeft: 4,
  },
  profileChoiceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  profileChoiceChip: {
    minHeight: 36,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(120,140,180,0.16)',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  profileChoiceChipSelected: {
    borderColor: colors.blue1,
    shadowColor: colors.blue1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 5,
    elevation: 3,
  },
  profileChoiceDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.inkFaint,
  },
  profileChoiceDotSelected: {
    backgroundColor: colors.blue1,
  },
  profileChoiceText: {
    fontFamily: fontBodyBold,
    fontSize: 12,
    color: colors.ink,
  },
  profileChoiceTextSelected: {
    color: colors.ink,
  },
  mobilePrefix: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingRight: 2,
  },
  mobileFlag: {
    fontSize: 14,
  },
  mobileCode: {
    fontFamily: fontBodyBold,
    fontSize: 13,
    color: colors.ink,
  },
  profileContinueButton: {
    marginTop: 2,
  },
  privacyNote: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    marginTop: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(51,203,161,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(51,203,161,0.22)',
    padding: 12,
  },
  privacyIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(51,203,161,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacyText: {
    flex: 1,
    fontFamily: fontBodySemi,
    fontSize: 11.5,
    lineHeight: 17,
    color: habitPalette.food.ink,
  },
  profileBubbleHost: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  profileBubble: {
    position: 'absolute',
    bottom: -36,
    backgroundColor: colors.blue1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
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
  coachSheetKeyboardTablet: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  coachSheet: {
    height: '82%',
    width: '100%',
    alignSelf: 'center',
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
  coachSheetTablet: {
    borderRadius: 30,
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
    flexGrow: 1,
  },
  coachListFrame: {
    flex: 1,
    minHeight: 0,
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
    paddingVertical: 6,
    paddingRight: 18,
  },
  quickReplyWrap: {
    height: 48,
    flexShrink: 0,
    justifyContent: 'center',
  },
  quickReplyScroll: {
    flexGrow: 0,
  },
  quickReplyChip: {
    height: 34,
    maxWidth: 220,
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
    maxWidth: 190,
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
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: NAV_HEIGHT + 30,
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
  heroAdaptive: {
    minHeight: 300,
    borderRadius: 32,
    paddingTop: 18,
    paddingHorizontal: 20,
    paddingBottom: 20,
    marginBottom: 0,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    ...shadow,
  },
  heroAdaptiveComplete: {
    shadowColor: colors.green,
    shadowOpacity: 0.28,
    shadowRadius: 28,
    elevation: 12,
  },
  heroContent: {
    position: 'relative',
    zIndex: 1,
    alignItems: 'center',
  },
  heroCompleteOrb: {
    transform: [{ scale: 1.04 }],
    shadowColor: colors.green,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
  },
  heroCompleteBanner: {
    marginTop: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(51,203,161,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(51,203,161,0.28)',
    paddingVertical: 10,
    paddingHorizontal: 13,
  },
  heroCompleteText: {
    fontFamily: fontBodyBold,
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.ink,
    textAlign: 'center',
  },
  floCheckinCard: {
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(79,168,255,0.18)',
    padding: 14,
    marginTop: 14,
    marginBottom: 14,
    ...shadow,
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  floCheckinTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  floCheckinIcon: {
    width: 38,
    height: 38,
    borderRadius: 15,
    backgroundColor: 'rgba(79,168,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floCheckinCopy: {
    flex: 1,
    minWidth: 0,
  },
  floCheckinTitle: {
    fontFamily: fontSerifSemi,
    fontSize: 15,
    color: colors.ink,
  },
  floCheckinSub: {
    fontFamily: fontBody,
    fontSize: 11.5,
    lineHeight: 16,
    color: colors.inkSoft,
    marginTop: 2,
  },
  floQuestion: {
    fontFamily: fontBodyExtra,
    fontSize: 12,
    color: colors.ink,
    marginTop: 14,
    marginBottom: 9,
  },
  floChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  floReplyChip: {
    minHeight: 34,
    borderRadius: 999,
    backgroundColor: '#F3F6FB',
    borderWidth: 1,
    borderColor: 'rgba(120,140,180,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  floReplyText: {
    fontFamily: fontBodyBold,
    fontSize: 11.5,
    color: colors.ink,
  },
  floInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  floInput: {
    flex: 1,
    minHeight: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(120,140,180,0.18)',
    backgroundColor: '#F8FAFD',
    paddingHorizontal: 12,
    fontFamily: fontBodyRegular,
    fontSize: 13,
    color: colors.ink,
  },
  floSendButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.blue1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floInlineReply: {
    borderRadius: 18,
    backgroundColor: 'rgba(79,168,255,0.09)',
    borderWidth: 1,
    borderColor: 'rgba(79,168,255,0.16)',
    padding: 12,
    marginTop: 12,
  },
  floInlineLabel: {
    fontFamily: fontBodyExtra,
    fontSize: 11,
    color: colors.blue1,
    marginBottom: 4,
  },
  floInlineText: {
    fontFamily: fontBody,
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.ink,
  },
  floActionChip: {
    alignSelf: 'flex-start',
    minHeight: 32,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(79,168,255,0.22)',
    justifyContent: 'center',
    paddingHorizontal: 12,
    marginTop: 9,
  },
  floActionText: {
    fontFamily: fontBodyExtra,
    fontSize: 11.5,
    color: colors.blue1,
  },
  floPatternCard: {
    borderRadius: 22,
    backgroundColor: '#FFF8EA',
    borderWidth: 1,
    borderColor: 'rgba(240,163,50,0.22)',
    flexDirection: 'row',
    gap: 11,
    padding: 13,
    marginBottom: 14,
  },
  floPatternIcon: {
    width: 34,
    height: 34,
    borderRadius: 13,
    backgroundColor: 'rgba(240,163,50,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floPatternCopy: {
    flex: 1,
    minWidth: 0,
  },
  floPatternTitle: {
    fontFamily: fontBodyExtra,
    fontSize: 12.5,
    color: colors.ink,
  },
  floPatternText: {
    fontFamily: fontBody,
    fontSize: 11.8,
    lineHeight: 17,
    color: colors.inkSoft,
    marginTop: 3,
  },
  themeLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 4,
  },
  themeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  themeLabel: {
    fontFamily: fontBodyExtra,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.45,
  },
  nightStar: {
    position: 'absolute',
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#FFFFFF',
  },
  themeSwitcherScroll: {
    marginHorizontal: -20,
    marginBottom: 2,
  },
  themeSwitcherRow: {
    paddingTop: 14,
    paddingHorizontal: 20,
    paddingBottom: 4,
    gap: 8,
  },
  themeChip: {
    minHeight: 30,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(120,140,180,0.14)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 12,
    shadowColor: '#4060A0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 3,
  },
  themeChipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  themeChipText: {
    fontFamily: fontBodyBold,
    fontSize: 11.5,
    color: colors.ink,
  },
  headerStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    flexShrink: 0,
  },
  headerStatPill: {
    minWidth: 56,
    height: 38,
    borderRadius: 18,
    paddingHorizontal: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.82)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    shadowColor: '#4060A0',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  headerStatIcon: {
    fontSize: 13,
  },
  headerStatValue: {
    fontFamily: fontSerifBold,
    fontSize: 15,
    color: colors.ink,
  },
  headerTooltip: {
    alignSelf: 'flex-end',
    maxWidth: 260,
    borderRadius: 14,
    paddingVertical: 9,
    paddingHorizontal: 12,
    marginTop: -4,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(120,140,180,0.14)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    ...shadow,
  },
  headerTooltipIcon: {
    fontSize: 14,
  },
  headerTooltipText: {
    flex: 1,
    fontFamily: fontBodySemi,
    fontSize: 11.5,
    lineHeight: 16,
    color: colors.ink,
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
  rhythmCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 16,
    marginBottom: 18,
    ...shadow,
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  rhythmHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  rhythmTitle: {
    fontFamily: fontSerifSemi,
    fontSize: 17,
    color: colors.ink,
  },
  rhythmLogged: {
    fontFamily: fontBodyExtra,
    fontSize: 12,
    color: colors.inkSoft,
  },
  rhythmTrackWrap: {
    height: 112,
    justifyContent: 'center',
  },
  rhythmTrack: {
    height: 34,
    borderRadius: 17,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  rhythmSegment: {
    height: '100%',
  },
  rhythmNowTick: {
    position: 'absolute',
    top: 12,
    bottom: 12,
    width: 2,
    borderRadius: 2,
    backgroundColor: 'rgba(28,43,73,0.36)',
  },
  timelineMarkerWrap: {
    position: 'absolute',
    width: 32,
    height: 44,
    alignItems: 'center',
  },
  timelineStem: {
    position: 'absolute',
    top: 22,
    width: 2,
    borderRadius: 2,
    opacity: 0.45,
  },
  timelineMarker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 6,
  },
  timelineMarkerIcon: {
    fontSize: 15,
  },
  timelineCountBadge: {
    position: 'absolute',
    top: -5,
    right: -7,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  timelineCountText: {
    fontFamily: fontBodyExtra,
    fontSize: 9,
    color: '#FFFFFF',
  },
  timelineTooltip: {
    position: 'absolute',
    bottom: 40,
    minWidth: 112,
    maxWidth: 172,
    borderRadius: 12,
    backgroundColor: colors.ink,
    paddingVertical: 7,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  timelineTooltipText: {
    fontFamily: fontBodyBold,
    fontSize: 11,
    color: '#FFFFFF',
  },
  rhythmAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  rhythmAxisLabel: {
    fontFamily: fontBodyBold,
    fontSize: 10.5,
    color: colors.inkSoft,
  },
  ritualCell: {
    width: '48%',
    minWidth: 150,
    flexGrow: 1,
  },
  ritualCellTablet: {
    width: '31.6%',
    minWidth: 210,
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
  ritualActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  ritualEditButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.58)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ritualCheck: {
    width: 26,
    height: 26,
    borderRadius: 13,
    overflow: 'hidden',
  },
  ritualCheckHost: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ritualPulse: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
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
  ritualGoal: {
    fontFamily: fontBodyBold,
    fontSize: 11,
    marginTop: 4,
    opacity: 0.78,
  },
  ritualTimeBadge: {
    alignSelf: 'flex-start',
    minHeight: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.56)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 9,
    marginTop: 7,
  },
  ritualTimeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  ritualTimeText: {
    fontFamily: fontBodyExtra,
    fontSize: 10.5,
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
  screenHeaderCopy: {
    flex: 1,
    minWidth: 0,
    paddingRight: 12,
  },
  screenTitle: {
    fontFamily: fontSerif,
    fontSize: 22,
    color: colors.ink,
  },
  screenHeaderSub: {
    fontFamily: fontBodyBold,
    fontSize: 11.5,
    color: colors.inkSoft,
    marginTop: 3,
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
  rangeToggle: {
    minHeight: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(120,140,180,0.12)',
    padding: 3,
    marginBottom: 12,
    flexDirection: 'row',
  },
  rangeToggleOption: {
    flex: 1,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
  },
  rangeToggleText: {
    fontFamily: fontBodyExtra,
    fontSize: 11.5,
    color: colors.inkSoft,
  },
  rangeToggleTextActive: {
    color: '#FFFFFF',
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
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    minHeight: 164,
    alignContent: 'flex-start',
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
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
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
  },
  profileName: {
    flexShrink: 1,
    minWidth: 0,
    fontFamily: fontSerif,
    fontSize: 17,
    color: colors.ink,
  },
  profileEditButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(79,168,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(79,168,255,0.2)',
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
  profileStarted: {
    fontFamily: fontBodyBold,
    fontSize: 11.5,
    color: colors.inkSoft,
    marginTop: 3,
  },
  profileFocus: {
    alignSelf: 'flex-start',
    fontFamily: fontBodyExtra,
    fontSize: 11.5,
    color: habitPalette.focus.ink,
    backgroundColor: 'rgba(122,121,255,0.1)',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    marginTop: 7,
  },
  pstatGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  profileSetupPrompt: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(51,203,161,0.22)',
    padding: 14,
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    ...shadow,
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  profileSetupPromptIcon: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: 'rgba(51,203,161,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileSetupPromptCopy: {
    flex: 1,
    minWidth: 0,
  },
  profileSetupPromptTitle: {
    fontFamily: fontBodyExtra,
    fontSize: 13,
    color: colors.ink,
  },
  profileSetupPromptText: {
    fontFamily: fontBody,
    fontSize: 11.5,
    lineHeight: 16,
    color: colors.inkSoft,
    marginTop: 2,
  },
  profileSetupPromptButton: {
    minHeight: 34,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(51,203,161,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  profileSetupPromptButtonText: {
    fontFamily: fontBodyExtra,
    fontSize: 11.5,
    color: habitPalette.food.ink,
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
  settingRowTall: {
    minHeight: 88,
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  settingRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  toneSegment: {
    flexDirection: 'row',
    gap: 6,
    borderRadius: 15,
    backgroundColor: '#F3F6FB',
    borderWidth: 1,
    borderColor: 'rgba(120,140,180,0.16)',
    padding: 4,
  },
  toneSegmentButton: {
    flex: 1,
    minHeight: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toneSegmentButtonActive: {
    backgroundColor: colors.blue1,
    shadowColor: colors.blue1,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 3,
  },
  toneSegmentText: {
    fontFamily: fontBodyBold,
    fontSize: 11.5,
    color: colors.inkSoft,
  },
  toneSegmentTextActive: {
    color: '#FFFFFF',
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
  askFloPressableCompact: {
    justifyContent: 'center',
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
  askFloButtonCompact: {
    marginLeft: 0,
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
  glassNavShell: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 40,
    elevation: 18,
  },
  glassNavRim: {
    borderRadius: 999,
    padding: 1.5,
    overflow: 'hidden',
    shadowColor: '#433C83',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 40,
    elevation: 18,
  },
  glassNavRimSpin: {
    position: 'absolute',
    left: '-60%',
    right: '-60%',
    top: '-120%',
    bottom: '-120%',
  },
  glassNavRimSpinGradient: {
    flex: 1,
  },
  glassNavPill: {
    minHeight: 68,
    borderRadius: 999,
    position: 'relative',
    backgroundColor: 'rgba(88,80,144,0.84)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  glassNavSheen: {
    position: 'absolute',
    left: 12,
    right: 12,
    top: 0,
    height: '50%',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.22)',
    opacity: 0.4,
  },
  glassNavSweep: {
    position: 'absolute',
    top: 0,
    bottom: 0,
  },
  glassNavSweepGradient: {
    flex: 1,
  },
  glassNavRow: {
    position: 'relative',
    flexDirection: 'row',
  },
  glassNavIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.24)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  glassNavItem: {
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  glassNavItemActive: {
    transform: [{ translateY: -2 }, { scale: 1.06 }],
  },
  glassNavAdd: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    shadowColor: '#6653D8',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.55,
    shadowRadius: 10,
  },
  glassNavLabel: {
    fontFamily: fontBodyRegular,
    fontSize: 10.5,
    lineHeight: 11,
    color: 'rgba(255,255,255,0.68)',
  },
  glassNavLabelActive: {
    fontFamily: fontBodyBold,
    color: '#FFFFFF',
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
  modalRootTablet: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(20,30,50,0.35)',
  },
  modalSheet: {
    width: '100%',
    alignSelf: 'center',
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
  modalSheetTablet: {
    borderRadius: 28,
  },
  modalSheetContent: {
    paddingBottom: 4,
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
  ritualPreviewWrap: {
    marginBottom: 18,
  },
  ritualPreviewLabel: {
    fontFamily: fontBodyBold,
    fontSize: 11.5,
    color: colors.inkSoft,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 8,
    paddingLeft: 4,
  },
  ritualPreviewCard: {
    minHeight: 136,
  },
  fieldLabel: {
    fontFamily: fontBodyBold,
    fontSize: 12,
    color: colors.inkSoft,
    marginBottom: 6,
  },
  templateChipRow: {
    gap: 8,
    paddingBottom: 16,
  },
  templateChip: {
    minHeight: 34,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(120,140,180,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 13,
  },
  templateChipText: {
    fontFamily: fontBodyBold,
    fontSize: 12,
    color: colors.ink,
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
  fieldInputMultiline: {
    minHeight: 72,
    height: 72,
    paddingTop: 12,
    textAlignVertical: 'top',
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
  iconLibraryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  iconLibraryTile: {
    width: '17.6%',
    minHeight: 64,
    borderRadius: 15,
    backgroundColor: '#F3F6FB',
    borderWidth: 1.5,
    borderColor: 'rgba(120,140,180,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  iconLibraryEmoji: {
    fontSize: 18,
    marginBottom: 3,
  },
  iconLibraryLabel: {
    fontFamily: fontBodyBold,
    fontSize: 9.5,
    color: colors.ink,
    textAlign: 'center',
  },
  amountToggleRow: {
    minHeight: 58,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(120,140,180,0.14)',
    backgroundColor: '#F8FAFD',
    paddingHorizontal: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  amountToggleTitle: {
    fontFamily: fontBodyExtra,
    fontSize: 13,
    color: colors.ink,
  },
  amountToggleSub: {
    fontFamily: fontBody,
    fontSize: 11.5,
    color: colors.inkSoft,
    marginTop: 2,
  },
  amountSwitch: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(120,140,180,0.2)',
    padding: 3,
  },
  amountSwitchOn: {
    backgroundColor: colors.blue1,
  },
  amountSwitchKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  amountSwitchKnobOn: {
    transform: [{ translateX: 18 }],
  },
  amountRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  amountInput: {
    flex: 1,
    marginBottom: 0,
  },
  unitButton: {
    minWidth: 106,
    height: 46,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: 'rgba(79,168,255,0.28)',
    backgroundColor: 'rgba(79,168,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  unitButtonText: {
    fontFamily: fontBodyExtra,
    fontSize: 12,
    color: colors.blue1,
    textTransform: 'capitalize',
  },
  reminderChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  reminderChip: {
    minHeight: 34,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(120,140,180,0.16)',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  reminderChipSelected: {
    borderColor: colors.blue1,
    shadowColor: colors.blue1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  reminderChipText: {
    fontFamily: fontBodyBold,
    fontSize: 12,
    color: colors.ink,
  },
  reminderChipTextSelected: {
    color: colors.blue1,
  },
  reminderExplain: {
    fontFamily: fontBody,
    fontSize: 11.5,
    lineHeight: 17,
    color: colors.inkSoft,
    marginBottom: 16,
  },
  deleteRitualButton: {
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,106,106,0.22)',
    backgroundColor: 'rgba(255,106,106,0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  deleteRitualButtonConfirm: {
    borderColor: 'rgba(255,106,106,0.42)',
    backgroundColor: 'rgba(255,106,106,0.14)',
  },
  deleteRitualText: {
    fontFamily: fontBodyExtra,
    fontSize: 13,
    color: colors.danger,
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
  btnPrimaryDisabled: {
    opacity: 0.45,
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
