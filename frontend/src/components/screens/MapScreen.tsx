"use client";

// Stage 01
// Step 13
//
// Purpose: root screen. Loads layer metadata, tracks which layers are
// toggled on, lazily fetches each layer's GeoJSON the first time it's shown,
// and composes Sidebar + MapView + SearchBar + DetailPanel + saved places +
// citizen reporting.

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import {
  deleteSavedPlace,
  fetchLayerGeoJSON,
  fetchLayers,
  fetchMyReports,
  fetchReportCategories,
  fetchSavedPlaces,
  savePlace,
  submitReport,
} from "@/lib/api";
import {
  AIQueryResult,
  GeoJSONFeatureCollection,
  LayerMeta,
  PlaceDetail,
  Report,
  SavedPlace,
} from "@/lib/types";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { SearchBar } from "@/components/search/SearchBar";
import { DetailPanel } from "@/components/detail/DetailPanel";
import { AuthModal } from "@/components/auth/AuthModal";
import { SavedPlacesPanel } from "@/components/saved/SavedPlacesPanel";
import { ReportFAB } from "@/components/report/ReportFAB";
import { ReportForm } from "@/components/report/ReportForm";
import { MyReportsPanel } from "@/components/report/MyReportsPanel";
import { AIChatFAB } from "@/components/ai/AIChatFAB";
import { AIChatPanel } from "@/components/ai/AIChatPanel";
import { useAuth } from "@/components/auth/AuthProvider";

const MapView = dynamic(
  () => import("@/components/map/MapView").then((m) => m.MapView),
  { ssr: false }
);

function samePlace(a: PlaceDetail, b: PlaceDetail) {
  return a.layerId === b.layerId && a.lon === b.lon && a.lat === b.lat;
}

