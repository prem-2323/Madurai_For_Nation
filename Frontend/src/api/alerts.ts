import { API_BASE_URL } from './analyze';
import type { AlertData } from '../types';

export async function fetchAlerts(token?: string | null): Promise<AlertData[]> {
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/api/alerts`, { headers });
  const payload = await response.json();

  if (!response.ok || !payload.success) {
    throw new Error(payload.message || 'Failed to load alerts');
  }

  return payload.data as AlertData[];
}

export async function updateAlertStatus(id: string, status: 'Pending' | 'In Progress' | 'Resolved', token?: string | null): Promise<AlertData> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/api/alerts/${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ status }),
  });
  
  const payload = await response.json();

  if (!response.ok || !payload.success) {
    throw new Error(payload.message || 'Failed to update alert status');
  }

  return payload.data as AlertData;
}
