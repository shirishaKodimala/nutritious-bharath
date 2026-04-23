import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, shadow } from '../../src/lib/theme';

export default function Community() {
  return (
    <SafeAreaView style={styles.container} edges={['top']} testID="community-screen">
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="people" size={40} color={colors.terracotta} />
        </View>
        <Text style={styles.title}>Mother&apos;s Circle</Text>
        <Text style={styles.desc}>
          Connect with mothers across India, share recipes,{'\n'}
          and learn from traditional wisdom together.
        </Text>
        <View style={styles.comingBadge}>
          <Ionicons name="sparkles" size={12} color={colors.marigold} />
          <Text style={styles.comingText}>Coming Soon</Text>
        </View>

        <View style={styles.featuresList}>
          {[
            { icon: 'chatbubbles', text: 'Local Mother Circles' },
            { icon: 'share-social', text: 'Recipe Sharing' },
            { icon: 'help-circle', text: 'Expert Q&A Sessions' },
            { icon: 'heart', text: 'Success Stories' },
          ].map(f => (
            <View key={f.text} style={styles.featureRow}>
              <Ionicons name={f.icon as any} size={18} color={colors.basil} />
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  iconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.coconut, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.base, ...shadow.soft },
  title: { fontSize: 26, fontFamily: 'serif', fontWeight: '700', color: colors.indigo, marginBottom: spacing.sm },
  desc: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: spacing.base },
  comingBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.round, backgroundColor: colors.saffronCream, marginBottom: spacing.xl },
  comingText: { fontSize: 12, fontWeight: '600', color: colors.marigold, letterSpacing: 0.5 },
  featuresList: { width: '100%', maxWidth: 320, gap: spacing.sm, marginTop: spacing.base },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface, padding: spacing.base, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  featureText: { fontSize: 14, color: colors.indigo, fontWeight: '500' },
});
