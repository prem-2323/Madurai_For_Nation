const Report = require('../models/Report');
const { getAirQuality, DEFAULT_CENTER } = require('./aqiService');

const EARTH_RADIUS_KM = 6371;
const DEFAULT_RADIUS_KM = 5;

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function haversineDistanceKm(pointA, pointB) {
  const deltaLat = toRadians(pointB.latitude - pointA.latitude);
  const deltaLon = toRadians(pointB.longitude - pointA.longitude);

  const startLat = toRadians(pointA.latitude);
  const endLat = toRadians(pointB.latitude);

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(startLat) * Math.cos(endLat) * Math.sin(deltaLon / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function classifyRisk(aqi) {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Fair';
  if (aqi <= 150) return 'Moderate';
  if (aqi <= 200) return 'Poor';
  return 'Very Poor';
}

function classifyTrend(currentAQI, predictedAQI) {
  const delta = predictedAQI - currentAQI;
  if (delta > 8) return 'Increasing';
  if (delta < -8) return 'Improving';
  return 'Stable';
}

function getTrendArrow(trend) {
  switch (trend) {
    case 'Increasing':
      return 'arrow-up';
    case 'Improving':
      return 'arrow-down';
    default:
      return 'arrow-right';
  }
}

function getSeverityWeight(severity) {
  switch ((severity || '').toLowerCase()) {
    case 'critical':
      return 1;
    case 'high':
      return 0.8;
    case 'moderate':
      return 0.5;
    case 'low':
      return 0.2;
    default:
      return 0.5;
  }
}

function buildReason({ windSpeed, humidity, nearbyCount, criticalCount, hotspotScore, trend }) {
  const factors = [];

  if (windSpeed <= 3) factors.push('low wind speed');
  else if (windSpeed >= 8) factors.push('strong dispersion winds');

  if (humidity >= 75) factors.push('high humidity');
  if (nearbyCount >= 5) factors.push(`${nearbyCount} nearby reports`);
  if (criticalCount >= 1) factors.push(`${criticalCount} critical reports`);
  if (hotspotScore >= 60) factors.push('elevated hotspot pressure');

  if (!factors.length) factors.push('limited nearby pollution pressure');

  const joined = factors.join(', ');
  return trend === 'Increasing'
    ? `Low dispersion conditions and ${joined} may allow pollutants to accumulate.`
    : trend === 'Improving'
      ? `Better dispersion and fewer active hotspots suggest improving air quality despite ${joined}.`
      : `Current weather and report density are balanced, with ${joined}.`;
}

async function build24HourPrediction({ latitude, longitude }) {
  const center = {
    latitude: Number.isFinite(latitude) ? latitude : DEFAULT_CENTER.latitude,
    longitude: Number.isFinite(longitude) ? longitude : DEFAULT_CENTER.longitude,
  };

  const [airQuality, reports] = await Promise.all([
    getAirQuality(center.latitude, center.longitude),
    Report.find({ latitude: { $ne: 0 }, longitude: { $ne: 0 } }).select(
      'latitude longitude severity AQI aqiLevel category createdAt'
    ),
  ]);

  const nearbyReports = reports.filter((report) => {
    const distance = haversineDistanceKm(center, {
      latitude: report.latitude,
      longitude: report.longitude,
    });
    return distance <= DEFAULT_RADIUS_KM;
  });

  const nearbyCount = nearbyReports.length;
  const criticalCount = nearbyReports.filter((report) => report.severity === 'critical').length;
  const highCount = nearbyReports.filter((report) => report.severity === 'high').length;
  const mediumCount = nearbyReports.filter((report) => report.severity === 'moderate').length;
  const averageWeight = nearbyCount
    ? nearbyReports.reduce((sum, report) => sum + getSeverityWeight(report.severity), 0) / nearbyCount
    : 0;

  const hotspotScore = clamp(
    nearbyCount * 9 + criticalCount * 16 + highCount * 9 + mediumCount * 5 + averageWeight * 18,
    0,
    100
  );

  const windSpeed = airQuality.windSpeed ?? 0;
  const humidity = airQuality.humidity ?? 0;
  const temperature = airQuality.temperature ?? 0;
  const currentAQI = airQuality.aqi ?? 0;
  const currentPM25 = airQuality.pm25 ?? 0;

  const currentPressure = currentAQI * 0.65;
  const reportPressure = nearbyCount * 5 + criticalCount * 12 + highCount * 7 + mediumCount * 3;
  const windPressure = Math.max(0, 12 - windSpeed) * 2.8;
  const humidityPressure = Math.max(0, humidity - 60) * 0.45;
  const temperaturePressure = Math.max(0, temperature - 30) * 0.7;
  const hotspotPressure = hotspotScore * 0.25;

  const predictedAQI = Math.round(
    currentPressure + reportPressure + windPressure + humidityPressure + temperaturePressure + hotspotPressure
  );

  const risk = classifyRisk(predictedAQI);
  const trend = classifyTrend(currentAQI, predictedAQI);
  const confidence = clamp(
    Math.round(
      56 + Math.min(18, nearbyCount * 2.5) + Math.min(12, criticalCount * 3.5) + Math.min(10, hotspotScore / 12) -
        Math.min(18, Math.abs(predictedAQI - currentAQI) / 10)
    ),
    45,
    97
  );

  return {
    currentAQI,
    currentPM25,
    predictedAQI,
    risk,
    trend,
    trendArrow: getTrendArrow(trend),
    confidence,
    reason: buildReason({
      windSpeed,
      humidity,
      nearbyCount,
      criticalCount,
      hotspotScore,
      trend,
    }),
    inputs: {
      temperature,
      humidity,
      windSpeed,
      windDirection: airQuality.windDirection ?? 0,
      currentPM25,
      nearbyCount,
      criticalCount,
      hotspotScore,
    },
  };
}

module.exports = {
  build24HourPrediction,
  classifyRisk,
  classifyTrend,
  getTrendArrow,
  getSeverityWeight,
  haversineDistanceKm,
};