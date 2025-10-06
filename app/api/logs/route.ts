import type { NextRequest } from "next/server"
import { Logger } from "@/lib/utils/logger"
import { ApiResponse } from "@/lib/utils/response"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const limitParam = searchParams.get("limit")
  const limit = Math.max(1, Math.min(500, Number(limitParam) || 100))

  const logs = Logger.getRecentLogs(limit)
  return ApiResponse.success({ logs })
}


