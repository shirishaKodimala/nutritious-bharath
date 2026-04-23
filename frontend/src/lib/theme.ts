// Design tokens from /app/design_guidelines.json
export const colors = {
  terracotta: '#D2691E',
  turmeric: '#FFB84D',
  basil: '#7BA474',
  saffronCream: '#F4E4C1',
  indigo: '#4B0082',
  coconut: '#F5F5DC',
  spice: '#8B4513',
  marigold: '#FF8C00',
  cumin: '#FFD700',
  bg: '#F4E4C1',
  surface: '#FFFFFF',
  textPrimary: '#4B0082',
  textSecondary: '#8B4513',
  textMuted: '#A08065',
  ayurvedic: '#7BA474',
  scientific: '#4B0082',
  border: 'rgba(139,69,19,0.15)',
};

export const radius = { sm: 4, md: 8, lg: 12, xl: 20, round: 999 };

export const spacing = { xs: 4, sm: 8, md: 12, base: 16, lg: 24, xl: 32, xxl: 48 };

export const shadow = {
  soft: {
    shadowColor: '#8B4513',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  card: {
    shadowColor: '#8B4513',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 6,
  },
};

export const font = {
  heading: 'serif' as const,  // Noto Serif Display not available natively
  body: 'System' as const,
};
