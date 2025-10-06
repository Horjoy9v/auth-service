import type { NextRequest } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { ApiResponse } from "@/lib/utils/response"
import { Logger } from "@/lib/utils/logger"

export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase()
    await db.command({ ping: 1 })

    return ApiResponse.success({
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "auth-service",
    })
  } catch (error) {
    Logger.error("[v0] Health check error:", error as any)
    return ApiResponse.error("Service unhealthy", 503)
  }
}
