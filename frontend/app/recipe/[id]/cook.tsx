import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing, shadow } from '../../../src/lib/theme';
import { t, Lang } from '../../../src/lib/i18n';
import { api } from '../../../src/lib/api';

const { width } = Dimensions.get('window');

export default function CookMode() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [recipe, setRecipe] = useState<any>(null);
  const [idx, setIdx] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [paused, setPaused] = useState(false);
  const [lang, setLang] = useState<Lang>('en');
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (id) api.getRecipe(id).then(r => {
      setRecipe(r);
      const secs = Math.max(30, Math.round((r.cook_time * 60) / r.steps.length));
      setRemaining(secs);
    }).catch(console.log);
    api.getProfile().then(p => p && setLang(p.language || 'en')).catch(() => {});
  }, [id]);

  useEffect(() => {
    if (paused || !recipe) return;
    tick.current = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          // auto-advance
          setIdx(i => {
            if (i + 1 < recipe.steps.length) {
              const nextSecs = Math.max(30, Math.round((recipe.cook_time * 60) / recipe.steps.length));
              setRemaining(nextSecs);
              return i + 1;
            }
            return i;
          });
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => { if (tick.current) clearInterval(tick.current); };
  }, [paused, recipe]);

  if (!recipe) return null;

  const isLast = idx >= recipe.steps.length - 1;
  const isDone = idx === recipe.steps.length - 1 && remaining === 0;
  const stepSecsTotal = Math.max(30, Math.round((recipe.cook_time * 60) / recipe.steps.length));
  const progress = 1 - (remaining / stepSecsTotal);
  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');

  const next = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (idx + 1 < recipe.steps.length) {
      setIdx(idx + 1);
      setRemaining(stepSecsTotal);
    }
  };
  const prev = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (idx > 0) {
      setIdx(idx - 1);
      setRemaining(stepSecsTotal);
    }
  };

  if (isDone) {
    return (
      <SafeAreaView style={styles.container} testID="cook-done-screen">
        <View style={styles.doneWrap}>
          <View style={styles.doneIcon}>
            <Ionicons name="checkmark-circle" size={72} color={colors.basil} />
          </View>
          <Text style={styles.doneTitle}>{t('doneCooking', lang)}</Text>
          <Text style={styles.doneSub}>{t('cookingDone', lang)}</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.back()} testID="done-close">
            <Text style={styles.primaryBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} testID="cook-mode-screen">
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} testID="cook-close">
          <Ionicons name="close" size={26} color={colors.indigo} />
        </TouchableOpacity>
        <Text style={styles.topTitle} numberOfLines={1}>{recipe.title[lang] || recipe.title.en}</Text>
        <View style={{ width: 26 }} />
      </View>

      <View style={styles.progressRow}>
        {recipe.steps.map((_: any, i: number) => (
          <View key={i} style={[styles.progressDot, i === idx && styles.progressDotActive, i < idx && styles.progressDotDone]} />
        ))}
      </View>

      <View style={styles.content}>
        <Text style={styles.stepLabel}>{t('step', lang)} {idx + 1} {t('of', lang)} {recipe.steps.length}</Text>
        <Text style={styles.stepText}>{recipe.steps[idx]}</Text>

        <View style={styles.timerWrap}>
          <View style={[styles.timerRing, { transform: [{ rotate: `${progress * 360}deg` }] }]} />
          <View style={styles.timerInner}>
            <Text style={styles.timerValue}>{mm}:{ss}</Text>
            <Text style={styles.timerLabel}>auto-advance</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.pauseBtn} onPress={() => setPaused(p => !p)} testID="pause-btn">
          <Ionicons name={paused ? 'play' : 'pause'} size={18} color={colors.coconut} />
          <Text style={styles.pauseText}>{paused ? t('resumeTimer', lang) : t('pauseTimer', lang)}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomRow}>
        <TouchableOpacity style={[styles.navBtn, idx === 0 && styles.navBtnDisabled]} onPress={prev} disabled={idx === 0} testID="prev-step">
          <Ionicons name="chevron-back" size={20} color={idx === 0 ? colors.textMuted : colors.terracotta} />
          <Text style={[styles.navText, idx === 0 && { color: colors.textMuted }]}>{t('previousStep', lang)}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navBtn, styles.navBtnPrimary]} onPress={next} testID="next-step">
          <Text style={[styles.navText, { color: colors.coconut }]}>{isLast ? t('doneCooking', lang) : t('nextStep', lang)}</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.coconut} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const SIZE = Math.min(width * 0.55, 240);
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.base, borderBottomWidth: 1, borderBottomColor: colors.border },
  topTitle: { flex: 1, textAlign: 'center', fontFamily: 'serif', fontSize: 16, fontWeight: '600', color: colors.indigo, marginHorizontal: spacing.sm },
  progressRow: { flexDirection: 'row', gap: 4, padding: spacing.base, justifyContent: 'center' },
  progressDot: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.border },
  progressDotActive: { backgroundColor: colors.terracotta },
  progressDotDone: { backgroundColor: colors.basil },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.lg },
  stepLabel: { fontSize: 12, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 2, fontWeight: '700' },
  stepText: { fontSize: 22, color: colors.indigo, fontFamily: 'serif', textAlign: 'center', lineHeight: 32, paddingHorizontal: spacing.sm },
  timerWrap: { width: SIZE, height: SIZE, borderRadius: SIZE / 2, backgroundColor: colors.saffronCream, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 6, borderColor: colors.terracotta + '30' },
  timerRing: { position: 'absolute', width: '50%', height: '100%', right: 0, backgroundColor: colors.terracotta + '25' },
  timerInner: { alignItems: 'center', backgroundColor: colors.coconut, width: SIZE * 0.72, height: SIZE * 0.72, borderRadius: SIZE * 0.36, justifyContent: 'center', ...shadow.soft },
  timerValue: { fontSize: 40, fontWeight: '700', color: colors.terracotta, fontFamily: 'serif' },
  timerLabel: { fontSize: 11, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 2 },
  pauseBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: colors.indigo, borderRadius: radius.round },
  pauseText: { color: colors.coconut, fontWeight: '600' },
  bottomRow: { flexDirection: 'row', gap: spacing.sm, padding: spacing.base, paddingBottom: spacing.lg },
  navBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  navBtnPrimary: { backgroundColor: colors.terracotta, borderColor: colors.terracotta },
  navBtnDisabled: { opacity: 0.5 },
  navText: { fontSize: 14, fontWeight: '600', color: colors.terracotta },
  doneWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.base },
  doneIcon: { marginBottom: spacing.base },
  doneTitle: { fontSize: 32, fontFamily: 'serif', fontWeight: '700', color: colors.indigo },
  doneSub: { fontSize: 16, color: colors.textSecondary, textAlign: 'center', lineHeight: 24 },
  primaryBtn: { marginTop: spacing.lg, paddingHorizontal: 32, paddingVertical: 14, backgroundColor: colors.terracotta, borderRadius: radius.lg },
  primaryBtnText: { color: colors.coconut, fontWeight: '600', fontSize: 15 },
});
