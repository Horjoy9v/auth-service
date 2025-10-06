import type { NextRequest } from "next/server"
import { withRole } from "@/lib/middleware/auth.middleware"
import { UserRepository } from "@/lib/db/user.repository"
import { blockUserSchema } from "@/lib/utils/validation"
import { ApiResponse } from "@/lib/utils/response"
import { UserRole, Permissions } from "@/lib/models/user.model"

export async function POST(request: NextRequest) {
  return withRole(request, [UserRole.CREATOR, UserRole.ADMIN], async (req, user) => {
    try {
      const body = await request.json()

      // Validate input
      const validation = blockUserSchema.safeParse(body)
      if (!validation.success) {
        return ApiResponse.error("Validation failed", 400, validation.error.errors)
      }

      const { userId, reason } = validation.data

      // Check if user has permission
      if (!Permissions.canBlockUsers(user.role)) {
        return ApiResponse.forbidden("You don't have permission to block users")
      }

      // Prevent blocking yourself
      if (userId === user.userId) {
        return ApiResponse.error("You cannot block yourself", 400)
      }

      // Get target user
      const targetUser = await UserRepository.findById(userId)
      if (!targetUser) {
        return ApiResponse.notFound("User not found")
      }

      // Prevent blocking admins (unless you're an admin)
      if (targetUser.role === UserRole.ADMIN && user.role !== UserRole.ADMIN) {
        return ApiResponse.forbidden("You cannot block administrators")
      }

      // Block user
      await UserRepository.blockUser(userId, user.userId, reason)

      // Clear all refresh tokens to force logout
      await UserRepository.clearRefreshTokens(userId)

      return ApiResponse.success({
        message: "User blocked successfully",
        userId,
      })
    } catch (error) {
      console.error("[v0] Block user error:", error)
      return ApiResponse.serverError("Failed to block user")
    }
  })
}
