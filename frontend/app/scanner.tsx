import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { colors, radius, spacing, shadow } from '../src/lib/theme';
import { t } from '../src/lib/i18n';
import { api } from '../src/lib/api';

export default function Scanner() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onScan = async (result: { data: string; type: string }) => {
    if (scanned || loading) return;
    setScanned(true);
    setLoading(true);
    setError('');
    try {
      const res = await api.lookupBarcode(result.data);
      if (res.found) {
        setProduct(res);
      } else {
        setError(t('notFound', 'en'));
      }
    } catch (e: any) {
      setError(String(e.message || e));
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setProduct(null);
    setScanned(false);
    setError('');
  };

  if (Platform.OS === 'web') {
    return (
      <SafeAreaView style={styles.container} testID="scanner-screen">
        <Header onClose={() => router.back()} />
        <View style={styles.webMsg}>
          <Ionicons name="phone-portrait" size={48} color={colors.terracotta} />
          <Text style={styles.webMsgTitle}>Barcode scanning available on mobile</Text>
          <Text style={styles.webMsgDesc}>Open this app on your phone via Expo Go to scan grocery barcodes.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission) {
    return <View style={styles.container}><ActivityIndicator color={colors.terracotta} style={{ flex: 1 }} /></View>;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container} testID="scanner-screen">
        <Header onClose={() => router.back()} />
        <View style={styles.permWrap}>
          <Ionicons name="camera" size={48} color={colors.terracotta} />
          <Text style={styles.permTitle}>{t('scanProduct', 'en')}</Text>
          <Text style={styles.permDesc}>{t('scanDesc', 'en')}</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={requestPermission} testID="grant-camera">
            <Text style={styles.primaryBtnText}>Allow Camera</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container} testID="scanner-screen">
      {!product && !loading && (
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          onBarcodeScanned={scanned ? undefined : onScan}
          barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128'] }}
        />
      )}
      <SafeAreaView edges={['top']} style={styles.topOverlay}>
        <Header onClose={() => router.back()} onCamera />
      </SafeAreaView>

      {!product && !loading && (
        <View pointerEvents="none" style={styles.reticleWrap}>
          <View style={styles.reticle} />
          <Text style={styles.reticleHint}>{t('scanDesc', 'en')}</Text>
        </View>
      )}

      {loading && (
        <View style={styles.resultOverlay}>
          <ActivityIndicator size="large" color={colors.terracotta} />
          <Text style={{ color: colors.coconut, marginTop: 12 }}>Looking up...</Text>
        </View>
      )}

      {error && !product && (
        <View style={styles.resultOverlay}>
          <Ionicons name="sad-outline" size={40} color={colors.coconut} />
          <Text style={{ color: colors.coconut, marginTop: 12, fontSize: 16 }}>{error}</Text>
          <TouchableOpacity style={[styles.primaryBtn, { marginTop: 16 }]} onPress={reset} testID="try-again">
            <Text style={styles.primaryBtnText}>{t('tryAgain', 'en')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {product && (
        <SafeAreaView edges={['top', 'bottom']} style={styles.productScreen}>
          <Header onClose={() => router.back()} />
          <ScrollView contentContainerStyle={{ padding: spacing.base }}>
            {product.image ? <Image source={{ uri: product.image }} style={styles.prodImage} /> : null}
            <Text style={styles.prodName} testID="product-name">{product.name}</Text>
            {product.brand ? <Text style={styles.prodBrand}>{product.brand}</Text> : null}

            <View style={styles.gradeRow}>
              {product.nutrition_grade ? (
                <View style={[styles.gradeBadge, { backgroundColor: gradeColor(product.nutrition_grade) }]}>
                  <Text style={styles.gradeText}>{String(product.nutrition_grade).toUpperCase()}</Text>
                  <Text style={styles.gradeLabel}>{t('nutritionGrade', 'en')}</Text>
                </View>
              ) : null}
              {product.nova_group ? (
                <View style={[styles.gradeBadge, { backgroundColor: novaColor(product.nova_group) }]}>
                  <Text style={styles.gradeText}>{product.nova_group}/4</Text>
                  <Text style={styles.gradeLabel}>{t('processing_level', 'en')}</Text>
                </View>
              ) : null}
            </View>

            <Text style={styles.nutrHeading}>Per 100g</Text>
            <View style={styles.nutrGrid}>
              <Nutr label="Energy" value={product.nutrients_per_100g?.energy_kcal} unit="kcal" />
              <Nutr label="Protein" value={product.nutrients_per_100g?.protein_g} unit="g" />
              <Nutr label="Carbs" value={product.nutrients_per_100g?.carbs_g} unit="g" />
              <Nutr label="Sugar" value={product.nutrients_per_100g?.sugars_g} unit="g" />
              <Nutr label="Fat" value={product.nutrients_per_100g?.fat_g} unit="g" />
              <Nutr label="Fiber" value={product.nutrients_per_100g?.fiber_g} unit="g" />
              <Nutr label="Salt" value={product.nutrients_per_100g?.salt_g} unit="g" />
              <Nutr label="Sat Fat" value={product.nutrients_per_100g?.saturated_fat_g} unit="g" />
            </View>

            {product.allergens?.length > 0 && (
              <>
                <Text style={styles.nutrHeading}>Allergens</Text>
                <View style={styles.tagRow}>
                  {product.allergens.map((a: string) => (
                    <View key={a} style={styles.allergen}><Text style={styles.allergenText}>{a}</Text></View>
                  ))}
                </View>
              </>
            )}

            <TouchableOpacity style={[styles.primaryBtn, { marginTop: spacing.lg }]} onPress={reset} testID="try-again">
              <Ionicons name="scan" size={18} color={colors.coconut} />
              <Text style={styles.primaryBtnText}>{t('tryAgain', 'en')}</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      )}
    </View>
  );
}

function Header({ onClose, onCamera }: { onClose: () => void; onCamera?: boolean }) {
  return (
    <View style={[styles.header, onCamera && { backgroundColor: 'rgba(0,0,0,0.4)' }]}>
      <TouchableOpacity onPress={onClose} style={styles.closeBtn} testID="close-scanner">
        <Ionicons name="close" size={22} color={onCamera ? '#fff' : colors.indigo} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: onCamera ? '#fff' : colors.indigo }]}>{t('scanProduct', 'en')}</Text>
      <View style={{ width: 40 }} />
    </View>
  );
}

