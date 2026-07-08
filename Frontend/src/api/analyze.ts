import type { AIAnalysisResult, AirQualityData } from '../types';
import { emitGeminiUsageUpdated } from './usage';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export async function imageUrlToFile(imageUrl: string, filename = 'photo.jpg'): Promise<File> {
  if (imageUrl.startsWith('data:')) {
    const res = await fetch(imageUrl);
    const blob = await res.blob();
    return new File([blob], filename, { type: blob.type || 'image/jpeg' });
  }

  const res = await fetch(imageUrl);
  const blob = await res.blob();
  return new File([blob], filename, { type: blob.type || 'image/jpeg' });
}

export async function analyzePollutionImage(params: {
  imageFile: File;
  latitude: number;
  longitude: number;
  description?: string;
  location?: string;
  token?: string | null;
}) {
  const formData = new FormData();
  formData.append('image', params.imageFile);
  formData.append('latitude', String(params.latitude));
  formData.append('longitude', String(params.longitude));
  if (params.description) formData.append('description', params.description);
  if (params.location) formData.append('location', params.location);

  const headers: Record<string, string> = {};
  if (params.token) {
    headers.Authorization = `Bearer ${params.token}`;
  }

  const response = await fetch(`${API_BASE_URL}/api/analyze`, {
    method: 'POST',
    headers,
    body: formData,
  });

  const payload = await response.json();
  if (!response.ok || !payload.success) {
    throw new Error(payload.message || 'Failed to analyze image');
  }

  emitGeminiUsageUpdated();

  const data = payload.data as {
    analysis: AIAnalysisResult;
    airQuality: AirQualityData | null;
    report: {
      id: string;
      image: string;
      latitude: number;
      longitude: number;
      location: string;
      createdAt: string;
    };
  };

  if (data.airQuality) {
    data.airQuality.updatedAt = new Date().toISOString();
  }

  return data;
}
