import type { NextRequest } from "next/server"
import { UserRepository } from "@/lib/db/user.repository"
import { CryptoUtils } from "@/lib/utils/crypto"
import { JWTUtils } from "@/lib/utils/jwt"
import { ApiResponse } from "@/lib/utils/response"

export async function POST(request: NextRequest) {
  try {
    // Get refresh token from cookie or body
    const refreshToken = request.cookies.get("refreshToken")?.value || (await request.json()).refreshToken

    if (!refreshToken) {
      return ApiResponse.success({ message: "Logged out successfully" })
    }

    // Verify and decode token
    const payload = JWTUtils.verifyRefreshToken(refreshToken)
    if (payload) {
      // Remove refresh token from database
      const refreshTokenHash = CryptoUtils.hashToken(refreshToken)
      await UserRepository.removeRefreshToken(payload.userId, refreshTokenHash)
    }

    const response = ApiResponse.success({ message: "Logged out successfully" })

    // Clear refresh token cookie
    response.cookies.delete("refreshToken")

    return response
  } catch (error) {
    console.error("[v0] Logout error:", error)
    return ApiResponse.serverError("Failed to logout")
  }
}
