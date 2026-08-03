"use client";

// Stage 02
// Step 05
//
// Purpose: imperative "fly the map to this point" bridge. MapScreen sets a
// target (from search selection); this effect drives the actual Leaflet
// map instance whenever it changes.

import { useEffect } from "react";
import { useMap } from "react-leaflet";

interface FlyToTarget {
  lat: number;
  lon: number;
}

export function FlyToController({ target }: { target: FlyToTarget | null }) {
  const map = useMap();

  useEffect(() => {
    if (!target) return;
    map.flyTo([target.lat, target.lon], 16, { duration: 1.2 });
  }, [map, target]);

  return null;
}
