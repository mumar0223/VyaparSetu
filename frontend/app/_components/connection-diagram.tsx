"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  Landmark,
  TrendingUp,
  Building2,
  Truck,
  BookOpen,
  Users,
  PhoneCall,
  ShieldCheck,
  Coins,
  QrCode,
  Bot,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/brand-icons";

type NodeDef = {
  id: string;
  label: string;
  sublabel?: string;
  x: number; // percent
  y: number; // percent
  color?: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  big?: boolean;
};

const VB_W = 1000;
const VB_H = 600;

// Adjust this multiplier to scale all node distances (Close, Medium, Far) outward or inward.
const DISTANCE_SCALE = 1.25;

const R_LEVELS = {
  close: { rx: 250 * DISTANCE_SCALE, ry: 150 * DISTANCE_SCALE },
  medium: { rx: 310 * DISTANCE_SCALE, ry: 200 * DISTANCE_SCALE },
  far: { rx: 400 * DISTANCE_SCALE, ry: 280 * DISTANCE_SCALE },
  custom: { rx: 350 * DISTANCE_SCALE, ry: 240 * DISTANCE_SCALE },
};

const nodeConfigs = [
  {
    id: "github",
    label: "Govt Schemes",
    sublabel: "PM Mudra & SVANidhi",
    angle: -30,
    rType: "far" as const,
    color: "#10b981",
    Icon: Landmark,
  },
  {
    id: "wordpress",
    label: "Mandi Rates",
    sublabel: "e-NAM Pricing",
    angle: -60,
    rType: "close" as const,
    color: "#f59e0b",
    Icon: TrendingUp,
  },
  {
    id: "webflow",
    label: "Banks & NBFCs",
    sublabel: "Credit Underwriting",
    angle: -90,
    rType: "medium" as const,
    color: "#059669",
    Icon: Building2,
  },
  {
    id: "wix",
    label: "Suppliers",
    sublabel: "Bulk Procurement",
    angle: -120,
    rType: "custom" as const,
    color: "#f59e0b",
    Icon: Truck,
  },
  {
    id: "squarespace",
    label: "Digital Khata",
    sublabel: "Sales & Turnover",
    angle: -150,
    rType: "close" as const,
    color: "#10b981",
    Icon: BookOpen,
  },
  {
    id: "shopify",
    label: "Local Buyers",
    sublabel: "B2B Trade Network",
    angle: -170,
    rType: "close" as const,
    color: "#f59e0b",
    Icon: Users,
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    sublabel: "Voice & Chat Input",
    angle: 135,
    rType: "medium" as const,
    color: "#22c55e",
    Icon: WhatsAppIcon,
  },
  {
    id: "slack",
    label: "Voice IVR",
    sublabel: "Regional Dialect",
    angle: 120,
    rType: "close" as const,
    color: "#10b981",
    Icon: PhoneCall,
  },
  {
    id: "facebook",
    label: "Udyam Portal",
    sublabel: "MSME Certificate",
    angle: 90,
    rType: "medium" as const,
    color: "#059669",
    Icon: ShieldCheck,
  },
  {
    id: "instagram",
    label: "SHG Linkage",
    sublabel: "NABARD Federation",
    angle: 60,
    rType: "far" as const,
    color: "#f59e0b",
    Icon: Users,
  },
  {
    id: "linkedin",
    label: "Credit Scoring",
    sublabel: "P&L Balance Sheet",
    angle: 30,
    rType: "close" as const,
    color: "#10b981",
    Icon: Coins,
  },
  {
    id: "x",
    label: "UPI Sync",
    sublabel: "Cash Flow Ledger",
    angle: 0,
    rType: "medium" as const,
    color: "#f59e0b",
    Icon: QrCode,
  },
];

