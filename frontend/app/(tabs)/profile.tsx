import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, shadow } from '../../src/lib/theme';
import { t, Lang } from '../../src/lib/i18n';
import { api } from '../../src/lib/api';

const LANGS: { key: Lang; label: string }[] = [
  { key: 'en', label: 'English' },
  { key: 'hi', label: 'हिन्दी' },
  { key: 'te', label: 'తెలుగు' },
];

export default function Profile() {
  const [profile, setProfile] = useState<any>(null);
  const [growth, setGrowth] = useState<any>(null);

  const load = useCallback(async () => {
    const p = await api.getProfile().catch(() => null);
    const g = await api.getGrowth().catch(() => null);
    setProfile(p);
    setGrowth(g);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

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
});
