const sharp = require('sharp');
const Report = require('../models/Report');
const Alert = require('../models/Alert');
const { analyzeImage } = require('../services/geminiVision');
const { getAirQuality } = require('../services/aqiService');
const { build24HourPrediction } = require('../services/predictionService');
const { normalizeSeverity } = require('../utils/pollutionPrompt');
const { successResponse, errorResponse } = require('../utils/response');
const { generateHotspots } = require('../services/hotspotEngine');

exports.analyzePollution = async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return errorResponse(res, 'Gemini API key is not configured', 500);
    }

    if (!req.file) {
      return errorResponse(res, 'Image file is required', 400);
    }

    let imageBuffer = req.file.buffer;
    let imageMimeType = req.file.mimetype;
    if (imageBuffer.length > 100 * 1024) {
      const compressed = await sharp(imageBuffer)
        .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80, mozjpeg: true })
        .toBuffer();
      if (compressed.length < imageBuffer.length) {
        imageBuffer = compressed;
        imageMimeType = 'image/jpeg';
      }
    }

    const latitude = parseFloat(req.body.latitude);
    const longitude = parseFloat(req.body.longitude);
    const description = req.body.description?.trim() || '';

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      return errorResponse(res, 'Valid latitude and longitude are required', 400);
    }

    const [analysis, airQuality, prediction] = await Promise.all([
      analyzeImage(imageBuffer, imageMimeType, description),
      getAirQuality(latitude, longitude).catch((err) => {
        console.warn('AQI fetch failed:', err.message);
        return null;
      }),
      build24HourPrediction({ latitude, longitude }).catch((err) => {
        console.warn('Prediction fetch failed:', err.message);
        return null;
      }),
    ]);

    const locationLabel =
      req.body.location?.trim() ||
      `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`;

    const report = await Report.create({
      reportedBy: req.user?.id || null,
      image: '',
      images: [],
      imageData: imageBuffer,
      imageMimeType: imageMimeType,
      category: analysis.pollutionType,
      description: description || analysis.reason || `AI-detected ${analysis.pollutionType}`,
      severity: normalizeSeverity(analysis.severity),
      confidence: analysis.confidence,
      healthRisk: analysis.healthRisk,
      recommendation: analysis.recommendation,
      location: locationLabel,
      latitude,
      longitude,
      pollutionDetected: analysis.pollutionDetected,
      reason: analysis.reason,
      estimatedPM25Impact: analysis.estimatedPM25Impact,
      estimatedPM10Impact: analysis.estimatedPM10Impact,
      emergencyLevel: analysis.emergencyLevel,
      needsMunicipalAction: analysis.needsMunicipalAction,
      possibleSource: analysis.possibleSource,
      priority: analysis.priority,
      AQI: airQuality?.aqi ?? 0,
      aqiLevel: airQuality?.aqiLevel ?? '',
      PM25: airQuality?.pm25 ?? 0,
      PM10: airQuality?.pm10 ?? 0,
      CO: airQuality?.co ?? 0,
      NO2: airQuality?.no2 ?? 0,
      O3: airQuality?.o3 ?? 0,
      temperature: airQuality?.temperature ?? 0,
      humidity: airQuality?.humidity ?? 0,
      status: 'pending'
    });

    report.image = `/api/reports/${report._id}/image`;
    report.images = [`/api/reports/${report._id}/image`];
    await report.save();

    const currentAQI = airQuality?.aqi ?? 0;
    const predictedAQI = prediction?.predictedAQI ?? 0;
    const confidence = analysis.confidence ?? 0;
    const priority = analysis.priority ?? 'Medium';
    const needsMunicipalAction = analysis.needsMunicipalAction === true;

    let alertCreated = false;

    if (
      confidence >= 80 || 
      currentAQI >= 180 || 
      predictedAQI >= 180 || 
      needsMunicipalAction || 
      priority === 'Critical' || 
      priority === 'High'
    ) {
      const getAction = (type) => {
        const typeLower = (type || '').toLowerCase();
        if (typeLower.includes('garbage')) return 'Deploy Fire & Cleanup Team';
        if (typeLower.includes('vehicle')) return 'Traffic Diversion';
        if (typeLower.includes('industrial') || typeLower.includes('factory')) return 'Send Pollution Control Inspection';
        if (typeLower.includes('construction') || typeLower.includes('dust')) return 'Deploy Water Mist Cannon';
        if (typeLower.includes('water')) return 'Water Quality Inspection';
        return 'Dispatch General Inspection Team';
      };

      const alertPriority = (priority === 'Critical' || priority === 'High') ? priority : (confidence >= 80 || needsMunicipalAction) ? 'High' : 'Medium';
      
      const existingAlert = await Alert.findOne({ reportId: report._id });
      if (!existingAlert) {
        await Alert.create({
          reportId: report._id,
          pollutionType: analysis.pollutionType || 'Unknown',
          location: locationLabel,
          latitude,
          longitude,
          AQI: currentAQI,
          predictedAQI,
          confidence,
          priority: alertPriority,
          reason: analysis.reason || 'High pollution levels detected',
          suggestedAction: getAction(analysis.pollutionType)
        });
        alertCreated = true;
      }
    }


    successResponse(
      res,
      {
        analysis,
        airQuality,
        alertCreated,
        report: {
          id: report._id,
          image: `/api/reports/${report._id}/image`,
          latitude,
          longitude,
          location: locationLabel,
          createdAt: report.createdAt
        }
      },
      'Image analyzed successfully',
      201
    );

    try {
      await generateHotspots();
    } catch (hotspotError) {
      console.error('Error generating hotspots after analysis:', hotspotError);
    }
  } catch (error) {
    console.error('Analyze error:', error.message);
    errorResponse(res, error.message || 'Failed to analyze image', 500);
  }
};
