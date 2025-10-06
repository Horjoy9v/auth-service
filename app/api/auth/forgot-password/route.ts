import type { NextRequest } from "next/server"
import { UserRepository } from "@/lib/db/user.repository"
import { CryptoUtils } from "@/lib/utils/crypto"
import { forgotPasswordSchema } from "@/lib/utils/validation"
import { ApiResponse } from "@/lib/utils/response"
import { emailQueue } from "@/lib/email/queue"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validation = forgotPasswordSchema.safeParse(body)
    if (!validation.success) {
      return ApiResponse.error("Validation failed", 400, validation.error.errors)
    }

    const { email } = validation.data

    // Find user
    const user = await UserRepository.findByEmail(email)

    // Always return success to prevent email enumeration
    if (!user) {
      return ApiResponse.success({
        message: "If an account exists with this email, a password reset link has been sent.",
      })
    }

    // Generate reset token
    const passwordResetToken = CryptoUtils.generateToken()
    const passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Update user
    await UserRepository.updateById(user._id!, {
      passwordResetToken,
      passwordResetExpires,
    })

    await emailQueue.add("password-reset", email, { token: passwordResetToken })

    return ApiResponse.success({
      message: "If an account exists with this email, a password reset link has been sent.",
    })
  } catch (error) {
    console.error("[v0] Forgot password error:", error)
    return ApiResponse.serverError("Failed to process password reset request")
  }
}
