"use client";

// Stage 01
// Step 12
//
// Purpose: primary navigation surface — grouped, searchable, toggleable list
// of map layers. Category groups are collapsible; each row reuses LayerToggleRow.

import { useMemo, useState } from "react";
import { LayerMeta } from "@/lib/types";
import { LayerToggleRow } from "./LayerToggleRow";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { AccountButton } from "@/components/auth/AccountButton";

interface SidebarProps {
  layers: LayerMeta[];
  visibleIds: Set<string>;
  loadingIds: Set<string>;
  onToggleLayer: (id: string) => void;
  onToggleCategory: (categoryLayerIds: string[]) => void;
  onSignIn: () => void;
  onOpenSaved: () => void;
  onOpenReports: () => void;
  // Stage 10: below `md`, the sidebar is a slide-in drawer instead of a
  // permanently-docked column — there isn't room for both it and the map.
  open: boolean;
  onClose: () => void;
}

const CATEGORY_ORDER = [
  "Health",
  "Education",
  "Transport",
  "Civic & Safety",
  "Tourism & Heritage",
];

export function Sidebar({
  layers,
  visibleIds,
  loadingIds,
  onToggleLayer,
  onToggleCategory,
  onSignIn,
  onOpenSaved,
  onOpenReports,
  open,
  onClose,
}: SidebarProps) {
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? layers.filter((l) => l.label.toLowerCase().includes(q))
      : layers;

    const map = new Map<string, LayerMeta[]>();
    for (const layer of filtered) {
      const list = map.get(layer.category) ?? [];
      list.push(layer);
      map.set(layer.category, list);
    }
    return CATEGORY_ORDER.filter((c) => map.has(c)).map((c) => ({
      category: c,
      items: map.get(c)!,
    }));
  }, [layers, query]);

  const activeCount = visibleIds.size;

  const toggleCategory = (category: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };

  return (
    <aside
      role="navigation"
      aria-label="Map layers"
      className={`fixed inset-y-0 left-0 z-[1200] flex h-full w-80 max-w-[85vw] transform flex-col border-r border-zinc-200 bg-white shadow-2xl transition-transform duration-300 ease-out dark:border-zinc-800 dark:bg-zinc-950 md:static md:z-auto md:max-w-none md:translate-x-0 md:flex-shrink-0 md:bg-white/95 md:shadow-none md:backdrop-blur dark:md:bg-zinc-950/95 ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-4 dark:border-zinc-800">
        <div>
          <h1 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Lagos Explorer
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {activeCount} layer{activeCount === 1 ? "" : "s"} active
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <AccountButton
            onSignIn={onSignIn}
            onOpenSaved={onOpenSaved}
            onOpenReports={onOpenReports}
          />
          <ThemeToggle />
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 md:hidden"
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
      </div>

      <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <div className="relative">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500 dark:text-zinc-400"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter layers…"
            className="w-full rounded-md border border-zinc-200 bg-zinc-50 py-1.5 pl-8 pr-3 text-sm text-zinc-800 outline-none ring-zinc-900/10 placeholder:text-zinc-400 focus:ring-2 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-50/10"
          />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {grouped.map(({ category, items }) => {
          const isCollapsed = collapsed.has(category);
          const categoryIds = items.map((l) => l.id);
          const allVisible = categoryIds.every((id) => visibleIds.has(id));
          return (
            <div key={category} className="mb-2">
              <div className="flex w-full items-center justify-between rounded-md px-2 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-900">
                <button
                  onClick={() => onToggleCategory(categoryIds)}
                  title={allVisible ? "Hide all in category" : "Show all in category"}
                  className="flex-1 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                >
                  {category}
                </button>
                <button
                  onClick={() => toggleCategory(category)}
                  aria-label={isCollapsed ? "Expand category" : "Collapse category"}
                  className="p-1 text-zinc-500 dark:text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`h-3 w-3 transition-transform ${
                      isCollapsed ? "-rotate-90" : ""
                    }`}
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
              </div>
              {!isCollapsed && (
                <div className="mt-0.5">
                  {items.map((layer) => (
                    <LayerToggleRow
                      key={layer.id}
                      layer={layer}
                      checked={visibleIds.has(layer.id)}
                      loading={loadingIds.has(layer.id)}
                      onToggle={onToggleLayer}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {grouped.length === 0 && (
          <p className="px-2 py-4 text-sm text-zinc-500 dark:text-zinc-400">No layers match.</p>
        )}
      </nav>
    </aside>
  );
}
