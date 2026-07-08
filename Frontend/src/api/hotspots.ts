import { API_BASE_URL } from './analyze';
import { mongoHotspotToPollutionHotspot, type MongoHotspot } from '../utils/hotspotTransform';
import type { PollutionHotspot } from '../types';

export async function fetchHotspots(token?: string | null, officer?: boolean): Promise<PollutionHotspot[]> {
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const url = officer ? `${API_BASE_URL}/api/officer/hotspots` : `${API_BASE_URL}/api/hotspots`;
  const response = await fetch(url, { headers });
  const payload = await response.json();

  if (!response.ok || !payload.success) {
    throw new Error(payload.message || 'Failed to load hotspots');
  }

  return (payload.data as MongoHotspot[]).map(mongoHotspotToPollutionHotspot);
}

export async function updateHotspotStatus(
  id: string,
  data: {
    municipalStatus?: string;
    assignedOfficerName?: string;
    assignedTeam?: string;
  },
  token?: string | null
): Promise<PollutionHotspot> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}/api/hotspots/${id}/status`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(data),
  });
  const payload = await response.json();
  if (!response.ok || !payload.success) {
    throw new Error(payload.message || 'Failed to update hotspot');
  }
  return mongoHotspotToPollutionHotspot(payload.data as MongoHotspot);
}

export async function updateReportDetails(
  id: string,
  data: {
    municipalStatus?: string;
    assignedOfficerName?: string;
    assignedTeam?: string;
  },
  token?: string | null
): Promise<{
  _id: string;
  municipalStatus: string;
  assignedOfficerName: string;
  assignedTeam: string;
  statusUpdatedAt: string;
  resolvedAt: string | null;
}> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}/api/hotspots/report/${id}/status`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(data),
  });
  const payload = await response.json();
  if (!response.ok || !payload.success) {
    throw new Error(payload.message || 'Failed to update report');
  }
  return payload.data;
}

export async function assignTeam(
  id: string,
  teamName: string,
  token?: string | null
): Promise<PollutionHotspot> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}/api/hotspots/${id}/assign`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ assignedTeam: teamName }),
  });
  const payload = await response.json();
  if (!response.ok || !payload.success) {
    throw new Error(payload.message || 'Failed to assign team');
  }
  return mongoHotspotToPollutionHotspot(payload.data as MongoHotspot);
}


