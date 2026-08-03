"use client";

// Stage 09
// Step 05
//
// Purpose: usage stats tab — simple stat cards plus category breakdowns.

import { AdminStats } from "@/lib/types";

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        {value.toLocaleString()}
      </p>
    </div>
  );
}

export function AdminOverview({ stats }: { stats: AdminStats }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Users" value={stats.totalUsers} />
        <StatCard label="POIs" value={stats.totalPois} />
        <StatCard label="Reports" value={stats.totalReports} />
        <StatCard label="Saved places" value={stats.totalSavedPlaces} />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Reports by status
          </h3>
          {Object.keys(stats.reportsByStatus).length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No reports yet.</p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {Object.entries(stats.reportsByStatus).map(([status, count]) => (
                <li key={status} className="flex justify-between">
                  <span className="capitalize text-zinc-600 dark:text-zinc-300">
                    {status.replace("_", " ")}
                  </span>
                  <span className="tabular-nums text-zinc-900 dark:text-zinc-50">
                    {count}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Reports by category
          </h3>
          {Object.keys(stats.reportsByCategory).length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No reports yet.</p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {Object.entries(stats.reportsByCategory).map(([category, count]) => (
                <li key={category} className="flex justify-between">
                  <span className="text-zinc-600 dark:text-zinc-300">{category}</span>
                  <span className="tabular-nums text-zinc-900 dark:text-zinc-50">
                    {count}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          POIs by category
        </h3>
        <ul className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-3">
          {stats.poisByCategory.map((c) => (
            <li key={c.layerId} className="flex justify-between">
              <span className="text-zinc-600 dark:text-zinc-300">{c.layerLabel}</span>
              <span className="tabular-nums text-zinc-900 dark:text-zinc-50">
                {c.count}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
