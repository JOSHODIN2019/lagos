"use client";

// Stage 03
// Step 01
//
// Purpose: slide-over panel shown when a marker (or search result) is
// selected — address, contact info, and the full set of OSM properties.
// A photo section is included as a labeled placeholder since OSM data has
// no images to show; see Section 9 of PROJECT_MEMORY.md (simulate rather
// than fake what isn't actually available).

import { useState } from "react";
import { PlaceDetail } from "@/lib/types";

const ADDRESS_KEYS = [
  "addr:housenumber",
  "addr:street",
  "addr:city",
  "addr:postcode",
];

const CONTACT_FIELDS: { keys: string[]; label: string; href: (v: string) => string }[] = [
  { keys: ["contact:phone", "phone"], label: "Phone", href: (v) => `tel:${v}` },
  {
    keys: ["contact:website", "website"],
    label: "Website",
    href: (v) => (v.startsWith("http") ? v : `https://${v}`),
  },
  { keys: ["contact:email", "email"], label: "Email", href: (v) => `mailto:${v}` },
];

function firstValue(properties: Record<string, string>, keys: string[]) {
  for (const key of keys) {
    if (properties[key]) return properties[key];
  }
  return null;
}

function formatAddress(properties: Record<string, string>) {
  const houseNumber = properties["addr:housenumber"];
  const street = properties["addr:street"];
  const city = properties["addr:city"];
  const postcode = properties["addr:postcode"];
  const line1 = [houseNumber, street].filter(Boolean).join(" ");
  const line2 = [city, postcode].filter(Boolean).join(" ");
  return [line1, line2].filter(Boolean).join(", ");
}

interface DetailPanelProps {
  place: PlaceDetail | null;
  isSaved: boolean;
  onToggleSave: (place: PlaceDetail) => Promise<void>;
  onClose: () => void;
}

export function DetailPanel({
  place,
  isSaved,
  onToggleSave,
  onClose,
}: DetailPanelProps) {
  const [saving, setSaving] = useState(false);
  const address = place ? formatAddress(place.properties) : "";
  const contacts = place
    ? CONTACT_FIELDS.map((field) => ({
        label: field.label,
        value: firstValue(place.properties, field.keys),
        href: field.href,
      })).filter((c) => c.value)
    : [];
  const otherEntries = place
    ? Object.entries(place.properties).filter(
        ([k]) =>
          !k.startsWith("@") &&
          k !== "name" &&
          !ADDRESS_KEYS.includes(k) &&
          !CONTACT_FIELDS.some((f) => f.keys.includes(k))
      )
    : [];

  return (
    <aside
      aria-label="Place details"
      aria-hidden={!place}
      className={`absolute right-0 top-0 z-[1050] h-full w-full max-w-sm transform border-l border-zinc-200 bg-white shadow-2xl transition-transform duration-300 ease-out dark:border-zinc-800 dark:bg-zinc-950 ${
        place ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {place && (
        <div className="flex h-full flex-col overflow-y-auto">
          <div className="flex items-start justify-between gap-3 border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
            <div className="min-w-0">
              <div className="mb-1 flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: place.color }}
                />
                <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  {place.layerLabel}
                </span>
              </div>
              <h2 className="text-lg font-semibold leading-snug text-zinc-900 dark:text-zinc-50">
                {place.name}
              </h2>
            </div>
            <div className="flex flex-shrink-0 items-center gap-1">
              <button
                onClick={async () => {
                  if (!place || saving) return;
                  setSaving(true);
                  try {
                    await onToggleSave(place);
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving}
                aria-label={isSaved ? "Remove from saved places" : "Save this place"}
                aria-pressed={isSaved}
                className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-50 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill={isSaved ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`h-4 w-4 ${isSaved ? "text-amber-500" : ""}`}
                >
                  <path d="M6 3.5h12a1 1 0 0 1 1 1V21l-7-4-7 4V4.5a1 1 0 0 1 1-1Z" />
                </svg>
              </button>
              <button
                onClick={onClose}
                aria-label="Close details"
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
          </div>

          <div
            className="flex h-36 flex-shrink-0 items-center justify-center gap-2 text-zinc-500 dark:text-zinc-400"
            style={{ backgroundColor: `${place.color}14` }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
            >
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <circle cx="9" cy="10" r="1.5" />
              <path d="m4 17 5-4 3 2.5 4-4 4 3.5" />
            </svg>
            <span className="text-xs">No photo available</span>
          </div>

          <div className="flex-1 space-y-6 px-5 py-5">
            {address && (
              <section>
                <h3 className="mb-1.5 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Address
                </h3>
                <p className="text-sm text-zinc-700 dark:text-zinc-300">
                  {address}
                </p>
              </section>
            )}

            {contacts.length > 0 && (
              <section>
                <h3 className="mb-1.5 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Contact
                </h3>
                <ul className="space-y-1.5">
                  {contacts.map((c) => (
                    <li key={c.label}>
                      <a
                        href={c.href(c.value!)}
                        target={c.label === "Website" ? "_blank" : undefined}
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                      >
                        {c.value}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {otherEntries.length > 0 && (
              <section>
                <h3 className="mb-1.5 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Details
                </h3>
                <dl className="divide-y divide-zinc-100 dark:divide-zinc-900">
                  {otherEntries.map(([k, v]) => (
                    <div key={k} className="flex gap-3 py-1.5 text-sm">
                      <dt className="w-32 flex-shrink-0 truncate text-zinc-500 dark:text-zinc-400">
                        {k}
                      </dt>
                      <dd className="min-w-0 flex-1 break-words text-zinc-700 dark:text-zinc-300">
                        {v}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
