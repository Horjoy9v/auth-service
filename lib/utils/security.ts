import crypto from "crypto"

export class SecurityUtils {
  /**
   * Generate a secure random string
   */
  static generateSecureToken(length = 32): string {
    return crypto.randomBytes(length).toString("hex")
  }

  /**
   * Generate CSRF token
   */
  static generateCSRFToken(): string {
    return this.generateSecureToken(32)
  }

  /**
   * Verify CSRF token
   */
  static verifyCSRFToken(token: string, expectedToken: string): boolean {
    if (!token || !expectedToken) return false
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expectedToken))
  }

  /**
   * Sanitize user input to prevent XSS
   */
  static sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, "") // Remove < and >
      .replace(/javascript:/gi, "") // Remove javascript: protocol
      .replace(/on\w+=/gi, "") // Remove event handlers
      .trim()
  }

  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * Check password strength
   */
  static checkPasswordStrength(password: string): {
    score: number
    feedback: string[]
  } {
    const feedback: string[] = []
    let score = 0

    if (password.length >= 8) score++
    else feedback.push("Password should be at least 8 characters")

    if (password.length >= 12) score++

    if (/[a-z]/.test(password)) score++
    else feedback.push("Add lowercase letters")

    if (/[A-Z]/.test(password)) score++
    else feedback.push("Add uppercase letters")

    if (/[0-9]/.test(password)) score++
    else feedback.push("Add numbers")

    if (/[^a-zA-Z0-9]/.test(password)) score++
    else feedback.push("Add special characters")

    return { score, feedback }
  }

  /**
   * Generate a secure session ID
   */
  static generateSessionId(): string {
    return this.generateSecureToken(64)
  }

  /**
   * Hash sensitive data (for logging, etc.)
   */
  static hashForLogging(data: string): string {
    return crypto.createHash("sha256").update(data).digest("hex").substring(0, 8)
  }
}
