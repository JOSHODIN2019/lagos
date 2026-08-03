// Stage 01
// Step 04
//
// Purpose: shared types for map layers and GeoJSON payloads from the backend.

export interface LayerMeta {
  id: string;
  label: string;
  category: string;
  color: string;
  icon: string;
  defaultVisible: boolean;
  count: number;
}

export interface GeoJSONPointFeature {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: Record<string, string>;
}

export interface GeoJSONFeatureCollection {
  type: "FeatureCollection";
  features: GeoJSONPointFeature[];
}

// Stage 02
// Step 03
//
// Purpose: a single place, spanning any layer — returned by search hits and
// by clicking a marker directly (Stage 03's detail panel uses the same shape).
export interface PlaceDetail {
  name: string;
  layerId: string;
  layerLabel: string;
  color: string;
  lon: number;
  lat: number;
  properties: Record<string, string>;
}

// Stage 04
// Step 07
//
// Purpose: the authenticated user shape returned by signup/login/me.
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  isAdmin: boolean;
}

// Stage 05
// Step 03
//
// Purpose: a PlaceDetail the current user has bookmarked. Extends the same
// shape with an id (for deletion) and a save timestamp.
export interface SavedPlace extends PlaceDetail {
  id: string;
  savedAt: string;
}

// Stage 06
// Step 03
//
// Purpose: a citizen-submitted issue report, with its simulated
// proof-of-submission (a real SHA-256 digest of the report content).
export interface Report {
  id: string;
  category: string;
  description: string;
  lon: number;
  lat: number;
  status: string;
  createdAt: string;
  proofHash: string;
  proofMessage: string;
}

// Stage 08
// Step 03
//
// Purpose: one turn of the AI Query Interpreter — the question, the Cypher
// the local LLM generated for it, the plain-language answer, and any POI
// coordinates worth highlighting on the map.
export interface AIQueryResult {
  question: string;
  cypher: string | null;
  answer: string;
  resultCount: number;
  mapPoints: { name: string | null; lon: number; lat: number }[];
}

// Stage 09
// Step 04
//
// Purpose: admin dashboard shapes — usage stats, moderated reports (with
// reporter info), and manageable POI rows.
export interface AdminStats {
  totalUsers: number;
  totalSavedPlaces: number;
  totalPois: number;
  totalReports: number;
  reportsByStatus: Record<string, number>;
  reportsByCategory: Record<string, number>;
  poisByCategory: { layerId: string; layerLabel: string; count: number }[];
}

export interface AdminReport extends Report {
  reporterName: string;
  reporterEmail: string;
}

export interface AdminPoi {
  id: string;
  name: string;
  lon: number;
  lat: number;
  layerId: string;
  layerLabel: string;
  color: string;
}
