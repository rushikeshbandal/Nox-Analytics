import React, { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from "d3";
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
    mapFill: "#e2e8f0",
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
    mapFill: "#1e293b",
    threeBg: 0x0b0f19,
  },
};

const PALETTES = {
  Classic: ["#0071ce", "#ffc220", "#10b981", "#ef4444", "#8b5cf6"], // Walmart Blue & Spark Yellow
  Neon: ["#00f5ff", "#ffe600", "#39ff14", "#ff007f", "#b537f2"],
  Sunset: ["#ff4e50", "#fc913a", "#f9d423", "#ede574", "#e1f5c4"],
  Emerald: ["#047857", "#059669", "#10b981", "#34d399", "#6ee7b7"],
};

// Representative historical store cluster dataset (1962 to 2010)
// Expanding outward from Bentonville/Rogers, Arkansas [-94.2, 36.3]
const STORE_SAMPLES = (() => {
  const origin = [-94.17, 36.33]; // Rogers, Arkansas
  const states = [
    { state: "AR", coords: [-92.4, 34.9], startYear: 1962, count: 128 },
    { state: "MO", coords: [-92.6, 38.3], startYear: 1968, count: 156 },
    { state: "OK", coords: [-97.5, 35.5], startYear: 1969, count: 134 },
    { state: "TX", coords: [-99.9, 31.9], startYear: 1975, count: 590 },
    { state: "LA", coords: [-91.9, 30.9], startYear: 1977, count: 138 },
    { state: "TN", coords: [-86.5, 35.5], startYear: 1978, count: 150 },
    { state: "FL", coords: [-81.5, 27.6], startYear: 1982, count: 384 },
    { state: "GA", coords: [-83.6, 32.1], startYear: 1983, count: 212 },
    { state: "NC", coords: [-79.0, 35.7], startYear: 1985, count: 215 },
    { state: "IL", coords: [-89.3, 40.6], startYear: 1988, count: 184 },
    { state: "OH", coords: [-82.9, 40.4], startYear: 1990, count: 172 },
    { state: "PA", coords: [-77.1, 41.2], startYear: 1990, count: 160 },
    { state: "CA", coords: [-119.4, 36.7], startYear: 1991, count: 320 },
    { state: "NY", coords: [-75.5, 43.2], startYear: 1992, count: 112 },
    { state: "WA", coords: [-120.7, 47.7], startYear: 1993, count: 68 },
    { state: "AZ", coords: [-111.0, 34.0], startYear: 1994, count: 125 },
  ];

  const list = [];
  let idCounter = 1;

  // Add founding store #1
  list.push({ id: 1, year: 1962, state: "AR", city: "Rogers", lon: origin[0], lat: origin[1] });

  states.forEach((st) => {
    const yearsActive = 2010 - st.startYear;
    for (let i = 0; i < st.count; i++) {
      const year = Math.min(2010, Math.floor(st.startYear + Math.pow(Math.random(), 1.5) * yearsActive));
      const jitterLon = st.coords[0] + (Math.random() - 0.5) * 3.5;
      const jitterLat = st.coords[1] + (Math.random() - 0.5) * 2.5;
      list.push({
        id: ++idCounter,
        year,
        state: st.state,
        lon: jitterLon,
        lat: jitterLat,
      });
    }
  });

  return list.sort((a, b) => a.year - b.year);
})();

// ─── STATS PANEL ─────────────────────────────────────────────────────────────
function StatsPanel({ currentYear, activeStoresCount, theme, palette }) {
  const T = UI_THEMES[theme];

  const phaseName =
    currentYear < 1970
      ? "Ozark Regional Incubation"
      : currentYear < 1980
      ? "Southern States Expansion"
      : currentYear < 1990
      ? "Midwest & Sunbelt Surge"
      : currentYear < 2000
      ? "Coast-to-Coast Saturation"
      : "Modern Supercenter Hegemony";

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
        EXPANSION METRICS
      </div>

      {card("🏬 Cumulative Stores", `${d3.format(",")(activeStoresCount)} Units`, `Opened by Year ${currentYear}`, palette[0])}
      {card("📅 Expansion Phase", phaseName, `Decade of ${Math.floor(currentYear / 10) * 10}s`, palette[1] || "#f59e0b")}
      {card("📍 Origin Point", "Rogers, Arkansas", "Founded by Sam Walton (1962)", palette[2] || "#10b981")}
      {card("⚡ Store Growth Rate", currentYear > 1962 ? `+${Math.round(activeStoresCount / (currentYear - 1961))} / yr` : "Origin", "Average annual additions", palette[3] || "#ef4444")}

      {/* Historical Milestones */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 12px", marginTop: 4 }}>
        <div style={{ fontSize: 10, color: T.subtext, fontWeight: 700, marginBottom: 6, textTransform: "uppercase" }}>
          Milestone Timeline
        </div>
        <div style={{ fontSize: 11, color: T.text, marginBottom: 4 }}><b>1962:</b> Store #1 in Rogers, AR</div>
        <div style={{ fontSize: 11, color: T.text, marginBottom: 4 }}><b>1975:</b> Texas Entry (500+ stores)</div>
        <div style={{ fontSize: 11, color: T.text, marginBottom: 4 }}><b>1988:</b> 1st Supercenter (Washington, MO)</div>
        <div style={{ fontSize: 11, color: T.text }}><b>1991:</b> West Coast Expansion (California)</div>
      </div>
    </div>
  );
}

