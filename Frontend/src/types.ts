export type SeverityLevel = 'Low' | 'Medium' | 'High' | 'Critical';
export type ReportStatus = 'Reported' | 'AI Analyzed' | 'Action Scheduled' | 'Resolved';

export interface AIAnalysisResult {
  pollutionDetected: boolean;
  pollutionType: string;
  confidence: number;
  severity: SeverityLevel;
  reason: string;
  healthRisk: string;
  recommendation: string;
  estimatedPM25Impact: string;
  estimatedPM10Impact: string;
  emergencyLevel: string;
  needsMunicipalAction: boolean;
  possibleSource: string;
}

export interface PollutionReport {
  id: string;
  imageUrl: string;
  category: string;
  description: string;
  severity: SeverityLevel;
  location: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  time: string;
  status: ReportStatus;
  confidence: number;
  healthRisk: string;
  recommendation: string;
  pollutionDetected?: boolean;
  reason?: string;
  estimatedPM25Impact?: string;
  estimatedPM10Impact?: string;
  emergencyLevel?: string;
  needsMunicipalAction?: boolean;
  possibleSource?: string;
}

export interface StatCardData {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  iconName: string;
}

export interface FeatureData {
  title: string;
  description: string;
  iconName: string;
}
