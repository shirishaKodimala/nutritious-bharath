import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { storage } from './api';

export type MealKey = 'breakfast' | 'lunch' | 'snack' | 'dinner';

export type ReminderSettings = {
  [K in MealKey]: { enabled: boolean; hour: number; minute: number };
};

export const DEFAULT_REMINDERS: ReminderSettings = {
  breakfast: { enabled: false, hour: 8, minute: 0 },
  lunch: { enabled: false, hour: 12, minute: 30 },
  snack: { enabled: false, hour: 16, minute: 0 },
  dinner: { enabled: false, hour: 19, minute: 30 },
};

const STORAGE_KEY = 'reminder_settings';
const ID_PREFIX = 'nutritious-india-reminder-';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function loadReminders(): Promise<ReminderSettings> {
  const saved = await storage.get(STORAGE_KEY);
  return saved || DEFAULT_REMINDERS;
}

export async function saveReminders(settings: ReminderSettings) {
  await storage.set(STORAGE_KEY, settings);
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

const MEAL_COPY: Record<MealKey, { title: string; body: string }> = {
  breakfast: { title: '🌞 Breakfast time!', body: 'A warm, nourishing start for your little one.' },
  lunch: { title: '🍲 Lunch time', body: 'Time for a wholesome midday meal.' },
  snack: { title: '🍎 Snack time', body: 'A healthy bite to keep energy up.' },
  dinner: { title: '🌙 Dinner time', body: 'Wind down with a light, warm dinner.' },
};

export async function scheduleReminder(key: MealKey, hour: number, minute: number) {
  if (Platform.OS === 'web') return;
  const id = `${ID_PREFIX}${key}`;
  await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
  await Notifications.scheduleNotificationAsync({
    identifier: id,
    content: {
      title: MEAL_COPY[key].title,
      body: MEAL_COPY[key].body,
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    } as any,
  });
}

export async function cancelReminder(key: MealKey) {
  if (Platform.OS === 'web') return;
  await Notifications.cancelScheduledNotificationAsync(`${ID_PREFIX}${key}`).catch(() => {});
}

export async function applyAllReminders(settings: ReminderSettings) {
  if (Platform.OS === 'web') return;
  for (const key of Object.keys(settings) as MealKey[]) {
    const s = settings[key];
    if (s.enabled) {
      await scheduleReminder(key, s.hour, s.minute);
    } else {
      await cancelReminder(key);
    }
  }
}
