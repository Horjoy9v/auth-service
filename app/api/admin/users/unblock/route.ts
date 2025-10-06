import type { NextRequest } from "next/server"
import { withRole } from "@/lib/middleware/auth.middleware"
import { UserRepository } from "@/lib/db/user.repository"
import { ApiResponse } from "@/lib/utils/response"
import { UserRole } from "@/lib/models/user.model"

export async function POST(request: NextRequest) {
  return withRole(request, [UserRole.CREATOR, UserRole.ADMIN], async (req, user) => {
    try {
      const body = await request.json()
      const { userId } = body

      if (!userId) {
        return ApiResponse.error("User ID is required", 400)
      }

      // Get target user
      const targetUser = await UserRepository.findById(userId)
      if (!targetUser) {
        return ApiResponse.notFound("User not found")
      }

      // Unblock user
      await UserRepository.unblockUser(userId)

      return ApiResponse.success({
        message: "User unblocked successfully",
        userId,
      })
    } catch (error) {
      console.error("[v0] Unblock user error:", error)
      return ApiResponse.serverError("Failed to unblock user")
    }
  })
}
