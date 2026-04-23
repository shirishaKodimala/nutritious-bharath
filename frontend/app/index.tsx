import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { api } from '../src/lib/api';
import { colors } from '../src/lib/theme';

export default function Index() {
  useEffect(() => {
    (async () => {
      try {
        const profile = await api.getProfile();
        if (profile && profile.child_name) {
          router.replace('/(tabs)/home');
        } else {
          router.replace('/onboarding');
        }
      } catch {
        router.replace('/onboarding');
      }
    })();
  }, []);

  return (
    <View style={styles.container} testID="splash-screen">
      <ActivityIndicator size="large" color={colors.terracotta} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
});
