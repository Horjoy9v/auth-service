import { getDatabase } from "@/lib/mongodb"
import { type User, AccountStatus } from "@/lib/models/user.model"
import { ObjectId } from "mongodb"

const COLLECTION_NAME = "users"

export class UserRepository {
  private static async getCollection() {
    const db = await getDatabase()
    return db.collection<User>(COLLECTION_NAME)
  }

  // Create indexes for performance optimization
  static async createIndexes() {
    const collection = await this.getCollection()
    await collection.createIndex({ email: 1 }, { unique: true })
    await collection.createIndex({ emailVerificationToken: 1 })
    await collection.createIndex({ passwordResetToken: 1 })
    await collection.createIndex({ status: 1 })
    await collection.createIndex({ role: 1 })
    await collection.createIndex({ createdAt: -1 })
  }

  static async create(userData: Omit<User, "_id" | "createdAt" | "updatedAt">): Promise<User> {
    const collection = await this.getCollection()
    const now = new Date()

    const user: User = {
      ...userData,
      createdAt: now,
      updatedAt: now,
    }

    const result = await collection.insertOne(user)
    return { ...user, _id: result.insertedId }
  }

  static async findByEmail(email: string): Promise<User | null> {
    const collection = await this.getCollection()
    return collection.findOne({ email: email.toLowerCase() })
  }

  static async findById(id: string | ObjectId): Promise<User | null> {
    const collection = await this.getCollection()
    const objectId = typeof id === "string" ? new ObjectId(id) : id
    return collection.findOne({ _id: objectId })
  }

  static async findByVerificationToken(token: string): Promise<User | null> {
    const collection = await this.getCollection()
    return collection.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() },
    })
  }

  static async findByResetToken(token: string): Promise<User | null> {
    const collection = await this.getCollection()
    return collection.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() },
    })
  }

  static async updateById(id: string | ObjectId, update: Partial<User>): Promise<boolean> {
    const collection = await this.getCollection()
    const objectId = typeof id === "string" ? new ObjectId(id) : id

    const result = await collection.updateOne(
      { _id: objectId },
      {
        $set: {
          ...update,
          updatedAt: new Date(),
        },
      },
    )

    return result.modifiedCount > 0
  }

  static async addRefreshToken(userId: string | ObjectId, tokenHash: string): Promise<boolean> {
    const collection = await this.getCollection()
    const objectId = typeof userId === "string" ? new ObjectId(userId) : userId

    const result = await collection.updateOne(
      { _id: objectId },
      {
        $push: { refreshTokens: tokenHash },
        $set: { updatedAt: new Date() },
      },
    )

    return result.modifiedCount > 0
  }

  static async removeRefreshToken(userId: string | ObjectId, tokenHash: string): Promise<boolean> {
    const collection = await this.getCollection()
    const objectId = typeof userId === "string" ? new ObjectId(userId) : userId

    const result = await collection.updateOne(
      { _id: objectId },
      {
        $pull: { refreshTokens: tokenHash },
        $set: { updatedAt: new Date() },
      },
    )

    return result.modifiedCount > 0
  }

  static async clearRefreshTokens(userId: string | ObjectId): Promise<boolean> {
    const collection = await this.getCollection()
    const objectId = typeof userId === "string" ? new ObjectId(userId) : userId

    const result = await collection.updateOne(
      { _id: objectId },
      {
        $set: {
          refreshTokens: [],
          updatedAt: new Date(),
        },
      },
    )

    return result.modifiedCount > 0
  }

  static async blockUser(userId: string | ObjectId, blockedBy: string | ObjectId, reason?: string): Promise<boolean> {
    const collection = await this.getCollection()
    const userObjectId = typeof userId === "string" ? new ObjectId(userId) : userId
    const blockedByObjectId = typeof blockedBy === "string" ? new ObjectId(blockedBy) : blockedBy

    const result = await collection.updateOne(
      { _id: userObjectId },
      {
        $set: {
          status: AccountStatus.BLOCKED,
          blockedBy: blockedByObjectId,
          blockedAt: new Date(),
          blockedReason: reason,
          updatedAt: new Date(),
        },
      },
    )

    return result.modifiedCount > 0
  }

  static async unblockUser(userId: string | ObjectId): Promise<boolean> {
    const collection = await this.getCollection()
    const objectId = typeof userId === "string" ? new ObjectId(userId) : userId

    const result = await collection.updateOne(
      { _id: objectId },
      {
        $set: {
          status: AccountStatus.ACTIVE,
          updatedAt: new Date(),
        },
        $unset: {
          blockedBy: "",
          blockedAt: "",
          blockedReason: "",
        },
      },
    )

    return result.modifiedCount > 0
  }
}
