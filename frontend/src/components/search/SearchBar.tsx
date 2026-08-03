"use client";

// Stage 02
// Step 04
//
// Purpose: global place search — a map overlay, debounced against the
// backend, with a results dropdown. Selecting a result is handed up to
// MapScreen via onSelect, which owns what "flying to it" means.

import { useEffect, useRef, useState } from "react";
import { searchPlaces } from "@/lib/api";
import { PlaceDetail } from "@/lib/types";

interface SearchBarProps {
  onSelect: (result: PlaceDetail) => void;
}

export function SearchBar({ onSelect }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceDetail[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const skipNextSearch = useRef(false);

  useEffect(() => {
    if (skipNextSearch.current) {
      skipNextSearch.current = false;
      return;
    }
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    const handle = setTimeout(() => {
      searchPlaces(trimmed)
        .then((r) => {
          setResults(r);
          setOpen(true);
          setActiveIndex(-1);
        })
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(result: PlaceDetail) {
    onSelect(result);
    skipNextSearch.current = true;
    setQuery(result.name);
    setResults([]);
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(results[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div
      ref={containerRef}
      className="pointer-events-auto absolute left-16 right-4 top-4 z-[1000] md:left-1/2 md:right-auto md:w-full md:max-w-md md:-translate-x-1/2 md:px-4"
    >
      <div className="relative">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 dark:text-zinc-400"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search hospitals, schools, banks…"
          className="w-full rounded-xl border border-zinc-200 bg-white/95 py-2.5 pl-10 pr-4 text-sm text-zinc-800 shadow-lg outline-none ring-zinc-900/10 backdrop-blur placeholder:text-zinc-400 focus:ring-2 dark:border-zinc-800 dark:bg-zinc-900/95 dark:text-zinc-100 dark:ring-zinc-50/10"
        />
      </div>

      {open && (
        <div className="mt-2 max-h-80 overflow-y-auto rounded-xl border border-zinc-200 bg-white/95 shadow-lg backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95">
          {loading && (
            <p className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">Searching…</p>
          )}
          {!loading && results.length === 0 && (
            <p className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">No places found.</p>
          )}
          {!loading &&
            results.map((result, i) => (
              <button
                key={`${result.layerId}-${result.name}-${i}`}
                onClick={() => handleSelect(result)}
                onMouseEnter={() => setActiveIndex(i)}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                  i === activeIndex
                    ? "bg-zinc-100 dark:bg-zinc-800"
                    : "hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                }`}
              >
                <span
                  className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: result.color }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-zinc-800 dark:text-zinc-200">
                    {result.name}
                  </span>
                  <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
                    {result.layerLabel}
                  </span>
                </span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
