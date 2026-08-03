"use client";

// Stage 08
// Step 05
//
// Purpose: floating action button that opens the AI chat panel. Public —
// no auth gating, since the interpreter only ever touches public map data.

interface AIChatFABProps {
  onOpen: () => void;
}

export function AIChatFAB({ onOpen }: AIChatFABProps) {
  return (
    <button
      onClick={onOpen}
      className="absolute bottom-6 left-6 z-[1000] flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-3 text-sm font-medium text-white shadow-lg hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
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
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
      Ask Lagos
    </button>
  );
}
