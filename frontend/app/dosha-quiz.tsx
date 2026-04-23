import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, shadow } from '../src/lib/theme';
import { t, Lang } from '../src/lib/i18n';
import { api } from '../src/lib/api';

export default function DoshaQuiz() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState<Lang>('en');

  useEffect(() => {
    api.getDoshaQuiz().then(r => setQuestions(r.questions)).catch(console.log);
    api.getProfile().then(p => p && setLang(p.language || 'en')).catch(() => {});
  }, []);

  const pick = async (dosha: string) => {
    const next = [...answers, dosha];
    setAnswers(next);
    if (idx + 1 >= questions.length) {
      setLoading(true);
      try {
        const r = await api.submitDosha(next);
        setResult(r);
      } catch (e: any) {
        console.log(e);
      } finally {
        setLoading(false);
      }
    } else {
      setIdx(idx + 1);
    }
  };

  if (result) {
    const g = result.guidance;
    return (
      <SafeAreaView style={styles.container} testID="dosha-result-screen">
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => router.back()}><Ionicons name="close" size={24} color={colors.indigo} /></TouchableOpacity>
          <Text style={styles.headerTitle}>{t('dosha', lang)}</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView contentContainerStyle={styles.resultScroll}>
          <View style={[styles.resultHero, { backgroundColor: g.color + '20', borderColor: g.color }]}>
            <Text style={[styles.resultDosha, { color: g.color }]}>{g.name}</Text>
            <Text style={styles.resultNature}>{g.nature}</Text>
          </View>

          <View style={styles.scoreRow}>
            {(['vata','pitta','kapha'] as const).map(k => (
              <View key={k} style={styles.scoreCard}>
                <Text style={styles.scoreVal}>{result.scores[k]}</Text>
                <Text style={styles.scoreLabel}>{k}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.section}>{t('favor', lang)}</Text>
          {g.favor.map((x: string, i: number) => (
            <View key={i} style={styles.listItem}>
              <Ionicons name="checkmark-circle" size={16} color={colors.basil} />
              <Text style={styles.listText}>{x}</Text>
            </View>
          ))}

          <Text style={[styles.section, { color: colors.marigold }]}>{t('reduce', lang)}</Text>
          {g.reduce.map((x: string, i: number) => (
            <View key={i} style={styles.listItem}>
              <Ionicons name="remove-circle" size={16} color={colors.marigold} />
              <Text style={styles.listText}>{x}</Text>
            </View>
          ))}

          <TouchableOpacity style={styles.doneBtn} onPress={() => router.back()} testID="dosha-done">
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const q = questions[idx];
  const progress = questions.length ? (idx + 1) / questions.length : 0;

  return (
    <SafeAreaView style={styles.container} testID="dosha-quiz-screen">
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="close" size={24} color={colors.indigo} /></TouchableOpacity>
        <Text style={styles.headerTitle}>{t('doshaQuiz', lang)}</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${progress * 100}%` }]} /></View>
      {loading || !q ? (
        <ActivityIndicator style={{ flex: 1 }} color={colors.terracotta} size="large" />
      ) : (
        <View style={styles.qWrap}>
          <Text style={styles.qCount}>Question {idx + 1} of {questions.length}</Text>
          <Text style={styles.qText}>{q.q}</Text>
          <View style={{ gap: 12 }}>
            {q.options.map((o: any, i: number) => (
              <TouchableOpacity
                key={i}
                style={styles.optBtn}
                onPress={() => pick(o.dosha)}
                testID={`dosha-opt-${i}`}
              >
                <Text style={styles.optText}>{o.label}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.terracotta} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.base, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { fontSize: 17, fontFamily: 'serif', fontWeight: '700', color: colors.indigo },
  progressBar: { height: 4, backgroundColor: colors.border },
  progressFill: { height: 4, backgroundColor: colors.terracotta },
  qWrap: { flex: 1, padding: spacing.lg, justifyContent: 'center' },
  qCount: { fontSize: 12, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 },
  qText: { fontSize: 22, fontFamily: 'serif', fontWeight: '700', color: colors.indigo, marginBottom: spacing.lg, lineHeight: 30 },
  optBtn: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.base, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: colors.border, ...shadow.soft },
  optText: { flex: 1, fontSize: 15, color: colors.indigo, lineHeight: 22, marginRight: spacing.sm },
  resultScroll: { padding: spacing.base, paddingBottom: spacing.xxl },
  resultHero: { padding: spacing.lg, borderRadius: radius.lg, alignItems: 'center', borderWidth: 2, gap: 8, marginBottom: spacing.base },
  resultDosha: { fontSize: 26, fontFamily: 'serif', fontWeight: '800' },
  resultNature: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  scoreRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.base },
  scoreCard: { flex: 1, padding: spacing.base, backgroundColor: colors.surface, borderRadius: radius.md, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  scoreVal: { fontSize: 24, fontWeight: '700', color: colors.terracotta, fontFamily: 'serif' },
  scoreLabel: { fontSize: 11, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 },
  section: { fontSize: 14, fontWeight: '700', color: colors.basil, marginTop: spacing.base, marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 1 },
  listItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.md, marginBottom: 6 },
  listText: { flex: 1, fontSize: 14, color: colors.indigo },
  doneBtn: { marginTop: spacing.lg, backgroundColor: colors.terracotta, padding: spacing.base, borderRadius: radius.lg, alignItems: 'center' },
  doneBtnText: { color: colors.coconut, fontWeight: '700', fontSize: 15 },
});
