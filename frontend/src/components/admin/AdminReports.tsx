"use client";

// Stage 09
// Step 06
//
// Purpose: report moderation table — change status per report inline.

import { useState } from "react";
import { AdminReport } from "@/lib/types";

const STATUSES = ["submitted", "in_review", "resolved", "rejected"];

const STATUS_STYLES: Record<string, string> = {
  submitted: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  in_review: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  resolved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

interface AdminReportsProps {
  reports: AdminReport[];
  onUpdateStatus: (reportId: string, status: string) => Promise<void>;
}

export function AdminReports({ reports, onUpdateStatus }: AdminReportsProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  if (reports.length === 0) {
    return <p className="text-sm text-zinc-500 dark:text-zinc-400">No reports submitted yet.</p>;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-2.5 font-medium">Category</th>
              <th className="px-4 py-2.5 font-medium">Description</th>
              <th className="px-4 py-2.5 font-medium">Reporter</th>
              <th className="px-4 py-2.5 font-medium">Date</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
            {reports.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-2.5 text-zinc-800 dark:text-zinc-200">
                  {r.category}
                </td>
                <td className="max-w-xs truncate px-4 py-2.5 text-zinc-600 dark:text-zinc-300">
                  {r.description}
                </td>
                <td className="px-4 py-2.5 text-zinc-600 dark:text-zinc-300">
                  <div>{r.reporterName}</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">{r.reporterEmail}</div>
                </td>
                <td className="whitespace-nowrap px-4 py-2.5 text-zinc-500 dark:text-zinc-400">
                  {new Date(r.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-2.5">
                  <label className="sr-only" htmlFor={`status-${r.id}`}>
                    Status for report: {r.category}
                  </label>
                  <select
                    id={`status-${r.id}`}
                    value={r.status}
                    disabled={updatingId === r.id}
                    onChange={async (e) => {
                      setUpdatingId(r.id);
                      try {
                        await onUpdateStatus(r.id, e.target.value);
                      } finally {
                        setUpdatingId(null);
                      }
                    }}
                    className={`rounded-full border-0 px-2.5 py-1 text-xs font-medium capitalize outline-none disabled:opacity-50 ${
                      STATUS_STYLES[r.status] ?? STATUS_STYLES.submitted
                    }`}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
