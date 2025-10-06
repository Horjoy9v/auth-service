import type { NextRequest } from "next/server"
import { withAuth } from "@/lib/middleware/auth.middleware"
import { UserRepository } from "@/lib/db/user.repository"
import { ApiResponse } from "@/lib/utils/response"

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      // Get full user data
      const userData = await UserRepository.findById(user.userId)
      if (!userData) {
        return ApiResponse.notFound("User not found")
      }

      return ApiResponse.success({
        id: userData._id,
        email: userData.email,
        role: userData.role,
        status: userData.status,
        emailVerified: userData.emailVerified,
        createdAt: userData.createdAt,
        lastLoginAt: userData.lastLoginAt,
      })
    } catch (error) {
      console.error("[v0] Get user error:", error)
      return ApiResponse.serverError("Failed to get user data")
    }
  })
}
