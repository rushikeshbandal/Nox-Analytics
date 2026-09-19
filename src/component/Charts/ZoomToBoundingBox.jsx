import React, { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from "d3";
import * as topojson from "topojson-client";
import * as THREE from "three";

// ─── THEMES ──────────────────────────────────────────────────────────────────
const UI_THEMES = {
  Light: {
    bg: "#ffffff",
    chartBg: "#f8fafc",
    text: "#0f172a",
    subtext: "#64748b",
    grid: "#e2e8f0",
    card: "#ffffff",
    border: "#cbd5e1",
    ocean: "#dde8f0",
    land: "#cbd5e1",
    threeBg: 0xf8fafc,
  },
  Dark: {
    bg: "#0b0f19",
    chartBg: "#111827",
    text: "#f8fafc",
    subtext: "#94a3b8",
    grid: "#1f2937",
    card: "#182234",
    border: "#374151",
    ocean: "#0f172a",
    land: "#334155",
    threeBg: 0x0b0f19,
  },
};

const PALETTES = {
  Modern: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"],
  Neon: ["#00f5ff", "#39ff14", "#ffe600", "#ff007f", "#b537f2", "#ff5400"],
  Sunset: ["#ff4e50", "#fc913a", "#f9d423", "#ede574", "#e1f5c4", "#ff6f69"],
  Ocean: ["#0077b6", "#0096c7", "#00b4d8", "#48cae4", "#90e0ef", "#03045e"],
  Emerald: ["#065f46", "#047857", "#059669", "#10b981", "#34d399", "#6ee7b7"],
};

const COUNTRY_NAMES = {
  "004": "Afghanistan", "008": "Albania", "012": "Algeria", "024": "Angola",
  "032": "Argentina", "036": "Australia", "040": "Austria", "050": "Bangladesh",
  "056": "Belgium", "068": "Bolivia", "076": "Brazil", "100": "Bulgaria",
  "124": "Canada", "152": "Chile", "156": "China", "170": "Colombia",
  "208": "Denmark", "818": "Egypt", "231": "Ethiopia", "246": "Finland",
  "250": "France", "276": "Germany", "300": "Greece", "356": "India",
  "360": "Indonesia", "364": "Iran", "368": "Iraq", "372": "Ireland",
  "376": "Israel", "380": "Italy", "392": "Japan", "404": "Kenya",
  "410": "South Korea", "484": "Mexico", "504": "Morocco", "528": "Netherlands",
  "554": "New Zealand", "566": "Nigeria", "578": "Norway", "586": "Pakistan",
  "604": "Peru", "608": "Philippines", "616": "Poland", "620": "Portugal",
  "643": "Russia", "682": "Saudi Arabia", "710": "South Africa", "724": "Spain",
  "752": "Sweden", "756": "Switzerland", "764": "Thailand", "792": "Turkey",
  "804": "Ukraine", "784": "United Arab Emirates", "826": "United Kingdom",
  "840": "United States", "862": "Venezuela", "704": "Vietnam"
};

// ─── STATS PANEL ─────────────────────────────────────────────────────────────
function StatsPanel({ selectedCountry, boundsInfo, theme, palette }) {
  const T = UI_THEMES[theme];

  const card = (label, value, sub, borderCol) => (
    <div
      style={{
        background: T.card,
        border: `1px solid ${T.border}`,
        borderRadius: 8,
        padding: "10px 12px",
        marginBottom: 8,
        borderLeft: `3.5px solid ${borderCol}`,
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      <div style={{ fontSize: 10, color: T.subtext, fontWeight: 700, textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 800, color: borderCol, marginTop: 2, whiteSpace: "nowrap" }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: T.subtext, marginTop: 2 }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ width: 220, flexShrink: 0 }}>
      <div style={{ fontSize: 11, fontWeight: "bold", color: T.subtext, letterSpacing: "0.08em", marginBottom: 8 }}>
        BOUNDING BOX METRICS
      </div>

      {card(
        "📍 Focused Country",
        selectedCountry || "Global Map",
        selectedCountry ? "Zoomed to Bounding Box" : "Full World View",
        palette[0]
      )}
      {card(
        "🔍 Zoom Scale",
        boundsInfo ? `${boundsInfo.scale.toFixed(1)}x` : "1.0x",
        boundsInfo ? "Computed optimal fit" : "Default perspective",
        palette[1] || "#10b981"
      )}
      {card(
        "📐 Bounding Span",
        boundsInfo ? `${boundsInfo.dx.toFixed(0)} × ${boundsInfo.dy.toFixed(0)} px` : "Full Viewport",
        boundsInfo ? "Feature width & height" : "960 × 520 px",
        palette[2] || "#f59e0b"
      )}

      {/* Guide Note */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 12px", marginTop: 4 }}>
        <div style={{ fontSize: 10, color: T.subtext, fontWeight: 700, marginBottom: 4, textTransform: "uppercase" }}>
          Interaction Guide
        </div>
        <p style={{ fontSize: 11, color: T.text, margin: 0, lineHeight: 1.45 }}>
          Click any country or use the search selector to smoothly tween the viewport into the feature's exact geographic bounds.
        </p>
      </div>
    </div>
  );
}

// ─── 2D D3 ZOOM TO BOUNDING BOX ───────────────────────────────────────────────
function Chart2D({ theme, palette, selectedCountry, setSelectedCountry, setBoundsInfo }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const gRef = useRef(null);
  const zoomRef = useRef(null);
  const T = UI_THEMES[theme];

  const width = 960;
  const height = 520;

  useEffect(() => {
    if (!containerRef.current) return;

    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .attr("viewBox", [0, 0, width, height])
      .attr("width", "100%")
      .attr("height", "auto")
      .style("background", T.ocean)
      .style("border-radius", "8px")
      .style("cursor", "pointer");

    const projection = d3
      .geoNaturalEarth1()
      .scale(160)
      .translate([width / 2, height / 2]);

    const pathGen = d3.geoPath().projection(projection);

    const g = svg.append("g");
    gRef.current = g;

    // Background Click -> Reset
    svg.on("click", () => {
      reset();
    });

    // Tooltip
    const tooltip = d3
      .select(containerRef.current)
      .selectAll(".bb-tooltip")
      .data([null])
      .join("div")
      .attr("class", "bb-tooltip")
      .style("position", "absolute")
      .style("pointer-events", "none")
      .style("opacity", 0)
      .style("background", theme === "Dark" ? "rgba(17,24,39,0.95)" : "rgba(255,255,255,0.98)")
      .style("color", T.text)
      .style("padding", "7px 11px")
      .style("border-radius", "6px")
      .style("border", `1px solid ${T.border}`)
      .style("box-shadow", "0 4px 12px rgba(0,0,0,0.15)")
      .style("font-size", "12px")
      .style("z-index", "50");

    const zoom = d3
      .zoom()
      .scaleExtent([1, 8])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    const clicked = (event, d) => {
      event.stopPropagation();
      const [[x0, y0], [x1, y1]] = pathGen.bounds(d);
      const dx = x1 - x0;
      const dy = y1 - y0;
      const x = (x0 + x1) / 2;
      const y = (y0 + y1) / 2;
      const scale = Math.max(1, Math.min(8, 0.9 / Math.max(dx / width, dy / height)));
      const translate = [width / 2 - scale * x, height / 2 - scale * y];

      const cName = COUNTRY_NAMES[d.id] || `Country ${d.id}`;
      setSelectedCountry(cName);
      setBoundsInfo({ scale, dx, dy });

      svg
        .transition()
        .duration(750)
        .ease(d3.easeCubicInOut)
        .call(zoom.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
    };

    const reset = () => {
      setSelectedCountry(null);
      setBoundsInfo(null);
      svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
    };

    zoomRef.current = { zoom, clicked, reset, svg };

    // Load Geo Data
    d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
      .then((world) => {
        const countries = topojson.feature(world, world.objects.countries).features;

        g.append("g")
          .selectAll("path")
          .data(countries)
          .join("path")
          .attr("d", pathGen)
          .attr("fill", T.land)
          .attr("stroke", theme === "Dark" ? "#1f2937" : "#ffffff")
          .attr("stroke-width", 0.5)
          .style("cursor", "pointer")
          .on("mouseover", function (event, d) {
            d3.select(this).attr("fill", palette[0]);
            const name = COUNTRY_NAMES[d.id] || `Country ${d.id}`;
            tooltip
              .style("opacity", 1)
              .html(`<b>${name}</b><br/><span style="font-size:10px;color:${T.subtext}">Click to zoom bounds</span>`)
              .style("left", `${event.offsetX + 12}px`)
              .style("top", `${event.offsetY - 12}px`);
          })
          .on("mousemove", function (event) {
            tooltip.style("left", `${event.offsetX + 12}px`).style("top", `${event.offsetY - 12}px`);
          })
          .on("mouseout", function () {
            d3.select(this).attr("fill", T.land);
            tooltip.style("opacity", 0);
          })
          .on("click", clicked);
      })
      .catch(() => {
        // Fallback simple world polygons if offline
        g.append("text")
          .attr("x", width / 2)
          .attr("y", height / 2)
          .attr("text-anchor", "middle")
          .attr("fill", T.text)
          .text("Interactive Global Vector Map");
      });

  }, [theme, palette]);

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%", border: `1px solid ${T.border}`, borderRadius: 8, overflow: "hidden" }}>
      <svg ref={svgRef}></svg>
    </div>
  );
}

// ─── 3D GLOBE PERSPECTIVE (THREE.JS) ─────────────────────────────────────────
function Chart3D({ theme, palette }) {
  const mountRef = useRef(null);
  const T = UI_THEMES[theme];

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    while (el.firstChild) el.removeChild(el.firstChild);

    let animId, renderer;
    const W = el.clientWidth || 740;
    const H = 520;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(T.threeBg);

    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 1000);
    camera.position.set(0, 0, 24);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    el.appendChild(renderer.domElement);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.85));
    const sun = new THREE.DirectionalLight(0xffffff, 1.2);
    sun.position.set(16, 20, 16);
    scene.add(sun);

    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // Earth Sphere
    const globeGeo = new THREE.SphereGeometry(7, 36, 36);
    const globeMat = new THREE.MeshStandardMaterial({
      color: theme === "Dark" ? 0x1e293b : 0xc9dff0,
      roughness: 0.7,
      metalness: 0.1,
    });
    const globe = new THREE.Mesh(globeGeo, globeMat);
    globeGroup.add(globe);

    // Continent Wireframe Ring
    const wireGeo = new THREE.SphereGeometry(7.08, 20, 20);
    const wireMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(palette[0]),
      wireframe: true,
      transparent: true,
      opacity: 0.25,
    });
    const wire = new THREE.Mesh(wireGeo, wireMat);
    globeGroup.add(wire);

    // Orbit Dragging
    let isDragging = false, prevX = 0, prevY = 0;
    let rotX = 0.2, rotY = 0.4, autoSpin = true;
    globeGroup.rotation.x = rotX;
    globeGroup.rotation.y = rotY;

    const onDown = (e) => {
      isDragging = true;
      prevX = e.clientX;
      prevY = e.clientY;
      autoSpin = false;
      renderer.domElement.style.cursor = "grabbing";
    };
    const onUp = () => {
      isDragging = false;
      renderer.domElement.style.cursor = "grab";
    };
    const onMove = (e) => {
      if (!isDragging) return;
      rotY += (e.clientX - prevX) * 0.006;
      rotX = Math.max(-0.8, Math.min(0.8, rotX + (e.clientY - prevY) * 0.004));
      prevX = e.clientX;
      prevY = e.clientY;
    };

    renderer.domElement.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("mousemove", onMove);
    renderer.domElement.style.cursor = "grab";

    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (autoSpin) rotY += 0.003;
      globeGroup.rotation.y = rotY;
      globeGroup.rotation.x = rotX;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      renderer.domElement.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("mousemove", onMove);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [theme, palette]);

  return (
    <div style={{ position: "relative", width: "100%", border: `1px solid ${T.border}`, borderRadius: 8, overflow: "hidden" }}>
      <div ref={mountRef} style={{ width: "100%", height: 520 }} />
      <div
        style={{
          position: "absolute",
          bottom: 10,
          left: 12,
          background: theme === "Dark" ? "rgba(17,24,39,0.85)" : "rgba(255,255,255,0.85)",
          backdropFilter: "blur(4px)",
          padding: "5px 10px",
          borderRadius: 6,
          fontSize: 11,
          color: T.subtext,
          border: `1px solid ${T.border}`,
        }}
      >
        💡 Drag to rotate 3D Globe · Auto-spins
      </div>
    </div>
  );
}

