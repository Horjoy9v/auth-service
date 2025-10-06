type LogLevel = "info" | "warn" | "error" | "debug"

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  service: string
  metadata?: Record<string, any>
}

export class Logger {
  private static service = "auth-service"
  // Simple in-memory ring buffer for recent logs (shared across module instances)
  private static maxRecentLogs = 200

  private static get buffer(): LogEntry[] {
    if (!(globalThis as any).__recentLogs) {
      ;(globalThis as any).__recentLogs = [] as LogEntry[]
    }
    return (globalThis as any).__recentLogs as LogEntry[]
  }

  private static formatLog(level: LogLevel, message: string, metadata?: Record<string, any>): LogEntry {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      service: this.service,
      ...(metadata && { metadata }),
    }
    // Store in buffer (best-effort)
    try {
      const buf = this.buffer
      buf.push(entry)
      if (buf.length > this.maxRecentLogs) {
        buf.splice(0, buf.length - this.maxRecentLogs)
      }
    } catch {}
    return entry
  }

  static info(message: string, metadata?: Record<string, any>) {
    const log = this.formatLog("info", message, metadata)
    console.log(JSON.stringify(log))
  }

  static warn(message: string, metadata?: Record<string, any>) {
    const log = this.formatLog("warn", message, metadata)
    console.warn(JSON.stringify(log))
  }

  static error(message: string, error?: Error | unknown, metadata?: Record<string, any>) {
    const log = this.formatLog("error", message, {
      ...metadata,
      ...(error instanceof Error && {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      }),
    })
    console.error(JSON.stringify(log))
  }

  static debug(message: string, metadata?: Record<string, any>) {
    if (process.env.NODE_ENV === "development") {
      const log = this.formatLog("debug", message, metadata)
      console.debug(JSON.stringify(log))
    }
  }

  // Security-specific logging
  static securityEvent(event: string, metadata?: Record<string, any>) {
    this.warn(`[SECURITY] ${event}`, metadata)
  }

  // Authentication-specific logging
  static authEvent(event: string, userId?: string, metadata?: Record<string, any>) {
    this.info(`[AUTH] ${event}`, {
      ...metadata,
      ...(userId && { userId }),
    })
  }

  // Expose recent logs for diagnostics (avoid secrets in metadata)
  static getRecentLogs(limit = 100): LogEntry[] {
    const buf = this.buffer
    const sliceStart = Math.max(0, buf.length - Math.min(limit, this.maxRecentLogs))
    return buf.slice(sliceStart)
  }
}
