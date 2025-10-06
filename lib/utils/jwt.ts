import jwt from "jsonwebtoken"
import type { UserRole } from "@/lib/models/user.model"

if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
  throw new Error("JWT secrets are not configured")
}

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET
const ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || "15m"
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d"

export interface JWTPayload {
  userId: string
  email: string
  role: UserRole
  type: "access" | "refresh"
}

export class JWTUtils {
  static generateAccessToken(userId: string, email: string, role: UserRole): string {
    return jwt.sign(
      {
        userId,
        email,
        role,
        type: "access",
      } as JWTPayload,
      ACCESS_SECRET,
      { expiresIn: ACCESS_EXPIRES_IN },
    )
  }

  static generateRefreshToken(userId: string, email: string, role: UserRole): string {
    return jwt.sign(
      {
        userId,
        email,
        role,
        type: "refresh",
      } as JWTPayload,
      REFRESH_SECRET,
      { expiresIn: REFRESH_EXPIRES_IN },
    )
  }

  static verifyAccessToken(token: string): JWTPayload | null {
    try {
      const payload = jwt.verify(token, ACCESS_SECRET) as JWTPayload
      if (payload.type !== "access") return null
      return payload
    } catch (error) {
      return null
    }
  }

  static verifyRefreshToken(token: string): JWTPayload | null {
    try {
      const payload = jwt.verify(token, REFRESH_SECRET) as JWTPayload
      if (payload.type !== "refresh") return null
      return payload
    } catch (error) {
      return null
    }
  }

  static decodeToken(token: string): JWTPayload | null {
    try {
      return jwt.decode(token) as JWTPayload
    } catch (error) {
      return null
    }
  }
}
