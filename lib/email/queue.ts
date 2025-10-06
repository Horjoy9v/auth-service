interface EmailJob {
  id: string
  type: "verification" | "password-reset" | "welcome"
  to: string
  data: any
  attempts: number
  maxAttempts: number
  createdAt: Date
  scheduledFor: Date
}

// Simple in-memory queue (for production, use Redis or a proper queue service)
class EmailQueue {
  private queue: EmailJob[] = []
  private processing = false
  private readonly MAX_ATTEMPTS = 3
  private readonly RETRY_DELAY = 60000 // 1 minute

  async add(type: EmailJob["type"], to: string, data: any, delay = 0): Promise<string> {
    const job: EmailJob = {
      id: crypto.randomUUID(),
      type,
      to,
      data,
      attempts: 0,
      maxAttempts: this.MAX_ATTEMPTS,
      createdAt: new Date(),
      scheduledFor: new Date(Date.now() + delay),
    }

    this.queue.push(job)
    this.processQueue()

    return job.id
  }

  private async processQueue() {
    if (this.processing) return
    this.processing = true

    while (this.queue.length > 0) {
      const now = new Date()
      const job = this.queue.find((j) => j.scheduledFor <= now)

      if (!job) {
        // No jobs ready to process
        break
      }

      // Remove job from queue
      this.queue = this.queue.filter((j) => j.id !== job.id)

      try {
        await this.processJob(job)
      } catch (error) {
        console.error(`[v0] Failed to process email job ${job.id}:`, error)

        // Retry logic
        if (job.attempts < job.maxAttempts) {
          job.attempts++
          job.scheduledFor = new Date(Date.now() + this.RETRY_DELAY * job.attempts)
          this.queue.push(job)
        } else {
          console.error(`[v0] Email job ${job.id} failed after ${job.maxAttempts} attempts`)
        }
      }
    }

    this.processing = false
  }

  private async processJob(job: EmailJob) {
    const { EmailService } = await import("./email.service")

    switch (job.type) {
      case "verification":
        await EmailService.sendVerificationEmail(job.to, job.data.token)
        break
      case "password-reset":
        await EmailService.sendPasswordResetEmail(job.to, job.data.token)
        break
      case "welcome":
        await EmailService.sendWelcomeEmail(job.to, job.data.name)
        break
      default:
        throw new Error(`Unknown email job type: ${job.type}`)
    }
  }

  getQueueSize(): number {
    return this.queue.length
  }
}

export const emailQueue = new EmailQueue()
