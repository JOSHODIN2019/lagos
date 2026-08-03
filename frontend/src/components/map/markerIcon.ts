// Stage 01
// Step 08
//
// Purpose: builds a small colored dot Leaflet divIcon per layer, avoiding a
// dependency on external marker image assets.

import L from "leaflet";

const iconCache = new Map<string, L.DivIcon>();

export function getDotIcon(color: string): L.DivIcon {
  const cached = iconCache.get(color);
  if (cached) return cached;

  const icon = L.divIcon({
    className: "lagos-marker",
    html: `<span style="background:${color}" class="lagos-marker-dot"></span>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -8],
  });

  iconCache.set(color, icon);
  return icon;
}
