import { API_BASE_URL } from '../api/analyze';
import type { PollutionHotspot, SeverityLevel } from '../types';

export interface MongoSourceReportData {
  _id: string;
  image: string;
  category: string;
  severity: string;
  description: string;
}

export interface MongoHotspot {
  _id: string;
  centerLat: number;
  centerLng: number;
  radius: number;
  reportCount: number;
  averageAQI: number;
  averageConfidence: number;
  dominantPollution: string;
  highestSeverity: string;
  recommendedAction: string;
  risk: string;
  status: string;
  municipalStatus?: string;
  assignedOfficerName?: string;
  statusUpdatedAt?: string;
  resolvedAt?: string;
  location: string;
  assignedTeam?: string | null;
  createdAt: string;
  sourceReportIds?: string[];
  sourceReportData?: MongoSourceReportData[];
}

function normalizeSeverity(value: string): SeverityLevel {
  switch ((value || '').toLowerCase()) {
    case 'critical':
      return 'Critical';
    case 'high':
      return 'High';
    case 'medium':
    case 'moderate':
      return 'Medium';
    default:
      return 'Low';
  }
}

function normalizeRisk(value: string): SeverityLevel {
  return normalizeSeverity(value);
}

export function mongoHotspotToPollutionHotspot(hotspot: MongoHotspot): PollutionHotspot {
  return {
    id: hotspot._id,
    center: {
      lat: hotspot.centerLat,
      lng: hotspot.centerLng,
    },
    radius: hotspot.radius,
    reportCount: hotspot.reportCount,
    averageAQI: hotspot.averageAQI,
    averageConfidence: hotspot.averageConfidence,
    dominantPollution: hotspot.dominantPollution,
    highestSeverity: normalizeSeverity(hotspot.highestSeverity),
    recommendedAction: hotspot.recommendedAction,
    risk: normalizeRisk(hotspot.risk),
    status: hotspot.status,
    municipalStatus: hotspot.municipalStatus || 'pending',
    assignedOfficerName: hotspot.assignedOfficerName || '',
    statusUpdatedAt: hotspot.statusUpdatedAt || null,
    resolvedAt: hotspot.resolvedAt || null,
    location: hotspot.location || '',
    assignedTeam: hotspot.assignedTeam || null,
    createdAt: hotspot.createdAt,
    sourceReportIds: hotspot.sourceReportIds || [],
    sourceReportData: hotspot.sourceReportData || [],
  };
}

export function resolveHotspotBadgeColor(risk: SeverityLevel): string {
  switch (risk) {
    case 'Low':
      return '#16a34a';
    case 'Medium':
      return '#eab308';
    case 'High':
      return '#f97316';
    case 'Critical':
      return '#dc2626';
    default:
      return '#64748b';
  }
}

export function formatHotspotTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
