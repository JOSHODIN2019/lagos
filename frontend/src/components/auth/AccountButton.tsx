"use client";

// Stage 04
// Step 10
//
// Purpose: sidebar header affordance — "Sign in" when logged out, or the
// user's initials with a sign-out dropdown when logged in.

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

interface AccountButtonProps {
  onSignIn: () => void;
  onOpenSaved: () => void;
  onOpenReports: () => void;
}

export function AccountButton({
  onSignIn,
  onOpenSaved,
  onOpenReports,
}: AccountButtonProps) {
  const { user, loading, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  if (loading) {
    return <div className="h-7 w-7 animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-800" />;
  }

  if (!user) {
    return (
      <button
        onClick={onSignIn}
        className="rounded-md px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        Sign in
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setMenuOpen((v) => !v)}
        title={user.name}
        className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900 text-xs font-medium text-white dark:bg-zinc-50 dark:text-zinc-900"
      >
        {initials(user.name) || "?"}
      </button>
      {menuOpen && (
        <div className="absolute right-0 top-9 z-[1100] w-44 rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
          <p className="truncate px-3 py-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            {user.email}
          </p>
          <button
            onClick={() => {
              setMenuOpen(false);
              onOpenSaved();
            }}
            className="block w-full px-3 py-1.5 text-left text-sm text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            Saved places
          </button>
          <button
            onClick={() => {
              setMenuOpen(false);
              onOpenReports();
            }}
            className="block w-full px-3 py-1.5 text-left text-sm text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            My reports
          </button>
          {user.isAdmin && (
            <Link
              href="/admin"
              onClick={() => setMenuOpen(false)}
              className="block w-full px-3 py-1.5 text-left text-sm text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              Admin dashboard
            </Link>
          )}
          <button
            onClick={() => {
              setMenuOpen(false);
              logout();
            }}
            className="block w-full px-3 py-1.5 text-left text-sm text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
