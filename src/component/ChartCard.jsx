import React from "react";
import { CHARTS_WITH_3D } from "../pages/chart3DList.js";

// Turns a PascalCase / camelCase component name into a readable title.
const humanize = (name) =>
  name
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();

// ── Small self-contained color helpers (no external deps) ──────────────────
const hexToRgb = (hex) => {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h[0] + h[0] + h[1] + h[1] + h[2] + h[2] : h;
  const n = parseInt(full, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
};

const relativeLuminance = ({ r, g, b }) => {
  const [R, G, B] = [r, g, b]
    .map((v) => v / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
};

// Lighten/darken a hex color by a percentage (-1 to 1). Used for the header
// strip so it reads as a slightly different shade than the body.
const shade = (hex, percent) => {
  const { r, g, b } = hexToRgb(hex);
  const amt = Math.round(255 * percent);
  const clamp = (v) => Math.max(0, Math.min(255, v));
  const nr = clamp(r + amt), ng = clamp(g + amt), nb = clamp(b + amt);
  return `#${[nr, ng, nb].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
};

/**
 * ChartCard - uniform layout wrapper used for every chart in the gallery.
 * The color picked from the ColorWheel becomes the card's actual background
 * (header + body), and text color automatically switches to black or white
 * for readability, based on the background's luminance — exactly like a
 * light/dark mode switch, but driven by whatever color is chosen.
 */
const ChartCard = ({ name, children, accentColor = "#6366f1", className = "mb-8", onDrillDown = null }) => {
  const is3D = CHARTS_WITH_3D.has(name);
  const title = humanize(name);

  const luminance = relativeLuminance(hexToRgb(accentColor));
  const isDarkBg = luminance < 0.5;
  const textColor = isDarkBg ? "#f5f5f5" : "#111111";
  const mutedTextColor = isDarkBg ? "#d4d4d4" : "#4b5563";
  const headerBg = shade(accentColor, isDarkBg ? 0.08 : -0.05);
  const borderColor = shade(accentColor, isDarkBg ? 0.18 : -0.18);
  const badgeBg = isDarkBg ? "#ffffff" : "#111111";
  const badgeText = isDarkBg ? "#111111" : "#ffffff";

  return (
    <div
      className={`chart-card rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md ${className}`}
      style={{
        "--card-accent-color": accentColor,
        "--card-text-color": "#334155",
        "--card-muted-text-color": "#64748b",
        "--card-border-color": "#e2e8f0",
        borderTop: `4px solid ${accentColor}`,
      }}
    >
      <div
        className="flex items-center justify-between px-5 py-4 bg-slate-50/80 border-b border-slate-100"
      >
        <h3
          className="font-Aldrich text-sm md:text-base font-semibold tracking-wide text-slate-800"
        >
          {title}
        </h3>
        <div className="flex items-center gap-3">
          {onDrillDown && (
            <button
              onClick={onDrillDown}
              className="text-[10px] font-bold px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white uppercase tracking-wider shadow-sm transition-colors cursor-pointer font-Aldrich"
            >
              🔍 Drill Down
            </button>
          )}
          {is3D && (
            <span
              className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-white uppercase tracking-wider shadow-sm"
            >
              3D
            </span>
          )}
        </div>
      </div>
      <div
        className="p-5 flex justify-center items-center overflow-x-auto min-h-[220px]"
        style={{ color: "#475569" }}
      >
        <div className="w-full h-full flex justify-center items-center">
          {children}
        </div>
      </div>
    </div>
  );
};

export default ChartCard;