const nodes: NodeDef[] = [
  // Center Orchestrator
  {
    id: "agent",
    label: "VyaparSetu AI",
    sublabel: "Advisory & Credit Engine",
    x: 50,
    y: 50,
    Icon: Bot,
    big: true,
    color: "#10b981",
  },
  ...nodeConfigs.map((config) => {
    const rad = (config.angle * Math.PI) / 180;
    const dims = R_LEVELS[config.rType];
    let px = 500 + dims.rx * Math.cos(rad);
    let py = 300 + dims.ry * Math.sin(rad);

    // Minor visual nudges to clear hero text without breaking diagram composition (1000x600 viewBox)
    if (config.id === "whatsapp") { px += 30; py += 85; }
    if (config.id === "slack") { px += 20; py += 15; } // Voice IVR
    if (config.id === "shopify") { px += 70; py += 25; } // Local Buyers

    return {
      id: config.id,
      label: config.label,
      sublabel: config.sublabel,
      x: (px / 1000) * 100,
      y: (py / 600) * 100,
      color: config.color,
      Icon: config.Icon,
    };
  }),
];

const edges: [string, string][] = [
  ["whatsapp", "agent"],
  ["slack", "agent"],
  ["agent", "github"],
  ["agent", "wordpress"],
  ["agent", "webflow"],
  ["agent", "wix"],
  ["agent", "squarespace"],
  ["agent", "shopify"],
  ["agent", "facebook"],
  ["agent", "instagram"],
  ["agent", "linkedin"],
  ["agent", "x"],
];

const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]));

function toVb(n: NodeDef) {
  return { x: (n.x / 100) * VB_W, y: (n.y / 100) * VB_H };
}

// Draw a clean straight line from node to node in the 360-degree layout
function buildPath(a: NodeDef, b: NodeDef) {
  const p1 = toVb(a);
  const p2 = toVb(b);
  return `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`;
}

