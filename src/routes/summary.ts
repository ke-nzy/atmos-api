import Elysia, { t } from "elysia"
import { geocode, fetchWeather } from "../lib/open-meteo"
import { getSummary } from "../lib/gemini"

export const summaryRoute = new Elysia().get(
    "/api/forecast/:city/summary",
    async ({ params, query }) => {
        const geo = await geocode(params.city)
        if (!geo) return { error: `City "${params.city}" not found`, status: 404 }

        const weather = await fetchWeather(geo.latitude, geo.longitude, `${geo.name}, ${geo.country}`)
        const format = query.format === "text" ? "text" : "json"
        const summary = await getSummary(weather, format)

        return { location: weather.location, format, summary }
    },
    {
        params: t.Object({ city: t.String() }),
        query: t.Object({ format: t.Optional(t.String()) }),
    }
)