"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  getSessions,
  deleteSession as storageDeleteSession,
  clearSessions,
  dispatchStorageEvent,
} from "@/lib/storage";
import type { Session } from "@/lib/types";

function formatTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export default function SessionHistory() {
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    loadSessions();
    window.addEventListener("storage", loadSessions);
    return () => window.removeEventListener("storage", loadSessions);
  }, []);

  function loadSessions() {
    setSessions(getSessions());
  }

  function deleteSession(id: string) {
    storageDeleteSession(id);
    setSessions(getSessions());
    dispatchStorageEvent();
  }

  function clearAll() {
    clearSessions();
    setSessions([]);
    dispatchStorageEvent();
  }

  const totalSeconds = sessions.reduce((sum, s) => sum + s.duration, 0);

  const tagSummary = sessions.reduce<Record<string, number>>((acc, s) => {
    s.tags.forEach((tag) => {
      acc[tag] = (acc[tag] || 0) + s.duration;
    });
    return acc;
  }, {});

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Session History</CardTitle>
        {sessions.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="text-[hsl(var(--muted))] hover:text-[hsl(var(--error))]"
          >
            Clear all
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {sessions.length === 0 ? (
          <p className="text-[14px] text-[hsl(var(--muted))] text-center py-8">
            No sessions yet. Start your first timer!
          </p>
        ) : (
          <>
            <div className="text-[14px] text-[hsl(var(--muted))]">
              Total:{" "}
              <span className="font-medium text-[hsl(var(--body-strong))]">
                {formatTime(totalSeconds)}
              </span>
              {" · "}
              {sessions.length} session{sessions.length !== 1 ? "s" : ""}
            </div>

            {Object.keys(tagSummary).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {Object.entries(tagSummary).map(([tag, secs]) => (
                  <Badge key={tag} variant="outline" className="text-[12px]">
                    {tag} · {(secs / 3600).toFixed(1)}h
                  </Badge>
                ))}
              </div>
            )}

            <Separator className="my-2" />

            <ScrollArea className="h-[calc(100vh-280px)] md:h-56">
              <div className="space-y-2 pr-4">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-start justify-between gap-2 py-2"
                  >
                    <div className="space-y-1 min-w-0">
                      <p className="text-[14px] font-medium truncate text-[hsl(var(--body-strong))]">
                        {session.taskName}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {session.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-[12px]"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-[12px] text-[hsl(var(--muted))]">
                        {new Date(session.startedAt).toLocaleString()} ·{" "}
                        {session.durationFormatted}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0 text-[hsl(var(--muted))] hover:text-[hsl(var(--error))]"
                      onClick={() => deleteSession(session.id)}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </>
        )}
      </CardContent>
    </Card>
  );
}