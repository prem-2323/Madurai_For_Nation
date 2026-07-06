const INSPECTION_PROMPT = `You are an environmental pollution inspection AI.

Analyze this uploaded image.

Determine whether pollution exists.

Possible pollution types:
- Smoke
- Garbage Burning
- Factory Emission
- Construction Dust
- Vehicle Pollution
- Water Pollution
- Plastic Waste
- Open Waste Dump
- Clean Environment

Return ONLY valid JSON.

{
  "pollutionDetected": true,
  "pollutionType": "",
  "confidence": 0,
  "severity": "",
  "reason": "",
  "healthRisk": "",
  "recommendation": "",
  "estimatedPM25Impact": "",
  "estimatedPM10Impact": "",
  "emergencyLevel": "",
  "needsMunicipalAction": false,
  "possibleSource": ""
}

Severity must be one of: Low, Medium, High, Critical
Confidence must be between 0-100.
emergencyLevel must be one of: Green, Yellow, Orange, Red
estimatedPM25Impact and estimatedPM10Impact must be one of: Low, Medium, High, Very High
Do not return markdown.
Do not explain anything.`;

const parseGeminiJson = (text) => {
  const cleaned = text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) {
    throw new Error('Gemini did not return valid JSON');
  }

  return JSON.parse(cleaned.slice(start, end + 1));
};

const normalizeSeverity = (severity) => {
  const map = {
    low: 'low',
    medium: 'moderate',
    moderate: 'moderate',
    high: 'high',
    critical: 'critical'
  };
  return map[String(severity).toLowerCase()] || 'moderate';
};

const normalizeDisplaySeverity = (severity) => {
  const map = {
    low: 'Low',
    medium: 'Medium',
    moderate: 'Medium',
    high: 'High',
    critical: 'Critical'
  };
  return map[String(severity).toLowerCase()] || 'Medium';
};

module.exports = {
  INSPECTION_PROMPT,
  parseGeminiJson,
  normalizeSeverity,
  normalizeDisplaySeverity
};
