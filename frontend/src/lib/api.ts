// Stage 01
// Step 05
//
// Purpose: fetch helpers for talking to the FastAPI backend.

import {
  AdminPoi,
  AdminReport,
  AdminStats,
  AIQueryResult,
  GeoJSONFeatureCollection,
  LayerMeta,
  PlaceDetail,
  Report,
  SavedPlace,
  User,
} from "./types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8010";

async function extractErrorMessage(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (typeof body.detail === "string") return body.detail;
    if (Array.isArray(body.detail)) {
      return body.detail.map((d: { msg: string }) => d.msg).join(", ");
    }
  } catch {
    // fall through to generic message
  }
  return `Request failed: ${res.status}`;
}

export async function fetchLayers(): Promise<LayerMeta[]> {
  const res = await fetch(`${API_BASE_URL}/api/layers`);
  if (!res.ok) throw new Error(`Failed to fetch layers: ${res.status}`);
  return res.json();
}

export async function fetchLayerGeoJSON(
  layerId: string
): Promise<GeoJSONFeatureCollection> {
  const res = await fetch(`${API_BASE_URL}/api/layers/${layerId}/geojson`);
  if (!res.ok)
    throw new Error(`Failed to fetch layer '${layerId}': ${res.status}`);
  return res.json();
}

export async function searchPlaces(query: string): Promise<PlaceDetail[]> {
  if (!query.trim()) return [];
  const res = await fetch(
    `${API_BASE_URL}/api/search?q=${encodeURIComponent(query)}`
  );
  if (!res.ok) throw new Error(`Search failed: ${res.status}`);
  return res.json();
}

interface AuthResponse {
  token: string;
  user: User;
}

export async function signup(
  name: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  if (!res.ok) throw new Error(await extractErrorMessage(res));
  return res.json();
}

export async function login(
  email: string,
  password: string
): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(await extractErrorMessage(res));
  return res.json();
}

export async function fetchMe(token: string): Promise<User> {
  const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await extractErrorMessage(res));
  return res.json();
}

export async function fetchSavedPlaces(token: string): Promise<SavedPlace[]> {
  const res = await fetch(`${API_BASE_URL}/api/saved`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await extractErrorMessage(res));
  return res.json();
}

export async function savePlace(
  token: string,
  place: PlaceDetail
): Promise<SavedPlace> {
  const res = await fetch(`${API_BASE_URL}/api/saved`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(place),
  });
  if (!res.ok) throw new Error(await extractErrorMessage(res));
  return res.json();
}

export async function deleteSavedPlace(
  token: string,
  id: string
): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/saved/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await extractErrorMessage(res));
}

export async function fetchReportCategories(): Promise<string[]> {
  const res = await fetch(`${API_BASE_URL}/api/reports/categories`);
  if (!res.ok) throw new Error(`Failed to fetch categories: ${res.status}`);
  return res.json();
}

export async function fetchMyReports(token: string): Promise<Report[]> {
  const res = await fetch(`${API_BASE_URL}/api/reports/mine`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await extractErrorMessage(res));
  return res.json();
}

export async function submitReport(
  token: string,
  report: { category: string; description: string; lon: number; lat: number }
): Promise<Report> {
  const res = await fetch(`${API_BASE_URL}/api/reports`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(report),
  });
  if (!res.ok) throw new Error(await extractErrorMessage(res));
  return res.json();
}

export async function askAI(question: string): Promise<AIQueryResult> {
  const res = await fetch(`${API_BASE_URL}/api/ai/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) throw new Error(await extractErrorMessage(res));
  return res.json();
}

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export async function fetchAdminStats(token: string): Promise<AdminStats> {
  const res = await fetch(`${API_BASE_URL}/api/admin/stats`, {
    headers: authHeader(token),
  });
  if (!res.ok) throw new Error(await extractErrorMessage(res));
  return res.json();
}

export async function fetchAdminReports(token: string): Promise<AdminReport[]> {
  const res = await fetch(`${API_BASE_URL}/api/admin/reports`, {
    headers: authHeader(token),
  });
  if (!res.ok) throw new Error(await extractErrorMessage(res));
  return res.json();
}

export async function updateReportStatus(
  token: string,
  reportId: string,
  status: string
): Promise<AdminReport> {
  const res = await fetch(`${API_BASE_URL}/api/admin/reports/${reportId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeader(token) },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(await extractErrorMessage(res));
  return res.json();
}

export async function fetchAdminPois(
  token: string,
  params: { category?: string; q?: string; limit?: number; offset?: number }
): Promise<{ items: AdminPoi[]; total: number }> {
  const search = new URLSearchParams();
  if (params.category) search.set("category", params.category);
  if (params.q) search.set("q", params.q);
  search.set("limit", String(params.limit ?? 50));
  search.set("offset", String(params.offset ?? 0));
  const res = await fetch(`${API_BASE_URL}/api/admin/pois?${search}`, {
    headers: authHeader(token),
  });
  if (!res.ok) throw new Error(await extractErrorMessage(res));
  return res.json();
}

export async function updatePoiName(
  token: string,
  poiId: string,
  name: string
): Promise<AdminPoi> {
  const res = await fetch(`${API_BASE_URL}/api/admin/pois/${poiId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeader(token) },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error(await extractErrorMessage(res));
  return res.json();
}

export async function deletePoi(token: string, poiId: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/admin/pois/${poiId}`, {
    method: "DELETE",
    headers: authHeader(token),
  });
  if (!res.ok) throw new Error(await extractErrorMessage(res));
}
