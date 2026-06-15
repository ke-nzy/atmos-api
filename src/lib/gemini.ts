import { GoogleGenerativeAI } from "@google/generative-ai"
import type { WeatherData, WeatherSummaryJSON } from "../types/weather"

const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = client.getGenerativeModel({ model: "gemini-2.0-flash" })

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
function buildFallbackSummary(weather: WeatherData): WeatherSummaryJSON {
    const { current, daily, location } = weather
    const today = daily[0]

    const tempDesc = current.temperature >= 30 ? "hot" : current.temperature >= 20 ? "warm" : current.temperature >= 10 ? "mild" : "cold"
    const rainDesc = (today?.precipitationProbability ?? 0) > 60 ? "Rain is likely today so carry an umbrella." : (today?.precipitationProbability ?? 0) > 30 ? "There's a chance of rain later." : "Rain is unlikely today."
    const windDesc = current.windSpeed > 40 ? "Strong winds expected." : ""

    const alert = current.temperature >= 38 ? "Extreme heat warning. Stay hydrated and avoid prolonged sun exposure."
        : current.temperature <= 0 ? "Freezing temperatures. Dress in warm layers."
            : (today?.precipitationProbability ?? 0) > 80 ? "Heavy rain expected. Carry an umbrella and expect delays."
                : null

    return {
        briefing: `Currently ${current.temperature}°C and ${current.condition.toLowerCase()} in ${location}, feeling like ${current.feelsLike}°C. ${rainDesc} ${windDesc}`.trim(),
        alert,
        recommendation: (today?.precipitationProbability ?? 0) > 50 ? "Carry an umbrella and wear waterproof shoes."
            : current.temperature >= 30 ? "Stay hydrated and wear light, breathable clothing."
                : current.temperature <= 10 ? "Layer up, it's chilly out there."
                    : "Comfortable conditions - a light jacket should do.",
        mood: current.temperature >= 30 ? "Blazing" : current.temperature >= 22 ? "Warm" : current.temperature >= 15 ? "Pleasant" : current.temperature >= 5 ? "Crisp" : "Freezing",
    }
}

export async function getSummary(weather: WeatherData, format: "text" | "json"): Promise<WeatherSummaryJSON | string> {
    let parsed: WeatherSummaryJSON

    try {
        const timeout = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Gemini request timed out after 10s")), 10000)
        )
        const result = await Promise.race([model.generateContent(buildPrompt(weather)), timeout])
        const raw = result.response.text().trim()
        const cleaned = raw.replace(/^```json\s*/i, "").replace(/\s*```$/, "").trim()
        parsed = JSON.parse(cleaned) as WeatherSummaryJSON
    } catch {
        // gemini unavailable or quota exceeded, fall back to rule-based summary
        parsed = buildFallbackSummary(weather)
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