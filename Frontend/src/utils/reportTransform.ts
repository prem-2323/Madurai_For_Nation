import { API_BASE_URL } from '../api/analyze';
import type { PollutionReport, SeverityLevel, ReportStatus } from '../types';

export interface MongoMapReport {
  _id: string;
  latitude: number;
  longitude: number;
  category: string;
  severity: string;
  aqi: number;
  aqiLevel?: string;
  image: string;
  createdAt: string;
  status: string;
  recommendation?: string;
  location?: string;
  description?: string;
  confidence?: number;
  healthRisk?: string;
  reporter?: string;
  municipalStatus?: string;
  assignedOfficerName?: string;
  assignedTeam?: string;
}

function mapSeverity(severity: string): SeverityLevel {
  switch (severity?.toLowerCase()) {
    case 'low':
      return 'Low';
    case 'moderate':
      return 'Medium';
    case 'high':
      return 'High';
    case 'critical':
      return 'Critical';
    default:
      return 'Medium';
  }
}

function mapStatus(status: string): ReportStatus {
  switch (status) {
    case 'pending':
      return 'Reported';
    case 'in_progress':
      return 'Action Scheduled';
    case 'resolved':
      return 'Resolved';
    default:
      return 'Reported';
  }
}

function resolveImageUrl(image: string): string {
  if (!image) {
    return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80';
  }
  if (image.startsWith('http')) {
    return image;
  }
  return `${API_BASE_URL}/${image.replace(/^\//, '')}`;
}

export function mongoReportToPollutionReport(report: MongoMapReport): PollutionReport {
  return {
    id: report._id,
    imageUrl: resolveImageUrl(report.image),
    category: report.category,
    description: report.description || '',
    severity: mapSeverity(report.severity),
    location: report.location || 'Madurai',
    coordinates: { lat: report.latitude, lng: report.longitude },
    time: report.createdAt,
    status: mapStatus(report.status),
    confidence: report.confidence ?? 0,
    healthRisk: report.healthRisk || '',
    recommendation: report.recommendation || '',
    reporter: report.reporter || 'Anonymous',
    backendStatus: report.status,
    municipalStatus: report.municipalStatus,
    assignedOfficerName: report.assignedOfficerName,
    assignedTeam: report.assignedTeam,
    airQuality: report.aqi
      ? {
          aqi: report.aqi,
          aqiLevel: report.aqiLevel || 'Unknown',
          pm25: 0,
          pm10: 0,
          co: 0,
          no2: 0,
          o3: 0,
          temperature: 0,
          humidity: 0,
        }
      : undefined,
  };
}

export function getMarkerColor(severity: SeverityLevel): string {
  switch (severity) {
    case 'Low':
      return '#22c55e';
    case 'Medium':
      return '#eab308';
    case 'High':
      return '#ef4444';
    case 'Critical':
      return '#7f1d1d';
    default:
      return '#94a3b8';
  }
}

export function formatReportStatus(status: string): string {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'in_progress':
      return 'In Progress';
    case 'resolved':
      return 'Resolved';
    case 'rejected':
      return 'Rejected';
    default:
      return status;
  }
}
