import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, shadow } from '../../src/lib/theme';
import { t, Lang } from '../../src/lib/i18n';
import { api } from '../../src/lib/api';
import {
  loadReminders, saveReminders, applyAllReminders,
  requestNotificationPermission, ReminderSettings, MealKey, DEFAULT_REMINDERS,
} from '../../src/lib/notifications';

const LANGS: { key: Lang; label: string }[] = [
  { key: 'en', label: 'English' },
  { key: 'hi', label: 'हिन्दी' },
  { key: 'te', label: 'తెలుగు' },
];

export default function Profile() {
  const [profile, setProfile] = useState<any>(null);
  const [growth, setGrowth] = useState<any>(null);
  const [reminders, setReminders] = useState<ReminderSettings>(DEFAULT_REMINDERS);

  const load = useCallback(async () => {
    const p = await api.getProfile().catch(() => null);
    const g = await api.getGrowth().catch(() => null);
    const r = await loadReminders();
    setProfile(p);
    setGrowth(g);
    setReminders(r);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const toggleReminder = async (key: MealKey, value: boolean) => {
    if (value) {
      if (Platform.OS === 'web') {
        Alert.alert(t('webNotSupported', lang));
        return;
      }
      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert(t('permDenied', lang));
        return;
      }
    }
    const next = { ...reminders, [key]: { ...reminders[key], enabled: value } };
    setReminders(next);
    await saveReminders(next);
    await applyAllReminders(next);
  };

  const bumpTime = async (key: MealKey, deltaMinutes: number) => {
    const s = reminders[key];
    let total = s.hour * 60 + s.minute + deltaMinutes;
    total = (total + 24 * 60) % (24 * 60);
    const next = { ...reminders, [key]: { ...s, hour: Math.floor(total / 60), minute: total % 60 } };
    setReminders(next);
    await saveReminders(next);
    if (s.enabled) await applyAllReminders(next);
  };

  const changeLang = async (l: Lang) => {
    if (!profile) return;
    try {
      await api.saveProfile({ ...profile, language: l });
      setProfile({ ...profile, language: l });
    } catch (e: any) {
      Alert.alert('Error', String(e.message || e));
    }
  };

  const lang: Lang = profile?.language || 'en';

  if (!profile) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>{t('noProfile', 'en')}</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/onboarding')}>
            <Text style={styles.primaryBtnText}>{t('getStarted', 'en')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']} testID="profile-screen">
      <ScrollView contentContainerStyle={{ padding: spacing.base, paddingBottom: spacing.xxl }}>
        {/* Mother */}
        <View style={styles.heroCard}>
          <View style={styles.avatar}>
            <Ionicons name="heart" size={28} color={colors.terracotta} />
          </View>
          <Text style={styles.motherName}>{profile.mother_name}</Text>
          <Text style={styles.motherSub}>Mama</Text>
        </View>

        {/* Child card */}
        <View style={styles.childCard}>
          <View style={styles.childHeader}>
            <View style={styles.childIcon}>
              <Ionicons name="happy" size={22} color={colors.marigold} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.childName}>{profile.child_name}</Text>
              <Text style={styles.childAge}>
                {(profile.child_age_months / 12).toFixed(1)} {t('years', lang)} old
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <Stat label={t('weight', lang)} value={`${profile.child_weight_kg}`} unit={t('kg', lang)} />
            <Stat label={t('height', lang)} value={`${profile.child_height_cm}`} unit={t('cm', lang)} />
            <Stat label="BMI" value={growth?.bmi ? `${growth.bmi}` : '—'} unit="" />
          </View>

          {growth?.status && growth.status !== 'no_profile' && (
            <View style={[styles.growthBadge, { backgroundColor: growth.status === 'on-track' ? colors.basil : colors.marigold }]}>
              <Ionicons name={growth.status === 'on-track' ? 'checkmark-circle' : 'alert-circle'} size={14} color="#fff" />
              <Text style={styles.growthBadgeText}>
                {growth.status === 'on-track' ? t('onTrack', lang) : growth.status === 'below' ? t('belowAvg', lang) : t('aboveAvg', lang)}
              </Text>
            </View>
          )}
        </View>

        {/* Diet & region */}
        <View style={styles.infoCard}>
          <InfoRow icon="restaurant" label={t('dietary', lang)} value={profile.dietary} />
          <InfoRow icon="location" label={t('region', lang)} value={profile.region} />
          <InfoRow icon="warning" label={t('allergies', lang).split('(')[0]} value={profile.allergies?.join(', ') || 'None'} />
        </View>

        {/* Language */}
        <Text style={styles.sectionLabel}>{t('language', lang)}</Text>
        <View style={styles.langRow}>
          {LANGS.map(l => (
            <TouchableOpacity
              key={l.key}
              style={[styles.langChip, lang === l.key && styles.langChipActive]}
              onPress={() => changeLang(l.key)}
              testID={`profile-lang-${l.key}`}
            >
              <Text style={[styles.langText, lang === l.key && styles.langTextActive]}>{l.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.editBtn} onPress={() => router.push('/onboarding')} testID="edit-profile">
          <Ionicons name="create" size={18} color={colors.terracotta} />
          <Text style={styles.editText}>{t('editProfile', lang)}</Text>
        </TouchableOpacity>

        {/* Meal Reminders */}
        <Text style={styles.sectionLabel}>{t('mealReminders', lang)}</Text>
        <Text style={styles.remindersHint}>{t('remindersDesc', lang)}</Text>
        <View style={styles.remindersCard}>
          {(['breakfast', 'lunch', 'snack', 'dinner'] as MealKey[]).map((key, idx) => {
            const s = reminders[key];
            const timeStr = `${s.hour.toString().padStart(2, '0')}:${s.minute.toString().padStart(2, '0')}`;
            const icons: Record<MealKey, any> = { breakfast: 'sunny', lunch: 'restaurant', snack: 'cafe', dinner: 'moon' };
            const tints: Record<MealKey, string> = { breakfast: colors.turmeric, lunch: colors.terracotta, snack: colors.basil, dinner: colors.indigo };
            return (
              <View key={key} style={[styles.reminderRow, idx < 3 && styles.reminderRowBorder]} testID={`reminder-${key}`}>
                <View style={[styles.reminderIcon, { backgroundColor: tints[key] + '20' }]}>
                  <Ionicons name={icons[key]} size={18} color={tints[key]} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.reminderLabel}>{t(key, lang)}</Text>
                  <View style={styles.timeAdjustRow}>
                    <TouchableOpacity
                      disabled={!s.enabled}
                      style={[styles.timeBtn, !s.enabled && styles.timeBtnDisabled]}
                      onPress={() => bumpTime(key, -30)}
                      testID={`${key}-minus`}
                    >
                      <Ionicons name="remove" size={12} color={s.enabled ? colors.terracotta : colors.textMuted} />
                    </TouchableOpacity>
                    <Text style={[styles.timeText, !s.enabled && { color: colors.textMuted }]}>{timeStr}</Text>
                    <TouchableOpacity
                      disabled={!s.enabled}
                      style={[styles.timeBtn, !s.enabled && styles.timeBtnDisabled]}
                      onPress={() => bumpTime(key, 30)}
                      testID={`${key}-plus`}
                    >
                      <Ionicons name="add" size={12} color={s.enabled ? colors.terracotta : colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                </View>
                <Switch
                  value={s.enabled}
                  onValueChange={(v) => toggleReminder(key, v)}
                  trackColor={{ false: colors.border, true: colors.terracotta + '80' }}
                  thumbColor={s.enabled ? colors.terracotta : colors.coconut}
                  testID={`${key}-switch`}
                />
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statVal}>{value}<Text style={styles.statUnit}> {unit}</Text></Text>
      <Text style={styles.statLbl}>{label}</Text>
    </View>
  );
}

function InfoRow({ icon, label, value }: any) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={16} color={colors.terracotta} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  emptyText: { fontSize: 16, color: colors.textSecondary, marginBottom: spacing.base },
  heroCard: { alignItems: 'center', padding: spacing.lg, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, ...shadow.soft, marginBottom: spacing.base },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.saffronCream, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm, ...shadow.soft },
  motherName: { fontSize: 22, fontFamily: 'serif', fontWeight: '700', color: colors.indigo },
  motherSub: { fontSize: 12, color: colors.textMuted, marginTop: 2, textTransform: 'uppercase', letterSpacing: 1 },
  childCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.base, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.base, ...shadow.soft },
  childHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.base },
  childIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.turmeric + '30', alignItems: 'center', justifyContent: 'center' },
  childName: { fontSize: 18, fontFamily: 'serif', fontWeight: '700', color: colors.indigo },
  childAge: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  stat: { flex: 1, backgroundColor: colors.bg, padding: spacing.sm, borderRadius: radius.md, alignItems: 'center' },
  statVal: { fontSize: 18, fontWeight: '700', fontFamily: 'serif', color: colors.terracotta },
  statUnit: { fontSize: 11, color: colors.textMuted, fontWeight: '400' },
  statLbl: { fontSize: 10, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },
  growthBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.round },
  growthBadgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  infoCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.base, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.base, gap: spacing.sm },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  infoLabel: { fontSize: 13, color: colors.textMuted, flex: 1, textTransform: 'capitalize' },
  infoValue: { fontSize: 13, color: colors.indigo, fontWeight: '600', textTransform: 'capitalize' },
  sectionLabel: { fontSize: 12, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.sm, marginTop: spacing.sm, fontWeight: '600' },
  langRow: { flexDirection: 'row', gap: 8, marginBottom: spacing.base },
  langChip: { flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  langChipActive: { backgroundColor: colors.terracotta, borderColor: colors.terracotta },
  langText: { color: colors.textSecondary, fontWeight: '500' },
  langTextActive: { color: colors.coconut, fontWeight: '700' },
  editBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.terracotta, marginTop: spacing.sm },
  editText: { color: colors.terracotta, fontWeight: '600' },
  primaryBtn: { backgroundColor: colors.terracotta, paddingVertical: 14, paddingHorizontal: 28, borderRadius: radius.lg, ...shadow.soft },
  primaryBtnText: { color: colors.coconut, fontWeight: '600', fontSize: 15 },
  remindersHint: { fontSize: 12, color: colors.textMuted, marginBottom: spacing.sm, marginTop: -6 },
  remindersCard: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, ...shadow.soft, overflow: 'hidden' },
  reminderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.base },
  reminderRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  reminderIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  reminderLabel: { fontSize: 14, fontWeight: '600', color: colors.indigo, textTransform: 'capitalize', fontFamily: 'serif' },
  timeAdjustRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  timeBtn: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.saffronCream, alignItems: 'center', justifyContent: 'center' },
  timeBtnDisabled: { backgroundColor: colors.border, opacity: 0.5 },
  timeText: { fontSize: 13, color: colors.terracotta, fontWeight: '700', minWidth: 44, textAlign: 'center' },
});
