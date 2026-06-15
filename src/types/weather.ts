// yeah these are all the types, don't touch unless you know what you're doing

export interface GeocodingResult {
    name: string
    latitude: number
    longitude: number
    country: string
}

export interface CurrentWeather {
    temperature: number
    feelsLike: number
    humidity: number
    windSpeed: number
    windDirection: number
    weatherCode: number
    condition: string
    icon: string
    isDay: boolean
    precipitation: number
}

export interface DailyForecast {
    date: string
    day: string
    icon: string
    condition: string
    tempMax: number
    tempMin: number
    precipitationProbability: number
    sunrise: string
    sunset: string
}

export interface HourlyForecast {
    time: string
    hour: string
    temperature: number
    precipitationProbability: number
    icon: string
}

export interface WeatherData {
    location: string
    latitude: number
    longitude: number
    timezone: string
    current: CurrentWeather
    daily: DailyForecast[]
    hourly: HourlyForecast[]
    fetchedAt: string
}

// what gemini gives back
export interface WeatherSummaryJSON {
    briefing: string
    alert: string | null
    recommendation: string
    mood: string
}