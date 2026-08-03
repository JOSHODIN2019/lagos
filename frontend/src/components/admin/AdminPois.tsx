"use client";

// Stage 09
// Step 07
//
// Purpose: POI management tab — search/filter, inline rename, delete,
// paginated. Owns its own fetching since it's the most stateful tab.

import { useCallback, useEffect, useState } from "react";
import { deletePoi, fetchAdminPois, updatePoiName } from "@/lib/api";
import { AdminPoi, LayerMeta } from "@/lib/types";

const PAGE_SIZE = 25;

interface AdminPoisProps {
  token: string;
  layers: LayerMeta[];
}

export function AdminPois({ token, layers }: AdminPoisProps) {
  const [items, setItems] = useState<AdminPoi[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [category, setCategory] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    fetchAdminPois(token, { category: category || undefined, q: query || undefined, limit: PAGE_SIZE, offset })
      .then((res) => {
        setItems(res.items);
        setTotal(res.total);
      })
      .finally(() => setLoading(false));
  }, [token, category, query, offset]);

  useEffect(() => {
    load();
  }, [load]);

  function handleFilterChange(fn: () => void) {
    setOffset(0);
    fn();
  }

  async function handleSaveEdit(id: string) {
    if (!editValue.trim()) return;
    const updated = await updatePoiName(token, id, editValue.trim());
    setItems((prev) => prev.map((p) => (p.id === id ? updated : p)));
    setEditingId(null);
  }

  async function handleDelete(id: string) {
    await deletePoi(token, id);
    setItems((prev) => prev.filter((p) => p.id !== id));
    setTotal((prev) => prev - 1);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <select
          value={category}
          onChange={(e) => handleFilterChange(() => setCategory(e.target.value))}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
        >
          <option value="">All categories</option>
          {layers.map((l) => (
            <option key={l.id} value={l.id}>
              {l.label}
            </option>
          ))}
        </select>
        <input
          value={query}
          onChange={(e) => handleFilterChange(() => setQuery(e.target.value))}
          placeholder="Search by name…"
          className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 outline-none placeholder:text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-2.5 font-medium">Name</th>
                <th className="px-4 py-2.5 font-medium">Category</th>
                <th className="px-4 py-2.5 font-medium">Coordinates</th>
                <th className="px-4 py-2.5 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
              {items.map((poi) => (
                <tr key={poi.id}>
                  <td className="px-4 py-2.5">
                    {editingId === poi.id ? (
                      <>
                        <label className="sr-only" htmlFor={`poi-name-${poi.id}`}>
                          Name for POI
                        </label>
                        <input
                          id={`poi-name-${poi.id}`}
                          autoFocus
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveEdit(poi.id);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          className="w-full rounded-md border border-zinc-300 px-2 py-1 text-sm outline-none dark:border-zinc-700 dark:bg-zinc-800"
                        />
                      </>
                    ) : (
                      <span className="text-zinc-800 dark:text-zinc-200">{poi.name}</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="inline-flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300">
                      <span
                        className="h-2 w-2 flex-shrink-0 rounded-full"
                        style={{ backgroundColor: poi.color }}
                      />
                      {poi.layerLabel}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-xs text-zinc-500 dark:text-zinc-400">
                    {poi.lat.toFixed(4)}, {poi.lon.toFixed(4)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right">
                    {editingId === poi.id ? (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleSaveEdit(poi.id)}
                          className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-xs font-medium text-zinc-500 hover:underline dark:text-zinc-400"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingId(poi.id);
                            setEditValue(poi.name);
                          }}
                          className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(poi.id)}
                          className="text-xs font-medium text-red-600 hover:underline dark:text-red-400"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {items.length === 0 && !loading && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-400">
                    No POIs match.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
        <span>
          {total === 0 ? 0 : offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of {total}
        </span>
        <div className="flex gap-2">
          <button
            disabled={offset === 0}
            onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
            className="rounded-md border border-zinc-200 px-2.5 py-1 disabled:opacity-40 dark:border-zinc-800"
          >
            Prev
          </button>
          <button
            disabled={offset + PAGE_SIZE >= total}
            onClick={() => setOffset(offset + PAGE_SIZE)}
            className="rounded-md border border-zinc-200 px-2.5 py-1 disabled:opacity-40 dark:border-zinc-800"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
