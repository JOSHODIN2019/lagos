"use client";

// Stage 06
// Step 05
//
// Purpose: right-side panel for citizen reporting. Two states: filling out
// the form for a picked map location, then showing the simulated
// proof-of-submission receipt once it's been created.

import { useState } from "react";
import { Report } from "@/lib/types";

interface ReportFormProps {
  categories: string[];
  location: { lat: number; lon: number };
  onSubmit: (category: string, description: string) => Promise<Report>;
  onCancel: () => void;
  onDone: () => void;
}

export function ReportForm({
  categories,
  location,
  onSubmit,
  onCancel,
  onDone,
}: ReportFormProps) {
  const [category, setCategory] = useState(categories[0] ?? "Other");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<Report | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const report = await onSubmit(category, description.trim());
      setSubmitted(report);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit report.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <aside aria-label="Report an issue" className="absolute right-0 top-0 z-[1050] h-full w-full max-w-sm translate-x-0 transform border-l border-zinc-200 bg-white shadow-2xl transition-transform duration-300 ease-out dark:border-zinc-800 dark:bg-zinc-950">
      {submitted ? (
        <div className="flex h-full flex-col overflow-y-auto">
          <div className="border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Report submitted
            </h2>
          </div>
          <div className="flex-1 space-y-5 px-5 py-5">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/40">
              <p className="text-sm text-emerald-800 dark:text-emerald-200">
                {submitted.proofMessage}
              </p>
            </div>
            <section>
              <h3 className="mb-1.5 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Category
              </h3>
              <p className="text-sm text-zinc-700 dark:text-zinc-300">
                {submitted.category}
              </p>
            </section>
            <section>
              <h3 className="mb-1.5 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Proof hash
              </h3>
              <p className="break-all font-mono text-xs text-zinc-500 dark:text-zinc-400">
                {submitted.proofHash}
              </p>
            </section>
            <button
              onClick={onDone}
              className="w-full rounded-lg bg-zinc-900 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Done
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex h-full flex-col overflow-y-auto">
          <div className="border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Report an issue
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              {location.lat.toFixed(5)}, {location.lon.toFixed(5)}
            </p>
          </div>

          <div className="flex-1 space-y-5 px-5 py-5">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 outline-none ring-zinc-900/10 focus:ring-2 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-50/10"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                placeholder="Describe the issue…"
                className="w-full resize-none rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 outline-none ring-zinc-900/10 placeholder:text-zinc-400 focus:ring-2 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-50/10"
              />
            </div>

            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 rounded-lg border border-zinc-200 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !description.trim()}
                className="flex-1 rounded-lg bg-zinc-900 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                {submitting ? "Submitting…" : "Submit report"}
              </button>
            </div>
          </div>
        </form>
      )}
    </aside>
  );
}