// ─── 2D ANIMATED MAP EXPANSION (D3) ──────────────────────────────────────────
function Chart2D({ theme, palette, currentYear, activeStores }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const T = UI_THEMES[theme];

  const width = 800;
  const height = 520;

  useEffect(() => {
    if (!containerRef.current) return;

    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .attr("viewBox", [0, 0, width, height])
      .attr("width", "100%")
      .attr("height", "auto")
      .style("background", T.chartBg)
      .style("border-radius", "8px");

    // Year Watermark
    svg
      .append("text")
      .attr("x", width - 40)
      .attr("y", height - 30)
      .attr("text-anchor", "end")
      .attr("font-size", "110px")
      .attr("font-weight", "900")
      .attr("fill", theme === "Dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)")
      .style("user-select", "none")
      .text(currentYear);

    // US Albers Projection
    const projection = d3
      .geoAlbersUsa()
      .scale(980)
      .translate([width / 2, height / 2]);

    // Store opening points
    const storeG = svg.append("g").attr("class", "stores");

    storeG
      .selectAll("circle")
      .data(activeStores, (d) => d.id)
      .join(
        (enter) =>
          enter
            .append("circle")
            .attr("cx", (d) => projection([d.lon, d.lat])?.[0] || -100)
            .attr("cy", (d) => projection([d.lon, d.lat])?.[1] || -100)
            .attr("r", 0)
            .attr("fill", palette[0])
            .attr("stroke", palette[1] || "#ffc220")
            .attr("stroke-width", 0.8)
            .attr("fill-opacity", 0.75)
            .call((enter) => enter.transition().duration(250).attr("r", 3.2)),
        (update) => update,
        (exit) => exit.remove()
      );

    // Highlight Store #1 (Rogers, AR)
    const origin = projection([-94.17, 36.33]);
    if (origin) {
      svg
        .append("circle")
        .attr("cx", origin[0])
        .attr("cy", origin[1])
        .attr("r", 7)
        .attr("fill", "none")
        .attr("stroke", palette[1] || "#ffc220")
        .attr("stroke-width", 2);

      svg
        .append("text")
        .attr("x", origin[0])
        .attr("y", origin[1] - 10)
        .attr("text-anchor", "middle")
        .attr("font-size", "10px")
        .attr("font-weight", "800")
        .attr("fill", palette[1] || "#ffc220")
        .text("Store #1 (1962)");
    }

  }, [theme, palette, currentYear, activeStores]);

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%", border: `1px solid ${T.border}`, borderRadius: 8, overflow: "hidden" }}>
      <svg ref={svgRef}></svg>
    </div>
  );
}