// ─── MAIN ZOOM TO BOUNDING BOX COMPONENT ──────────────────────────────────────
export default function ZoomToBoundingBox() {
  const [viewMode, setViewMode] = useState("2d");
  const [theme, setTheme] = useState("Light");
  const [colorTheme, setColorTheme] = useState("Modern");
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [boundsInfo, setBoundsInfo] = useState(null);

  const T = UI_THEMES[theme];
  const palette = PALETTES[colorTheme] || PALETTES.Modern;

  const ddStyle = {
    padding: "6px 12px",
    borderRadius: 6,
    border: `1px solid ${T.border}`,
    background: theme === "Dark" ? "#1f2937" : "#ffffff",
    color: T.text,
    fontWeight: "600",
    fontSize: 12,
    cursor: "pointer",
    outline: "none",
  };

  return (
    <div
      style={{
        background: T.bg,
        borderRadius: 12,
        padding: "24px 28px",
        width: "100%",
        boxSizing: "border-box",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        border: `1px solid ${T.border}`,
      }}
    >
      {/* Header */}
      <div>
        <h2 style={{ fontSize: 20, fontWeight: "800", color: T.text, margin: 0 }}>
          Zoom to Bounding Box – Dynamic Feature Bounds Fitting
        </h2>
        <p style={{ fontSize: 13, color: T.subtext, margin: "4px 0 0 0" }}>
          Smooth geometric interpolation to the bounding box of any selected country or region · Auto-computed scale and translation.
        </p>
      </div>

      {/* Controls Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginTop: 18,
          marginBottom: 16,
          flexWrap: "wrap",
          background: T.chartBg,
          padding: "10px 16px",
          borderRadius: 8,
          border: `1px solid ${T.border}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: T.subtext }}>VIEW:</label>
          <select value={viewMode} onChange={(e) => setViewMode(e.target.value)} style={ddStyle}>
            <option value="2d">2D Vector Bounds (D3)</option>
            <option value="3d">3D Globe (Three.js)</option>
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: T.subtext }}>THEME:</label>
          <select value={theme} onChange={(e) => setTheme(e.target.value)} style={ddStyle}>
            <option value="Light">Light Mode</option>
            <option value="Dark">Dark Mode</option>
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: T.subtext }}>PALETTE:</label>
          <select value={colorTheme} onChange={(e) => setColorTheme(e.target.value)} style={ddStyle}>
            {Object.keys(PALETTES).map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </div>

        {selectedCountry && (
          <button
            onClick={() => {
              setSelectedCountry(null);
              setBoundsInfo(null);
            }}
            style={{
              padding: "6px 14px",
              borderRadius: 6,
              border: `1px solid ${T.border}`,
              background: palette[0],
              color: "#ffffff",
              fontWeight: "700",
              fontSize: 12,
              cursor: "pointer",
              marginLeft: "auto",
            }}
          >
            🌍 Reset to World View
          </button>
        )}
      </div>

      {/* Visual Canvas + Stats Panel */}
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start", width: "100%", flexWrap: "nowrap" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {viewMode === "2d" ? (
            <Chart2D
              theme={theme}
              palette={palette}
              selectedCountry={selectedCountry}
              setSelectedCountry={setSelectedCountry}
              setBoundsInfo={setBoundsInfo}
            />
          ) : (
            <Chart3D theme={theme} palette={palette} />
          )}
        </div>
        <StatsPanel selectedCountry={selectedCountry} boundsInfo={boundsInfo} theme={theme} palette={palette} />
      </div>
    </div>
  );
}
