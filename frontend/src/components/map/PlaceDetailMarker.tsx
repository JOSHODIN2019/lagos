"use client";

// Stage 02
// Step 06
//
// Purpose: highlights the currently-selected place on the map (from a search
// hit or a marker click). Full details now live in the DetailPanel (Stage 03)
// instead of a Leaflet popup.

import { Marker } from "react-leaflet";
import { PlaceDetail } from "@/lib/types";
import { getDotIcon } from "./markerIcon";

export function PlaceDetailMarker({ result }: { result: PlaceDetail }) {
  return (
    <Marker position={[result.lat, result.lon]} icon={getDotIcon(result.color)} />
  );
}
