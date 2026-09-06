"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  ScanEye,
  TrendingUp,
  ShieldAlert,
  Lightbulb,
  Building2,
  MapPin,
  ScanSearch,
  CheckCircle2,
  Award,
  Navigation,
  ExternalLink,
  Layers,
  ChevronDown,
  Store,
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ALL_INDIAN_STATES_DATA, getDistrictGeo } from "@/lib/api/district-data";

export interface ScannerBusinessProfile {
  id: string;
  businessName: string;
  industry?: string | null;
  category?: string | null;
  city?: string | null;
  state?: string | null;
  annualRevenue?: number | null;
  monthlyExpenses?: number | null;
}

export interface CompetitorItem {
  name: string;
  distance: string;
  landmark: string;
  speciality: string;
  priceRange: string;
  threatLevel: "High" | "Medium" | "Low";
  differentiator?: string;
}

export interface InitialSwotData {
  district: string;
  state: string;
  radiusKm: number;
  score: number;
  swotData: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
    competitors?: CompetitorItem[];
  };
  actionPlan: { time: string; action: string; impact: string }[];
  dataSource: string;
  lastEvaluatedAt: string;
}

export function ScannerClient({
  profile,
  initialSwotData,
}: {
  profile: ScannerBusinessProfile | null;
  initialSwotData?: InitialSwotData | null;
}) {
  const { t } = useTranslation();
  const [radiusKm, setRadiusKm] = useState<number>(initialSwotData?.radiusKm || 10);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // Initial State & District Setup
  const initialDistrict = initialSwotData?.district || profile?.city || "Pune";
  const initialGeo = getDistrictGeo(initialDistrict, initialSwotData?.state || profile?.state || "Maharashtra");

  const [selectedState, setSelectedState] = useState<string>(initialSwotData?.state || profile?.state || "Maharashtra");
  const [selectedDistrict, setSelectedDistrict] = useState<string>(initialGeo.name);
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: initialGeo.lat,
    lng: initialGeo.lng,
  });

  const currentDistrictsList =
    ALL_INDIAN_STATES_DATA.find((s) => s.state === selectedState)?.districts || [];

  // When District changes via Shadcn Dropdown, update coordinates immediately
  const handleDistrictChange = (districtName: string) => {
    setSelectedDistrict(districtName);
    const geo = getDistrictGeo(districtName, selectedState);
    setCoords({ lat: geo.lat, lng: geo.lng });
    toast.info(`Map centered on ${districtName}, ${selectedState}`);
  };

  // When State changes via Shadcn Dropdown, update state and pick first district
  const handleStateChange = (stateName: string) => {
    setSelectedState(stateName);
    const stateObj = ALL_INDIAN_STATES_DATA.find((s) => s.state === stateName);
    if (stateObj && stateObj.districts.length > 0) {
      const firstDistrict = stateObj.districts[0];
      setSelectedDistrict(firstDistrict.name);
      setCoords({ lat: firstDistrict.lat, lng: firstDistrict.lng });
    }
  };

  // Debounced auto-sync location changes to user's Enterprise Profile in DB
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await fetch("/api/business", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            state: selectedState,
            city: selectedDistrict,
          }),
        });

        // Invalidate dashboard analytics cache so dashboard reflects new location
        if (typeof window !== "undefined") {
          localStorage.removeItem("vyaparsetu_dashboard_analytics_v3");
        }
      } catch (err) {
        console.error("Failed to auto-save location from SWOT scanner:", err);
      }
    }, 800);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [selectedState, selectedDistrict]);

  // Scan Results state (Loaded from Prisma if available, otherwise null until scanned)
  const [scanResult, setScanResult] = useState<{
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
    competitors?: CompetitorItem[];
    score: number;
    dataSource: string;
    actionPlan: { time: string; action: string; impact: string }[];
  } | null>(
    initialSwotData
      ? {
          strengths: initialSwotData.swotData?.strengths || [],
          weaknesses: initialSwotData.swotData?.weaknesses || [],
          opportunities: initialSwotData.swotData?.opportunities || [],
          threats: initialSwotData.swotData?.threats || [],
          competitors: initialSwotData.swotData?.competitors || [],
          score: initialSwotData.score || 88,
          dataSource:
            initialSwotData.dataSource ||
            `Geographic Heuristics for ${selectedDistrict}, ${selectedState}`,
          actionPlan: initialSwotData.actionPlan || [],
        }
      : null
  );

  // Reusable GPS Fetch Logic
  const fetchGpsLocation = useCallback((options?: { silent?: boolean }) => {
    if (!navigator.geolocation) {
      if (!options?.silent) toast.error("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    if (!options?.silent) toast.info("Acquiring GPS Satellite fix...");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { signal: AbortSignal.timeout(5000) }
          );
          if (res.ok) {
            const data = await res.json();
            const detectedDistrict =
              data.address?.state_district ||
              data.address?.city ||
              data.address?.county ||
              data.address?.town ||
              selectedDistrict;
            const detectedState = data.address?.state || selectedState;
            setSelectedDistrict(detectedDistrict);
            setSelectedState(detectedState);
            if (!options?.silent) toast.success(`Jumped to: ${detectedDistrict}, ${detectedState}!`);
          }
        } catch {
          if (!options?.silent) toast.success(`Jumped to GPS Coordinates: ${latitude.toFixed(3)}, ${longitude.toFixed(3)}`);
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        if (!options?.silent) toast.error(`GPS Location Error: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [selectedDistrict, selectedState]);

  // Auto-detect GPS location on mount (only if permission already granted — no prompt)
  useEffect(() => {
    if (navigator.permissions) {
      navigator.permissions.query({ name: "geolocation" as PermissionName }).then((result) => {
        if (result.state === "granted") {
          fetchGpsLocation({ silent: true });
        }
      }).catch(() => {
        // permissions API not supported, skip auto-detect
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Manual button handler
  const handleJumpToMyLocation = () => fetchGpsLocation();


  // Run Real AI SWOT Feasibility Scan
  const handleRunFeasibilityScan = async () => {
    setIsScanning(true);
    try {
      const res = await fetch("/api/ai/swot-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          district: selectedDistrict,
          state: selectedState,
          radiusKm,
          category: profile?.category || "General Store / Kirana",
          businessName: profile?.businessName || "My Enterprise",
          lat: coords.lat,
          lng: coords.lng,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setScanResult({
          strengths: data.strengths || [],
          weaknesses: data.weaknesses || [],
          opportunities: data.opportunities || [],
          threats: data.threats || [],
          competitors: data.competitors || [],
          score: data.score || 88,
          dataSource: data.dataSource || `Live Trade Register for ${selectedDistrict}`,
          actionPlan: data.actionPlan || [],
        });
        toast.success(`SWOT Scan updated for ${selectedDistrict}!`);
      } else {
        toast.error("Failed to generate SWOT scan.");
      }
    } catch {
      toast.error("Error connecting to SWOT analysis service.");
    } finally {
      setIsScanning(false);
    }
  };

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${selectedDistrict}, ${selectedState}`)}`;
  const googleMapsEmbedUrl = `https://maps.google.com/maps?q=${coords.lat},${coords.lng}&z=${Math.max(10, 16 - Math.floor(radiusKm / 5))}&output=embed`;

  return (
    <div className="h-full flex flex-col pt-16 sm:pt-16 md:pt-16 lg:pt-8 p-4 md:p-6 lg:p-8 overflow-y-auto font-sans text-foreground">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shrink-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-forest dark:text-mint flex items-center gap-2.5">
            <ScanEye className="size-7 text-mint" /> {t("scanner.title", "SWOT & Geospatial Market Scanner")}
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted dark:text-muted-foreground mt-0.5">
            {t("scanner.subtitle", "Demographic intelligence, competitor heuristics, margin expansion opportunities, and risk mitigation")}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            href="/ai-recommendations"
            className="px-3.5 py-2.5 bg-white dark:bg-card border border-sage/40 dark:border-border text-foreground hover:bg-cream font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <MapPin className="size-3.5 text-mint" />
            <span>District Matchmaker</span>
          </Link>
          <Link
            href="/schemes-for-you"
            className="px-4 py-2.5 bg-forest dark:bg-mint hover:bg-forest-deep text-white dark:text-black font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Award className="size-4" />
            <span>{t("scanner.matchedGovtSubsidies", "Matched Govt Subsidies")}</span>
          </Link>
        </div>
      </div>

      <div className="space-y-6">
        {/* Enterprise Profile & Map Controller Card */}
        <div className="bg-white/40 dark:bg-card/40 rounded-2xl border border-sage/20 dark:border-border p-5 sm:p-6 shadow-xs space-y-5">
          {/* Top Bar with Enterprise Info and Feasibility Score */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-sage/20 dark:border-border">
            <div className="flex items-center gap-3.5">
              <div className="size-11 rounded-2xl bg-mint-pale dark:bg-mint/10 text-forest dark:text-mint flex items-center justify-center shrink-0">
                <Building2 className="size-6" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-forest dark:text-foreground">
                  {profile?.businessName || "My Rural Enterprise"}
                </h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                  <MapPin className="size-3.5 text-mint" />
                  <span>
                    {selectedDistrict}, {selectedState} • Sector:{" "}
                    <strong className="text-foreground font-medium">{profile?.category || "General Store / Kirana"}</strong>
                  </span>
                </p>
              </div>
            </div>

            {/* Feasibility Score Badge */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                  {t("scanner.marketFeasibilityScore", "Market Feasibility Score")}
                </span>
                <span className="font-serif font-bold text-xl sm:text-2xl text-forest dark:text-mint">
                  {scanResult ? `${scanResult.score} / 100` : "--"}
                </span>
              </div>
              <div className="size-10 rounded-xl bg-mint-pale dark:bg-mint/20 text-forest dark:text-mint flex items-center justify-center font-bold text-sm">
                {scanResult ? (scanResult.score >= 80 ? "A+" : scanResult.score >= 60 ? "B" : "C") : "--"}
              </div>
            </div>
          </div>

          {/* State & District Shadcn DropdownMenu Selectors + GPS Jump */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
            {/* State Dropdown */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                Select State
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger className="w-full flex items-center justify-between px-3.5 py-2.5 bg-cream/70 dark:bg-muted/40 border border-sage/40 dark:border-border rounded-xl text-xs font-semibold focus:outline-none focus:border-mint cursor-pointer text-left">
                  <span className="truncate">{selectedState}</span>
                  <ChevronDown className="size-4 opacity-60 shrink-0 ml-1" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="max-h-72 overflow-y-auto w-64 p-2">
                  <DropdownMenuLabel>Select State</DropdownMenuLabel>
                  {ALL_INDIAN_STATES_DATA.map((s) => (
                    <DropdownMenuItem
                      key={s.state}
                      onClick={() => handleStateChange(s.state)}
                      className={`cursor-pointer px-3 py-2 rounded-xl transition-all ${
                        selectedState === s.state
                          ? "bg-mint-pale dark:bg-mint/20 text-forest dark:text-mint font-bold border border-mint/30"
                          : "hover:bg-cream dark:hover:bg-muted/50"
                      }`}
                    >
                      {s.state}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* District Dropdown (All Real Districts of Selected State) */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                Select District ({currentDistrictsList.length})
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger className="w-full flex items-center justify-between px-3.5 py-2.5 bg-cream/70 dark:bg-muted/40 border border-sage/40 dark:border-border rounded-xl text-xs font-semibold focus:outline-none focus:border-mint cursor-pointer text-left">
                  <span className="truncate">{selectedDistrict}</span>
                  <ChevronDown className="size-4 opacity-60 shrink-0 ml-1" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="max-h-80 overflow-y-auto w-84 p-2">
                  <DropdownMenuLabel>Districts in {selectedState}</DropdownMenuLabel>
                  {currentDistrictsList.map((d) => (
                    <DropdownMenuItem
                      key={d.name}
                      onClick={() => handleDistrictChange(d.name)}
                      className={`cursor-pointer flex flex-col items-start px-3 py-2 rounded-xl transition-all ${
                        selectedDistrict === d.name
                          ? "bg-mint-pale dark:bg-mint/20 text-forest dark:text-mint font-bold border border-mint/30"
                          : "hover:bg-cream dark:hover:bg-muted/50"
                      }`}
                    >
                      <span className="text-xs font-bold text-foreground">{d.name}</span>
                      {d.odop && (
                        <span className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                          ODOP: {d.odop.split("(")[0].trim()}
                        </span>
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Jump to Live GPS Button */}
            <button
              onClick={handleJumpToMyLocation}
              disabled={isLocating}
              className="py-2.5 px-4 bg-white dark:bg-card border border-sage/40 dark:border-border hover:bg-cream dark:hover:bg-muted/40 text-forest dark:text-mint font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isLocating ? <Spinner className="size-4 text-mint" /> : <Navigation className="size-4 text-mint" />}
              <span>{isLocating ? "Locating GPS..." : "🎯 Jump to My Location"}</span>
            </button>

            {/* Open in Google Maps */}
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-4 bg-white dark:bg-card border border-sage/40 dark:border-border hover:bg-cream dark:hover:bg-muted/40 text-muted-foreground hover:text-foreground font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ExternalLink className="size-4" />
              <span>Google Maps View</span>
            </a>
          </div>

          {/* Interactive Geospatial Map Display */}
          <div className="relative rounded-2xl overflow-hidden border border-sage/30 dark:border-border bg-muted h-64 sm:h-80 shadow-inner">
            {/* Map iframe — forced to z-1 so overlays paint on top */}
            <iframe
              key={`${coords.lat}-${coords.lng}-${radiusKm}`}
              src={googleMapsEmbedUrl}
              title="District Catchment Map"
              className="w-full h-full border-0 filter contrast-105"
              loading="lazy"
              style={{ position: "relative", zIndex: 1 }}
            />

            {/* SVG Catchment Circle Overlay — z-10 renders reliably above the iframe */}
            <svg
              className="absolute inset-0 pointer-events-none select-none"
              style={{ zIndex: 10 }}
              width="100%"
              height="100%"
              viewBox="0 0 100 100"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                {/* Vignette mask: cut out the catchment circle from a full-area dark overlay */}
                <mask id="catchment-mask">
                  <rect x="0" y="0" width="100" height="100" fill="white" />
                  <circle cx="50" cy="50" r={Math.min(45, Math.max(10, 9 + (radiusKm / 25) * 36))} fill="black" />
                </mask>
              </defs>

              {/* Semi-transparent vignette outside the circle */}
              <rect x="0" y="0" width="100" height="100" fill="rgba(15,23,42,0.25)" mask="url(#catchment-mask)" />

              {/* Outer catchment circle — dashed, high contrast */}
              <circle
                cx="50"
                cy="50"
                r={Math.min(45, Math.max(10, 9 + (radiusKm / 25) * 36))}
                fill="rgba(16,185,129,0.18)"
                stroke="#059669"
                strokeWidth="0.7"
                strokeDasharray="2.5 1.5"
              />

              {/* Inner concentric ring (50% of outer) */}
              <circle
                cx="50"
                cy="50"
                r={Math.min(45, Math.max(10, 9 + (radiusKm / 25) * 36)) / 2}
                fill="none"
                stroke="rgba(16,185,129,0.35)"
                strokeWidth="0.35"
                strokeDasharray="1.5 1"
              />

              {/* Crosshair lines */}
              <line x1="5" y1="50" x2="95" y2="50" stroke="rgba(16,185,129,0.3)" strokeWidth="0.2" />
              <line x1="50" y1="5" x2="50" y2="95" stroke="rgba(16,185,129,0.3)" strokeWidth="0.2" />

              {/* Center pulsing beacon */}
              <circle cx="50" cy="50" r="2.5" fill="rgba(16,185,129,0.3)">
                <animate attributeName="r" values="1.5;3.5;1.5" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.5;0.15;0.5" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle cx="50" cy="50" r="1" fill="#059669" stroke="white" strokeWidth="0.5" />
            </svg>

            {/* Catchment Radius Pill — on the top edge of the SVG circle */}
            <div
              className="absolute left-1/2 -translate-x-1/2 bg-emerald-700 dark:bg-mint text-white dark:text-black text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-lg border border-white/40 dark:border-black/30 flex items-center gap-1.5 whitespace-nowrap pointer-events-none"
              style={{
                zIndex: 11,
                top: `calc(50% - ${Math.min(45, Math.max(10, 9 + (radiusKm / 25) * 36))}% - 8px)`,
              }}
            >
              <span className="size-1.5 rounded-full bg-mint dark:bg-forest animate-ping" />
              <span>{radiusKm} km Catchment</span>
            </div>

            {/* Radar Radius Catchment Visual Overlay Badge */}
            <div className="absolute top-3 left-3 bg-white/95 dark:bg-card/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-sage/40 dark:border-border shadow-xs flex items-center gap-2" style={{ zIndex: 11 }}>
              <div className="size-3 rounded-full bg-mint animate-ping" />
              <div className="text-[11px] font-bold text-forest dark:text-mint">
                {radiusKm}km Catchment Area • {selectedDistrict}, {selectedState}
              </div>
            </div>

            {/* Center Shop Pin Indicator */}
            <div className="absolute bottom-3 right-3 bg-white/95 dark:bg-card/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-sage/40 dark:border-border shadow-xs text-[10px] font-medium text-foreground flex items-center gap-1.5" style={{ zIndex: 11 }}>
              <MapPin className="size-3 text-red-500 fill-red-500" />
              <span>Coordinates: {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}</span>
            </div>
          </div>


          {/* Interactive Radius Controller & Trigger */}
          <div className="pt-2 flex flex-col lg:flex-row lg:items-center gap-6">
            <div className="flex-1">
              <div className="flex justify-between text-xs font-bold text-forest dark:text-foreground mb-2">
                <span>{t("scanner.geoScanRadius", "Geographic Scan Radius:")}</span>
                <span className="text-mint font-bold text-sm">{radiusKm} Kilometers Catchment</span>
              </div>
              <input
                type="range"
                min={1}
                max={25}
                value={radiusKm}
                onChange={(e) => setRadiusKm(Number(e.target.value))}
                className="w-full accent-forest dark:accent-mint cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5">
                <span>1 km (Hyper-Local)</span>
                <span>10 km (District Town)</span>
                <span>25 km (Regional Sub-District)</span>
              </div>
            </div>

            <button
              onClick={handleRunFeasibilityScan}
              disabled={isScanning}
              className="bg-orange hover:bg-orange-hover text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 disabled:opacity-50"
            >
              {isScanning ? (
                <>
                  <Spinner className="size-4 text-white" />
                  <span>Scanning local demographics & trade feeds...</span>
                </>
              ) : (
                <>
                  <ScanSearch className="size-4" />
                  <span>Run Deep Market Scan ({radiusKm}km Radius)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Loading State Skeleton */}
        {isScanning && (
          <div className="bg-white/40 dark:bg-card/40 rounded-2xl border border-sage/20 dark:border-border p-6 space-y-4">
            <Skeleton className="h-6 w-1/3" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-44 rounded-2xl" />
              <Skeleton className="h-44 rounded-2xl" />
              <Skeleton className="h-44 rounded-2xl" />
              <Skeleton className="h-44 rounded-2xl" />
            </div>
          </div>
        )}

        {/* SWOT Matrix 4-Quadrant Grid */}
        {!isScanning && scanResult && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {scanResult.dataSource}
              </span>
              <span className="text-xs font-bold text-forest dark:text-mint bg-mint-pale dark:bg-mint/20 px-3 py-1 rounded-full border border-mint/20 self-start sm:self-auto">
                {t("scanner.activeHeuristicsReport", "Active Feasibility Report")}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Strengths */}
              <div className="p-5 sm:p-6 rounded-2xl bg-white/40 dark:bg-card/40 border-2 border-mint/40 dark:border-mint/30 shadow-xs">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-mint/20">
                  <h4 className="font-serif font-bold text-forest dark:text-mint text-base flex items-center gap-2">
                    <TrendingUp className="size-5 text-mint" /> {t("scanner.strengthsTitle", "Strengths (Internal Advantage)")}
                  </h4>
                  <span className="text-[10px] uppercase font-bold bg-mint-pale dark:bg-mint/20 text-forest dark:text-mint px-2 py-0.5 rounded-md">
                    {t("scanner.highMoat", "High Moat")}
                  </span>
                </div>
                <ul className="space-y-2.5 text-xs sm:text-sm text-foreground/90 list-disc list-inside leading-relaxed">
                  {scanResult.strengths.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>

              {/* Weaknesses */}
              <div className="p-5 sm:p-6 rounded-2xl bg-white/40 dark:bg-card/40 border-2 border-orange/40 dark:border-orange/30 shadow-xs">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-orange/20">
                  <h4 className="font-serif font-bold text-orange text-base flex items-center gap-2">
                    <ShieldAlert className="size-5 text-orange" /> {t("scanner.weaknessesTitle", "Weaknesses (Internal Gaps)")}
                  </h4>
                  <span className="text-[10px] uppercase font-bold bg-orange/10 text-orange px-2 py-0.5 rounded-md">
                    {t("scanner.attention", "Attention")}
                  </span>
                </div>
                <ul className="space-y-2.5 text-xs sm:text-sm text-foreground/90 list-disc list-inside leading-relaxed">
                  {scanResult.weaknesses.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>

              {/* Opportunities */}
              <div className="p-5 sm:p-6 rounded-2xl bg-white/40 dark:bg-card/40 border-2 border-sage/50 dark:border-border shadow-xs">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-sage/20 dark:border-border">
                  <h4 className="font-serif font-bold text-forest dark:text-foreground text-base flex items-center gap-2">
                    <Lightbulb className="size-5 text-mint" /> {t("scanner.opportunitiesTitle", "Opportunities (Growth & Subsidies)")}
                  </h4>
                  <span className="text-[10px] uppercase font-bold bg-mint-pale dark:bg-mint/20 text-forest dark:text-mint px-2 py-0.5 rounded-md">
                    {t("scanner.highUpside", "High Upside")}
                  </span>
                </div>
                <ul className="space-y-2.5 text-xs sm:text-sm text-foreground/90 list-disc list-inside leading-relaxed">
                  {scanResult.opportunities.map((o, i) => (
                    <li key={i}>{o}</li>
                  ))}
                </ul>
              </div>

              {/* Threats */}
              <div className="p-5 sm:p-6 rounded-2xl bg-white/40 dark:bg-card/40 border-2 border-red-200 dark:border-red-900/40 shadow-xs">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-red-100 dark:border-red-900/30">
                  <h4 className="font-serif font-bold text-destructive text-base flex items-center gap-2">
                    <ShieldAlert className="size-5 text-destructive" /> {t("scanner.threatsTitle", "External Market Threats")}
                  </h4>
                  <span className="text-[10px] uppercase font-bold bg-red-100 dark:bg-red-950/40 text-destructive px-2 py-0.5 rounded-md">
                    {t("scanner.riskFactor", "Risk Factor")}
                  </span>
                </div>
                <ul className="space-y-2.5 text-xs sm:text-sm text-foreground/90 list-disc list-inside leading-relaxed">
                  {scanResult.threats.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Hyper-Local Competitor Benchmark Grid */}
            {scanResult.competitors && scanResult.competitors.length > 0 && (
              <div className="bg-white/40 dark:bg-card/40 rounded-2xl border border-sage/20 dark:border-border p-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <div>
                    <h3 className="font-serif font-bold text-lg text-forest dark:text-foreground flex items-center gap-2">
                      <Store className="size-5 text-mint" /> Hyper-Local Competitor Landscape
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Verified rival businesses competing in {profile?.category || "this sector"} within {radiusKm}km catchment radius
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-forest dark:text-mint bg-mint-pale dark:bg-mint/20 px-3 py-1 rounded-full border border-mint/20 self-start sm:self-auto">
                    {scanResult.competitors.length} Rivals Mapped
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {scanResult.competitors.map((comp, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-white/70 dark:bg-muted/30 border border-sage/30 dark:border-border flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <h5 className="text-xs sm:text-sm font-bold text-foreground line-clamp-1">
                            {comp.name}
                          </h5>
                          <span
                            className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md shrink-0 ${
                              comp.threatLevel === "High"
                                ? "bg-red-100 dark:bg-red-950/50 text-destructive border border-red-200 dark:border-red-900/30"
                                : comp.threatLevel === "Medium"
                                ? "bg-orange/10 text-orange border border-orange/20"
                                : "bg-mint-pale dark:bg-mint/20 text-forest dark:text-mint border border-mint/20"
                            }`}
                          >
                            {comp.threatLevel} Threat
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1 mb-2">
                          <MapPin className="size-3 text-mint shrink-0" />
                          <span className="line-clamp-1">{comp.distance} • {comp.landmark}</span>
                        </p>
                        <div className="flex flex-wrap gap-1.5 text-[10px]">
                          <span className="bg-sage/20 dark:bg-muted px-2 py-0.5 rounded text-foreground font-medium">
                            {comp.speciality}
                          </span>
                          <span className="bg-sage/20 dark:bg-muted px-2 py-0.5 rounded text-foreground font-medium">
                            {comp.priceRange}
                          </span>
                        </div>
                      </div>
                      {comp.differentiator && (
                        <p className="text-[11px] text-ink-muted dark:text-muted-foreground pt-2 border-t border-sage/20 dark:border-border/60 italic leading-snug">
                          {comp.differentiator}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actionable Strategic Roadmap */}
            <div className="bg-white/40 dark:bg-card/40 rounded-2xl border border-sage/20 dark:border-border p-6 shadow-xs">
              <h3 className="font-serif font-bold text-lg text-forest dark:text-foreground flex items-center gap-2 mb-1">
                <Layers className="size-5 text-mint" /> {t("scanner.roadmapTitle", "Strategic Action Roadmap")}
              </h3>
              <p className="text-xs text-muted-foreground mb-5">
                {t("scanner.roadmapSubtitle", "Targeted steps recommended to leverage local market strengths and mitigate structural risks.")}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {scanResult.actionPlan.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-cream/70 dark:bg-muted/40 border border-sage/30 dark:border-border flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-[10px] uppercase font-bold text-forest dark:text-mint bg-mint-pale dark:bg-mint/15 px-2.5 py-0.5 rounded-md inline-block mb-2">
                        {item.time}
                      </span>
                      <p className="text-xs font-semibold text-foreground leading-snug mb-2">
                        {item.action}
                      </p>
                    </div>
                    <div className="pt-2 border-t border-sage/20 dark:border-border/60 text-[11px] text-muted-foreground flex items-center gap-1.5 font-medium">
                      <CheckCircle2 className="size-3.5 text-mint shrink-0" />
                      <span>{item.impact}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Empty State when no scan has been performed yet */}
        {!isScanning && !scanResult && (
          <div className="p-8 sm:p-12 rounded-2xl bg-white/40 dark:bg-card/40 border border-sage/30 dark:border-border text-center flex flex-col items-center justify-center space-y-4 shadow-xs">
            <div className="size-16 rounded-2xl bg-mint-pale dark:bg-mint/20 text-forest dark:text-mint flex items-center justify-center shadow-xs">
              <ScanSearch className="size-8" />
            </div>
            <div className="max-w-md space-y-1.5">
              <h3 className="font-serif font-bold text-lg text-foreground">
                No Feasibility Scan on Record
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Select your target district and catchment radius above, then click &quot;Run Deep Market Scan&quot; to fetch live APMC Mandi rates, UDYAM registration saturation, and verified local competitors.
              </p>
            </div>
            <button
              onClick={handleRunFeasibilityScan}
              className="bg-orange hover:bg-orange-hover text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <ScanSearch className="size-4" />
              <span>Run Deep Market Scan ({radiusKm}km Radius)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
