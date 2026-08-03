"use client";

// Stage 06
// Step 06
//
// Purpose: floating action button that arms report mode. While armed, it
// becomes a "Cancel" button and an instruction banner tells the user to
// tap the map.

interface ReportFABProps {
  armed: boolean;
  onArm: () => void;
  onCancel: () => void;
}

export function ReportFAB({ armed, onArm, onCancel }: ReportFABProps) {
  return (
    <>
      {armed && (
        <div className="pointer-events-none absolute left-1/2 top-20 z-[1000] -translate-x-1/2 rounded-full bg-zinc-900/90 px-4 py-2 text-sm text-white shadow-lg dark:bg-zinc-50/90 dark:text-zinc-900">
          Tap the map to place your report
        </div>
      )}
      <button
        onClick={armed ? onCancel : onArm}
        className={`absolute bottom-6 right-6 z-[1000] flex items-center gap-2 rounded-full px-4 py-3 text-sm font-medium shadow-lg transition-colors ${
          armed
            ? "bg-white text-zinc-700 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            : "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        }`}
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
          {armed ? (
            <path d="M18 6 6 18M6 6l12 12" />
          ) : (
            <>
              <path d="M12 21s-7-5.686-7-11a7 7 0 0 1 14 0c0 5.314-7 11-7 11Z" />
              <circle cx="12" cy="10" r="2.5" />
            </>
          )}
        </svg>
        {armed ? "Cancel" : "Report an issue"}
      </button>
    </>
  );
}
