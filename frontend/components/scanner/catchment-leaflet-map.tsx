"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Crosshair,
  Store,
  Compass,
} from "lucide-react";

export interface CompetitorMapItem {
  name: string;
  distance: string;
  landmark: string;
  speciality: string;
  priceRange: string;
  threatLevel: "High" | "Medium" | "Low";
  differentiator?: string;
  lat?: number;
  lng?: number;
  rating?: number;
  reviews?: number;
}

export interface CatchmentLeafletMapProps {
  coords: { lat: number; lng: number };
  radiusKm: number;
  selectedDistrict: string;
  selectedState: string;
  competitors?: CompetitorMapItem[];
  allShops?: CompetitorMapItem[];
  className?: string;
}

// ─────────────────────────────────────────────────────────────
// ATHERIS TILE CONFIGURATIONS (Google Maps Tiles via Leaflet)
// ─────────────────────────────────────────────────────────────
const TILE_CONFIGS: Record<
  string,
  { url: string; label: string; subdomains?: string[] }
> = {
  google: {
    url: "https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
    label: "G-MAP",
    subdomains: ["mt0", "mt1", "mt2", "mt3"],
  },
  satellite: {
    url: "https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
    label: "SAT",
    subdomains: ["mt0", "mt1", "mt2", "mt3"],
  },
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    label: "DARK",
    subdomains: ["a", "b", "c", "d"],
  },
};

