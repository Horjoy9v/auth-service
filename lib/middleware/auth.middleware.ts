import type { NextRequest } from "next/server"
import { JWTUtils, type JWTPayload } from "@/lib/utils/jwt"
import { UserRepository } from "@/lib/db/user.repository"
import { ApiResponse } from "@/lib/utils/response"
import { UserRole, AccountStatus } from "@/lib/models/user.model"

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload
}

export class AuthMiddleware {
  /**
   * Extract and verify JWT token from Authorization header
   */
  static async authenticate(request: NextRequest): Promise<{ user: JWTPayload } | Response> {
    try {
      // Get token from Authorization header
      const authHeader = request.headers.get("authorization")
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return ApiResponse.unauthorized("Missing or invalid authorization header")
      }

      const token = authHeader.substring(7) // Remove "Bearer " prefix

      // Verify token
      const payload = JWTUtils.verifyAccessToken(token)
      if (!payload) {
        return ApiResponse.unauthorized("Invalid or expired token")
      }

      // Verify user still exists and is active
      const user = await UserRepository.findById(payload.userId)
      if (!user) {
        return ApiResponse.unauthorized("User not found")
      }

      if (user.status === AccountStatus.BLOCKED) {
        return ApiResponse.forbidden(`Account is blocked${user.blockedReason ? `: ${user.blockedReason}` : ""}`)
      }

      if (user.status === AccountStatus.DELETED) {
        return ApiResponse.forbidden("Account has been deleted")
      }

      return { user: payload }
    } catch (error) {
      console.error("[v0] Authentication error:", error)
      return ApiResponse.unauthorized("Authentication failed")
    }
  }

  /**
   * Verify user has required role
   */
  static requireRole(...allowedRoles: UserRole[]) {
    return async (request: NextRequest): Promise<{ user: JWTPayload } | Response> => {
      const authResult = await AuthMiddleware.authenticate(request)

      // If authentication failed, return error response
      if (authResult instanceof Response) {
        return authResult
      }

      const { user } = authResult

      // Check if user has required role
      if (!allowedRoles.includes(user.role)) {
        return ApiResponse.forbidden("Insufficient permissions")
      }

      return { user }
    }
  }

  /**
   * Verify user can delete comments (Support, Creator, Admin)
   */
  static async requireDeleteCommentPermission(request: NextRequest): Promise<{ user: JWTPayload } | Response> {
    return AuthMiddleware.requireRole(UserRole.SUPPORT, UserRole.CREATOR, UserRole.ADMIN)(request)
  }

  /**
   * Verify user can block users (Creator, Admin)
   */
  static async requireBlockUserPermission(request: NextRequest): Promise<{ user: JWTPayload } | Response> {
    return AuthMiddleware.requireRole(UserRole.CREATOR, UserRole.ADMIN)(request)
  }

  /**
   * Verify user is admin
   */
  static async requireAdmin(request: NextRequest): Promise<{ user: JWTPayload } | Response> {
    return AuthMiddleware.requireRole(UserRole.ADMIN)(request)
  }
}

/**
 * Helper function to use middleware in route handlers
 */
export async function withAuth(
  request: NextRequest,
  handler: (request: NextRequest, user: JWTPayload) => Promise<Response>,
): Promise<Response> {
  const authResult = await AuthMiddleware.authenticate(request)

  if (authResult instanceof Response) {
    return authResult
  }

  return handler(request, authResult.user)
}

/**
 * Helper function to use role-based middleware in route handlers
 */
export async function withRole(
  request: NextRequest,
  allowedRoles: UserRole[],
  handler: (request: NextRequest, user: JWTPayload) => Promise<Response>,
): Promise<Response> {
  const authResult = await AuthMiddleware.requireRole(...allowedRoles)(request)

  if (authResult instanceof Response) {
    return authResult
  }

  return handler(request, authResult.user)
}
