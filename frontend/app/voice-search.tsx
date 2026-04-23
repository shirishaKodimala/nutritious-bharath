import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  useAudioRecorder, RecordingPresets, AudioModule, setAudioModeAsync,
} from 'expo-audio';
import { colors, radius, spacing, shadow } from '../src/lib/theme';
import { t, Lang } from '../src/lib/i18n';
import { api } from '../src/lib/api';

export default function VoiceSearch() {
  const [lang, setLang] = useState<Lang>('en');
  const [state, setState] = useState<'idle' | 'recording' | 'processing' | 'done'>('idle');
  const [transcript, setTranscript] = useState('');
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  useEffect(() => {
    api.getProfile().then(p => p && setLang(p.language || 'en')).catch(() => {});
  }, []);

  const startRecord = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Voice search', 'Voice search is available on mobile app only.');
      return;
    }
    try {
      const perm = await AudioModule.requestRecordingPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(t('micPermDenied', lang));
        return;
      }
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setState('recording');
      // auto-stop after 5 seconds
      setTimeout(async () => {
        if (recorder.isRecording) {
          await stopAndTranscribe();
        }
      }, 5000);
    } catch (e: any) {
      Alert.alert('Could not start recording', String(e.message || e));
      setState('idle');
    }
  };

  const stopAndTranscribe = async () => {
    try {
      setState('processing');
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) throw new Error('No audio recorded');
      const res = await api.transcribe(uri, lang);
      const text = (res.text || '').trim();
      setTranscript(text);
      setState('done');
      if (text) {
        // Route to recipes with search param
        setTimeout(() => {
          router.replace({ pathname: '/(tabs)/recipes', params: { q: text } });
        }, 800);
      }
    } catch (e: any) {
      Alert.alert('Transcription failed', String(e.message || e));
      setState('idle');
    }
  };

  return (
    <View style={styles.overlay} testID="voice-search-screen">
      <TouchableOpacity style={styles.backdrop} onPress={() => router.back()} />
      <SafeAreaView style={styles.sheet} edges={['bottom']}>
        <View style={styles.handle} />
        <Text style={styles.title}>{t('voiceSearch', lang)}</Text>
        <Text style={styles.subtitle}>
          {state === 'recording' ? t('listening', lang) :
           state === 'processing' ? t('processing', lang) :
           state === 'done' ? `"${transcript}"` :
           t('tapToSpeak', lang)}
        </Text>

        <View style={styles.micWrap}>
          {state === 'recording' && <View style={[styles.ripple, styles.ripple1]} />}
          {state === 'recording' && <View style={[styles.ripple, styles.ripple2]} />}
          <TouchableOpacity
            style={[
              styles.micBtn,
              state === 'recording' && styles.micBtnActive,
              state === 'done' && { backgroundColor: colors.basil },
            ]}
            onPress={state === 'idle' ? startRecord : state === 'recording' ? stopAndTranscribe : undefined}
            disabled={state === 'processing'}
            testID="mic-btn"
          >
            {state === 'processing' ? (
              <ActivityIndicator color={colors.coconut} size="large" />
            ) : state === 'done' ? (
              <Ionicons name="checkmark" size={40} color={colors.coconut} />
            ) : (
              <Ionicons name={state === 'recording' ? 'stop' : 'mic'} size={40} color={colors.coconut} />
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.langHint}>Language: {lang === 'en' ? 'English' : lang === 'hi' ? 'हिन्दी' : 'తెలుగు'}</Text>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(75,0,130,0.45)' },
  sheet: { backgroundColor: colors.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: spacing.lg, alignItems: 'center', gap: spacing.base, paddingBottom: spacing.xxl },
  handle: { width: 44, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: spacing.sm },
  title: { fontSize: 22, fontFamily: 'serif', fontWeight: '700', color: colors.indigo },
  subtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', minHeight: 40, lineHeight: 20, paddingHorizontal: spacing.base },
  micWrap: { width: 180, height: 180, alignItems: 'center', justifyContent: 'center', marginVertical: spacing.base },
  ripple: { position: 'absolute', borderRadius: 90, backgroundColor: colors.terracotta + '20' },
  ripple1: { width: 150, height: 150 },
  ripple2: { width: 180, height: 180, backgroundColor: colors.terracotta + '10' },
  micBtn: { width: 120, height: 120, borderRadius: 60, backgroundColor: colors.terracotta, alignItems: 'center', justifyContent: 'center', ...shadow.card },
  micBtnActive: { backgroundColor: colors.marigold },
  langHint: { fontSize: 12, color: colors.textMuted },
});
