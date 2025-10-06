import type { NextRequest } from "next/server"
import { UserRepository } from "@/lib/db/user.repository"
import { CryptoUtils } from "@/lib/utils/crypto"
import { JWTUtils } from "@/lib/utils/jwt"
import { ApiResponse } from "@/lib/utils/response"
import { AccountStatus } from "@/lib/models/user.model"

export async function POST(request: NextRequest) {
  try {
    // Get refresh token from cookie or body
    const refreshToken = request.cookies.get("refreshToken")?.value || (await request.json()).refreshToken

    if (!refreshToken) {
      return ApiResponse.unauthorized("Refresh token is required")
    }

    // Verify refresh token
    const payload = JWTUtils.verifyRefreshToken(refreshToken)
    if (!payload) {
      return ApiResponse.unauthorized("Invalid or expired refresh token")
    }

    // Check if token exists in database
    const user = await UserRepository.findById(payload.userId)
    if (!user) {
      return ApiResponse.unauthorized("User not found")
    }

    // Check if refresh token is in user's token list
    const refreshTokenHash = CryptoUtils.hashToken(refreshToken)
    if (!user.refreshTokens.includes(refreshTokenHash)) {
      // Token reuse detected - clear all tokens for security
      await UserRepository.clearRefreshTokens(user._id!)
      return ApiResponse.unauthorized("Invalid refresh token. Please login again.")
    }

    // Check account status
    if (user.status === AccountStatus.BLOCKED || user.status === AccountStatus.DELETED) {
      return ApiResponse.forbidden("Account is not active")
    }

    // Generate new tokens
    const newAccessToken = JWTUtils.generateAccessToken(user._id!.toString(), user.email, user.role)
    const newRefreshToken = JWTUtils.generateRefreshToken(user._id!.toString(), user.email, user.role)

    // Replace old refresh token with new one
    const newRefreshTokenHash = CryptoUtils.hashToken(newRefreshToken)
    await UserRepository.removeRefreshToken(user._id!, refreshTokenHash)
    await UserRepository.addRefreshToken(user._id!, newRefreshTokenHash)

    const response = ApiResponse.success({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    })

    // Update httpOnly cookie
    response.cookies.set("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    })

    return response
  } catch (error) {
    console.error("[v0] Refresh token error:", error)
    return ApiResponse.serverError("Failed to refresh token")
  }
}
