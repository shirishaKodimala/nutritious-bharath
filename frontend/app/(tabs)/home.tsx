import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, shadow } from '../../src/lib/theme';
import { t, Lang } from '../../src/lib/i18n';
import { api } from '../../src/lib/api';

const TIPS = [
  { icon: 'leaf', en: 'Add a pinch of turmeric to warm milk for natural immunity.', hi: 'गर्म दूध में एक चुटकी हल्दी मिलाएं।', te: 'వెచ్చని పాలలో పసుపు కలపండి.' },
  { icon: 'sunny', en: 'Morning sunlight for 15 minutes boosts vitamin D.', hi: 'सुबह की धूप से विटामिन D मिलता है।', te: 'ఉదయం ఎండ విటమిన్ D ఇస్తుంది.' },
  { icon: 'water', en: 'Cumin water after meals aids toddler digestion.', hi: 'खाने के बाद जीरा पानी पिलाएं।', te: 'జీలకర్ర నీరు జీర్ణక్రియకు మంచిది.' },
];

export default function Home() {
  const [profile, setProfile] = useState<any>(null);
  const [growth, setGrowth] = useState<any>(null);
  const [todayRecipe, setTodayRecipe] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [p, g, r] = await Promise.all([
        api.getProfile(),
        api.getGrowth(),
        api.listRecipes({ category: 'lunch' }),
      ]);
      setProfile(p);
      setGrowth(g);
      if (r && r.length) setTodayRecipe(r[Math.floor(Math.random() * r.length)]);
    } catch (e) {
      console.log('home load error', e);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const lang: Lang = profile?.language || 'en';
  const tip = TIPS[new Date().getDay() % TIPS.length];
  const growthStatus = growth?.status === 'on-track' ? t('onTrack', lang) : growth?.status === 'below' ? t('belowAvg', lang) : growth?.status === 'above' ? t('aboveAvg', lang) : '—';
  const growthColor = growth?.status === 'on-track' ? colors.basil : colors.marigold;

  return (
    <SafeAreaView style={styles.container} edges={['top']} testID="home-screen">
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.terracotta} />}
      >
        {/* Greeting */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greetingSmall}>{t('namaste', lang)} 🙏</Text>
            <Text style={styles.greeting} testID="home-greeting">
              {profile?.mother_name || 'Mama'}
            </Text>
            <Text style={styles.subGreeting}>
              Caring for {profile?.child_name || 'your little one'}
            </Text>
          </View>
          <View style={styles.avatar}>
            <Ionicons name="heart" size={22} color={colors.terracotta} />
          </View>
        </View>

        {/* Seasonal banner */}
        <View style={styles.seasonalBanner}>
          <Image source={{ uri: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d' }} style={styles.bannerBg} />
          <View style={styles.bannerOverlay} />
          <View style={styles.bannerContent}>
            <Text style={styles.bannerLabel}>SEASONAL WISDOM</Text>
            <Text style={styles.bannerTitle}>Warm spices for growing bones</Text>
            <Text style={styles.bannerSubtitle}>Turmeric • Ginger • Cumin</Text>
          </View>
        </View>

        {/* Growth snapshot */}
        <View style={styles.cardRow}>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]} testID="growth-card">
            <View style={[styles.statIconWrap, { backgroundColor: colors.basil + '20' }]}>
              <Ionicons name="trending-up" size={18} color={colors.basil} />
            </View>
            <Text style={styles.statLabel}>{t('growthSnapshot', lang)}</Text>
            <Text style={[styles.statValue, { color: growthColor }]}>{growthStatus}</Text>
            <Text style={styles.statSub}>
              {growth?.weight_kg}{t('kg', lang)} • {growth?.height_cm}{t('cm', lang)}
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.statIconWrap, { backgroundColor: colors.terracotta + '20' }]}>
              <Ionicons name="sparkles" size={18} color={colors.terracotta} />
            </View>
            <Text style={styles.statLabel}>Age</Text>
            <Text style={[styles.statValue, { color: colors.terracotta }]}>
              {profile?.child_age_months ? (profile.child_age_months / 12).toFixed(1) : '—'}
            </Text>
            <Text style={styles.statSub}>{t('years', lang)}</Text>
          </View>
        </View>

        {/* Today's meal */}
        {todayRecipe && (
          <TouchableOpacity
            style={styles.todayCard}
            onPress={() => router.push(`/recipe/${todayRecipe.id}`)}
            testID="todays-meal-card"
          >
            <Image source={{ uri: todayRecipe.image }} style={styles.todayImage} />
            <View style={styles.todayContent}>
              <Text style={styles.todayLabel}>{t('todaysMeal', lang)}</Text>
              <Text style={styles.todayTitle}>{todayRecipe.title.en}</Text>
              <View style={styles.badgeRow}>
                {todayRecipe.ayurvedic && (
                  <View style={[styles.miniBadge, { backgroundColor: colors.basil }]}>
                    <Ionicons name="leaf" size={10} color="#fff" />
                    <Text style={styles.miniBadgeText}>{t('ayurvedic', lang)}</Text>
                  </View>
                )}
                {todayRecipe.scientific && (
                  <View style={[styles.miniBadge, { backgroundColor: colors.indigo }]}>
                    <Ionicons name="flask" size={10} color="#fff" />
                    <Text style={styles.miniBadgeText}>{t('scientific', lang)}</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Tip of the day */}
        <View style={styles.tipCard} testID="tip-card">
          <View style={styles.tipIconWrap}>
            <Ionicons name={tip.icon as any} size={20} color={colors.terracotta} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.tipLabel}>{t('tipOfDay', lang)}</Text>
            <Text style={styles.tipText}>{tip[lang] || tip.en}</Text>
          </View>
        </View>

        {/* Quick actions */}
        <View style={styles.quickGrid}>
          <TouchableOpacity style={styles.quickBtn} onPress={() => router.push('/(tabs)/recipes')} testID="quick-recipes">
            <Ionicons name="book" size={22} color={colors.terracotta} />
            <Text style={styles.quickText}>{t('recipes', lang)}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickBtn} onPress={() => router.push('/(tabs)/meal-plan')} testID="quick-meal-plan">
            <Ionicons name="calendar" size={22} color={colors.terracotta} />
            <Text style={styles.quickText}>{t('mealPlan', lang)}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.base, paddingBottom: spacing.xxl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  greetingSmall: { fontSize: 13, color: colors.textSecondary, marginBottom: 2 },
  greeting: { fontSize: 28, fontFamily: 'serif', fontWeight: '700', color: colors.indigo },
  subGreeting: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.coconut, alignItems: 'center', justifyContent: 'center', ...shadow.soft },
  seasonalBanner: {
    borderRadius: radius.lg, overflow: 'hidden', height: 140, marginBottom: spacing.base, ...shadow.soft,
  },
  bannerBg: { position: 'absolute', width: '100%', height: '100%' },
  bannerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(75,0,130,0.55)' },
  bannerContent: { flex: 1, justifyContent: 'flex-end', padding: spacing.base },
  bannerLabel: { color: colors.cumin, fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: 4 },
  bannerTitle: { color: colors.coconut, fontSize: 20, fontWeight: '700', fontFamily: 'serif' },
  bannerSubtitle: { color: colors.saffronCream, fontSize: 13, marginTop: 4 },
  cardRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.base },
  statCard: { flex: 1, padding: spacing.base, borderRadius: radius.md, ...shadow.soft, borderWidth: 1, borderColor: colors.border },
  statIconWrap: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  statLabel: { fontSize: 11, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue: { fontSize: 20, fontWeight: '700', fontFamily: 'serif', marginTop: 2 },
  statSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  todayCard: { backgroundColor: colors.surface, borderRadius: radius.lg, overflow: 'hidden', marginBottom: spacing.base, ...shadow.soft, borderWidth: 1, borderColor: colors.border },
  todayImage: { width: '100%', height: 160 },
  todayContent: { padding: spacing.base },
  todayLabel: { fontSize: 11, color: colors.terracotta, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  todayTitle: { fontSize: 20, fontFamily: 'serif', fontWeight: '700', color: colors.indigo, marginTop: 4 },
  badgeRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  miniBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.round },
  miniBadgeText: { color: '#fff', fontSize: 10, fontWeight: '600' },
  tipCard: { flexDirection: 'row', gap: spacing.md, backgroundColor: colors.saffronCream, padding: spacing.base, borderRadius: radius.lg, borderLeftWidth: 4, borderLeftColor: colors.marigold, marginBottom: spacing.base },
  tipIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  tipLabel: { fontSize: 11, color: colors.terracotta, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  tipText: { fontSize: 14, color: colors.indigo, marginTop: 4, lineHeight: 20 },
  quickGrid: { flexDirection: 'row', gap: spacing.sm },
  quickBtn: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.base, alignItems: 'center', gap: spacing.xs, borderWidth: 1, borderColor: colors.border, ...shadow.soft },
  quickText: { fontSize: 13, fontWeight: '600', color: colors.indigo },
});
