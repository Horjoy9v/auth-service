import type { NextRequest } from "next/server"
import { UserRepository } from "@/lib/db/user.repository"
import { CryptoUtils } from "@/lib/utils/crypto"
import { JWTUtils } from "@/lib/utils/jwt"
import { loginSchema } from "@/lib/utils/validation"
import { ApiResponse } from "@/lib/utils/response"
import { AccountStatus } from "@/lib/models/user.model"
import { rateLimit, strictRateLimiter } from "@/lib/utils/rate-limit"
import { Logger } from "@/lib/utils/logger"

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"

  try {
    const rateLimitResult = rateLimit(ip, strictRateLimiter)

    // Add rate limit headers
    const headers = {
      "X-RateLimit-Limit": strictRateLimiter["maxRequests"].toString(),
      "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
      "X-RateLimit-Reset": new Date(rateLimitResult.resetAt).toISOString(),
    }

    if (rateLimitResult.remaining <= 0) {
      Logger.securityEvent("Rate limit exceeded", { ip })
      return ApiResponse.error("Too many requests", 429, headers)
    }

    const body = await request.json()

    // Validate input
    const validation = loginSchema.safeParse(body)
    if (!validation.success) {
      return ApiResponse.error("Validation failed", 400, validation.error.errors)
    }

    const { email, password } = validation.data

    // Find user
    const user = await UserRepository.findByEmail(email)
    if (!user) {
      Logger.securityEvent("Login attempt with non-existent email", { email, ip })
      return ApiResponse.error("Invalid email or password", 401)
    }

    // Check account status
    if (user.status === AccountStatus.BLOCKED) {
      Logger.securityEvent("Login attempt on blocked account", { userId: user._id?.toString(), ip })
      return ApiResponse.error(`Account is blocked${user.blockedReason ? `: ${user.blockedReason}` : ""}`, 403)
    }

    if (user.status === AccountStatus.DELETED) {
      Logger.securityEvent("Login attempt on deleted account", { userId: user._id?.toString(), ip })
      return ApiResponse.error("Account has been deleted", 403)
    }

    // Verify password
    const isPasswordValid = await CryptoUtils.verifyPassword(password, user.passwordHash)
    if (!isPasswordValid) {
      Logger.securityEvent("Failed login attempt - invalid password", { userId: user._id?.toString(), ip })
      return ApiResponse.error("Invalid email or password", 401)
    }

    // Generate tokens
    const accessToken = JWTUtils.generateAccessToken(user._id!.toString(), user.email, user.role)
    const refreshToken = JWTUtils.generateRefreshToken(user._id!.toString(), user.email, user.role)

    // Store hashed refresh token
    const refreshTokenHash = CryptoUtils.hashToken(refreshToken)
    await UserRepository.addRefreshToken(user._id!, refreshTokenHash)

    // Update last login
    await UserRepository.updateById(user._id!, { lastLoginAt: new Date() })

    Logger.authEvent("User logged in successfully", user._id?.toString(), { email, ip })

    // Set refresh token as httpOnly cookie
    const response = ApiResponse.success({
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
      },
    })

    // Set httpOnly cookie for refresh token
    response.cookies.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    })

    return response
  } catch (error) {
    Logger.error("Login error", error, { ip })
    return ApiResponse.serverError("Failed to login")
  }
}
