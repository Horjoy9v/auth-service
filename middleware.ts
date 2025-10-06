import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Get allowed origins from environment variable
const getAllowedOrigins = (): string[] => {
  const origins = process.env.ALLOWED_ORIGINS || ""
  return origins
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
}

export function middleware(request: NextRequest) {
  const origin = request.headers.get("origin")
  const allowedOrigins = getAllowedOrigins()

  // Handle preflight requests
  if (request.method === "OPTIONS") {
    const response = new NextResponse(null, { status: 204 })

    // Set CORS headers for preflight
    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set("Access-Control-Allow-Origin", origin)
      response.headers.set("Access-Control-Allow-Credentials", "true")
      response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS")
      response.headers.set(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, X-Requested-With, X-CSRF-Token",
      )
      response.headers.set("Access-Control-Max-Age", "86400") // 24 hours
    }

    return response
  }

  // Clone the response
  const response = NextResponse.next()

  // Set CORS headers for actual requests
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin)
    response.headers.set("Access-Control-Allow-Credentials", "true")
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS")
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, X-CSRF-Token")
  }

  // Security headers
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-XSS-Protection", "1; mode=block")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")

  // Content Security Policy
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';",
  )

  // Strict Transport Security (HSTS) - only in production
  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload")
  }

  return response
}

// Apply middleware to all API routes
export const config = {
  matcher: "/api/:path*",
}
