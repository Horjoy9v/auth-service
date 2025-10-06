"use client"

import { useEffect, useMemo, useState } from "react"

type HealthResponse = {
  success: boolean
  data?: { status: string; timestamp: string; service: string }
  error?: string
}

type LogsResponse = {
  success: boolean
  data?: { logs: Array<{ level: string; message: string; timestamp: string; service: string; metadata?: Record<string, any> }> }
}

export default function HealthPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [logs, setLogs] = useState<LogsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const formatDate = (value?: string | number | Date) => {
    if (!value) return "-"
    const d = typeof value === "string" || typeof value === "number" ? new Date(value) : value
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(d)
  }

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [healthRes, logsRes] = await Promise.all([
          fetch("/api/health", { cache: "no-store" }),
          fetch("/api/logs?limit=100", { cache: "no-store" }),
        ])

        const healthJson: HealthResponse = await healthRes.json()
        const logsJson: LogsResponse = await logsRes.json()
        if (!cancelled) {
          setHealth(healthJson)
          setLogs(logsJson)
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.message || "Failed to load")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const statusColor = useMemo(() => {
    const ok = health?.success && health?.data?.status === "healthy"
    return ok ? "#10b981" : "#ef4444"
  }, [health])

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#0b1220",
      color: "#e5e7eb",
      padding: 24,
      boxSizing: "border-box",
    }}>
      <div style={{
        width: "100%",
        maxWidth: 980,
        background: "#0f172a",
        border: "1px solid #1f2937",
        borderRadius: 12,
        boxShadow: "0 10px 25px rgba(0,0,0,0.35)",
        overflow: "hidden",
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "16px 20px",
          borderBottom: "1px solid #1f2937",
          background: "linear-gradient(180deg,#111827, #0f172a)",
        }}>
          <div style={{ width: 10, height: 10, borderRadius: 9999, background: statusColor, boxShadow: `0 0 12px ${statusColor}` }} />
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Service Health</h1>
          <div style={{ marginLeft: "auto", opacity: 0.8, fontSize: 12 }}>
            {formatDate(Date.now())}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
          <div style={{ padding: 20, borderRight: "1px solid #1f2937" }}>
            <h2 style={{ marginTop: 0, fontSize: 14, color: "#93c5fd", letterSpacing: 0.3 }}>Status</h2>
            {loading ? (
              <div style={{ opacity: 0.8 }}>Loading...</div>
            ) : error ? (
              <div style={{ color: "#ef4444" }}>{error}</div>
            ) : (
              <div style={{ display: "grid", gap: 8, fontSize: 14 }}>
                <div>
                  <span style={{ opacity: 0.7 }}>Service:</span>
                  <span style={{ marginLeft: 8, fontWeight: 600 }}>{health?.data?.service ?? "-"}</span>
                </div>
                <div>
                  <span style={{ opacity: 0.7 }}>Status:</span>
                  <span style={{ marginLeft: 8, fontWeight: 600, color: statusColor }}>
                    {health?.success ? health?.data?.status : "unhealthy"}
                  </span>
                </div>
                <div>
                  <span style={{ opacity: 0.7 }}>Timestamp:</span>
                  <span style={{ marginLeft: 8 }}>{formatDate(health?.data?.timestamp)}</span>
                </div>
              </div>
            )}
          </div>

          <div style={{ padding: 20 }}>
            <h2 style={{ marginTop: 0, fontSize: 14, color: "#93c5fd", letterSpacing: 0.3 }}>Recent Logs</h2>
            <div style={{
              height: 360,
              overflow: "auto",
              background: "#0b1020",
              border: "1px solid #1f2937",
              borderRadius: 8,
              padding: 12,
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
              fontSize: 12,
              lineHeight: 1.5,
            }}>
              {!logs?.success ? (
                <div style={{ opacity: 0.8 }}>No logs available</div>
              ) : (
                logs?.data?.logs?.map((log, idx) => {
                  const color = log.level === "error" ? "#ef4444" : log.level === "warn" ? "#f59e0b" : log.level === "debug" ? "#22d3ee" : "#9ca3af"
                  return (
                    <div key={idx} style={{ marginBottom: 8, whiteSpace: "pre-wrap" }}>
                      <span style={{ color: "#6b7280" }}>[{formatDate(log.timestamp)}]</span>{" "}
                      <span style={{ color }}>[{log.level.toUpperCase()}]</span>{" "}
                      <span style={{ color: "#e5e7eb" }}>{log.message}</span>
                      {log.metadata ? (
                        <span style={{ color: "#93c5fd" }}> {JSON.stringify(log.metadata)}</span>
                      ) : null}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        <div style={{ padding: 16, borderTop: "1px solid #1f2937", display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            onClick={() => location.reload()}
            style={{
              padding: "8px 12px",
              background: "#1f2937",
              color: "#e5e7eb",
              border: "1px solid #374151",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  )
}


