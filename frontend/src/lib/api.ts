import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE = process.env.EXPO_PUBLIC_BACKEND_URL || '';

async function request(path: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE}/api${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`API ${res.status}: ${txt}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  getProfile: () => request('/profile'),
  saveProfile: (data: any) =>
    request('/profile', { method: 'POST', body: JSON.stringify(data) }),
  listRecipes: (params: { category?: string; region?: string; search?: string } = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v) q.append(k, String(v)); });
    const qs = q.toString();
    return request(`/recipes${qs ? `?${qs}` : ''}`);
  },
  getRecipe: (id: string) => request(`/recipes/${id}`),
  generateMealPlan: () =>
    request('/meal-plan/generate', { method: 'POST', body: JSON.stringify({}) }),
  getLatestPlan: () => request('/meal-plan/latest'),
  getGrowth: () => request('/growth/assessment'),
};

export const storage = {
  get: async (k: string) => {
    const v = await AsyncStorage.getItem(k);
    return v ? JSON.parse(v) : null;
  },
  set: async (k: string, v: any) => AsyncStorage.setItem(k, JSON.stringify(v)),
  remove: async (k: string) => AsyncStorage.removeItem(k),
};
