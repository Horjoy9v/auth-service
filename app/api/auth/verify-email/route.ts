import type { NextRequest } from "next/server"
import { UserRepository } from "@/lib/db/user.repository"
import { verifyEmailSchema } from "@/lib/utils/validation"
import { ApiResponse } from "@/lib/utils/response"
import { AccountStatus } from "@/lib/models/user.model"
import { emailQueue } from "@/lib/email/queue"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validation = verifyEmailSchema.safeParse(body)
    if (!validation.success) {
      return ApiResponse.error("Validation failed", 400, validation.error.errors)
    }

    const { token } = validation.data

    // Find user by verification token
    const user = await UserRepository.findByVerificationToken(token)
    if (!user) {
      return ApiResponse.error("Invalid or expired verification token", 400)
    }

    // Update user
    await UserRepository.updateById(user._id!, {
      emailVerified: true,
      status: AccountStatus.ACTIVE,
      emailVerificationToken: undefined,
      emailVerificationExpires: undefined,
    })

    await emailQueue.add("welcome", user.email, {})

    return ApiResponse.success({
      message: "Email verified successfully",
    })
  } catch (error) {
    console.error("[v0] Email verification error:", error)
    return ApiResponse.serverError("Failed to verify email")
  }
}
