import "server-only";

export type DailyForecast = {
  date: string;
  weatherCode: number;
  temperatureMaxC: number | null;
  temperatureMinC: number | null;
  precipitationProbabilityMax: number | null;
  windSpeedMaxKmh: number | null;
};

export class WeatherProviderError extends Error {
  constructor(message = "Weather information is temporarily unavailable.") {
    super(message);
    this.name = "WeatherProviderError";
  }
}

const weatherLabels: Record<number, string> = {
  0: "clear", 1: "mostly clear", 2: "partly cloudy", 3: "overcast",
  45: "fog", 48: "freezing fog", 51: "light drizzle", 53: "drizzle", 55: "dense drizzle",
  56: "freezing drizzle", 57: "dense freezing drizzle", 61: "light rain", 63: "rain", 65: "heavy rain",
  66: "freezing rain", 67: "heavy freezing rain", 71: "light snow", 73: "snow", 75: "heavy snow",
  77: "snow grains", 80: "rain showers", 81: "rain showers", 82: "heavy rain showers",
  85: "snow showers", 86: "heavy snow showers", 95: "thunderstorm", 96: "thunderstorm with hail", 99: "thunderstorm with heavy hail",
};

export function weatherDescription(code: number): string {
  return weatherLabels[code] ?? "unknown conditions";
}

export async function getDailyForecast(latitude: number, longitude: number, date: string): Promise<{
  forecast: DailyForecast;
  fetchedAt: string;
  locationPrecision: "rounded_to_0.1_degree";
  sourceUrl: string;
}> {
  const roundedLatitude = Math.round(latitude * 10) / 10;
  const roundedLongitude = Math.round(longitude * 10) / 10;
  const params = new URLSearchParams({
    latitude: String(roundedLatitude),
    longitude: String(roundedLongitude),
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max",
    timezone: "Asia/Ho_Chi_Minh",
    forecast_days: "7",
  });
  const sourceUrl = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;

  let response: Response;
  try {
    response = await fetch(sourceUrl, { signal: AbortSignal.timeout(8_000), next: { revalidate: 900 } });
  } catch {
    throw new WeatherProviderError();
  }
  if (!response.ok) throw new WeatherProviderError();

  const payload = await response.json() as {
    daily?: {
      time?: string[];
      weather_code?: number[];
      temperature_2m_max?: Array<number | null>;
      temperature_2m_min?: Array<number | null>;
      precipitation_probability_max?: Array<number | null>;
      wind_speed_10m_max?: Array<number | null>;
    };
  };
  const daily = payload.daily;
  const index = daily?.time?.indexOf(date) ?? -1;
  if (!daily || index < 0 || !daily.weather_code || typeof daily.weather_code[index] !== "number") {
    throw new WeatherProviderError("A forecast is not available for that date. Choose a date in the next seven days.");
  }
  return {
    forecast: {
      date,
      weatherCode: daily.weather_code[index],
      temperatureMaxC: daily.temperature_2m_max?.[index] ?? null,
      temperatureMinC: daily.temperature_2m_min?.[index] ?? null,
      precipitationProbabilityMax: daily.precipitation_probability_max?.[index] ?? null,
      windSpeedMaxKmh: daily.wind_speed_10m_max?.[index] ?? null,
    },
    fetchedAt: new Date().toISOString(),
    locationPrecision: "rounded_to_0.1_degree",
    sourceUrl: "https://open-meteo.com/en/docs",
  };
}
