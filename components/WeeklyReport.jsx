"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

function safeParseSessions(raw) {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export default function WeeklyReport() {
  const [sessions, setSessions] = useState([])

  useEffect(() => {
    loadSessions()
    window.addEventListener("storage", loadSessions)
    return () => window.removeEventListener("storage", loadSessions)
  }, [])

  function loadSessions() {
    const all = safeParseSessions(localStorage.getItem("compass_sessions"))
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay())
    weekStart.setHours(0, 0, 0, 0)
    setSessions(all.filter((s) => new Date(s.startedAt) >= weekStart))
  }

  function handleExport() {
    const totalSeconds = sessions.reduce((sum, s) => sum + s.duration, 0)
    const totalHours = (totalSeconds / 3600).toFixed(1)

    const tagSummary = sessions.reduce((acc, s) => {
      (s.tags || []).forEach((tag) => { acc[tag] = (acc[tag] || 0) + s.duration })
      return acc
    }, {})

    const lines = [
      "=== COMPASS WEEKLY REPORT ===",
      `Generated: ${new Date().toLocaleDateString()}`,
      "",
      "TIME DISTRIBUTION",
      `Total tracked: ${totalHours} hours`,
      "",
      "BY TAG",
      ...Object.entries(tagSummary).map(
        ([tag, secs]) => `  ${tag}: ${(secs / 3600).toFixed(1)}h (${Math.round((secs / totalSeconds) * 100)}%)`
      ),
      "",
      "SESSIONS",
      ...sessions.map(
        (s) => `  ${new Date(s.startedAt).toLocaleString()} - ${s.taskName} (${(s.duration / 60).toFixed(1)} min) ${(s.tags || []).join(" ")}`
      ),
      "",
      `---`,
      `Total sessions: ${sessions.length}`,
      `Average session: ${sessions.length ? Math.round(totalSeconds / sessions.length / 60) : 0} min`,
    ]

    const blob = new Blob([lines.join("\n")], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `compass-report-${new Date().toISOString().split("T")[0]}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const totalSeconds = sessions.reduce((sum, s) => sum + s.duration, 0)

  const tagSummary = sessions.reduce((acc, s) => {
    s.tags.forEach((tag) => { acc[tag] = (acc[tag] || 0) + s.duration })
    return acc
  }, {})

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Weekly Report</CardTitle>
        <Button variant="outline" size="sm" onClick={handleExport} disabled={sessions.length === 0}>
          Export
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {sessions.length === 0 ? (
          <p className="text-[14px] text-[hsl(var(--muted))] text-center py-4">
            No sessions this week yet.
          </p>
        ) : (
          <>
            <div className="text-[14px] text-[hsl(var(--muted))]">
              This week: <span className="font-medium text-[hsl(var(--body-strong))]">{(totalSeconds / 3600).toFixed(1)}h</span>
              {" · "}
              {sessions.length} session{sessions.length !== 1 ? "s" : ""}
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(tagSummary).map(([tag, secs]) => (
                <Badge key={tag} variant="outline">
                  {tag} · {(secs / 3600).toFixed(1)}h
                </Badge>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
