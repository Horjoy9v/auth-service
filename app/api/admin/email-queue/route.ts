import type { NextRequest } from "next/server"
import { ApiResponse } from "@/lib/utils/response"
import { emailQueue } from "@/lib/email/queue"

// Admin endpoint to check email queue status
export async function GET(request: NextRequest) {
  try {
    // TODO: Add authentication middleware to verify admin role

    return ApiResponse.success({
      queueSize: emailQueue.getQueueSize(),
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[v0] Email queue status error:", error)
    return ApiResponse.serverError("Failed to get email queue status")
  }
}
