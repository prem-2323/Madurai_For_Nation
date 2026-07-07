require('dotenv').config();
const connectDB = require('./src/config/mongodb');
const Report = require('./src/models/Report');
const { rebuildHotspots } = require('./src/services/hotspotEngine');

const TEST_CLUSTERS = [
  {
    location: 'Anna Nagar, Madurai',
    lat: 9.9400, lng: 78.1300,
    category: 'Garbage Burning',
    reports: [
      { description: 'Open garbage burning near Anna Nagar market', severity: 'high', AQI: 165, confidence: 88 },
      { description: 'Plastic waste burning in residential area', severity: 'critical', AQI: 192, confidence: 94 },
      { description: 'Trash pile on fire since morning', severity: 'high', AQI: 178, confidence: 91 },
    ],
  },
  {
    location: 'Periyar, Madurai',
    lat: 9.9150, lng: 78.1100,
    category: 'Vehicle Pollution',
    reports: [
      { description: 'Heavy traffic smog near Periyar bus stand',     severity: 'moderate', AQI: 142, confidence: 82 },
      { description: 'Diesel buses emitting thick black smoke', severity: 'high', AQI: 155, confidence: 87 },
      { description: 'Congestion causing visible exhaust haze',     severity: 'moderate', AQI: 138, confidence: 79 },
    ],
  },
  {
    location: 'SIDCO Industrial Estate, Madurai',
    lat: 9.9123, lng: 78.1145,
    category: 'Industrial Emissions',
    reports: [
      { description: 'Factory chimney releasing dark smoke', severity: 'critical', AQI: 210, confidence: 96 },
      { description: 'Chemical smell from industrial stack', severity: 'high', AQI: 185, confidence: 92 },
    ],
  },
  {
    location: 'Mattuthavani Bus Stand, Madurai',
    lat: 9.9198, lng: 78.1195,
    category: 'Exhaust & Traffic Smog',
    reports: [
      { description: 'Bus depot with visible smog layer',     severity: 'moderate', AQI: 128, confidence: 78 },
      { description: 'Idling buses emitting fumes all day',     severity: 'moderate', AQI: 132, confidence: 81 },
      { description: 'Traffic jam causing heavy air pollution', severity: 'high', AQI: 148, confidence: 85 },
      { description: 'Auto rickshaw smoke at terminal entrance', severity: 'low', AQI: 112, confidence: 73 },
    ],
  },
];

async function seed() {
  await connectDB();

  const now = Date.now();

  const reportDocs = [];
  TEST_CLUSTERS.forEach((cluster) => {
    cluster.reports.forEach((r, i) => {
      reportDocs.push({
        reportedBy: null,
        image: '',
        images: [],
        imageData: null,
        imageMimeType: '',
        category: cluster.category,
        description: r.description,
        severity: r.severity,
        confidence: r.confidence,
        healthRisk: r.severity === 'critical' ? 'Severe respiratory hazard' : r.severity === 'high' ? 'High health risk' : 'Moderate health risk',
        recommendation: r.severity === 'critical' ? 'Immediate municipal intervention required' : 'Schedule inspection within 48 hours',
        pollutionDetected: true,
        reason: 'AI analysis from seed data: ' + r.description,
        estimatedPM25Impact: r.severity === 'critical' ? 'Very High' : 'High',
        estimatedPM10Impact: r.severity === 'critical' ? 'Very High' : 'High',
        emergencyLevel: r.severity === 'critical' ? 'Red' : r.severity === 'high' ? 'Orange' : 'Yellow',
        needsMunicipalAction: r.severity === 'critical' || r.severity === 'high',
        possibleSource: cluster.category,
        priority: r.severity === 'critical' ? 'Critical' : r.severity === 'high' ? 'High' : 'Medium',
        location: cluster.location,
        latitude: cluster.lat + (Math.random() - 0.5) * 0.002,
        longitude: cluster.lng + (Math.random() - 0.5) * 0.002,
        AQI: r.AQI,
        aqiLevel: r.AQI > 200 ? 'Very Poor' : r.AQI > 150 ? 'Poor' : r.AQI > 100 ? 'Moderate' : 'Fair',
        PM25: Math.round(r.AQI * 0.6),
        PM10: Math.round(r.AQI * 0.8),
        CO: Math.round(r.AQI * 0.15 * 100) / 100,
        NO2: Math.round(r.AQI * 0.12 * 100) / 100,
        O3: Math.round(r.AQI * 0.08 * 100) / 100,
        temperature: 32 + Math.round(Math.random() * 6),
        humidity: 55 + Math.round(Math.random() * 20),
        status: 'pending',
        createdAt: new Date(now - Math.round(Math.random() * 3600000 * 4)),
      });
    });
  });

  console.log('Inserting ' + reportDocs.length + ' seed reports...');
  await Report.insertMany(reportDocs);
  console.log('Seed reports inserted. Running hotspot engine...');

  const hotspots = await rebuildHotspots();
  console.log('Hotspot generation complete. Created ' + hotspots.length + ' hotspots.');

  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
