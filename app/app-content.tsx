"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { checkOnboardingAction, completeOnboardingAction } from "@/app/actions";
import ThemeToggle from "@/components/ThemeToggle";
import Onboarding from "@/components/Onboarding";
import { LayoutDashboard, CalendarDays, Zap, History } from "lucide-react";

// New tab components
import Dashboard from "@/components/Dashboard";
import PlanView from "@/components/PlanView";
import FocusView from "@/components/FocusView";
import CalendarHeatmap from "@/components/CalendarHeatmap";
import WeeklyReport from "@/components/WeeklyReport";
import SessionHistory from "@/components/SessionHistory";
import HabitTracker from "@/components/HabitTracker";
import type { SafeUser } from "@/lib/db-users";

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "plan", label: "Plan", icon: CalendarDays },
  { id: "focus", label: "Focus", icon: Zap },
  { id: "history", label: "History", icon: History },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function AppContent({ user }: { user: SafeUser }) {
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [preselectedFocusTask, setPreselectedFocusTask] = useState<{ id: string | null; name: string | null } | null>(null);

  useEffect(() => {
    async function checkOnboarding() {
      const done = await checkOnboardingAction();
      if (!done) {
        setShowOnboarding(true);
      }
    }
    checkOnboarding();
  }, []);

  async function completeOnboarding() {
    try {
      await completeOnboardingAction();
    } catch (e) {
      console.error("Failed to complete onboarding:", e);
    }
    setShowOnboarding(false);
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  const handleStartFocusFromDashboard = useCallback(
    (taskId?: string, taskName?: string) => {
      setPreselectedFocusTask({ id: taskId ?? null, name: taskName ?? null });
      setActiveTab("focus");
    },
    [],
  );

  const renderContent = () => {
    if (showOnboarding) {
      return <Onboarding onComplete={completeOnboarding} />;
    }

    switch (activeTab) {
      case "dashboard":
        return <Dashboard onStartFocus={handleStartFocusFromDashboard} />;
      case "plan":
        return <PlanView />;
      case "focus":
        return (
          <FocusView
            preselectedTaskId={preselectedFocusTask?.id ?? null}
            preselectedTaskName={preselectedFocusTask?.name ?? null}
          />
        );
      case "history":
        return (
          <div className="space-y-4">
            <CalendarHeatmap />
            <WeeklyReport />
            <SessionHistory />
            <HabitTracker />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--canvas))] text-[hsl(var(--body))]">
      {/* Desktop navigation and content */}
      <div className="hidden md:block">
        <header className="border-b border-[hsl(var(--hairline))] bg-[hsl(var(--surface-card))] p-4">
          <nav className="max-w-[1200px] mx-auto flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-[hsl(var(--body-strong))]">
                <CompassIcon />
                <span className="text-[15px] font-semibold">Compass</span>
              </div>
              <div className="flex gap-2">
                {TABS.map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors ${
                      activeTab === id
                        ? "bg-[hsl(var(--primary))] text-white"
                        : "text-[hsl(var(--muted))] hover:text-[hsl(var(--body-strong))] hover:bg-[hsl(var(--surface-strong))]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-[hsl(var(--muted))]">{user.username}</span>
              <button
                onClick={handleLogout}
                className="text-xs text-[hsl(var(--muted))] hover:text-[hsl(var(--error))] transition-colors"
              >
                Logout
              </button>
              <ThemeToggle />
            </div>
          </nav>
        </header>
        <main className="max-w-[1200px] mx-auto px-8 py-8">
          <Suspense fallback={<div>Loading...</div>}>
            {renderContent()}
          </Suspense>
        </main>
      </div>

      {/* Mobile navigation and content */}
      <div className="md:hidden flex flex-col min-h-screen">
        <div className="flex-1 overflow-y-auto px-4 py-5 pb-24 space-y-4">
          <Suspense fallback={<div>Loading...</div>}>
            {renderContent()}
          </Suspense>
        </div>

        <div className="fixed bottom-0 left-0 right-0 z-20 bg-[hsl(var(--background))] border-t border-[hsl(var(--hairline))]">
          <nav className="flex items-center justify-around px-2 py-1 safe-area-bottom">
            {TABS.map(({ id, label, icon: Icon }) => {
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-[8px] transition-all active:scale-95 ${
                    active
                      ? "text-[hsl(var(--primary))]"
                      : "text-[hsl(var(--muted))] hover:text-[hsl(var(--body-strong))]"
                  }`}
                >
                  <div
                    className={`p-1.5 rounded-[8px] transition-colors ${active ? "bg-[hsl(var(--primary))]/10" : ""}`}
                  >
                    <Icon size={20} strokeWidth={active ? 2 : 1.5} />
                  </div>
                  <span
                    className={`text-[10px] font-medium ${active ? "text-[hsl(var(--primary))]" : "text-[hsl(var(--muted))]"}`}>
                    {label}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}

function CompassIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-[hsl(var(--muted))]"
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );
}
