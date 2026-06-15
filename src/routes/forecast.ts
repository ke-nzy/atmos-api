import Elysia, { t } from "elysia"
import { geocode, fetchWeather } from "../lib/open-meteo"

export const forecastRoute = new Elysia().get(
    "/api/forecast/:city",
    async ({ params }) => {
        const geo = await geocode(params.city)
        if (!geo) return { error: `City "${params.city}" not found`, status: 404 }

        const weather = await fetchWeather(geo.latitude, geo.longitude, `${geo.name}, ${geo.country}`)
        return weather
    },
    {
        params: t.Object({ city: t.String() }),
    }
)