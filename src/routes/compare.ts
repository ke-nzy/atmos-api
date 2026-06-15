import Elysia, { t } from "elysia"
import { geocode, fetchWeather } from "../lib/open-meteo"

export const compareRoute = new Elysia().get(
    "/api/compare",
    async ({ query }) => {
        const cityList = query.cities.split(",").map(c => c.trim()).filter(Boolean)

        if (cityList.length < 2) return { error: "Provide at least 2 cities e.g. ?cities=Nairobi,Lagos", status: 400 }
        if (cityList.length > 5) return { error: "Max 5 cities per request", status: 400 }

        const results = await Promise.allSettled(
            cityList.map(async (city) => {
                const geo = await geocode(city)
                if (!geo) throw new Error(`City "${city}" not found`)
                return fetchWeather(geo.latitude, geo.longitude, `${geo.name}, ${geo.country}`)
            })
        )

        // separate what worked from what didn't
        const fulfilled = results
            .map((r, i) => ({ result: r, city: cityList[i]! }))
            .filter(({ result }) => result.status === "fulfilled")
            .map(({ result }) => (result as PromiseFulfilledResult<Awaited<ReturnType<typeof fetchWeather>>>).value)

        const failed = results
            .map((r, i) => ({ result: r, city: cityList[i]! }))
            .filter(({ result }) => result.status === "rejected")
            .map(({ city }) => city)

        return {
            count: fulfilled.length,
            failed: failed.length ? failed : undefined,
            cities: fulfilled.map(w => ({
                location: w.location,
                temperature: w.current.temperature,
                feelsLike: w.current.feelsLike,
                condition: w.current.condition,
                icon: w.current.icon,
                humidity: w.current.humidity,
                windSpeed: w.current.windSpeed,
                today: {
                    high: w.daily[0]?.tempMax,
                    low: w.daily[0]?.tempMin,
                    rain: w.daily[0]?.precipitationProbability,
                }
            }))
        }
    },
    {
        query: t.Object({ cities: t.String() }),
    }
)