import { z } from "zod"

export const registerSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  role: z.enum(["user", "creator", "support", "admin"]).optional(),
})

export const loginSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase(),
  password: z.string().min(1, "Password is required"),
})

export const verifyEmailSchema = z.object({
  token: z.string().min(1, "Token is required"),
})

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase(),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
})

export const blockUserSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  reason: z.string().optional(),
})