// ─── 3D EXPANSION PILLARS (THREE.JS) ─────────────────────────────────────────
function Chart3D({ theme, palette, activeStores }) {
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
    camera.position.set(0, 18, 24);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    el.appendChild(renderer.domElement);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const sun = new THREE.DirectionalLight(0xffffff, 1.2);
    sun.position.set(16, 24, 18);
    sun.castShadow = true;
    scene.add(sun);

    // US Floor & 3D Grid
    const floorGeo = new THREE.PlaneGeometry(32, 20);
    const floorMat = new THREE.MeshStandardMaterial({
      color: theme === "Dark" ? 0x111827 : 0xf1f5f9,
      roughness: 0.9,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -6;
    floor.receiveShadow = true;
    scene.add(floor);

    const grid = new THREE.GridHelper(32, 16, theme === "Dark" ? 0x374151 : 0xcbd5e1, theme === "Dark" ? 0x1f2937 : 0xe2e8f0);
    grid.position.y = -5.95;
    scene.add(grid);

    const pivot = new THREE.Group();
    scene.add(pivot);

    // Roll up active stores by state coordinates
    const xLonScale = d3.scaleLinear().domain([-125, -65]).range([-13, 13]);
    const zLatScale = d3.scaleLinear().domain([25, 50]).range([7, -7]);

    const stateClusters = d3.rollup(activeStores, (v) => v.length, (d) => d.state);

    activeStores.slice(0, 150).forEach((store) => {
      const x = xLonScale(store.lon);
      const z = zLatScale(store.lat);
      const cylGeo = new THREE.CylinderGeometry(0.12, 0.12, 1.2, 8);
      const cylMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(palette[0]),
        roughness: 0.25,
        metalness: 0.5,
        emissive: new THREE.Color(palette[0]),
        emissiveIntensity: 0.35,
      });
      const cyl = new THREE.Mesh(cylGeo, cylMat);
      cyl.position.set(x, -5.35, z);
      cyl.castShadow = true;
      pivot.add(cyl);
    });

    // Orbit Dragging
    let isDragging = false, prevX = 0, prevY = 0;
    let rotX = 0.4, rotY = 0.2, autoSpin = true;
    pivot.rotation.x = rotX;
    pivot.rotation.y = rotY;

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
      rotX = Math.max(0.1, Math.min(1.0, rotX + (e.clientY - prevY) * 0.004));
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
      pivot.rotation.y = rotY;
      pivot.rotation.x = rotX;
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
  }, [theme, palette, activeStores]);

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
        💡 3D Store Growth Pillars across US Geography · X=Lon · Z=Lat · Y=Height
      </div>
    </div>
  );
}

// ─── MAIN WALMART'S GROWTH COMPONENT ─────────────────────────────────────────
export default function WalmartsGrowth() {
  const [viewMode, setViewMode] = useState("2d");
  const [theme, setTheme] = useState("Light");
  const [colorTheme, setColorTheme] = useState("Classic");
  const [year, setYear] = useState(1962);
  const [isPlaying, setIsPlaying] = useState(false);

  const T = UI_THEMES[theme];
  const palette = PALETTES[colorTheme] || PALETTES.Classic;

  const activeStores = useMemo(() => {
    return STORE_SAMPLES.filter((d) => d.year <= year);
  }, [year]);

  // Year scrubber loop
  useEffect(() => {
    let timer;
    if (isPlaying) {
      timer = setInterval(() => {
        setYear((prev) => {
          if (prev >= 2010) {
            setIsPlaying(false);
            return 2010;
          }
          return prev + 1;
        });
      }, 350);
    }
    return () => clearInterval(timer);
  }, [isPlaying]);

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

  const btnStyle = {
    padding: "6px 14px",
    borderRadius: 6,
    border: `1px solid ${T.border}`,
    background: palette[0],
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 12,
    cursor: "pointer",
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
          Walmart’s Growth – Geographic Expansion Wave (1962–2010)
        </h2>
        <p style={{ fontSize: 13, color: T.subtext, margin: "4px 0 0 0" }}>
          Spatiotemporal animation showing store network expansion from Bentonville / Rogers, Arkansas across North America.
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
            <option value="2d">2D Geographic Wave (D3)</option>
            <option value="3d">3D Store Towers (Three.js)</option>
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

        {/* Playback & Scrubber */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto", flexWrap: "wrap" }}>
          <button
            onClick={() => {
              if (year >= 2010) setYear(1962);
              setIsPlaying(!isPlaying);
            }}
            style={btnStyle}
          >
            {isPlaying ? "⏸ Pause" : year >= 2010 ? "🔄 Replay" : "▶ Play Growth"}
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: palette[0], minWidth: 40 }}>{year}</span>
            <input
              type="range"
              min={1962}
              max={2010}
              value={year}
              onChange={(e) => {
                setIsPlaying(false);
                setYear(Number(e.target.value));
              }}
              style={{ width: 140, cursor: "pointer", accentColor: palette[0] }}
            />
          </div>
        </div>
      </div>

      {/* Visual Canvas + Stats Panel */}
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start", width: "100%", flexWrap: "nowrap" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {viewMode === "2d" ? (
            <Chart2D theme={theme} palette={palette} currentYear={year} activeStores={activeStores} />
          ) : (
            <Chart3D theme={theme} palette={palette} activeStores={activeStores} />
          )}
        </div>
        <StatsPanel
          currentYear={year}
          activeStoresCount={activeStores.length}
          theme={theme}
          palette={palette}
        />
      </div>
    </div>
  );
}
