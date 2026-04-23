import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  KeyboardAvoidingView, Platform, Image, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, shadow } from '../src/lib/theme';
import { t, Lang } from '../src/lib/i18n';
import { api } from '../src/lib/api';

const SLIDES = [
  {
    key: 1,
    titleKey: 'onboardTitle1',
    descKey: 'onboardDesc1',
    image: 'https://images.pexels.com/photos/7491419/pexels-photo-7491419.jpeg',
    icon: 'leaf' as const,
  },
  {
    key: 2,
    titleKey: 'onboardTitle2',
    descKey: 'onboardDesc2',
    image: 'https://images.pexels.com/photos/1596040033229-a9821ebd058d.jpeg',
    fallbackImage: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d',
    icon: 'flask' as const,
  },
  {
    key: 3,
    titleKey: 'onboardTitle3',
    descKey: 'onboardDesc3',
    image: 'https://images.pexels.com/photos/6363501/pexels-photo-6363501.jpeg',
    icon: 'sparkles' as const,
  },
];

const REGIONS = [
  { key: 'north', label: 'northIndia' },
  { key: 'south', label: 'southIndia' },
  { key: 'east', label: 'eastIndia' },
  { key: 'west', label: 'westIndia' },
  { key: 'pan-india', label: 'panIndia' },
];

const LANGS: { key: Lang; label: string }[] = [
  { key: 'en', label: 'English' },
  { key: 'hi', label: 'हिन्दी' },
  { key: 'te', label: 'తెలుగు' },
];

