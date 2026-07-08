import { API_BASE_URL } from './analyze';
import { mongoReportToPollutionReport, type MongoMapReport } from '../utils/reportTransform';
import type { PollutionReport, CitizenReport } from '../types';

export async function fetchMapReports(token?: string | null): Promise<PollutionReport[]> {
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/api/reports?map=true`, { headers });
  const payload = await response.json();

  if (!response.ok || !payload.success) {
    throw new Error(payload.message || 'Failed to load reports');
  }

  return (payload.data as MongoMapReport[]).map(mongoReportToPollutionReport);
}

export async function fetchReportById(id: string, token?: string | null): Promise<any> {
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/api/reports/${id}`, { headers });
  const payload = await response.json();

  if (!response.ok || !payload.success) {
    throw new Error(payload.message || 'Failed to load report');
  }

  return payload.data;
}

export async function fetchMyReports(token: string): Promise<CitizenReport[]> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };

  const response = await fetch(`${API_BASE_URL}/api/hotspots/citizen/my-reports`, { headers });
  const payload = await response.json();

  if (!response.ok || !payload.success) {
    throw new Error(payload.message || 'Failed to load your reports');
  }

  return payload.data as CitizenReport[];
}
