export interface EmailTemplate {
  subject: string
  html: string
  text: string
}

export class EmailTemplates {
  static verifyEmail(verificationUrl: string, email: string): EmailTemplate {
    return {
      subject: "Verify your email address",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify Email</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <tr>
                      <td style="padding: 40px;">
                        <h1 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 600; color: #1a1a1a;">Verify your email address</h1>
                        <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.5; color: #4a4a4a;">
                          Thank you for registering! Please verify your email address by clicking the button below:
                        </p>
                        <p style="margin: 0 0 24px 0; font-size: 14px; color: #6b6b6b;">
                          Email: <strong>${email}</strong>
                        </p>
                        <table cellpadding="0" cellspacing="0" style="margin: 0 0 24px 0;">
                          <tr>
                            <td style="border-radius: 6px; background-color: #0070f3;">
                              <a href="${verificationUrl}" target="_blank" style="display: inline-block; padding: 12px 32px; font-size: 16px; font-weight: 500; color: #ffffff; text-decoration: none;">
                                Verify Email
                              </a>
                            </td>
                          </tr>
                        </table>
                        <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.5; color: #6b6b6b;">
                          Or copy and paste this link into your browser:
                        </p>
                        <p style="margin: 0 0 24px 0; font-size: 14px; color: #0070f3; word-break: break-all;">
                          ${verificationUrl}
                        </p>
                        <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #6b6b6b;">
                          This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 24px 40px; border-top: 1px solid #e5e5e5;">
                        <p style="margin: 0; font-size: 12px; color: #9b9b9b; text-align: center;">
                          This is an automated message, please do not reply.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
      text: `
Verify your email address

Thank you for registering! Please verify your email address by visiting the following link:

${verificationUrl}

This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
      `.trim(),
    }
  }

  static passwordReset(resetUrl: string, email: string): EmailTemplate {
    return {
      subject: "Reset your password",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Password</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <tr>
                      <td style="padding: 40px;">
                        <h1 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 600; color: #1a1a1a;">Reset your password</h1>
                        <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.5; color: #4a4a4a;">
                          We received a request to reset your password. Click the button below to create a new password:
                        </p>
                        <p style="margin: 0 0 24px 0; font-size: 14px; color: #6b6b6b;">
                          Email: <strong>${email}</strong>
                        </p>
                        <table cellpadding="0" cellspacing="0" style="margin: 0 0 24px 0;">
                          <tr>
                            <td style="border-radius: 6px; background-color: #0070f3;">
                              <a href="${resetUrl}" target="_blank" style="display: inline-block; padding: 12px 32px; font-size: 16px; font-weight: 500; color: #ffffff; text-decoration: none;">
                                Reset Password
                              </a>
                            </td>
                          </tr>
                        </table>
                        <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.5; color: #6b6b6b;">
                          Or copy and paste this link into your browser:
                        </p>
                        <p style="margin: 0 0 24px 0; font-size: 14px; color: #0070f3; word-break: break-all;">
                          ${resetUrl}
                        </p>
                        <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.5; color: #6b6b6b;">
                          This link will expire in 1 hour.
                        </p>
                        <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #d32f2f;">
                          <strong>Important:</strong> If you didn't request a password reset, please ignore this email or contact support if you have concerns.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 24px 40px; border-top: 1px solid #e5e5e5;">
                        <p style="margin: 0; font-size: 12px; color: #9b9b9b; text-align: center;">
                          This is an automated message, please do not reply.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
      text: `
Reset your password

We received a request to reset your password. Visit the following link to create a new password:

${resetUrl}

This link will expire in 1 hour.

If you didn't request a password reset, please ignore this email or contact support if you have concerns.
      `.trim(),
    }
  }

  static welcomeEmail(email: string, name?: string): EmailTemplate {
    const greeting = name ? `Hi ${name}` : "Welcome"
    return {
      subject: "Welcome to our platform!",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <tr>
                      <td style="padding: 40px;">
                        <h1 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 600; color: #1a1a1a;">${greeting}!</h1>
                        <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.5; color: #4a4a4a;">
                          Your email has been verified successfully. You're all set to start using our platform!
                        </p>
                        <p style="margin: 0 0 24px 0; font-size: 14px; color: #6b6b6b;">
                          Email: <strong>${email}</strong>
                        </p>
                        <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #6b6b6b;">
                          If you have any questions or need assistance, feel free to reach out to our support team.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 24px 40px; border-top: 1px solid #e5e5e5;">
                        <p style="margin: 0; font-size: 12px; color: #9b9b9b; text-align: center;">
                          This is an automated message, please do not reply.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
      text: `
${greeting}!

Your email has been verified successfully. You're all set to start using our platform!

Email: ${email}

If you have any questions or need assistance, feel free to reach out to our support team.
      `.trim(),
    }
  }
}
