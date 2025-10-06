import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })
/**
 * Setup database indexes and initial configuration
 * Run this script after deploying to ensure optimal database performance
 */
async function setupDatabase() {
  try {
    const { Logger } = await import("../lib/utils/logger.js")
    const { UserRepository } = await import("../lib/db/user.repository.js")

    Logger.info("Setting up database indexes...")

    await UserRepository.createIndexes()

    Logger.info("Database setup completed successfully")
    process.exit(0)
  } catch (error) {
    // Якщо Logger не доступний (помилка стадії імпорту), дублюємо у console.error
    try {
      const { Logger } = await import("../lib/utils/logger.js")
      Logger.error("Database setup failed", error)
    } catch (_) {
      console.error("Database setup failed", error)
    }
    process.exit(1)
  }
}

setupDatabase()
