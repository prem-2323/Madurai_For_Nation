const fs = require('fs');
const ai = require('../config/gemini');
const {
  INSPECTION_PROMPT,
  parseGeminiJson,
  normalizeDisplaySeverity,
  normalizePriority
} = require('../utils/pollutionPrompt');

const analyzeImage = async (filePath, mimeType, userDescription = '') => {
  const base64Image = fs.readFileSync(filePath).toString('base64');
  const prompt = userDescription
    ? `${INSPECTION_PROMPT}\n\nAdditional context from the reporter: ${userDescription}`
    : INSPECTION_PROMPT;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        role: 'user',
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: mimeType || 'image/jpeg',
              data: base64Image
            }
          }
        ]
      }
    ]
  });

  const rawText = response.text;
  if (!rawText) {
    throw new Error('Empty response from Gemini');
  }

  const parsed = parseGeminiJson(rawText);

  return {
    pollutionDetected: Boolean(parsed.pollutionDetected),
    pollutionType: parsed.pollutionType || 'Unknown',
    confidence: Math.min(100, Math.max(0, Number(parsed.confidence) || 0)),
    severity: normalizeDisplaySeverity(parsed.severity),
    reason: parsed.reason || '',
    healthRisk: parsed.healthRisk || '',
    recommendation: parsed.recommendation || '',
    estimatedPM25Impact: parsed.estimatedPM25Impact || 'Unknown',
    estimatedPM10Impact: parsed.estimatedPM10Impact || 'Unknown',
    emergencyLevel: parsed.emergencyLevel || 'Green',
    needsMunicipalAction: Boolean(parsed.needsMunicipalAction),
    possibleSource: parsed.possibleSource || '',
    priority: normalizePriority(parsed.priority, parsed.severity, Boolean(parsed.needsMunicipalAction))
  };
};

module.exports = { analyzeImage };
