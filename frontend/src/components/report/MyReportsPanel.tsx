"use client";

// Stage 06
// Step 07
//
// Purpose: slide-over listing the signed-in user's submitted reports —
// category, status, description, and submission date. Shares the same
// right-side slot as DetailPanel/SavedPlacesPanel/ReportForm.

import { useState } from "react";
import { Report } from "@/lib/types";

interface MyReportsPanelProps {
  reports: Report[];
  onClose: () => void;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function MyReportsPanel({ reports, onClose }: MyReportsPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <aside aria-label="My reports" className="absolute right-0 top-0 z-[1050] h-full w-full max-w-sm translate-x-0 transform border-l border-zinc-200 bg-white shadow-2xl transition-transform duration-300 ease-out dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            My reports
          </h2>
          <button
            onClick={onClose}
            aria-label="Close my reports"
            className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {reports.length === 0 ? (
            <p className="px-5 py-6 text-sm text-zinc-500 dark:text-zinc-400">
              No reports yet. Use "Report an issue" on the map to submit one.
            </p>
          ) : (
            reports.map((report) => {
              const isExpanded = expandedId === report.id;
              return (
                <div
                  key={report.id}
                  className="border-b border-zinc-100 dark:border-zinc-900"
                >
                  <button
                    onClick={() =>
                      setExpandedId(isExpanded ? null : report.id)
                    }
                    className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-900/60"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-zinc-800 dark:text-zinc-200">
                        {report.category}
                      </span>
                      <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
                        {formatDate(report.createdAt)} · {report.status}
                      </span>
                    </span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`h-3 w-3 flex-shrink-0 text-zinc-500 dark:text-zinc-400 transition-transform ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>
                  {isExpanded && (
                    <div className="space-y-2 px-5 pb-4 text-sm">
                      <p className="text-zinc-600 dark:text-zinc-300">
                        {report.description}
                      </p>
                      <p className="break-all font-mono text-xs text-zinc-500 dark:text-zinc-400">
                        {report.proofHash}
                      </p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </aside>
  );
}
