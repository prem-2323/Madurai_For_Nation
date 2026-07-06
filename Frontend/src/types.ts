export type SeverityLevel = 'Low' | 'Medium' | 'High' | 'Critical';
export type ReportStatus = 'Reported' | 'AI Analyzed' | 'Action Scheduled' | 'Resolved';

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
