"use client";

// Stage 06
// Step 04
//
// Purpose: while report mode is armed, listen for the next map click and
// hand its coordinates back up — this is how "tap the map to place your
// report" is implemented. Rendered conditionally so it adds no listener
// at all when reporting isn't active.

import { useMapEvents } from "react-leaflet";

interface ReportClickCaptureProps {
  onPick: (lat: number, lon: number) => void;
}

export function ReportClickCapture({ onPick }: ReportClickCaptureProps) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}