export function ConnectionDiagram() {
  const [cycleIndex, setCycleIndex] = useState(0);

  // Shifting cycle combinations every 4s (matching CSS timing)
  useEffect(() => {
    const interval = setInterval(() => {
      setCycleIndex((prev) => prev + 1);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const CHAT_HUBS = ["whatsapp", "slack"];
  const WEBSITE_HUBS = [
    "github",
    "wordpress",
    "webflow",
    "wix",
    "squarespace",
    "shopify",
  ];
  const SOCIAL_HUBS = ["facebook", "instagram", "linkedin", "x"];

  const activeChat = CHAT_HUBS[cycleIndex % CHAT_HUBS.length];
  const activeWebsite = WEBSITE_HUBS[(cycleIndex + 1) % WEBSITE_HUBS.length];
  const activeSocial = SOCIAL_HUBS[(cycleIndex + 2) % SOCIAL_HUBS.length];

  return (
    <div className="relative aspect-1000/600 w-full pointer-events-none select-none">
      <style>{`
        @keyframes fill-inward {
          0% { stroke-dashoffset: 100; opacity: 0; }
          5% { opacity: 1; }
          35% { stroke-dashoffset: 0; opacity: 1; }
          85% { opacity: 1; }
          100% { stroke-dashoffset: 0; opacity: 0; }
        }
        @keyframes fill-outward {
          0% { stroke-dashoffset: 100; opacity: 0; }
          35% { stroke-dashoffset: 100; opacity: 0; }
          40% { opacity: 1; }
          70% { stroke-dashoffset: 0; opacity: 1; }
          85% { opacity: 1; }
          100% { stroke-dashoffset: 0; opacity: 0; }
        }
        .animate-flow-inward {
          stroke-dasharray: 100;
          animation: fill-inward 4s ease-in-out infinite;
        }
        .animate-flow-outward {
          stroke-dasharray: 100;
          animation: fill-outward 4s ease-in-out infinite;
        }
        @keyframes glow-chat {
          0%, 85% {
            border-color: var(--color-primary);
            box-shadow: 0 0 14px var(--color-primary);
          }
          100% {
            border-color: var(--border);
            box-shadow: none;
          }
        }
        @keyframes glow-agent {
          0%, 30% {
            border-color: var(--border);
            box-shadow: none;
          }
          35%, 85% {
            border-color: var(--color-primary);
            box-shadow: 0 0 20px var(--color-primary);
          }
          100% {
            border-color: var(--border);
            box-shadow: none;
          }
        }
        @keyframes glow-destination {
          0%, 65% {
            border-color: var(--border);
            box-shadow: none;
          }
          70%, 85% {
            border-color: var(--color-primary);
            box-shadow: 0 0 14px var(--color-primary);
          }
          100% {
            border-color: var(--border);
            box-shadow: none;
          }
        }
        .animate-glow-chat {
          animation: glow-chat 4s ease-in-out infinite;
        }
        .animate-glow-agent {
          animation: glow-agent 4s ease-in-out infinite;
        }
        .animate-glow-destination {
          animation: glow-destination 4s ease-in-out infinite;
        }
      `}</style>

      {/* connection lines */}
      <svg
        className="absolute inset-0 h-full w-full overflow-visible"
        style={{ overflow: "visible" }}
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {edges.map(([from, to]) => {
          const a = nodeMap[from];
          const b = nodeMap[to];
          if (!a || !b) return null;
          const d = buildPath(a, b);

          const isActiveChatEdge = from === activeChat && to === "agent";
          const isActiveWebsiteEdge = from === "agent" && to === activeWebsite;
          const isActiveSocialEdge = from === "agent" && to === activeSocial;

          return (
            <g key={`${from}-${to}`}>
              {/* Inactive background path */}
              <path
                d={d}
                fill="none"
                stroke="oklch(1 0 0 / 16%)"
                strokeWidth={1.25}
                vectorEffect="non-scaling-stroke"
              />

              {/* Dynamic Animated Pulse Flow */}
              {(isActiveChatEdge ||
                isActiveWebsiteEdge ||
                isActiveSocialEdge) && (
                <path
                  d={d}
                  fill="none"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  strokeLinecap="round"
                  pathLength={100}
                  vectorEffect="non-scaling-stroke"
                  className={
                    isActiveChatEdge
                      ? "animate-flow-inward"
                      : "animate-flow-outward"
                  }
                />
              )}
            </g>
          );
        })}
      </svg>

      {/* nodes */}
      {nodes.map((n) => {
        const isCycleActive =
          n.id === activeChat ||
          n.id === "agent" ||
          n.id === activeWebsite ||
          n.id === activeSocial;
        const cycleType =
          n.id === "agent"
            ? "agent"
            : n.id === activeChat
              ? "chat"
              : "destination";

        return (
          <DiagramNode
            key={n.id}
            node={n}
            isCycleActive={isCycleActive}
            cycleType={cycleType}
          />
        );
      })}
    </div>
  );
}

function DiagramNode({
  node,
  isCycleActive,
  cycleType,
}: {
  node: NodeDef;
  isCycleActive: boolean;
  cycleType: "chat" | "agent" | "destination";
}) {
  const { Icon, label, sublabel, color, big } = node;
  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none"
      style={{ left: `${node.x}%`, top: `${node.y}%` }}
    >
      <div
        className={[
          "group flex items-center gap-3 rounded-xl border bg-white shadow-sm px-3 py-2.5 transition-all duration-300 outline-none",
          big ? "sm:px-4 sm:py-3.5" : "",
          isCycleActive
            ? cycleType === "chat"
              ? "animate-glow-chat"
              : cycleType === "agent"
                ? "animate-glow-agent"
                : "animate-glow-destination"
            : "border-stone-200",
        ].join(" ")}
      >
        <div
          className={[
            "relative flex shrink-0 items-center justify-center rounded-lg border border-stone-200 bg-stone-50",
            big ? "size-11" : "size-9",
          ].join(" ")}
        >
          {/* default (white) icon */}
          <Icon
            className={[
              "absolute text-foreground transition-all duration-300",
              big ? "size-6" : "size-5",
              isCycleActive ? "scale-50 opacity-0" : "scale-100 opacity-100",
            ].join(" ")}
          />
          {/* hover (colored / blue) icon swap */}
          <Icon
            className={[
              "absolute transition-all duration-300",
              big ? "size-6" : "size-5",
              isCycleActive ? "scale-100 opacity-100" : "scale-150 opacity-0",
            ].join(" ")}
            style={{ color: color ?? "var(--color-primary)" }}
          />
        </div>
        <div className="pr-1">
          <p
            className={[
              "font-medium leading-tight text-foreground",
              big ? "text-sm sm:text-base" : "text-sm",
            ].join(" ")}
          >
            {label}
          </p>
          {sublabel ? (
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {sublabel}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
