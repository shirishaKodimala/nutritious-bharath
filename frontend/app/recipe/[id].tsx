import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, shadow } from '../../src/lib/theme';
import { t, Lang } from '../../src/lib/i18n';
import { api } from '../../src/lib/api';

export default function RecipeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [recipe, setRecipe] = useState<any>(null);
  const [subs, setSubs] = useState<any[]>([]);
  const [lang, setLang] = useState<Lang>('en');

  useEffect(() => {
    if (id) {
      api.getRecipe(id).then(setRecipe).catch(console.log);
      api.getSubstitutions(id).then(r => setSubs(r?.substitutions || [])).catch(() => {});
    }
    api.getProfile().then(p => p && setLang(p.language || 'en')).catch(() => {});
  }, [id]);

  if (!recipe) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={colors.terracotta} style={{ marginTop: 100 }} />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container} testID="recipe-detail-screen">
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <View style={styles.hero}>
          <Image source={{ uri: recipe.image }} style={styles.heroImage} />
          <View style={styles.heroOverlay} />
          <SafeAreaView edges={['top']} style={styles.heroNav}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} testID="back-btn">
              <Ionicons name="arrow-back" size={22} color={colors.coconut} />
            </TouchableOpacity>
            <View style={styles.heroBadges}>
              {recipe.ayurvedic && (
                <View style={[styles.heroBadge, { backgroundColor: colors.basil }]}>
                  <Ionicons name="leaf" size={12} color="#fff" />
                  <Text style={styles.heroBadgeText}>{t('ayurvedic', lang)}</Text>
                </View>
              )}
              {recipe.scientific && (
                <View style={[styles.heroBadge, { backgroundColor: colors.indigo }]}>
                  <Ionicons name="flask" size={12} color="#fff" />
                  <Text style={styles.heroBadgeText}>{t('scientific', lang)}</Text>
                </View>
              )}
            </View>
          </SafeAreaView>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>{recipe.title[lang] || recipe.title.en}</Text>
          <Text style={styles.desc}>{recipe.description}</Text>

          <View style={styles.metaRow}>
            <MetaItem icon="time-outline" label={t('prepTime', lang)} value={`${recipe.prep_time}${t('min', lang)}`} />
            <MetaItem icon="flame-outline" label={t('cookTime', lang)} value={`${recipe.cook_time}${t('min', lang)}`} />
            <MetaItem icon="star" label="Rating" value={recipe.rating.toFixed(1)} color={colors.marigold} />
          </View>

          {/* Nutrition */}
          <Text style={styles.sectionTitle}>{t('nutrition', lang)}</Text>
          <View style={styles.nutrGrid}>
            {recipe.nutrition.calories && <NutrItem label="Cal" value={recipe.nutrition.calories} />}
            {recipe.nutrition.protein && <NutrItem label="Protein" value={`${recipe.nutrition.protein}g`} />}
            {recipe.nutrition.carbs && <NutrItem label="Carbs" value={`${recipe.nutrition.carbs}g`} />}
            {recipe.nutrition.fat && <NutrItem label="Fat" value={`${recipe.nutrition.fat}g`} />}
          </View>

          {/* Ingredients */}
          <Text style={styles.sectionTitle}>{t('ingredients', lang)}</Text>
          {recipe.ingredients.map((ing: string, i: number) => (
            <View key={i} style={styles.ingItem}>
              <View style={styles.bullet} />
              <Text style={styles.ingText}>{ing}</Text>
            </View>
          ))}

          {/* Steps */}
          <Text style={styles.sectionTitle}>{t('steps', lang)}</Text>
          {recipe.steps.map((step: string, i: number) => (
            <View key={i} style={styles.stepItem}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>{i + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}

          {/* Substitutions */}
          {subs.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>{t('substitutions', lang)}</Text>
              <Text style={styles.subsDesc}>{t('substitutionsDesc', lang)}</Text>
              {subs.map((s, i) => (
                <View key={i} style={styles.subBlock} testID={`sub-${s.ingredient}`}>
                  <View style={styles.subHeader}>
                    <Ionicons name="swap-horizontal" size={14} color={colors.terracotta} />
                    <Text style={styles.subIngName}>{s.ingredient}</Text>
                  </View>
                  {s.alternatives.map((alt: any, j: number) => (
                    <View key={j} style={styles.altRow}>
                      <View style={styles.altBullet} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.altName}>{alt.swap}</Text>
                        <Text style={styles.altReason}>{alt.reason}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              ))}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function MetaItem({ icon, label, value, color }: any) {
  return (
    <View style={styles.metaItem}>
      <Ionicons name={icon} size={16} color={color || colors.terracotta} />
      <Text style={styles.metaValue}>{value}</Text>
      <Text style={styles.metaLabel}>{label}</Text>
    </View>
  );
}

function NutrItem({ label, value }: any) {
  return (
    <View style={styles.nutrItem}>
      <Text style={styles.nutrValue}>{value}</Text>
      <Text style={styles.nutrLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  hero: { height: 300, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.25)' },
  heroNav: { position: 'absolute', top: 0, left: 0, right: 0, padding: spacing.base, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  heroBadges: { gap: 6 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.round },
  heroBadgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  content: { backgroundColor: colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -24, padding: spacing.base, paddingTop: spacing.lg },
  title: { fontSize: 26, fontFamily: 'serif', fontWeight: '700', color: colors.indigo },
  desc: { fontSize: 14, color: colors.textSecondary, marginTop: spacing.sm, lineHeight: 22 },
  metaRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.base },
  metaItem: { flex: 1, alignItems: 'center', padding: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, gap: 2 },
  metaValue: { fontSize: 15, fontWeight: '700', color: colors.indigo, fontFamily: 'serif' },
  metaLabel: { fontSize: 10, color: colors.textMuted, textTransform: 'uppercase' },
  sectionTitle: { fontSize: 18, fontFamily: 'serif', fontWeight: '700', color: colors.indigo, marginTop: spacing.lg, marginBottom: spacing.sm },
  nutrGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  nutrItem: { minWidth: 70, backgroundColor: colors.saffronCream, padding: spacing.sm, borderRadius: radius.md, alignItems: 'center' },
  nutrValue: { fontSize: 16, fontWeight: '700', color: colors.terracotta, fontFamily: 'serif' },
  nutrLabel: { fontSize: 10, color: colors.textSecondary, marginTop: 2, textTransform: 'uppercase' },
  ingItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 6 },
  bullet: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.terracotta },
  ingText: { fontSize: 14, color: colors.indigo, flex: 1 },
  stepItem: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.base },
  stepNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.terracotta, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { color: colors.coconut, fontWeight: '700', fontSize: 13 },
  stepText: { flex: 1, fontSize: 14, color: colors.indigo, lineHeight: 22, paddingTop: 4 },
  subsDesc: { fontSize: 13, color: colors.textSecondary, marginBottom: spacing.sm, marginTop: -4 },
  subBlock: { backgroundColor: colors.saffronCream, padding: spacing.sm, borderRadius: radius.md, marginBottom: spacing.sm, borderLeftWidth: 3, borderLeftColor: colors.terracotta },
  subHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  subIngName: { fontSize: 13, fontWeight: '700', color: colors.indigo, textTransform: 'capitalize' },
  altRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 4, paddingLeft: 4 },
  altBullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.basil, marginTop: 6 },
  altName: { fontSize: 13, fontWeight: '600', color: colors.indigo },
  altReason: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
});
