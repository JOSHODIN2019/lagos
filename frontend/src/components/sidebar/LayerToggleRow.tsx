"use client";

// Stage 01
// Step 11
//
// Purpose: a single toggleable layer row — colored dot, label, feature count,
// and a switch. Kept separate from Sidebar so it stays a small, reusable unit.

import { LayerMeta } from "@/lib/types";

interface LayerToggleRowProps {
  layer: LayerMeta;
  checked: boolean;
  loading: boolean;
  onToggle: (id: string) => void;
}

export function LayerToggleRow({
  layer,
  checked,
  loading,
  onToggle,
}: LayerToggleRowProps) {
  return (
    <label className="group flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800/60">
      <span
        className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
        style={{ backgroundColor: layer.color }}
      />
      <span className="flex-1 truncate text-sm text-zinc-700 dark:text-zinc-300">
        {layer.label}
      </span>
      <span className="text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
        {loading && checked ? "…" : layer.count.toLocaleString()}
      </span>
      <span className="relative inline-flex h-5 w-9 flex-shrink-0 items-center">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          onChange={() => onToggle(layer.id)}
        />
        <span className="absolute inset-0 rounded-full bg-zinc-200 transition-colors peer-checked:bg-zinc-900 dark:bg-zinc-700 dark:peer-checked:bg-zinc-50" />
        <span className="absolute left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-4 dark:bg-zinc-900" />
      </span>
    </label>
  );
}
