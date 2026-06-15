// WMO weather codes, open-meteo uses these
// full list: https://open-meteo.com/en/docs#weathervariables

const codes: Record<number, { label: string; icon: string; nightIcon?: string }> = {
    0: { label: "Clear Sky", icon: "☀️", nightIcon: "🌙" },
    1: { label: "Mainly Clear", icon: "🌤️", nightIcon: "🌙" },
    2: { label: "Partly Cloudy", icon: "⛅", nightIcon: "🌥️" },
    3: { label: "Overcast", icon: "☁️" },
    45: { label: "Foggy", icon: "🌫️" },
    48: { label: "Icy Fog", icon: "🌫️" },
    51: { label: "Light Drizzle", icon: "🌦️" },
    53: { label: "Drizzle", icon: "🌦️" },
    55: { label: "Heavy Drizzle", icon: "🌧️" },
    61: { label: "Light Rain", icon: "🌧️" },
    63: { label: "Rain", icon: "🌧️" },
    65: { label: "Heavy Rain", icon: "🌧️" },
    71: { label: "Light Snow", icon: "🌨️" },
    73: { label: "Snow", icon: "❄️" },
    75: { label: "Heavy Snow", icon: "❄️" },
    80: { label: "Light Showers", icon: "🌦️" },
    81: { label: "Showers", icon: "🌧️" },
    82: { label: "Heavy Showers", icon: "⛈️" },
    95: { label: "Thunderstorm", icon: "⛈️" },
    99: { label: "Severe Thunderstorm", icon: "🌪️" },
}

export function resolveCode(code: number, isDay = true) {
    const entry = codes[code] ?? { label: "Unknown", icon: "🌡️" }
    const icon = !isDay && entry.nightIcon ? entry.nightIcon : entry.icon
    return { condition: entry.label, icon }
}