import type { NextRequest } from "next/server"
import { withRole } from "@/lib/middleware/auth.middleware"
import { getDatabase } from "@/lib/mongodb"
import { ApiResponse } from "@/lib/utils/response"
import { UserRole } from "@/lib/models/user.model"

export async function GET(request: NextRequest) {
  return withRole(request, [UserRole.ADMIN, UserRole.SUPPORT], async (req, user) => {
    try {
      const { searchParams } = new URL(request.url)
      const page = Number.parseInt(searchParams.get("page") || "1")
      const limit = Number.parseInt(searchParams.get("limit") || "20")
      const role = searchParams.get("role")
      const status = searchParams.get("status")

      const skip = (page - 1) * limit

      const db = await getDatabase()
      const collection = db.collection("users")

      // Build filter
      const filter: any = {}
      if (role) filter.role = role
      if (status) filter.status = status

      // Get users with pagination
      const users = await collection
        .find(filter, {
          projection: {
            passwordHash: 0,
            refreshTokens: 0,
            emailVerificationToken: 0,
            passwordResetToken: 0,
          },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray()

      const total = await collection.countDocuments(filter)

      return ApiResponse.success({
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      })
    } catch (error) {
      console.error("[v0] Get users error:", error)
      return ApiResponse.serverError("Failed to get users")
    }
  })
}
