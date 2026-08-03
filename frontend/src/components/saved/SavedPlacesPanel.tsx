"use client";

// Stage 05
// Step 04
//
// Purpose: slide-over panel listing the signed-in user's saved places.
// Reuses the same right-side panel slot as DetailPanel (mutually exclusive
// with it — MapScreen only ever shows one at a time).

import { SavedPlace } from "@/lib/types";

interface SavedPlacesPanelProps {
  savedPlaces: SavedPlace[];
  onSelect: (place: SavedPlace) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
}

export function SavedPlacesPanel({
  savedPlaces,
  onSelect,
  onRemove,
  onClose,
}: SavedPlacesPanelProps) {
  return (
    <aside aria-label="Saved places" className="absolute right-0 top-0 z-[1050] h-full w-full max-w-sm translate-x-0 transform border-l border-zinc-200 bg-white shadow-2xl transition-transform duration-300 ease-out dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Saved places
          </h2>
          <button
            onClick={onClose}
            aria-label="Close saved places"
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
          {savedPlaces.length === 0 ? (
            <p className="px-5 py-6 text-sm text-zinc-500 dark:text-zinc-400">
              Nothing saved yet. Open a place's details and tap the bookmark
              icon to save it here.
            </p>
          ) : (
            savedPlaces.map((place) => (
              <div
                key={place.id}
                className="flex items-center gap-3 border-b border-zinc-100 px-5 py-3 hover:bg-zinc-50 dark:border-zinc-900 dark:hover:bg-zinc-900/60"
              >
                <button
                  onClick={() => onSelect(place)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <span
                    className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: place.color }}
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-zinc-800 dark:text-zinc-200">
                      {place.name}
                    </span>
                    <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
                      {place.layerLabel}
                    </span>
                  </span>
                </button>
                <button
                  onClick={() => onRemove(place.id)}
                  aria-label={`Remove ${place.name} from saved places`}
                  className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 hover:text-red-600 dark:hover:bg-zinc-800 dark:hover:text-red-400"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-3.5 w-3.5"
                  >
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  );
}
