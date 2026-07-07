import { API_BASE_URL } from './analyze';
import { mongoHotspotToPollutionHotspot, type MongoHotspot } from '../utils/hotspotTransform';
import type { PollutionHotspot } from '../types';

export async function fetchHotspots(token?: string | null): Promise<PollutionHotspot[]> {
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/api/hotspots`, { headers });
  const payload = await response.json();

  if (!response.ok || !payload.success) {
    throw new Error(payload.message || 'Failed to load hotspots');
  }

  return (payload.data as MongoHotspot[]).map(mongoHotspotToPollutionHotspot);
}

export async function updateHotspotStatus(
  id: string,
  status: 'Active' | 'In Progress' | 'Resolved',
  token?: string | null
): Promise<PollutionHotspot> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}/api/hotspots/${id}/status`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ status }),
  });
  const payload = await response.json();
  if (!response.ok || !payload.success) {
    throw new Error(payload.message || 'Failed to update hotspot status');
  }
  return mongoHotspotToPollutionHotspot(payload.data as MongoHotspot);
}

export async function updateHotspot(
  id: string,
  data: { assignedTeam?: string; status?: string; location?: string; recommendedAction?: string },
  token?: string | null
): Promise<PollutionHotspot> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}/api/hotspots/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(data),
  });
  const payload = await response.json();
  if (!response.ok || !payload.success) {
    throw new Error(payload.message || 'Failed to update hotspot');
  }
  return mongoHotspotToPollutionHotspot(payload.data as MongoHotspot);
}

export async function deleteHotspot(id: string, token?: string | null): Promise<void> {
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}/api/hotspots/${id}`, {
    method: 'DELETE',
    headers,
  });
  const payload = await response.json();
  if (!response.ok || !payload.success) {
    throw new Error(payload.message || 'Failed to delete hotspot');
  }
}
