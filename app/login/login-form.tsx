"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Network error. Is the server running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--canvas))]">
      <div className="w-full max-w-sm mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-[hsl(var(--body-strong))]">Compass</h1>
          <p className="text-sm text-[hsl(var(--muted))] mt-1">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[hsl(var(--muted))]">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full h-9 px-3 text-sm border rounded-lg bg-[hsl(var(--surface-card))] border-[hsl(var(--hairline))] text-[hsl(var(--body))] focus:outline-none focus:border-[hsl(var(--primary))]"
              required
              autoComplete="username"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[hsl(var(--muted))]">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-9 px-3 text-sm border rounded-lg bg-[hsl(var(--surface-card))] border-[hsl(var(--hairline))] text-[hsl(var(--body))] focus:outline-none focus:border-[hsl(var(--primary))]"
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="text-xs text-[hsl(var(--error))]">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-9 text-sm font-medium rounded-lg bg-[hsl(var(--primary))] text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="text-center text-xs text-[hsl(var(--muted))] mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-[hsl(var(--primary))] hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}