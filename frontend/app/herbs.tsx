import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, shadow } from '../src/lib/theme';
import { t, Lang } from '../src/lib/i18n';
import { api } from '../src/lib/api';

export default function Herbs() {
  const [herbs, setHerbs] = useState<any[]>([]);
  const [lang, setLang] = useState<Lang>('en');

  useEffect(() => {
    api.getHerbs().then(r => setHerbs(r.herbs)).catch(console.log);
    api.getProfile().then(p => p && setLang(p.language || 'en')).catch(() => {});
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']} testID="herbs-screen">
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} testID="herbs-back">
          <Ionicons name="arrow-back" size={24} color={colors.indigo} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('herbs', lang)}</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.base, paddingBottom: spacing.xxl, gap: spacing.base }}>
        <Text style={styles.intro}>Ancient herbs with child-safe dosages 🌿</Text>
        {herbs.map(h => {
          const name = lang === 'hi' ? h.name_hi : lang === 'te' ? h.name_te : h.name;
          return (
            <View key={h.key} style={styles.card} testID={`herb-${h.key}`}>
              <Image source={{ uri: h.image }} style={styles.img} />
              <View style={styles.body}>
                <Text style={styles.name}>{name}</Text>
                <Text style={styles.origName}>{h.name}</Text>

                <View style={styles.row}>
                  <Ionicons name="leaf" size={14} color={colors.basil} />
                  <Text style={styles.rowLabel}>{t('benefits', lang)}:</Text>
                </View>
                <Text style={styles.rowText}>{h.benefits.join(' • ')}</Text>

                <View style={styles.row}>
                  <Ionicons name="medkit" size={14} color={colors.indigo} />
                  <Text style={styles.rowLabel}>{t('dosage', lang)}:</Text>
                </View>
                <Text style={styles.rowText}>{h.dosage}</Text>

                <View style={styles.row}>
                  <Ionicons name="warning" size={14} color={colors.marigold} />
                  <Text style={styles.rowLabel}>{t('caution', lang)}:</Text>
                </View>
                <Text style={styles.rowText}>{h.caution}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.base, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { fontSize: 18, fontFamily: 'serif', fontWeight: '700', color: colors.indigo },
  intro: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.sm },
  card: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, ...shadow.soft },
  img: { width: 100, height: 'auto', backgroundColor: colors.saffronCream },
  body: { flex: 1, padding: spacing.sm, gap: 3 },
  name: { fontSize: 16, fontFamily: 'serif', fontWeight: '700', color: colors.indigo },
  origName: { fontSize: 11, color: colors.textMuted, marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  rowLabel: { fontSize: 10, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  rowText: { fontSize: 12, color: colors.indigo, lineHeight: 16, paddingLeft: 18 },
});
