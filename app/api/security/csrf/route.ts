import type { NextRequest } from "next/server"
import { ApiResponse } from "@/lib/utils/response"
import { SecurityUtils } from "@/lib/utils/security"

/**
 * Generate CSRF token for forms
 * This endpoint can be called by client applications to get a CSRF token
 */
export async function GET(request: NextRequest) {
  try {
    const token = SecurityUtils.generateCSRFToken()

    const response = ApiResponse.success({
      csrfToken: token,
      expiresIn: 3600, // 1 hour
    })

    // Set CSRF token in httpOnly cookie
    response.cookies.set("csrf-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 3600,
      path: "/",
    })

    return response
  } catch (error) {
    console.error("[v0] CSRF token generation error:", error)
    return ApiResponse.serverError("Failed to generate CSRF token")
  }
}
