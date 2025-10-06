import type { NextRequest } from "next/server"
import { JWTUtils } from "@/lib/utils/jwt"
import { UserRepository } from "@/lib/db/user.repository"
import { ApiResponse } from "@/lib/utils/response"
import { AccountStatus } from "@/lib/models/user.model"

/**
 * Endpoint for other services to verify JWT tokens
 * This allows other microservices to validate tokens without direct database access
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

    if (!token) {
      return ApiResponse.error("Token is required", 400)
    }

    // Verify token
    const payload = JWTUtils.verifyAccessToken(token)
    if (!payload) {
      return ApiResponse.unauthorized("Invalid or expired token")
    }

    // Verify user still exists and is active
    const user = await UserRepository.findById(payload.userId)
    if (!user) {
      return ApiResponse.unauthorized("User not found")
    }

    if (user.status !== AccountStatus.ACTIVE) {
      return ApiResponse.forbidden("User account is not active")
    }

    return ApiResponse.success({
      valid: true,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
      },
      permissions: {
        canDeleteComments: [UserRole.SUPPORT, UserRole.CREATOR, UserRole.ADMIN].includes(user.role),
        canBlockUsers: [UserRole.CREATOR, UserRole.ADMIN].includes(user.role),
        canManageRoles: user.role === UserRole.ADMIN,
      },
    })
  } catch (error) {
    console.error("[v0] Token verification error:", error)
    return ApiResponse.serverError("Failed to verify token")
  }
}

// Import UserRole for permissions check
import { UserRole } from "@/lib/models/user.model"
