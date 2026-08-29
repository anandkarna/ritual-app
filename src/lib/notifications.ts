import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

type NotificationApi = {
  setNotificationChannelAsync?: (channelId: string, options: unknown) => Promise<unknown>;
  AndroidImportance?: { DEFAULT?: number };
  getPermissionsAsync?: () => Promise<{ status?: string } | null>;
  requestPermissionsAsync?: () => Promise<{ status?: string } | null>;
  scheduleNotificationAsync?: (options: unknown) => Promise<string | null | undefined>;
  cancelScheduledNotificationAsync?: (notificationId: string) => Promise<unknown>;
  SchedulableTriggerInputTypes?: { DATE?: string };
};

type ReminderScheduleRecord = Record<string, { notificationId: string; reminderTime: string; body: string }>;

export type { ReminderScheduleRecord };

type RitualLike = {
  id: string;
  name: string;
  reminderTime?: string;
  doneToday?: boolean;
  goalAmount?: number;
  goalUnit?: string;
};

function goalLabel(amount?: number, unit?: string) {
  if (!amount || !unit) {
    return '';
  }
  const formattedAmount = Number.isInteger(amount) ? String(amount) : String(Number(amount.toFixed(2)));
  const unitLabel = unit === 'liters' ? 'L' : unit === 'minutes' ? 'min' : unit === 'hours' ? 'hrs' : unit;
  return unit === 'liters' || unit === 'minutes' || unit === 'hours' ? `${formattedAmount}${unitLabel}` : `${formattedAmount} ${unitLabel}`;
}

export function nextReminderDate(value: string) {
  const [hourRaw, minuteRaw] = value.split(':');
  const date = new Date();
  date.setHours(Number(hourRaw) || 8, Number(minuteRaw) || 0, 0, 0);
  if (date.getTime() <= Date.now()) {
    date.setDate(date.getDate() + 1);
  }
  return date;
}

export function ritualReminderBody(ritual: Pick<RitualLike, 'name' | 'goalAmount' | 'goalUnit'>) {
  const name = ritual.name.trim() || 'your ritual';
  const goal = goalLabel(ritual.goalAmount, ritual.goalUnit);
  return goal ? `Still time for your ${goal} today?` : `Still time to check in with ${name} today?`;
}

export async function ensureReminderPermissions(notifications: NotificationApi | null | undefined) {
  if (!notifications) {
    return false;
  }
  if (Platform.OS === 'android') {
    await notifications.setNotificationChannelAsync?.('ritual-reminders', {
      name: 'Ritual reminders',
      importance: notifications.AndroidImportance?.DEFAULT ?? 3,
    });
  }
  const existing = await notifications.getPermissionsAsync?.();
  if (existing?.status === 'granted') {
    return true;
  }
  const requested = await notifications.requestPermissionsAsync?.();
  return requested?.status === 'granted' ? true : false;
}

export async function readReminderScheduleRecord(storageKey: string): Promise<ReminderScheduleRecord> {
  const stored = await AsyncStorage.getItem(storageKey);
  if (!stored) {
    return {};
  }
  try {
    return JSON.parse(stored) as ReminderScheduleRecord;
  } catch {
    return {};
  }
}

export async function cancelReminderNotification(notifications: NotificationApi | null | undefined, record?: { notificationId: string }) {
  if (!record?.notificationId) {
    return;
  }
  await notifications?.cancelScheduledNotificationAsync?.(record.notificationId).catch(() => undefined);
}

export async function syncRitualReminderNotifications({
  rituals,
  enabled,
  notifications,
  storageKey,
}: {
  rituals: RitualLike[];
  enabled: boolean;
  notifications: NotificationApi | null | undefined;
  storageKey: string;
}) {
  if (!notifications) {
    return;
  }

  const stored = await readReminderScheduleRecord(storageKey);
  const next: ReminderScheduleRecord = {};
  const byId = new Map(rituals.map((ritual) => [ritual.id, ritual]));
  const schedulableRituals = rituals.filter((ritual) => ritual.reminderTime && !ritual.doneToday);

  if (!enabled) {
    await Promise.all(Object.values(stored).map((record) => cancelReminderNotification(notifications, record)));
    await AsyncStorage.removeItem(storageKey);
    return;
  }

  for (const [ritualId, record] of Object.entries(stored)) {
    const ritual = byId.get(ritualId);
    const body = ritual ? ritualReminderBody(ritual) : '';
    if (!ritual || !ritual.reminderTime || ritual.doneToday || record.reminderTime !== ritual.reminderTime || record.body !== body) {
      await cancelReminderNotification(notifications, record);
    } else {
      next[ritualId] = record;
    }
  }

  if (!schedulableRituals.some((ritual) => !next[ritual.id])) {
    await AsyncStorage.setItem(storageKey, JSON.stringify(next));
    return;
  }

  const hasPermission = await ensureReminderPermissions(notifications);
  if (!hasPermission) {
    return;
  }

  for (const ritual of schedulableRituals) {
    if (!ritual.reminderTime || next[ritual.id]) {
      continue;
    }
    const body = ritualReminderBody(ritual);
    const notificationId = await notifications.scheduleNotificationAsync?.({
      content: {
        title: `${ritual.name} reminder`,
        body,
        data: { ritualId: ritual.id, screen: 'today' },
      },
      trigger: {
        type: notifications.SchedulableTriggerInputTypes?.DATE ?? 'date',
        date: nextReminderDate(ritual.reminderTime),
        channelId: 'ritual-reminders',
      },
    });
    if (notificationId) {
      next[ritual.id] = { notificationId, reminderTime: ritual.reminderTime, body };
    }
  }

  await AsyncStorage.setItem(storageKey, JSON.stringify(next));
}