function Nutr({ label, value, unit }: any) {
  if (value == null) return null;
  const v = typeof value === 'number' ? (Math.round(value * 10) / 10).toString() : String(value);
  return (
    <View style={styles.nutrItem}>
      <Text style={styles.nutrVal}>{v}<Text style={styles.nutrUnit}> {unit}</Text></Text>
      <Text style={styles.nutrLabel}>{label}</Text>
    </View>
  );
}

function gradeColor(g: string) {
  const m: Record<string, string> = { a: '#1B8E3A', b: '#6CB33F', c: '#FFC107', d: '#FF9800', e: '#E53935' };
  return m[String(g).toLowerCase()] || colors.textMuted;
}
function novaColor(n: number) {
  if (n <= 1) return '#1B8E3A';
  if (n === 2) return '#6CB33F';
  if (n === 3) return '#FF9800';
  return '#E53935';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.base },
  headerTitle: { fontSize: 16, fontFamily: 'serif', fontWeight: '600' },
  closeBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.2)' },
  topOverlay: { position: 'absolute', top: 0, left: 0, right: 0 },
  reticleWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  reticle: { width: 280, height: 180, borderRadius: radius.lg, borderWidth: 3, borderColor: colors.turmeric, borderStyle: 'dashed' },
  reticleHint: { color: '#fff', fontSize: 14, backgroundColor: 'rgba(0,0,0,0.6)', padding: 10, borderRadius: radius.md },
  resultOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.8)', padding: spacing.lg },
  productScreen: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.bg },
  prodImage: { width: '100%', height: 200, borderRadius: radius.lg, backgroundColor: colors.surface, marginBottom: spacing.base },
  prodName: { fontSize: 22, fontFamily: 'serif', fontWeight: '700', color: colors.indigo },
  prodBrand: { fontSize: 13, color: colors.textMuted, marginTop: 2, marginBottom: spacing.base },
  gradeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.base },
  gradeBadge: { flex: 1, padding: spacing.sm, borderRadius: radius.md, alignItems: 'center' },
  gradeText: { color: '#fff', fontSize: 22, fontWeight: '700', fontFamily: 'serif' },
  gradeLabel: { color: '#fff', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 },
  nutrHeading: { fontSize: 14, fontWeight: '700', color: colors.indigo, marginTop: spacing.base, marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 1 },
  nutrGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  nutrItem: { width: '22%', flexGrow: 1, minWidth: 70, backgroundColor: colors.saffronCream, padding: spacing.sm, borderRadius: radius.md, alignItems: 'center' },
  nutrVal: { fontSize: 16, fontWeight: '700', color: colors.terracotta, fontFamily: 'serif' },
  nutrUnit: { fontSize: 11, color: colors.textMuted, fontWeight: '400' },
  nutrLabel: { fontSize: 10, color: colors.textSecondary, marginTop: 2, textTransform: 'uppercase' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  allergen: { backgroundColor: colors.marigold + '30', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.round },
  allergenText: { fontSize: 12, color: colors.spice, fontWeight: '600', textTransform: 'capitalize' },
  webMsg: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.base, backgroundColor: colors.bg },
  webMsgTitle: { fontSize: 20, fontFamily: 'serif', fontWeight: '700', color: colors.indigo, textAlign: 'center' },
  webMsgDesc: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  permWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.base, backgroundColor: colors.bg },
  permTitle: { fontSize: 22, fontFamily: 'serif', fontWeight: '700', color: colors.indigo, textAlign: 'center' },
  permDesc: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center', backgroundColor: colors.terracotta, paddingVertical: 14, paddingHorizontal: 28, borderRadius: radius.lg, ...shadow.soft },
  primaryBtnText: { color: colors.coconut, fontWeight: '600', fontSize: 15 },
});
