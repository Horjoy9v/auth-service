import type { NextRequest } from "next/server"
import { UserRepository } from "@/lib/db/user.repository"
import { CryptoUtils } from "@/lib/utils/crypto"
import { resetPasswordSchema } from "@/lib/utils/validation"
import { ApiResponse } from "@/lib/utils/response"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validation = resetPasswordSchema.safeParse(body)
    if (!validation.success) {
      return ApiResponse.error("Validation failed", 400, validation.error.errors)
    }

    const { token, password } = validation.data

    // Find user by reset token
    const user = await UserRepository.findByResetToken(token)
    if (!user) {
      return ApiResponse.error("Invalid or expired reset token", 400)
    }

    // Hash new password
    const passwordHash = await CryptoUtils.hashPassword(password)

    // Update user and clear reset token
    await UserRepository.updateById(user._id!, {
      passwordHash,
      passwordResetToken: undefined,
      passwordResetExpires: undefined,
    })

    // Clear all refresh tokens for security
    await UserRepository.clearRefreshTokens(user._id!)

    return ApiResponse.success({
      message: "Password reset successfully. Please login with your new password.",
    })
  } catch (error) {
    console.error("[v0] Reset password error:", error)
    return ApiResponse.serverError("Failed to reset password")
  }
}
