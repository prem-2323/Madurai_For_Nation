export type UserRole = 'citizen' | 'officer';
export type UserStatus = 'active' | 'inactive' | 'suspended';
export type SeverityLevel = 'Low' | 'Medium' | 'High' | 'Critical';
export type HotspotRisk = SeverityLevel;
export type ReportStatus = 'Reported' | 'AI Analyzed' | 'Action Scheduled' | 'Resolved';

export type MunicipalStatus = 'pending' | 'under_review' | 'team_assigned' | 'in_progress' | 'resolved';

export interface CitizenReport {
  _id: string;
  category: string;
  description: string;
  severity: string;
  location: string;
  latitude: number;
  longitude: number;
  AQI: number;
  aqiLevel: string;
  image: string;
  confidence: number;
  healthRisk: string;
  recommendation: string;
  createdAt: string;
  municipalStatus: MunicipalStatus;
  assignedOfficerName: string;
  assignedTeam: string;
  statusUpdatedAt: string | null;
  resolvedAt: string | null;
  reviewHistory: { value: string; reviewedAt: string }[];
}

export interface AirQualityData {
  aqi: number;
  aqiLevel: string;
  pm25: number;
  pm10: number;
  co: number;
  no2: number;
  o3: number;
  temperature: number;
  humidity: number;
  updatedAt?: string;
}

export interface AQIPrediction {
  currentAQI: number;
  currentPM25: number;
  predictedAQI: number;
  risk: 'Good' | 'Fair' | 'Moderate' | 'Poor' | 'Very Poor';
  trend: 'Increasing' | 'Improving' | 'Stable';
  trendArrow: '⬆' | '⬇' | '➡';
  confidence: number;
  reason: string;
  inputs?: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    windDirection: number;
    currentPM25: number;
    nearbyCount: number;
    criticalCount: number;
    hotspotScore: number;
  };
}

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
  priority: string;
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
  priority?: string;
  airQuality?: AirQualityData;
  reporter?: string;
  backendStatus?: string;
}

export interface SourceReportData {
  _id: string;
  image: string;
  category: string;
  severity: string;
  description: string;
}

export interface PollutionHotspot {
  id: string;
  center: {
    lat: number;
    lng: number;
  };
  radius: number;
  reportCount: number;
  averageAQI: number;
  averageConfidence: number;
  dominantPollution: string;
  highestSeverity: SeverityLevel;
  recommendedAction: string;
  risk: HotspotRisk;
  status: string;
  municipalStatus?: string;
  assignedOfficerName?: string;
  statusUpdatedAt?: string | null;
  resolvedAt?: string | null;
  location: string;
  assignedTeam?: string | null;
  createdAt: string;
  sourceReportIds?: string[];
  sourceReportData?: SourceReportData[];
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

export interface AlertData {
  _id: string;
  location: string;
  pollutionType: string;
  aqi: number;
  predictedAQI: number;
  severity: number;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  reason: string;
  suggestedAction: string;
  status: 'Pending' | 'In Progress' | 'Resolved';
  createdAt: string;
}
