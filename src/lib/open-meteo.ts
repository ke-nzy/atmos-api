import type { WeatherData, DailyForecast, HourlyForecast, GeocodingResult } from "../types/weather"
import { resolveCode } from "./weather-codes"

const BASE = "https://api.open-meteo.com/v1/forecast"
const GEO = "https://geocoding-api.open-meteo.com/v1/search"

// raw shape from open-meteo geocoding API
interface GeocodingResponse {
    results?: GeocodingResult[]
}

// raw shape from open-meteo forecast API
interface OpenMeteoResponse {
    latitude: number
    longitude: number
    timezone: string
    current: {
        temperature_2m: number
        apparent_temperature: number
        relative_humidity_2m: number
        precipitation: number
        weather_code: number
        wind_speed_10m: number
        wind_direction_10m: number
        is_day: number
    }
    hourly: {
        time: string[]
        temperature_2m: number[]
        precipitation_probability: number[]
        weather_code: number[]
    }
    daily: {
        time: string[]
        weather_code: number[]
        temperature_2m_max: number[]
        temperature_2m_min: number[]
        precipitation_probability_max: number[]
        sunrise: string[]
        sunset: string[]
    }
}

// takes a city name, returns coordinates
export async function geocode(city: string): Promise<GeocodingResult | null> {
    const res = await fetch(`${GEO}?name=${encodeURIComponent(city)}&count=1&language=en&format=json`)
    const data = await res.json() as GeocodingResponse
    if (!data.results?.length) return null
    return data.results[0] ?? null
}

// formats "2024-06-15T14:00" -> "2 PM"
function toHourLabel(iso: string) {
    return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", hour12: true })
}

// formats sunrise/sunset iso -> "6:24 AM"
function toTimeLabel(iso: string) {
    return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
}

export async function fetchWeather(lat: number, lon: number, locationName: string): Promise<WeatherData> {
    const params = new URLSearchParams({
        latitude: lat.toString(),
        longitude: lon.toString(),
        current: [
            "temperature_2m", "apparent_temperature", "relative_humidity_2m",
            "precipitation", "weather_code", "wind_speed_10m", "wind_direction_10m", "is_day"
        ].join(","),
        hourly: ["temperature_2m", "precipitation_probability", "weather_code"].join(","),
        daily: [
            "weather_code", "temperature_2m_max", "temperature_2m_min",
            "precipitation_probability_max", "sunrise", "sunset"
        ].join(","),
        wind_speed_unit: "kmh",
        timezone: "auto",
        forecast_days: "7",
    })

    const res = await fetch(`${BASE}?${params}`)
    const raw = await res.json() as OpenMeteoResponse
    const isDay = raw.current.is_day === 1
    const { condition, icon } = resolveCode(raw.current.weather_code, isDay)

    const today = new Date().toISOString().split("T")[0]

    const daily: DailyForecast[] = raw.daily.time.map((date, i) => {
        const { condition: dc, icon: di } = resolveCode(raw.daily.weather_code[i]!)
        return {
            date,
            day: date === today ? "Today" : new Date(date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" }),
            icon: di,
            condition: dc,
            tempMax: Math.round(raw.daily.temperature_2m_max[i]!),
            tempMin: Math.round(raw.daily.temperature_2m_min[i]!),
            precipitationProbability: raw.daily.precipitation_probability_max[i] ?? 0,
            sunrise: toTimeLabel(raw.daily.sunrise[i]!),
            sunset: toTimeLabel(raw.daily.sunset[i]!),
        }
    })

    const now = new Date()
    const hourly: HourlyForecast[] = raw.hourly.time
        .map((time, i) => {
            const { icon: hi } = resolveCode(raw.hourly.weather_code[i]!)
            return {
                time,
                hour: toHourLabel(time),
                temperature: Math.round(raw.hourly.temperature_2m[i]!),
                precipitationProbability: raw.hourly.precipitation_probability[i] ?? 0,
                icon: hi,
            }
        })
        .filter((h) => new Date(h.time) >= new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours()))
        .slice(0, 24)

    return {
        location: locationName,
        latitude: raw.latitude,
        longitude: raw.longitude,
        timezone: raw.timezone,
        current: {
            temperature: Math.round(raw.current.temperature_2m),
            feelsLike: Math.round(raw.current.apparent_temperature),
            humidity: raw.current.relative_humidity_2m,
            precipitation: raw.current.precipitation,
            windSpeed: Math.round(raw.current.wind_speed_10m),
            windDirection: raw.current.wind_direction_10m,
            weatherCode: raw.current.weather_code,
            condition,
            icon,
            isDay,
        },
        daily,
        hourly,
        fetchedAt: new Date().toISOString(),
    }
}