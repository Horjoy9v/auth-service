import type { ObjectId } from "mongodb"

export enum UserRole {
  USER = "user",
  CREATOR = "creator",
  SUPPORT = "support",
  ADMIN = "admin",
}

export enum AccountStatus {
  ACTIVE = "active",
  BLOCKED = "blocked",
  PENDING_VERIFICATION = "pending_verification",
  DELETED = "deleted",
}

export interface User {
  _id?: ObjectId
  email: string
  passwordHash: string
  role: UserRole
  status: AccountStatus
  emailVerified: boolean
  emailVerificationToken?: string
  emailVerificationExpires?: Date
  passwordResetToken?: string
  passwordResetExpires?: Date
  refreshTokens: string[] // Store hashed refresh tokens
  blockedBy?: ObjectId // Admin/Creator who blocked this user
  blockedAt?: Date
  blockedReason?: string
  createdAt: Date
  updatedAt: Date
  lastLoginAt?: Date
}

// Permission helpers
export const Permissions = {
  canDeleteComments: (role: UserRole): boolean => {
    return [UserRole.SUPPORT, UserRole.CREATOR, UserRole.ADMIN].includes(role)
  },
  canBlockUsers: (role: UserRole): boolean => {
    return [UserRole.CREATOR, UserRole.ADMIN].includes(role)
  },
  canManageRoles: (role: UserRole): boolean => {
    return role === UserRole.ADMIN
  },
}
