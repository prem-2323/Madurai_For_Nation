const AQI_LEVELS = {
  1: 'Good',
  2: 'Fair',
  3: 'Moderate',
  4: 'Poor',
  5: 'Very Poor',
};

const AQI_APPROX_VALUES = {
  1: 25,
  2: 75,
  3: 125,
  4: 175,
  5: 250,
};

const DEFAULT_CENTER = { latitude: 9.9252, longitude: 78.1198 };

function getAqiLevel(aqi) {
  return AQI_LEVELS[aqi] || 'Unknown';
}

async function fetchAirPollution(lat, lon, apiKey) {
  const url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`;
  const response = await fetch(url);

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Air pollution API error (${response.status}): ${body}`);
  }

  const data = await response.json();
  const entry = data.list?.[0];

  if (!entry) {
    throw new Error('No air pollution data returned for this location');
  }

  const aqi = entry.main?.aqi ?? 0;
  const components = entry.components ?? {};

  return {
    aqi: AQI_APPROX_VALUES[aqi] || 0,
    aqiIndex: aqi,
    aqiLevel: getAqiLevel(aqi),
    pm25: components.pm2_5 ?? 0,
    pm10: components.pm10 ?? 0,
    co: components.co ?? 0,
    no2: components.no2 ?? 0,
    o3: components.o3 ?? 0,
  };
}

async function fetchWeather(lat, lon, apiKey) {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
  const response = await fetch(url);

  if (!response.ok) {
    return { temperature: 0, humidity: 0, windSpeed: 0, windDirection: 0 };
  }

  const data = await response.json();
  return {
    temperature: data.main?.temp ?? 0,
    humidity: data.main?.humidity ?? 0,
    windSpeed: data.wind?.speed ?? 0,
    windDirection: data.wind?.deg ?? 0,
  };
}

exports.getAirQuality = async (latitude, longitude) => {
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    throw new Error('OpenWeather API key is not configured');
  }

  const [pollution, weather] = await Promise.all([
    fetchAirPollution(latitude, longitude, apiKey),
    fetchWeather(latitude, longitude, apiKey),
  ]);

  return {
    ...pollution,
    ...weather,
  };
};

exports.getAqiLevel = getAqiLevel;
exports.DEFAULT_CENTER = DEFAULT_CENTER;