export default function Onboarding() {
  const [step, setStep] = useState(0); // 0-2 slides, 3 form
  const [lang, setLang] = useState<Lang>('en');
  const [form, setForm] = useState({
    mother_name: '',
    child_name: '',
    child_age_months: '30',
    child_weight_kg: '12',
    child_height_cm: '90',
    allergies: '',
    region: 'pan-india',
    dietary: 'vegetarian',
  });

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleSubmit = async () => {
    if (!form.mother_name || !form.child_name) {
      Alert.alert('Please fill all required fields');
      return;
    }
    try {
      await api.saveProfile({
        mother_name: form.mother_name,
        child_name: form.child_name,
        child_age_months: parseInt(form.child_age_months) || 30,
        child_weight_kg: parseFloat(form.child_weight_kg) || 12,
        child_height_cm: parseFloat(form.child_height_cm) || 90,
        allergies: form.allergies.split(',').map(s => s.trim()).filter(Boolean),
        region: form.region,
        language: lang,
        dietary: form.dietary,
      });
      router.replace('/(tabs)/home');
    } catch (e: any) {
      Alert.alert('Error saving profile', String(e.message || e));
    }
  };

  if (step < 3) {
    const slide = SLIDES[step];
    return (
      <SafeAreaView style={styles.container} testID="onboarding-screen">
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => setStep(3)} testID="onboarding-skip">
            <Text style={styles.skipText}>{t('skip', lang)}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.slideContent}>
          <View style={styles.imageWrap}>
            <Image source={{ uri: slide.image }} style={styles.slideImage} />
            <View style={styles.imageOverlay} />
            <View style={styles.iconBadge}>
              <Ionicons name={slide.icon} size={28} color={colors.terracotta} />
            </View>
          </View>
          <Text style={styles.slideTitle}>{t(slide.titleKey, lang)}</Text>
          <Text style={styles.slideDesc}>{t(slide.descKey, lang)}</Text>
        </View>
        <View style={styles.bottomBar}>
          <View style={styles.dots}>
            {SLIDES.map((_, i) => (
              <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
            ))}
          </View>
          <TouchableOpacity style={styles.primaryBtn} onPress={handleNext} testID="onboarding-next">
            <Text style={styles.primaryBtnText}>
              {step === SLIDES.length - 1 ? t('getStarted', lang) : t('next', lang)}
            </Text>
            <Ionicons name="arrow-forward" size={20} color={colors.coconut} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Form
  return (
    <SafeAreaView style={styles.container} testID="profile-setup-screen">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.formTitle}>{t('welcome', lang)}</Text>
          <Text style={styles.formSubtitle}>Let&apos;s get to know your little one</Text>

          {/* Language */}
          <Text style={styles.label}>{t('language', lang)}</Text>
          <View style={styles.chipRow}>
            {LANGS.map(l => (
              <TouchableOpacity
                key={l.key}
                style={[styles.chip, lang === l.key && styles.chipActive]}
                onPress={() => setLang(l.key)}
                testID={`lang-${l.key}`}
              >
                <Text style={[styles.chipText, lang === l.key && styles.chipTextActive]}>{l.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>{t('motherName', lang)}</Text>
          <TextInput
            style={styles.input}
            value={form.mother_name}
            onChangeText={v => setForm({ ...form, mother_name: v })}
            placeholder="Priya"
            placeholderTextColor={colors.textMuted}
            testID="input-mother-name"
          />

          <Text style={styles.label}>{t('childName', lang)}</Text>
          <TextInput
            style={styles.input}
            value={form.child_name}
            onChangeText={v => setForm({ ...form, child_name: v })}
            placeholder="Arjun"
            placeholderTextColor={colors.textMuted}
            testID="input-child-name"
          />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{t('ageMonths', lang)}</Text>
              <TextInput
                style={styles.input}
                value={form.child_age_months}
                onChangeText={v => setForm({ ...form, child_age_months: v })}
                keyboardType="numeric"
                testID="input-age"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{t('weight', lang)}</Text>
              <TextInput
                style={styles.input}
                value={form.child_weight_kg}
                onChangeText={v => setForm({ ...form, child_weight_kg: v })}
                keyboardType="numeric"
                testID="input-weight"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{t('height', lang)}</Text>
              <TextInput
                style={styles.input}
                value={form.child_height_cm}
                onChangeText={v => setForm({ ...form, child_height_cm: v })}
                keyboardType="numeric"
                testID="input-height"
              />
            </View>
          </View>

          <Text style={styles.label}>{t('allergies', lang)}</Text>
          <TextInput
            style={styles.input}
            value={form.allergies}
            onChangeText={v => setForm({ ...form, allergies: v })}
            placeholder="peanuts, lactose"
            placeholderTextColor={colors.textMuted}
            testID="input-allergies"
          />

          <Text style={styles.label}>{t('region', lang)}</Text>
          <View style={styles.chipRow}>
            {REGIONS.map(r => (
              <TouchableOpacity
                key={r.key}
                style={[styles.chip, form.region === r.key && styles.chipActive]}
                onPress={() => setForm({ ...form, region: r.key })}
                testID={`region-${r.key}`}
              >
                <Text style={[styles.chipText, form.region === r.key && styles.chipTextActive]}>
                  {t(r.label, lang)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>{t('dietary', lang)}</Text>
          <View style={styles.chipRow}>
            {['vegetarian', 'non-vegetarian', 'jain'].map(d => (
              <TouchableOpacity
                key={d}
                style={[styles.chip, form.dietary === d && styles.chipActive]}
                onPress={() => setForm({ ...form, dietary: d })}
                testID={`diet-${d}`}
              >
                <Text style={[styles.chipText, form.dietary === d && styles.chipTextActive]}>
                  {d === 'vegetarian' ? t('vegetarian', lang) : d === 'non-vegetarian' ? t('nonVegetarian', lang) : t('jain', lang)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={[styles.primaryBtn, { marginTop: spacing.xl }]} onPress={handleSubmit} testID="submit-profile">
            <Text style={styles.primaryBtnText}>{t('save', lang)}</Text>
            <Ionicons name="checkmark" size={20} color={colors.coconut} />
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  topBar: { flexDirection: 'row', justifyContent: 'flex-end', padding: spacing.base },
  skipText: { color: colors.textSecondary, fontSize: 16, fontWeight: '500' },
  slideContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg },
  imageWrap: { width: 280, height: 280, borderRadius: 140, overflow: 'hidden', marginBottom: spacing.xl, ...shadow.card },
  slideImage: { width: '100%', height: '100%' },
  imageOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(210,105,30,0.08)' },
  iconBadge: {
    position: 'absolute', bottom: 20, right: 20,
    width: 56, height: 56, borderRadius: 28, backgroundColor: colors.coconut,
    alignItems: 'center', justifyContent: 'center', ...shadow.soft,
  },
  slideTitle: { fontSize: 30, fontFamily: 'serif', fontWeight: '700', color: colors.indigo, textAlign: 'center', marginBottom: spacing.md },
  slideDesc: { fontSize: 16, color: colors.textSecondary, textAlign: 'center', lineHeight: 24, paddingHorizontal: spacing.md },
  bottomBar: { padding: spacing.lg, paddingBottom: spacing.xl },
  dots: { flexDirection: 'row', justifyContent: 'center', marginBottom: spacing.base, gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.terracotta, width: 24 },
  primaryBtn: {
    backgroundColor: colors.terracotta, borderRadius: radius.lg, paddingVertical: 16,
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, ...shadow.soft,
  },
  primaryBtnText: { color: colors.coconut, fontSize: 16, fontWeight: '600' },

  formScroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  formTitle: { fontSize: 28, fontFamily: 'serif', fontWeight: '700', color: colors.indigo },
  formSubtitle: { fontSize: 15, color: colors.textSecondary, marginBottom: spacing.lg },
  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginTop: spacing.base, marginBottom: spacing.xs, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: colors.indigo, borderWidth: 1, borderColor: colors.border,
  },
  row: { flexDirection: 'row', gap: spacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.round, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.terracotta, borderColor: colors.terracotta },
  chipText: { color: colors.textSecondary, fontSize: 13, fontWeight: '500' },
  chipTextActive: { color: colors.coconut, fontWeight: '600' },
});
