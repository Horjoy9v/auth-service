/**
 * Simple in-memory rate limiter
 * For production, use Redis or a dedicated rate limiting service
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

class RateLimiter {
  private store = new Map<string, RateLimitEntry>()
  private readonly maxRequests: number
  private readonly windowMs: number

  constructor(maxRequests = 10, windowMs = 60000) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs

    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60000)
  }

  check(identifier: string): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now()
    const entry = this.store.get(identifier)

    if (!entry || entry.resetAt < now) {
      // Create new entry
      const resetAt = now + this.windowMs
      this.store.set(identifier, { count: 1, resetAt })
      return { allowed: true, remaining: this.maxRequests - 1, resetAt }
    }

    if (entry.count >= this.maxRequests) {
      return { allowed: false, remaining: 0, resetAt: entry.resetAt }
    }

    entry.count++
    return { allowed: true, remaining: this.maxRequests - entry.count, resetAt: entry.resetAt }
  }

  private cleanup() {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetAt < now) {
        this.store.delete(key)
      }
    }
  }
}

// Create rate limiters for different endpoints
export const authRateLimiter = new RateLimiter(
  Number.parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "10"),
  Number.parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000"),
)

export const strictRateLimiter = new RateLimiter(5, 60000) // 5 requests per minute

/**
 * Apply rate limiting to a request
 */
export function rateLimit(identifier: string, limiter = authRateLimiter) {
  const result = limiter.check(identifier)

  if (!result.allowed) {
    const resetIn = Math.ceil((result.resetAt - Date.now()) / 1000)
    throw new Error(`Too many requests. Please try again in ${resetIn} seconds.`)
  }

  return result
}