export function MapScreen() {
  const { user, token } = useAuth();
  const [layers, setLayers] = useState<LayerMeta[]>([]);
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const [dataCache, setDataCache] = useState<
    Record<string, GeoJSONFeatureCollection>
  >({});
  const [error, setError] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<PlaceDetail | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [savedPanelOpen, setSavedPanelOpen] = useState(false);

  const [reportCategories, setReportCategories] = useState<string[]>([]);
  const [reportMode, setReportMode] = useState(false);
  const [reportPin, setReportPin] = useState<{ lat: number; lon: number } | null>(
    null
  );
  const [myReports, setMyReports] = useState<Report[]>([]);
  const [myReportsPanelOpen, setMyReportsPanelOpen] = useState(false);

  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [aiMapPoints, setAiMapPoints] = useState<AIQueryResult["mapPoints"]>([]);

  // Stage 10: below `md` there's no room for a permanently-docked sidebar
  // alongside the map, so it becomes a toggleable drawer there.
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    fetchLayers()
      .then((all) => {
        setLayers(all);
        setVisibleIds(new Set(all.filter((l) => l.defaultVisible).map((l) => l.id)));
      })
      .catch(() => setError("Could not reach the map API. Is the backend running?"));
    fetchReportCategories().then(setReportCategories).catch(() => {});
  }, []);

  useEffect(() => {
    visibleIds.forEach((id) => {
      if (dataCache[id] || loadingIds.has(id)) return;
      setLoadingIds((prev) => new Set(prev).add(id));
      fetchLayerGeoJSON(id)
        .then((geojson) => {
          setDataCache((prev) => ({ ...prev, [id]: geojson }));
        })
        .catch(() => setError(`Failed to load layer '${id}'.`))
        .finally(() => {
          setLoadingIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleIds]);

  useEffect(() => {
    if (!token) {
      setSavedPlaces([]);
      setMyReports([]);
      return;
    }
    fetchSavedPlaces(token)
      .then(setSavedPlaces)
      .catch(() => setError("Failed to load saved places."));
    fetchMyReports(token)
      .then(setMyReports)
      .catch(() => setError("Failed to load your reports."));
  }, [token]);

  const handleToggleLayer = useCallback((id: string) => {
    setVisibleIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleToggleCategory = useCallback((categoryLayerIds: string[]) => {
    setVisibleIds((prev) => {
      const allVisible = categoryLayerIds.every((id) => prev.has(id));
      const next = new Set(prev);
      categoryLayerIds.forEach((id) =>
        allVisible ? next.delete(id) : next.add(id)
      );
      return next;
    });
  }, []);

  // Fly to it and make sure its layer is on, then show details. Used both by
  // search selection and by picking a saved place from the saved-places panel.
  const flyToAndShow = useCallback((place: PlaceDetail) => {
    setSelectedPlace(place);
    setVisibleIds((prev) => {
      if (prev.has(place.layerId)) return prev;
      return new Set(prev).add(place.layerId);
    });
  }, []);

  // Marker click: the feature is already visible on the map, just show details.
  const handleSelectFeature = useCallback((place: PlaceDetail) => {
    setSelectedPlace(place);
  }, []);

  const handleCloseDetail = useCallback(() => setSelectedPlace(null), []);

  const handleSelectSavedPlace = useCallback(
    (place: SavedPlace) => {
      flyToAndShow(place);
      setSavedPanelOpen(false);
    },
    [flyToAndShow]
  );

  const handleToggleSave = useCallback(
    async (place: PlaceDetail) => {
      if (!user || !token) {
        setAuthModalOpen(true);
        return;
      }
      const existing = savedPlaces.find((sp) => samePlace(sp, place));
      if (existing) {
        await deleteSavedPlace(token, existing.id);
        setSavedPlaces((prev) => prev.filter((sp) => sp.id !== existing.id));
      } else {
        const saved = await savePlace(token, place);
        setSavedPlaces((prev) => [saved, ...prev]);
      }
    },
    [user, token, savedPlaces]
  );

  const handleRemoveSaved = useCallback(
    async (savedPlaceId: string) => {
      if (!token) return;
      await deleteSavedPlace(token, savedPlaceId);
      setSavedPlaces((prev) => prev.filter((sp) => sp.id !== savedPlaceId));
    },
    [token]
  );

  const handleArmReport = useCallback(() => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    setSavedPanelOpen(false);
    setMyReportsPanelOpen(false);
    setAiChatOpen(false);
    setReportMode(true);
  }, [user]);

  const handleCancelReport = useCallback(() => {
    setReportMode(false);
    setReportPin(null);
  }, []);

  const handlePickReportLocation = useCallback((lat: number, lon: number) => {
    setReportPin({ lat, lon });
    setReportMode(false);
  }, []);

  const handleSubmitReport = useCallback(
    async (category: string, description: string) => {
      if (!token || !reportPin) throw new Error("Not ready to submit.");
      const report = await submitReport(token, {
        category,
        description,
        lon: reportPin.lon,
        lat: reportPin.lat,
      });
      setMyReports((prev) => [report, ...prev]);
      return report;
    },
    [token, reportPin]
  );

  const handleReportDone = useCallback(() => setReportPin(null), []);

  const handleOpenAIChat = useCallback(() => {
    setSavedPanelOpen(false);
    setMyReportsPanelOpen(false);
    setReportPin(null);
    setReportMode(false);
    setAiChatOpen(true);
  }, []);

  const handleAIResult = useCallback((result: AIQueryResult) => {
    setAiMapPoints(result.mapPoints);
  }, []);

  // Stage 10: Escape closes whatever's topmost, in the same priority order
  // the right-side panel chain below renders in.
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (authModalOpen) setAuthModalOpen(false);
      else if (aiChatOpen) setAiChatOpen(false);
      else if (reportMode || reportPin) handleCancelReport();
      else if (myReportsPanelOpen) setMyReportsPanelOpen(false);
      else if (savedPanelOpen) setSavedPanelOpen(false);
      else if (selectedPlace) handleCloseDetail();
      else if (mobileSidebarOpen) setMobileSidebarOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    authModalOpen,
    aiChatOpen,
    reportMode,
    reportPin,
    myReportsPanelOpen,
    savedPanelOpen,
    selectedPlace,
    mobileSidebarOpen,
    handleCancelReport,
    handleCloseDetail,
  ]);

  const isSelectedPlaceSaved = selectedPlace
    ? savedPlaces.some((sp) => samePlace(sp, selectedPlace))
    : false;

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      <Sidebar
        layers={layers}
        visibleIds={visibleIds}
        loadingIds={loadingIds}
        onToggleLayer={handleToggleLayer}
        onToggleCategory={handleToggleCategory}
        onSignIn={() => {
          setMobileSidebarOpen(false);
          setAuthModalOpen(true);
        }}
        onOpenSaved={() => {
          setAiChatOpen(false);
          setMobileSidebarOpen(false);
          setSavedPanelOpen(true);
        }}
        onOpenReports={() => {
          setAiChatOpen(false);
          setMobileSidebarOpen(false);
          setMyReportsPanelOpen(true);
        }}
        open={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
          className="fixed inset-0 z-[1150] bg-black/40 md:hidden"
        />
      )}
      <main className="relative flex-1">
        <button
          onClick={() => setMobileSidebarOpen(true)}
          aria-label="Open menu"
          className="absolute left-4 top-4 z-[1000] flex h-10 w-10 items-center justify-center rounded-full bg-white text-zinc-700 shadow-lg dark:bg-zinc-900 dark:text-zinc-200 md:hidden"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <MapView
          layers={layers}
          visibleIds={visibleIds}
          dataCache={dataCache}
          selectedResult={selectedPlace}
          onSelectFeature={handleSelectFeature}
          reportMode={reportMode}
          onPickReportLocation={handlePickReportLocation}
          reportPin={reportPin}
          aiMapPoints={aiMapPoints}
        />
        <SearchBar onSelect={flyToAndShow} />
        <ReportFAB
          armed={reportMode}
          onArm={handleArmReport}
          onCancel={handleCancelReport}
        />
        {!aiChatOpen && <AIChatFAB onOpen={handleOpenAIChat} />}
        {aiChatOpen ? (
          <AIChatPanel
            onClose={() => setAiChatOpen(false)}
            onResult={handleAIResult}
          />
        ) : reportPin ? (
          <ReportForm
            categories={reportCategories}
            location={reportPin}
            onSubmit={handleSubmitReport}
            onCancel={handleCancelReport}
            onDone={handleReportDone}
          />
        ) : myReportsPanelOpen ? (
          <MyReportsPanel
            reports={myReports}
            onClose={() => setMyReportsPanelOpen(false)}
          />
        ) : savedPanelOpen ? (
          <SavedPlacesPanel
            savedPlaces={savedPlaces}
            onSelect={handleSelectSavedPlace}
            onRemove={handleRemoveSaved}
            onClose={() => setSavedPanelOpen(false)}
          />
        ) : (
          <DetailPanel
            place={selectedPlace}
            isSaved={isSelectedPlaceSaved}
            onToggleSave={handleToggleSave}
            onClose={handleCloseDetail}
          />
        )}
        {authModalOpen && (
          <AuthModal onClose={() => setAuthModalOpen(false)} />
        )}
        {error && (
          <div className="absolute left-1/2 top-16 z-[1000] -translate-x-1/2 rounded-md bg-red-600 px-4 py-2 text-sm text-white shadow-lg">
            {error}
          </div>
        )}
      </main>
    </div>
  );
}
