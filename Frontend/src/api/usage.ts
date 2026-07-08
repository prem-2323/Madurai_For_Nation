import { API_BASE_URL } from './analyze';

export interface GeminiUsageData {
  date: string;
  used: number;
  limit: number;
  remaining: number;
  percentage: number;
}

export async function fetchGeminiUsage(token?: string | null): Promise<GeminiUsageData> {
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE_URL}/api/usage/gemini`, { headers });
  const payload = await res.json();
  if (!payload.success) {
    throw new Error(payload.message || 'Failed to fetch usage');
  }
  return payload.data;
}
