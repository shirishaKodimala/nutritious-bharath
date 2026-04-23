import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, shadow } from '../../src/lib/theme';
import { t, Lang } from '../../src/lib/i18n';
import { api } from '../../src/lib/api';

const PANTRY_ITEMS = [
  { key: 'ghee', icon: 'water', label: 'Ghee' },
  { key: 'milk', icon: 'cafe', label: 'Milk' },
  { key: 'wheat flour', icon: 'disc', label: 'Wheat flour' },
  { key: 'paneer', icon: 'square', label: 'Paneer' },
  { key: 'yogurt', icon: 'ellipse', label: 'Yogurt' },
  { key: 'egg', icon: 'egg', label: 'Eggs' },
  { key: 'chicken', icon: 'restaurant', label: 'Chicken' },
  { key: 'fish', icon: 'fish', label: 'Fish' },
  { key: 'rice', icon: 'apps', label: 'Rice' },
];

const MEALS = [
  { key: 'breakfast', icon: 'sunny', color: colors.turmeric },
  { key: 'lunch', icon: 'restaurant', color: colors.terracotta },
  { key: 'snack', icon: 'cafe', color: colors.basil },
  { key: 'dinner', icon: 'moon', color: colors.indigo },
];

export default function MealPlan() {
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeDay, setActiveDay] = useState(0);
  const [lang, setLang] = useState<Lang>('en');
  const [showShopping, setShowShopping] = useState(false);
  const [unavailable, setUnavailable] = useState<string[]>([]);

  useFocusEffect(useCallback(() => {
    (async () => {
      const p = await api.getProfile().catch(() => null);
      if (p) setLang(p.language || 'en');
      const existing = await api.getLatestPlan().catch(() => null);
      if (existing) setPlan(existing);
    })();
  }, []));

  const generate = async () => {
    setLoading(true);
    try {
      const p = await api.generateMealPlan(unavailable);
      setPlan(p);
      setActiveDay(0);
    } catch (e: any) {
      Alert.alert('Could not generate plan', String(e.message || e));
    } finally {
      setLoading(false);
    }
  };

  const togglePantry = (key: string) => {
    setUnavailable(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const day = plan?.days?.[activeDay];

  return (
    <SafeAreaView style={styles.container} edges={['top']} testID="meal-plan-screen">
      <View style={styles.headerWrap}>
        <Text style={styles.title}>{t('mealPlan', lang)}</Text>
        <Text style={styles.subtitle}>AI-powered weekly plan by Claude</Text>
      </View>

      {!plan && !loading && (
        <ScrollView contentContainerStyle={styles.emptyWrap}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="sparkles" size={40} color={colors.terracotta} />
          </View>
          <Text style={styles.emptyTitle}>Your 7-day plan awaits</Text>
          <Text style={styles.emptyDesc}>
            Personalized for {'\n'}your child&apos;s age, allergies & region.
          </Text>

          {/* Pantry check */}
          <View style={styles.pantryCard} testID="pantry-card">
            <View style={styles.pantryHeader}>
              <Ionicons name="basket" size={16} color={colors.terracotta} />
              <Text style={styles.pantryTitle}>{t('pantryCheck', lang)}</Text>
            </View>
            <Text style={styles.pantryDesc}>{t('pantryDesc', lang)}</Text>
            <View style={styles.pantryGrid}>
              {PANTRY_ITEMS.map(item => {
                const selected = unavailable.includes(item.key);
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[styles.pantryChip, selected && styles.pantryChipActive]}
                    onPress={() => togglePantry(item.key)}
                    testID={`pantry-${item.key}`}
                  >
                    <Ionicons name={item.icon as any} size={13} color={selected ? colors.coconut : colors.textSecondary} />
                    <Text style={[styles.pantryChipText, selected && styles.pantryChipTextActive]}>{item.label}</Text>
                    {selected && <Ionicons name="close-circle" size={14} color={colors.coconut} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <TouchableOpacity style={[styles.primaryBtn, { marginTop: spacing.lg }]} onPress={generate} testID="generate-plan-btn">
            <Ionicons name="flash" size={18} color={colors.coconut} />
            <Text style={styles.primaryBtnText}>{t('generatePlan', lang)}</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {loading && (
        <View style={styles.emptyWrap}>
          <ActivityIndicator size="large" color={colors.terracotta} />
          <Text style={[styles.emptyDesc, { marginTop: spacing.base }]}>{t('generating', lang)}</Text>
        </View>
      )}

      {plan && !loading && (
        <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
          {/* Day tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayRow}>
            {plan.days.map((d: any, i: number) => (
              <TouchableOpacity
                key={i}
                style={[styles.dayChip, activeDay === i && styles.dayChipActive]}
                onPress={() => setActiveDay(i)}
                testID={`day-${i}`}
              >
                <Text style={[styles.dayNum, activeDay === i && styles.dayNumActive]}>{d.day.slice(0, 3)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Avoiding tag */}
          {plan.unavailable_ingredients?.length > 0 && (
            <View style={styles.avoidingBar} testID="avoiding-bar">
              <Ionicons name="alert-circle" size={14} color={colors.marigold} />
              <Text style={styles.avoidingText}>
                {t('avoiding', lang)}: {plan.unavailable_ingredients.join(', ')}
              </Text>
            </View>
          )}

          {/* Meals */}
          <View style={styles.mealsList}>
            {MEALS.map(m => (
              <View key={m.key} style={styles.mealItem} testID={`meal-${m.key}`}>
                <View style={[styles.mealIconWrap, { backgroundColor: m.color + '20' }]}>
                  <Ionicons name={m.icon as any} size={20} color={m.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.mealLabel}>{t(m.key, lang).toUpperCase()}</Text>
                  <Text style={styles.mealName}>{day?.[m.key] || '—'}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Tip */}
          {day?.tip && (
            <View style={styles.tipBox}>
              <Ionicons name="bulb" size={18} color={colors.marigold} />
              <Text style={styles.tipText}>{day.tip}</Text>
            </View>
          )}

          {/* Shopping list */}
          <TouchableOpacity
            style={styles.shoppingToggle}
            onPress={() => setShowShopping(!showShopping)}
            testID="shopping-toggle"
          >
            <Ionicons name="cart" size={18} color={colors.indigo} />
            <Text style={styles.shoppingTitle}>{t('shoppingList', lang)} ({plan.shopping_list?.length || 0})</Text>
            <Ionicons name={showShopping ? 'chevron-up' : 'chevron-down'} size={18} color={colors.indigo} />
          </TouchableOpacity>
          {showShopping && (
            <View style={styles.shoppingList}>
              {plan.shopping_list?.map((item: string, i: number) => (
                <View key={i} style={styles.shoppingItem}>
                  <Ionicons name="checkmark-circle-outline" size={16} color={colors.basil} />
                  <Text style={styles.shoppingItemText}>{item}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Pantry check — also shown on existing-plan screen so mother can tweak and regenerate */}
          <View style={[styles.pantryCard, { marginHorizontal: spacing.base, marginTop: spacing.base }]} testID="pantry-card-inline">
            <View style={styles.pantryHeader}>
              <Ionicons name="basket" size={16} color={colors.terracotta} />
              <Text style={styles.pantryTitle}>{t('pantryCheck', lang)}</Text>
            </View>
            <Text style={styles.pantryDesc}>{t('pantryDesc', lang)}</Text>
            <View style={styles.pantryGrid}>
              {PANTRY_ITEMS.map(item => {
                const selected = unavailable.includes(item.key);
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[styles.pantryChip, selected && styles.pantryChipActive]}
                    onPress={() => togglePantry(item.key)}
                    testID={`pantry-inline-${item.key}`}
                  >
                    <Ionicons name={item.icon as any} size={13} color={selected ? colors.coconut : colors.textSecondary} />
                    <Text style={[styles.pantryChipText, selected && styles.pantryChipTextActive]}>{item.label}</Text>
                    {selected && <Ionicons name="close-circle" size={14} color={colors.coconut} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <TouchableOpacity style={[styles.primaryBtn, { margin: spacing.base }]} onPress={generate} testID="regenerate-btn">
            <Ionicons name="refresh" size={18} color={colors.coconut} />
            <Text style={styles.primaryBtnText}>{t('regeneratePlan', lang)}</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  headerWrap: { padding: spacing.base, paddingBottom: spacing.sm },
  title: { fontSize: 28, fontFamily: 'serif', fontWeight: '700', color: colors.indigo },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  emptyWrap: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, paddingBottom: spacing.xxl },
  emptyIconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.coconut, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.base, ...shadow.soft },
  emptyTitle: { fontSize: 22, fontFamily: 'serif', fontWeight: '700', color: colors.indigo, marginBottom: spacing.sm },
  emptyDesc: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.lg, lineHeight: 22 },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.terracotta, paddingVertical: 14, paddingHorizontal: 28, borderRadius: radius.lg, ...shadow.soft, justifyContent: 'center' },
  primaryBtnText: { color: colors.coconut, fontWeight: '600', fontSize: 15 },
  dayRow: { padding: spacing.base, gap: 8 },
  dayChip: { width: 52, height: 52, borderRadius: radius.md, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  dayChipActive: { backgroundColor: colors.terracotta, borderColor: colors.terracotta },
  dayNum: { color: colors.textSecondary, fontWeight: '600', fontSize: 13 },
  dayNumActive: { color: colors.coconut },
  mealsList: { padding: spacing.base, gap: spacing.sm },
  mealItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface, padding: spacing.base, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, ...shadow.soft },
  mealIconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  mealLabel: { fontSize: 10, color: colors.textMuted, fontWeight: '700', letterSpacing: 1 },
  mealName: { fontSize: 15, color: colors.indigo, fontWeight: '600', fontFamily: 'serif', marginTop: 2 },
  tipBox: { flexDirection: 'row', gap: spacing.sm, margin: spacing.base, padding: spacing.base, backgroundColor: colors.saffronCream, borderRadius: radius.md, borderLeftWidth: 4, borderLeftColor: colors.marigold },
  tipText: { flex: 1, fontSize: 13, color: colors.indigo, lineHeight: 20 },
  shoppingToggle: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.base, marginHorizontal: spacing.base, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  shoppingTitle: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.indigo },
  shoppingList: { marginHorizontal: spacing.base, marginTop: spacing.sm, padding: spacing.base, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, gap: 8 },
  shoppingItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  shoppingItemText: { fontSize: 14, color: colors.textSecondary },
  pantryCard: { width: '100%', maxWidth: 380, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.base, borderWidth: 1, borderColor: colors.border, ...shadow.soft },
  pantryHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  pantryTitle: { fontSize: 14, fontWeight: '700', color: colors.indigo, fontFamily: 'serif' },
  pantryDesc: { fontSize: 12, color: colors.textMuted, marginBottom: spacing.sm, lineHeight: 16 },
  pantryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pantryChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.round, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border },
  pantryChipActive: { backgroundColor: colors.terracotta, borderColor: colors.terracotta },
  pantryChipText: { fontSize: 12, fontWeight: '500', color: colors.textSecondary },
  pantryChipTextActive: { color: colors.coconut, fontWeight: '600' },
  avoidingBar: { flexDirection: 'row', alignItems: 'center', gap: 6, marginHorizontal: spacing.base, padding: spacing.sm, backgroundColor: colors.saffronCream, borderRadius: radius.md, borderLeftWidth: 3, borderLeftColor: colors.marigold },
  avoidingText: { flex: 1, fontSize: 12, color: colors.textSecondary, fontStyle: 'italic' },
});
