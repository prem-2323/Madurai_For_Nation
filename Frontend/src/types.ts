export type SeverityLevel = 'Low' | 'Medium' | 'High';
export type ReportStatus = 'Reported' | 'AI Analyzed' | 'Action Scheduled' | 'Resolved';

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
