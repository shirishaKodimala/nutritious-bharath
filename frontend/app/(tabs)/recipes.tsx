import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Image, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, shadow } from '../../src/lib/theme';
import { t, Lang } from '../../src/lib/i18n';
import { api } from '../../src/lib/api';

const CATS = [
  { key: 'all', labelKey: 'all', icon: 'grid' },
  { key: 'breakfast', labelKey: 'breakfast', icon: 'sunny' },
  { key: 'lunch', labelKey: 'lunch', icon: 'restaurant' },
  { key: 'snack', labelKey: 'snack', icon: 'cafe' },
  { key: 'dinner', labelKey: 'dinner', icon: 'moon' },
];

export default function Recipes() {
  const [recipes, setRecipes] = useState<any[]>([]);
  const [cat, setCat] = useState('all');
  const [search, setSearch] = useState('');
  const [lang, setLang] = useState<Lang>('en');

  useFocusEffect(useCallback(() => {
    api.getProfile().then(p => p && setLang(p.language || 'en')).catch(() => {});
  }, []));

  useEffect(() => {
    const timeout = setTimeout(() => {
      api.listRecipes({ category: cat, search }).then(setRecipes).catch(e => console.log(e));
    }, 300);
    return () => clearTimeout(timeout);
  }, [cat, search]);

  const renderCard = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/recipe/${item.id}`)}
      testID={`recipe-card-${item.id}`}
    >
      <Image source={{ uri: item.image }} style={styles.cardImage} />
      <View style={styles.cardBadgeRow}>
        {item.ayurvedic && (
          <View style={[styles.badge, { backgroundColor: colors.basil }]}>
            <Ionicons name="leaf" size={10} color="#fff" />
          </View>
        )}
        {item.scientific && (
          <View style={[styles.badge, { backgroundColor: colors.indigo }]}>
            <Ionicons name="flask" size={10} color="#fff" />
          </View>
        )}
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.title[lang] || item.title.en}</Text>
        <View style={styles.cardMeta}>
          <Ionicons name="time-outline" size={12} color={colors.textMuted} />
          <Text style={styles.cardMetaText}>{item.prep_time + item.cook_time}{t('min', lang)}</Text>
          <Ionicons name="star" size={12} color={colors.marigold} style={{ marginLeft: 8 }} />
          <Text style={styles.cardMetaText}>{item.rating.toFixed(1)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']} testID="recipes-screen">
      <View style={styles.headerWrap}>
        <Text style={styles.title}>{t('recipes', lang)}</Text>
        <Text style={styles.subtitle}>{recipes.length} dishes for your little one</Text>
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.search}
            value={search}
            onChangeText={setSearch}
            placeholder={t('searchRecipes', lang)}
            placeholderTextColor={colors.textMuted}
            testID="recipes-search"
          />
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
        {CATS.map(c => (
          <TouchableOpacity
            key={c.key}
            style={[styles.catChip, cat === c.key && styles.catChipActive]}
            onPress={() => setCat(c.key)}
            testID={`cat-${c.key}`}
          >
            <Ionicons name={c.icon as any} size={14} color={cat === c.key ? colors.coconut : colors.textSecondary} />
            <Text style={[styles.catText, cat === c.key && styles.catTextActive]}>{t(c.labelKey, lang)}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={recipes}
        keyExtractor={item => item.id}
        renderItem={renderCard}
        numColumns={2}
        columnWrapperStyle={{ gap: spacing.sm, paddingHorizontal: spacing.base }}
        contentContainerStyle={{ paddingBottom: spacing.xxl, gap: spacing.sm }}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  headerWrap: { padding: spacing.base, paddingBottom: spacing.sm },
  title: { fontSize: 28, fontFamily: 'serif', fontWeight: '700', color: colors.indigo },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2, marginBottom: spacing.md },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.surface, borderRadius: radius.lg, paddingHorizontal: spacing.md,
    borderWidth: 1, borderColor: colors.border,
  },
  search: { flex: 1, paddingVertical: 12, fontSize: 14, color: colors.indigo },
  catRow: { paddingHorizontal: spacing.base, gap: 8, paddingVertical: spacing.sm },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.round, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, height: 36 },
  catChipActive: { backgroundColor: colors.terracotta, borderColor: colors.terracotta },
  catText: { fontSize: 13, fontWeight: '500', color: colors.textSecondary },
  catTextActive: { color: colors.coconut, fontWeight: '600' },
  card: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg, overflow: 'hidden', ...shadow.soft, borderWidth: 1, borderColor: colors.border },
  cardImage: { width: '100%', height: 120 },
  cardBadgeRow: { position: 'absolute', top: 8, left: 8, flexDirection: 'row', gap: 4 },
  badge: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  cardBody: { padding: spacing.sm },
  cardTitle: { fontSize: 14, fontWeight: '600', color: colors.indigo, fontFamily: 'serif' },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  cardMetaText: { fontSize: 11, color: colors.textMuted },
});