export default function CatchmentLeafletMap({
  coords,
  radiusKm,
  selectedDistrict,
  selectedState,
  competitors = [],
  allShops = [],
  className = "",
}: CatchmentLeafletMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const circleLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const markersLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const outerCircleRef = useRef<L.Circle | null>(null);

  // Default tile is "google" (Atheris setup)
  const [activeTile, setActiveTile] = useState<string>("google");
  const [currentZoom, setCurrentZoom] = useState<number>(12);
  const [hoveredPlaceName, setHoveredPlaceName] = useState<string | null>(null);
  const [showAllShops, setShowAllShops] = useState<boolean>(true);

  // ─────────────────────────────────────────────────────────────
  // 1. INITIALIZE MAP (Once on mount)
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [coords.lat, coords.lng],
      zoom: 12,
      zoomControl: false,
      attributionControl: false,
    });

    // Atheris Zoom control placement (Dedicated clean bottom-right)
    L.control.zoom({ position: "bottomright" }).addTo(map);

    // Atheris Metric Ground Scale Bar (Shows 30m / 200m / 500m ground scale at bottom-left)
    L.control
      .scale({
        imperial: false,
        metric: true,
        position: "bottomleft",
        maxWidth: 120,
      })
      .addTo(map);

    // Set default Google Maps tile layer (Clean attribution-free overlay)
    const cfg = TILE_CONFIGS[activeTile] || TILE_CONFIGS.google;
    const tileLayer = L.tileLayer(cfg.url, {
      maxZoom: 20,
      subdomains: cfg.subdomains || ["mt0", "mt1", "mt2", "mt3"],
    }).addTo(map);

    tileLayerRef.current = tileLayer;

    // Layer groups
    const circleGroup = L.layerGroup().addTo(map);
    const markersGroup = L.layerGroup().addTo(map);
    circleLayerGroupRef.current = circleGroup;
    markersLayerGroupRef.current = markersGroup;

    // Zoom listener for dynamic zoom-dependent labels
    map.on("zoomend", () => {
      setCurrentZoom(map.getZoom());
    });

    mapInstanceRef.current = map;

    // ResizeObserver to ensure container fills 100% without tile distortion
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // ─────────────────────────────────────────────────────────────
  // 2. TILE LAYER SWITCHER (Google, Satellite, Dark)
  // ─────────────────────────────────────────────────────────────
  const switchTiles = useCallback((key: string) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const cfg = TILE_CONFIGS[key] || TILE_CONFIGS.google;
    const newLayer = L.tileLayer(cfg.url, {
      maxZoom: 20,
      subdomains: cfg.subdomains || ["mt0", "mt1", "mt2", "mt3"],
    }).addTo(map);

    tileLayerRef.current = newLayer;
    setActiveTile(key);
  }, []);

  // ─────────────────────────────────────────────────────────────
  // 3. RENDER GEODESIC CATCHMENT BOUNDARY
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    const circleGroup = circleLayerGroupRef.current;
    if (!map || !circleGroup) return;

    circleGroup.clearLayers();

    const centerLatLng: [number, number] = [coords.lat, coords.lng];
    const radiusMeters = radiusKm * 1000;

    // Outer Geodesic Catchment Boundary
    const outerCircle = L.circle(centerLatLng, {
      radius: radiusMeters,
      color: "#059669",
      weight: 2,
      dashArray: "6, 6",
      fillColor: "#10b981",
      fillOpacity: activeTile === "satellite" ? 0.22 : 0.12,
    });

    // Inner Concentric Ring (50% radius)
    const innerCircle = L.circle(centerLatLng, {
      radius: radiusMeters * 0.5,
      color: "#059669",
      weight: 1.2,
      dashArray: "3, 4",
      fill: false,
      opacity: 0.5,
    });

    outerCircle.addTo(circleGroup);
    innerCircle.addTo(circleGroup);
    outerCircleRef.current = outerCircle;

    // Smoothly pan & zoom to fit the entire catchment circle
    map.fitBounds(outerCircle.getBounds(), {
      padding: [45, 45],
      maxZoom: 15,
      animate: true,
    });
  }, [coords.lat, coords.lng, radiusKm, activeTile]);

  // ─────────────────────────────────────────────────────────────
  // 4. TWO-TIER IN-PLACE REPLACEMENT PIPELINE:
  //    • All shops from fast search are plotted immediately.
  //    • When AI finishes, matching Lat/Lng pins upgrade into AI Threat Badges!
  //    • Remaining non-ranked shops stay as normal ambient pins.
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerGroupRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    // ── CENTER TARGET LOCATION PIN (Target Enterprise) ──
    const centerIcon = L.divIcon({
      className: "atheris-center-icon",
      html: `
        <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; transform: translate(-50%, -50%);">
          <div style="position: absolute; inset: -4px; border-radius: 9999px; background: rgba(5, 150, 105, 0.35); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position: relative; width: 28px; height: 28px; border-radius: 9999px; background: #059669; color: white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(0,0,0,0.4); border: 2.5px solid white;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="2" x2="12" y2="6"/>
              <line x1="12" y1="18" x2="12" y2="22"/>
              <line x1="2" y1="12" x2="6" y2="12"/>
              <line x1="18" y1="12" x2="22" y2="12"/>
            </svg>
          </div>
        </div>
      `,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });

    const centerMarker = L.marker([coords.lat, coords.lng], {
      icon: centerIcon,
      zIndexOffset: 1200,
    });

    centerMarker.bindTooltip(
      `<strong>🎯 Target Enterprise Location</strong><br/>` +
        `<span style="color:#10b981;font-weight:700;">${selectedDistrict}, ${selectedState}</span><br/>` +
        `<span style="font-size:10px;color:#aaa;">Catchment: ${radiusKm}km radius</span>`,
      { className: "atheris-station-tooltip", direction: "top", offset: [0, -20] }
    );
    centerMarker.addTo(markersGroup);

    // Helper: Render an AI-Ranked Competitor Pin
    const renderRankedCompetitor = (comp: CompetitorMapItem, lat: number, lng: number) => {
      const isHighThreat = comp.threatLevel === "High";
      const isMedThreat = comp.threatLevel === "Medium";

      const threatColor = isHighThreat
        ? "#ef4444"
        : isMedThreat
          ? "#f59e0b"
          : "#10b981";

      const threatBg = isHighThreat
        ? "linear-gradient(135deg, #ef4444, #dc2626)"
        : isMedThreat
          ? "linear-gradient(135deg, #f59e0b, #d97706)"
          : "linear-gradient(135deg, #10b981, #059669)";

      const bubbleContent = comp.rating
        ? `${comp.rating.toFixed(1)}★`
        : isHighThreat
          ? "HIGH"
          : isMedThreat
            ? "MED"
            : "LOW";

      const showLabel = currentZoom >= 13;
      const cleanName = comp.name.length > 22 ? `${comp.name.slice(0, 20)}…` : comp.name;

      const compIcon = L.divIcon({
        className: "atheris-div-icon",
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; transform: translate(-50%, -50%); cursor: pointer;">
            <div style="
              background: ${threatBg};
              color: white;
              font-size: 10px;
              font-weight: 800;
              padding: 2px 7px;
              border-radius: 9999px;
              box-shadow: 0 4px 10px rgba(0,0,0,0.35);
              border: 1.5px solid white;
              white-space: nowrap;
              letter-spacing: 0.02em;
              display: flex;
              align-items: center;
              gap: 2px;
            ">
              ${bubbleContent}
            </div>
            ${
              showLabel
                ? `<div style="
                    margin-top: 3px;
                    background: rgba(14, 16, 23, 0.92);
                    backdrop-filter: blur(8px);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    border-radius: 4px;
                    padding: 1px 5px;
                    color: #f3f4f6;
                    font-size: 9px;
                    font-weight: 700;
                    white-space: nowrap;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                    pointer-events: none;
                  ">${cleanName}</div>`
                : ""
            }
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const compMarker = L.marker([lat, lng], {
        icon: compIcon,
        zIndexOffset: isHighThreat ? 950 : 850,
      });

      const ratingText = comp.rating
        ? `<span style="color:#fbbf24;font-weight:700;">${comp.rating}★</span> (${comp.reviews || 0} reviews) · `
        : "";

      compMarker.bindTooltip(
        `<div style="min-width: 170px; max-width: 240px; font-family: inherit;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px; margin-bottom:4px;">
            <strong style="color:#fff; font-size:12px; line-height:1.2;">${comp.name}</strong>
            <span style="font-size:8px; font-weight:800; text-transform:uppercase; color:white; background:${threatColor}; padding:1px 5px; border-radius:3px;">
              ${comp.threatLevel}
            </span>
          </div>
          <div style="font-size:10px; color:#9ca3af; margin-bottom:4px;">
            📍 ${comp.distance} • ${comp.landmark}
          </div>
          <div style="font-size:10px; color:#d1d5db; margin-bottom:2px;">
            ${ratingText}<span style="color:#10b981; font-weight:600;">${comp.speciality}</span>
          </div>
          <div style="font-size:9px; color:#9ca3af;">
            Price: ${comp.priceRange}
          </div>
          ${
            comp.differentiator
              ? `<div style="font-size:9px; color:#6ee7b7; font-style:italic; margin-top:4px; border-top:1px solid rgba(255,255,255,0.1); padding-top:3px;">
                  ${comp.differentiator}
                 </div>`
              : ""
          }
        </div>`,
        { className: "atheris-station-tooltip", direction: "top", offset: [0, -18] }
      );

      compMarker.on("mouseover", () => setHoveredPlaceName(comp.name));
      compMarker.on("mouseout", () => setHoveredPlaceName(null));
      compMarker.addTo(markersGroup);
    };

    // Helper: Render a Standard Ambient Shop Pin
    const renderAmbientShop = (shop: CompetitorMapItem, lat: number, lng: number) => {
      const showLabel = currentZoom >= 13;
      const cleanName = shop.name.length > 20 ? `${shop.name.slice(0, 18)}…` : shop.name;
      const ratingLabel = shop.rating ? `${shop.rating.toFixed(1)}★` : "SHOP";

      const shopIcon = L.divIcon({
        className: "atheris-div-icon",
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; transform: translate(-50%, -50%); cursor: pointer;">
            <div style="
              background: rgba(15, 23, 42, 0.92);
              backdrop-filter: blur(6px);
              color: #38bdf8;
              font-size: 9px;
              font-weight: 700;
              padding: 1.5px 6px;
              border-radius: 9999px;
              box-shadow: 0 3px 8px rgba(0,0,0,0.4);
              border: 1.5px solid #0284c7;
              white-space: nowrap;
              display: flex;
              align-items: center;
              gap: 3px;
            ">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
                <path d="M3 6h18"/>
                <path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
              <span>${ratingLabel}</span>
            </div>
            ${
              showLabel
                ? `<div style="
                    margin-top: 2px;
                    background: rgba(15, 23, 42, 0.9);
                    backdrop-filter: blur(6px);
                    border: 1px solid rgba(255, 255, 255, 0.12);
                    border-radius: 4px;
                    padding: 1px 4px;
                    color: #cbd5e1;
                    font-size: 8.5px;
                    font-weight: 600;
                    white-space: nowrap;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                    pointer-events: none;
                  ">${cleanName}</div>`
                : ""
            }
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const shopMarker = L.marker([lat, lng], {
        icon: shopIcon,
        zIndexOffset: 650,
      });

      const ratingText = shop.rating
        ? `<span style="color:#38bdf8;font-weight:700;">${shop.rating}★</span> (${shop.reviews || 0} reviews) · `
        : "";

      shopMarker.bindTooltip(
        `<div style="min-width: 160px; max-width: 230px; font-family: inherit;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:6px; margin-bottom:3px;">
            <strong style="color:#fff; font-size:11.5px; line-height:1.2;">${shop.name}</strong>
            <span style="font-size:8px; font-weight:700; color:#38bdf8; background:rgba(2,132,199,0.25); border:1px solid rgba(56,189,248,0.4); padding:1px 4px; border-radius:3px;">
              Nearby Shop
            </span>
          </div>
          <div style="font-size:9.5px; color:#94a3af; margin-bottom:3px;">
            📍 ${shop.distance || "In catchment"} • ${shop.landmark}
          </div>
          <div style="font-size:9.5px; color:#e2e8f0;">
            ${ratingText}<span style="color:#38bdf8; font-weight:600;">${shop.speciality || "Local Commercial Establishment"}</span>
          </div>
        </div>`,
        { className: "atheris-station-tooltip", direction: "top", offset: [0, -18] }
      );

      shopMarker.on("mouseover", () => setHoveredPlaceName(shop.name));
      shopMarker.on("mouseout", () => setHoveredPlaceName(null));
      shopMarker.addTo(markersGroup);
    };

    // Set of AI-competitor names that got matched & upgraded in-place
    const upgradedCompKeys = new Set<string>();

    // ── STEP 1: Loop through allShops (Instant SerpApi places) ──
    if (allShops && allShops.length > 0) {
      allShops.forEach((shop, sIdx) => {
        let sLat = shop.lat;
        let sLng = shop.lng;

        if (typeof sLat !== "number" || typeof sLng !== "number" || isNaN(sLat) || isNaN(sLng)) {
          let distKm = 0.85;
          if (shop.distance) {
            const match = shop.distance.match(/([\d.]+)\s*(km|m)/i);
            if (match) {
              const val = parseFloat(match[1]);
              distKm = match[2].toLowerCase() === "m" ? val / 1000 : val;
            }
          }
          distKm = Math.min(distKm, radiusKm * 0.85);
          const goldenAngle = 137.5;
          const angle = (((sIdx + 7) * goldenAngle) * Math.PI) / 180;
          const latOffset = (distKm / 111) * Math.cos(angle);
          const lngOffset =
            (distKm / (111 * Math.cos((coords.lat * Math.PI) / 180))) * Math.sin(angle);
          sLat = coords.lat + latOffset;
          sLng = coords.lng + lngOffset;
        }

        // Match against AI-ranked competitors by Lat/Lng proximity OR name match
        const matchedComp = (competitors || []).find((c) => {
          if (
            typeof c.lat === "number" &&
            typeof c.lng === "number" &&
            !isNaN(c.lat) &&
            !isNaN(c.lng)
          ) {
            const dLat = Math.abs(c.lat - sLat);
            const dLng = Math.abs(c.lng - sLng);
            if (dLat < 0.0008 && dLng < 0.0008) {
              return true;
            }
          }
          const cName = c.name.toLowerCase().trim();
          const sName = shop.name.toLowerCase().trim();
          return cName.length > 3 && (cName === sName || cName.includes(sName) || sName.includes(cName));
        });

        if (matchedComp) {
          upgradedCompKeys.add(matchedComp.name.toLowerCase().trim());
          // In-Place Replacement: Replace normal marker with the AI-Ranked Competitor Pin at same Lat/Lng!
          renderRankedCompetitor(matchedComp, sLat, sLng);
        } else if (showAllShops) {
          // Normal Ambient Shop Pin
          renderAmbientShop(shop, sLat, sLng);
        }
      });
    }

    // ── STEP 2: Render any AI-ranked competitors that weren't in allShops ──
    if (competitors && competitors.length > 0) {
      competitors.forEach((comp, idx) => {
        if (upgradedCompKeys.has(comp.name.toLowerCase().trim())) {
          return; // Already upgraded in-place at identical Lat/Lng!
        }

        let compLat = comp.lat;
        let compLng = comp.lng;

        if (
          typeof compLat !== "number" ||
          typeof compLng !== "number" ||
          isNaN(compLat) ||
          isNaN(compLng)
        ) {
          let distKm = 0.8;
          if (comp.distance) {
            const match = comp.distance.match(/([\d.]+)\s*(km|m)/i);
            if (match) {
              const val = parseFloat(match[1]);
              distKm = match[2].toLowerCase() === "m" ? val / 1000 : val;
            }
          }
          distKm = Math.min(distKm, radiusKm * 0.85);
          const goldenAngle = 137.5;
          const angle = ((idx * goldenAngle) * Math.PI) / 180;
          const latOffset = (distKm / 111) * Math.cos(angle);
          const lngOffset =
            (distKm / (111 * Math.cos((coords.lat * Math.PI) / 180))) *
            Math.sin(angle);
          compLat = coords.lat + latOffset;
          compLng = coords.lng + lngOffset;
        }

        renderRankedCompetitor(comp, compLat, compLng);
      });
    }
  }, [coords.lat, coords.lng, radiusKm, selectedDistrict, selectedState, competitors, allShops, currentZoom, activeTile, showAllShops]);

  // Re-center handler with safe bounds calculation
  const handleRecenter = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (outerCircleRef.current) {
      try {
        map.fitBounds(outerCircleRef.current.getBounds(), {
          padding: [45, 45],
          maxZoom: 15,
          animate: true,
        });
        return;
      } catch (err) {
        console.warn("[catchment-map] Error fitting outerCircle bounds:", err);
      }
    }

    const centerLatLng = L.latLng(coords.lat, coords.lng);
    map.fitBounds(centerLatLng.toBounds(radiusKm * 1000 * 2), {
      padding: [45, 45],
      maxZoom: 15,
      animate: true,
    });
  };

  const totalRivalsCount = competitors.length;
  const totalShopsCount = allShops.length > 0 ? allShops.length : competitors.length;
  const ambientShopsCount = Math.max(0, totalShopsCount - totalRivalsCount);

  return (
    <div
      className={`relative w-full h-72 sm:h-96 rounded-2xl overflow-hidden border border-sage/40 dark:border-border shadow-md bg-[#0c0e14] ${className}`}
    >
      {/* ── LEAFLET DOM CONTAINER ── */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* ── ATHERIS CENTER CROSSHAIR OVERLAY (Clean HUD) ── */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none opacity-40 hover:opacity-80 transition-opacity"
        style={{ filter: "drop-shadow(0 0 6px rgba(16, 185, 129, 0.4))" }}
      >
        <svg width="40" height="40" viewBox="0 0 60 60" fill="none">
          <line x1="30" y1="0" x2="30" y2="18" stroke="#10b981" strokeWidth="1.5" />
          <line x1="30" y1="42" x2="30" y2="60" stroke="#10b981" strokeWidth="1.5" />
          <line x1="0" y1="30" x2="18" y2="30" stroke="#10b981" strokeWidth="1.5" />
          <line x1="42" y1="30" x2="60" y2="30" stroke="#10b981" strokeWidth="1.5" />
          <circle cx="30" cy="30" r="3" stroke="#10b981" strokeWidth="1.5" fill="none" />
        </svg>
      </div>

      {/* ── FLOATING TOP-LEFT: CATCHMENT STATUS BADGE & RADAR TOGGLE ── */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
        <div className="bg-black/75 dark:bg-card/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 dark:border-border/80 shadow-md flex items-center gap-2 pointer-events-none">
          <div className="size-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <div className="text-[11px] font-bold text-white dark:text-emerald-400 font-mono tracking-tight">
            {radiusKm}km Radius • {selectedDistrict}, {selectedState}
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {totalRivalsCount > 0 && (
            <div className="bg-black/75 dark:bg-card/85 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 dark:border-border/60 shadow-xs flex items-center gap-1.5">
              <Store className="size-3 text-amber-400 shrink-0" />
              <span className="text-[10px] font-bold text-zinc-200">
                {totalRivalsCount} Direct Rivals Ranked
              </span>
            </div>
          )}

          {ambientShopsCount > 0 && (
            <button
              onClick={() => setShowAllShops((prev) => !prev)}
              title="Toggle surrounding catchment shops"
              className={`backdrop-blur-md px-2.5 py-1 rounded-lg border shadow-xs flex items-center gap-1.5 text-[10px] font-bold transition-all cursor-pointer ${
                showAllShops
                  ? "bg-sky-950/80 border-sky-400/60 text-sky-300"
                  : "bg-black/75 border-white/10 text-zinc-400 hover:text-white hover:border-white/30"
              }`}
            >
              <Compass className="size-3 text-sky-400 shrink-0" />
              <span>
                {showAllShops ? "✓ " : ""}+{ambientShopsCount} Similar Shops
              </span>
            </button>
          )}
        </div>

        {hoveredPlaceName && (
          <div className="bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold px-2.5 py-0.5 rounded-md shadow-xs animate-in fade-in duration-150 self-start pointer-events-none">
            {hoveredPlaceName}
          </div>
        )}
      </div>

      {/* ── FLOATING TOP-RIGHT: RE-CENTER BUTTON ── */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
        <button
          onClick={handleRecenter}
          title="Re-center Catchment Area"
          className="px-2.5 py-1.5 bg-black/75 dark:bg-card/85 backdrop-blur-md hover:bg-black/90 border border-white/15 dark:border-border/80 rounded-xl text-white font-bold text-[10px] shadow-sm transition-all flex items-center gap-1.5 cursor-pointer font-mono"
        >
          <Crosshair className="size-3 text-emerald-400" />
          <span>RE-CENTER</span>
        </button>
      </div>

      {/* ── FLOATING BOTTOM-LEFT: ATHERIS TILE SWITCHER (G-MAP / SAT / DARK) ABOVE 30M SCALE MARK ── */}
      <div className="absolute bottom-9.5 left-2.5 z-10 flex items-center gap-1 bg-black/80 dark:bg-card/90 backdrop-blur-md p-1 rounded-lg border border-white/10 dark:border-border/80 shadow-md">
        {Object.entries(TILE_CONFIGS).map(([key, cfg]) => {
          const isActive = activeTile === key;
          return (
            <button
              key={key}
              onClick={() => switchTiles(key)}
              className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded transition-all cursor-pointer ${
                isActive
                  ? "bg-emerald-500/25 border border-emerald-400/80 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                  : "text-zinc-400 hover:text-white hover:bg-white/10"
              }`}
            >
              {cfg.label}
            </button>
          );
        })}
      </div>

      {/* ── FLOATING BOTTOM-LEFT: HUD COORDINATES BADGE (Beside scale bar) ── */}
      <div className="absolute bottom-2 left-32 z-10 pointer-events-none hidden sm:flex items-center gap-1.5 bg-black/75 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10 text-[9px] font-mono text-zinc-400">
        <span className="text-emerald-400">LAT:</span> {coords.lat.toFixed(4)}
        <span className="text-emerald-400 ml-1">LON:</span> {coords.lng.toFixed(4)}
      </div>

      {/* ── ATHERIS HUD TOOLTIP & POPUP GLOBAL STYLES ── */}
      <style jsx global>{`
        /* Atheris Dark Leaflet Container */
        .leaflet-container {
          background-color: #0c0e14 !important;
        }

        /* Atheris Custom Div Icon */
        .atheris-div-icon,
        .atheris-center-icon {
          background: transparent !important;
          border: none !important;
        }

        /* Atheris Station Hover Tooltip */
        .leaflet-tooltip.atheris-station-tooltip {
          background: rgba(14, 16, 23, 0.96) !important;
          backdrop-filter: blur(12px) !important;
          border: 1px solid rgba(16, 185, 129, 0.35) !important;
          border-radius: 8px !important;
          color: #f3f4f6 !important;
          padding: 8px 10px !important;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5) !important;
          font-family: inherit !important;
          line-height: 1.4 !important;
        }
        .leaflet-tooltip.atheris-station-tooltip::before {
          border-top-color: rgba(14, 16, 23, 0.96) !important;
        }

        /* Atheris Control Zoom buttons (Completely unobstructed at bottom-right) */
        .leaflet-control-zoom {
          margin-right: 12px !important;
          margin-bottom: 12px !important;
          border: none !important;
        }
        .leaflet-control-zoom a {
          background: rgba(14, 16, 23, 0.9) !important;
          color: #10b981 !important;
          border: 1px solid rgba(255, 255, 255, 0.15) !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4) !important;
        }
        .leaflet-control-zoom a:hover {
          background: rgba(16, 185, 129, 0.25) !important;
          color: #fff !important;
        }

        /* Atheris Metric Ground Scale Bar */
        .leaflet-control-scale {
          margin-left: 10px !important;
          margin-bottom: 8px !important;
        }
        .leaflet-control-scale-line {
          background: rgba(12, 14, 20, 0.88) !important;
          backdrop-filter: blur(8px) !important;
          border: 1px solid rgba(16, 185, 129, 0.4) !important;
          border-top: none !important;
          color: #34d399 !important;
          font-size: 9px !important;
          font-family: monospace !important;
          font-weight: 700 !important;
          padding: 1px 6px !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5) !important;
          letter-spacing: 0.05em !important;
        }
      `}</style>
    </div>
  );
}
