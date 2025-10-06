import type { NextRequest } from "next/server"
import { UserRepository } from "@/lib/db/user.repository"
import { CryptoUtils } from "@/lib/utils/crypto"
import { registerSchema } from "@/lib/utils/validation"
import { ApiResponse } from "@/lib/utils/response"
import { UserRole, AccountStatus } from "@/lib/models/user.model"
import { emailQueue } from "@/lib/email/queue"
import { Logger } from "@/lib/utils/logger"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    Logger.debug("[register] Incoming payload", { bodyKeys: Object.keys(body || {}) })

    // Validate input
    const validation = registerSchema.safeParse(body)
    if (!validation.success) {
      Logger.warn("[register] Validation failed", { issues: validation.error.errors })
      return ApiResponse.error("Validation failed", 400, validation.error.errors)
    }

    const { email, password, role } = validation.data

    // Check if user already exists
    Logger.debug("[register] Checking existing user", { email })
    const existingUser = await UserRepository.findByEmail(email)
    if (existingUser) {
      Logger.warn("[register] Email already exists", { email })
      return ApiResponse.error("User with this email already exists", 409)
    }

    // Hash password
    const passwordHash = await CryptoUtils.hashPassword(password)
    Logger.debug("[register] Password hashed")

    // Generate email verification token
    const emailVerificationToken = CryptoUtils.generateToken()
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Create user
    const user = await UserRepository.create({
      email,
      passwordHash,
      role: role || UserRole.USER,
      status: AccountStatus.PENDING_VERIFICATION,
      emailVerified: false,
      emailVerificationToken,
      emailVerificationExpires,
      refreshTokens: [],
    })
    Logger.info("[register] User created", { userId: String(user._id) })

    try {
      await emailQueue.add("verification", email, { token: emailVerificationToken })
      Logger.info("[register] Verification email enqueued", { userId: String(user._id) })
    } catch (e) {
      Logger.warn("[register] Failed to enqueue verification email", { error: (e as any)?.message })
      // Do not fail registration if email cannot be queued in development
    }

    return ApiResponse.success(
      {
        message: "Registration successful. Please check your email to verify your account.",
        userId: user._id,
      },
      201,
    )
  } catch (error) {
    const err: any = error
    if (err?.code === 11000) {
      Logger.warn("[register] Duplicate key error on insert", { code: err.code, keyValue: err.keyValue })
      return ApiResponse.error("User with this email already exists", 409)
    }
    Logger.error("[v0] Registration error:", err)
    return ApiResponse.serverError("Failed to register user")
  }
}
