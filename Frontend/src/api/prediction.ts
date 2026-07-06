import { API_BASE_URL } from './analyze';
import type { AQIPrediction } from '../types';

export async function fetchPrediction(): Promise<AQIPrediction> {
  const response = await fetch(`${API_BASE_URL}/api/prediction`);
  const payload = await response.json();

  if (!response.ok || !payload.success) {
    throw new Error(payload.message || 'Failed to load prediction');
  }

  return payload.data as AQIPrediction;
}