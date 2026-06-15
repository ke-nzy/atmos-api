import { Elysia } from "elysia"
import { staticPlugin } from "@elysiajs/static"
import { cors } from "@elysiajs/cors"
import { forecastRoute } from "./routes/forecast"
import { hourlyRoute } from "./routes/hourly"
import { summaryRoute } from "./routes/summary"
import { compareRoute } from "./routes/compare"

const PORT = Number(process.env.PORT) || 4003

const app = new Elysia()
    .use(cors())
    .use(staticPlugin({ assets: "src/public", prefix: "/static" }))
    .get("/", () => Bun.file("src/public/index.html"))
    .use(forecastRoute)
    .use(hourlyRoute)
    .use(summaryRoute)
    .use(compareRoute)
    .get("/health", () => ({ status: "ok", timestamp: new Date().toISOString() }))
    .listen(PORT)

console.log(`atmos-api running at http://localhost:${PORT}`)