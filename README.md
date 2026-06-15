# atmos-api

A developer-facing weather REST API built with Elysia and Bun. Wraps Open-Meteo with a clean normalized schema, adds multi-city comparison, and an AI summary layer via Google Gemini. Includes a live API explorer UI at the root.

## Stack

- [Elysia](https://elysiajs.com) - fast TypeScript web framework for Bun
- [Bun](https://bun.sh) - runtime and package manager
- [Open-Meteo](https://open-meteo.com) - weather data, no API key needed
- [Google Gemini](https://ai.google.dev) - AI weather summaries

## Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/forecast/:city` | Current conditions + 7-day forecast |
| GET | `/api/forecast/:city/hourly` | Next 24 hours broken down by hour |
| GET | `/api/forecast/:city/summary` | AI weather brief (`?format=json` or `?format=text`) |
| GET | `/api/compare?cities=` | Side-by-side comparison of up to 5 cities |
| GET | `/health` | Health check |
| GET | `/` | API explorer UI |

## Setup

```bash
git clone https://github.com/ke-nzy/atmos-api.git
cd atmos-api
bun install
cp .env.example .env
bun run src/index.ts
```

Open `http://localhost:4003` in your browser.

## Environment Variables

```
PORT=4003
GEMINI_API_KEY=gemini_api_key_goes_here_mate
```

## Running Live

This project runs locally and is exposed publicly via Cloudflare Tunnel. To replicate:

```bash
# create the tunnel once
cloudflared tunnel create atmos-api
# This is my domain name, you can use yours to work with this
cloudflared tunnel route dns atmos-api weather.kennedyngugi.com

# run anytime
cloudflared tunnel run atmos-api
```

The tunnel config at `~/.cloudflared/config.yml` should point to `http://localhost:4003`.

For a permanent cloud deployment, this would work perfectly on Railway [Railway](https://railway.app) - we can just add the `GEMINI_API_KEY` environment variable and point it at `src/index.ts`.

## Notes

- Weather data is cached in-memory for 10 minutes, geocoding results cached indefinitely
- Gemini summary falls back to a rule-based response if the API is unavailable or quota is exceeded (Which on the free tier, is fairly fast unfortunately)
- All endpoints are fully typed end to end with TypeScript
- First API call per city may take 10-16s depending on your network - subsequent calls are cached and return in under 20ms.