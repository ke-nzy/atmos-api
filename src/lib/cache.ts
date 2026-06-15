// simple in-memory cache, nothing fancy
// good enough for a single-instance API

interface CacheEntry<T> {
    value: T
    expiresAt: number | null // null = never expires
}

class Cache {
    private store = new Map<string, CacheEntry<unknown>>()

    set<T>(key: string, value: T, ttlSeconds: number | null = null) {
        this.store.set(key, {
            value,
            expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
        })
    }

    get<T>(key: string): T | null {
        const entry = this.store.get(key) as CacheEntry<T> | undefined
        if (!entry) return null

        if (entry.expiresAt && Date.now() > entry.expiresAt) {
            this.store.delete(key)
            return null
        }

        return entry.value
    }

    has(key: string): boolean {
        return this.get(key) !== null
    }
}

// single instance shared across the app
export const cache = new Cache()