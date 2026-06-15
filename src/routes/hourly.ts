import Elysia, { t } from "elysia"
import { geocode, fetchWeather } from "../lib/open-meteo"

export const hourlyRoute = new Elysia().get(
    "/api/forecast/:city/hourly",
    async ({ params }) => {
        const geo = await geocode(params.city)
        if (!geo) return { error: `City "${params.city}" not found`, status: 404 }

        const weather = await fetchWeather(geo.latitude, geo.longitude, `${geo.name}, ${geo.country}`)
        return {
            location: weather.location,
            timezone: weather.timezone,
            hourly: weather.hourly,
        }
    },
    {
        params: t.Object({ city: t.String() }),
    }
)