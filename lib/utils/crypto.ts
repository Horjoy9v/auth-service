import crypto from "crypto"
import bcrypt from "bcryptjs"

const SALT_ROUNDS = 12

export class CryptoUtils {
  // Hash password with bcrypt
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS)
  }

  // Verify password
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  }

  // Generate random token
  static generateToken(length = 32): string {
    return crypto.randomBytes(length).toString("hex")
  }

  // Hash token (for storing refresh tokens)
  static hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex")
  }

  // Generate verification code (6 digits)
  static generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }
}
