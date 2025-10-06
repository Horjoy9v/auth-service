import { Resend } from "resend"
import { EmailTemplates } from "./templates"

if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY is not configured")
}

if (!process.env.RESEND_FROM_EMAIL) {
  throw new Error("RESEND_FROM_EMAIL is not configured")
}

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://localhost:3000"

export class EmailService {
  private static async send(to: string, subject: string, html: string, text: string) {
    try {
      const result = await resend.emails.send({
        from: FROM_EMAIL,
        to,
        subject,
        html,
        text,
      })

      if (result.error) {
        console.error("[v0] Email send error:", result.error)
        throw new Error(`Failed to send email: ${result.error.message}`)
      }

      return result.data
    } catch (error) {
      console.error("[v0] Email service error:", error)
      throw error
    }
  }

  static async sendVerificationEmail(email: string, token: string) {
    const verificationUrl = `${AUTH_SERVICE_URL}/verify-email?token=${token}`
    const template = EmailTemplates.verifyEmail(verificationUrl, email)

    return this.send(email, template.subject, template.html, template.text)
  }

  static async sendPasswordResetEmail(email: string, token: string) {
    const resetUrl = `${AUTH_SERVICE_URL}/reset-password?token=${token}`
    const template = EmailTemplates.passwordReset(resetUrl, email)

    return this.send(email, template.subject, template.html, template.text)
  }

  static async sendWelcomeEmail(email: string, name?: string) {
    const template = EmailTemplates.welcomeEmail(email, name)

    return this.send(email, template.subject, template.html, template.text)
  }
}
