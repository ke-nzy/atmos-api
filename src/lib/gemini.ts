import { GoogleGenerativeAI } from "@google/generative-ai"
import type { WeatherData, WeatherSummaryJSON } from "../types/weather"

const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = client.getGenerativeModel({ model: "gemini-1.5-flash" })

function buildPrompt(weather: WeatherData): string {
    const { current, daily, location } = weather
    const today = daily[0]
    const tomorrow = daily[1]

    return `
        You are a concise weather assistant. Given the data below, generate insights for ${location}.

        Current: ${current.temperature}°C, feels like ${current.feelsLike}°C, ${current.condition}
        Humidity: ${current.humidity}%, Wind: ${current.windSpeed} km/h
        Today: High ${today?.tempMax}°C / Low ${today?.tempMin}°C, ${today?.condition}, ${today?.precipitationProbability}% rain
        Tomorrow: High ${tomorrow?.tempMax}°C / Low ${tomorrow?.tempMin}°C, ${tomorrow?.condition}

        Reply ONLY with valid JSON, no markdown, no explanation:
        {
        "briefing": "2-3 sentence natural language summary of today's weather",
        "alert": "weather warning if severe conditions exist, otherwise null",
        "recommendation": "one practical suggestion for the day based on conditions",
        "mood": "single word describing the day e.g. Crisp, Gloomy, Blazing"
        }
        `.trim()
}

// format=text returns a readable paragraph, format=json returns structured data
export async function getSummary(weather: WeatherData, format: "text" | "json"): Promise<WeatherSummaryJSON | string> {
    const result = await model.generateContent(buildPrompt(weather))
    const raw = result.response.text().trim()
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/\s*```$/, "").trim()

    let parsed: WeatherSummaryJSON

    try {
        parsed = JSON.parse(cleaned) as WeatherSummaryJSON
    } catch {
        // if gemini misbehaves, return a safe fallback
        parsed = {
            briefing: `Currently ${weather.current.temperature}°C and ${weather.current.condition} in ${weather.location}.`,
            alert: null,
            recommendation: "Check conditions before heading out.",
            mood: weather.current.condition,
        }
    }

    if (format === "text") {
        return [
            parsed.briefing,
            parsed.alert ? `⚠️ ${parsed.alert}` : null,
            parsed.recommendation,
        ].filter(Boolean).join(" ")
    }

    return parsed
}