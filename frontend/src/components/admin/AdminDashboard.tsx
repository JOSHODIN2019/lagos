"use client";

// Stage 09
// Step 08
//
// Purpose: admin dashboard root — gates on isAdmin, then tabs between
// Overview/Reports/POIs. A distinct route (not a map overlay), since this
// is a separate utility screen for staff, not part of the citizen-facing map.

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { AdminOverview } from "./AdminOverview";
import { AdminReports } from "./AdminReports";
import { AdminPois } from "./AdminPois";
import {
  fetchAdminReports,
  fetchAdminStats,
  fetchLayers,
  updateReportStatus,
} from "@/lib/api";
import { AdminReport, AdminStats, LayerMeta } from "@/lib/types";

type Tab = "overview" | "reports" | "pois";

export function AdminDashboard() {
  const { user, token, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [layers, setLayers] = useState<LayerMeta[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !user?.isAdmin) return;
    fetchAdminStats(token).then(setStats).catch(() => setError("Failed to load stats."));
    fetchAdminReports(token).then(setReports).catch(() => setError("Failed to load reports."));
    fetchLayers().then(setLayers).catch(() => {});
  }, [token, user]);

  async function handleUpdateStatus(reportId: string, status: string) {
    if (!token) return;
    const updated = await updateReportStatus(token, reportId, status);
    setReports((prev) => prev.map((r) => (r.id === reportId ? updated : r)));
    // Keep the overview's counts in sync without a full refetch.
    fetchAdminStats(token).then(setStats).catch(() => {});
  }

  if (authLoading) {
    return <CenteredMessage>Loading…</CenteredMessage>;
  }

  if (!user) {
    return (
      <CenteredMessage>
        You need to sign in first.{" "}
        <Link href="/" className="text-blue-600 hover:underline dark:text-blue-400">
          Go to the map
        </Link>
        .
      </CenteredMessage>
    );
  }

  if (!user.isAdmin) {
    return (
      <CenteredMessage>
        This account doesn&rsquo;t have admin access.{" "}
        <Link href="/" className="text-blue-600 hover:underline dark:text-blue-400">
          Back to the map
        </Link>
        .
      </CenteredMessage>
    );
  }

  return (
    <div className="min-h-dvh bg-zinc-50 dark:bg-zinc-950">
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-4 sm:px-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div>
          <h1 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Admin Dashboard
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Lagos Explorer</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/"
            className="rounded-md px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Back to map
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <nav
        aria-label="Admin sections"
        className="flex gap-1 overflow-x-auto border-b border-zinc-200 bg-white px-4 sm:px-6 dark:border-zinc-800 dark:bg-zinc-900"
      >
        {(
          [
            ["overview", "Overview"],
            ["reports", "Reports"],
            ["pois", "POIs"],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            aria-current={tab === key ? "page" : undefined}
            className={`flex-shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
              tab === key
                ? "border-zinc-900 text-zinc-900 dark:border-zinc-50 dark:text-zinc-50"
                : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      <main className="p-4 sm:p-6">
        {error && (
          <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}
        {tab === "overview" && (stats ? <AdminOverview stats={stats} /> : <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>)}
        {tab === "reports" && (
          <AdminReports reports={reports} onUpdateStatus={handleUpdateStatus} />
        )}
        {tab === "pois" && token && <AdminPois token={token} layers={layers} />}
      </main>
    </div>
  );
}

function CenteredMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{children}</p>
    </div>
  );
}
