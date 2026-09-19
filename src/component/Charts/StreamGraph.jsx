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
    threeBg: 0x0b0f19,
  },
};

const PALETTES = {
  Cool: ["#0077b6", "#0096c7", "#00b4d8", "#48cae4", "#90e0ef", "#ade8f4", "#caf0f8", "#023e8a"],
  Neon: ["#00f5ff", "#39ff14", "#ffe600", "#ff007f", "#b537f2", "#ff5400", "#00ffcc", "#ff0099"],
  Sunset: ["#ff4e50", "#fc913a", "#f9d423", "#ede574", "#e1f5c4", "#ff6f69", "#d62828", "#f77f00"],
  Emerald: ["#064e3b", "#065f46", "#047857", "#059669", "#10b981", "#34d399", "#6ee7b7", "#a7f3d0"],
  Vibrant: ["#e63946", "#f1faee", "#a8dadc", "#457b9d", "#1d3557", "#ffb703", "#fb8500", "#2a9d8f"],
};

const CATEGORIES = [
  "Viral Respiratory",
  "Seasonal Influenza",
  "Cardiometabolic",
  "Gastrointestinal",
  "Allergic Rhinitis",
  "Orthopedic Trauma",
  "Neurological Pain",
  "Dermatology",
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Deterministic seasonal wave generation (24 bi-weekly points across the year)
function generateStreamData() {
  const points = 24;
  return Array.from({ length: points }, (_, t) => {
    const row = { time: t, month: MONTHS[Math.floor(t / 2)] };
    CATEGORIES.forEach((cat, idx) => {
      const phase = (idx * Math.PI) / 4;
      const seasonal = Math.sin((t / points) * 2 * Math.PI + phase) * 35 + 50;
      const wave = Math.cos((t / 3) + idx) * 15;
      row[cat] = Math.max(12, Math.round(seasonal + wave + 25));
    });
    return row;
  });
}

const STREAM_DATA = generateStreamData();

// ─── STATS PANEL ─────────────────────────────────────────────────────────────
function StatsPanel({ offsetMode, activeLayer, theme, palette }) {
  const T = UI_THEMES[theme];

  const totals = useMemo(() => {
    const map = {};
    CATEGORIES.forEach((cat) => {
      map[cat] = d3.sum(STREAM_DATA, (d) => d[cat]);
    });
    return map;
  }, []);

  const topCategory = useMemo(() => {
    return d3.greatest(Object.entries(totals), (d) => d[1]);
  }, [totals]);

  const activeTotal = activeLayer ? totals[activeLayer] : null;

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
        STREAM METRICS
      </div>

      {card("🌊 Offset Mode", offsetMode.toUpperCase(), `Stack Baseline: ${offsetMode}`, palette[0])}
      {card(
        "🏆 Peak Condition",
        topCategory?.[0] || "Respiratory",
        `${d3.format(",")(topCategory?.[1] || 0)} total cases`,
        palette[1] || "#10b981"
      )}
      {activeLayer &&
        card(
          "🔍 Focused Stream",
          activeLayer,
          `${d3.format(",")(activeTotal || 0)} annual cases`,
          palette[CATEGORIES.indexOf(activeLayer) % palette.length]
        )}

      {/* Layers Legend */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 12px", marginTop: 4 }}>
        <div style={{ fontSize: 10, color: T.subtext, fontWeight: 700, marginBottom: 8, textTransform: "uppercase" }}>
          Disease Streams
        </div>
        {CATEGORIES.map((cat, i) => (
          <div key={cat} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
            <div style={{ width: 12, height: 12, borderRadius: 2, background: palette[i % palette.length] }} />
            <span
              style={{
                fontSize: 11,
                color: activeLayer === cat ? palette[i % palette.length] : T.text,
                fontWeight: activeLayer === cat ? "700" : "500",
              }}
            >
              {cat}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 2D STREAMGRAPH WITH OFFSET TRANSITIONS (D3) ─────────────────────────────
function Chart2D({ theme, palette, offsetMode, activeLayer, setActiveLayer }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const T = UI_THEMES[theme];

  const width = 740;
  const height = 520;
  const margin = { top: 35, right: 35, bottom: 55, left: 65 };

  useEffect(() => {
    if (!containerRef.current) return;
    const w = containerRef.current.clientWidth || width;
    const h = height;

    // Pick offset function
    let offsetFn = d3.stackOffsetWiggle;
    if (offsetMode === "silhouette") offsetFn = d3.stackOffsetSilhouette;
    if (offsetMode === "expand") offsetFn = d3.stackOffsetExpand;
    if (offsetMode === "zero") offsetFn = d3.stackOffsetNone;

    const stack = d3.stack().keys(CATEGORIES).offset(offsetFn).order(d3.stackOrderInsideOut);
    const series = stack(STREAM_DATA);

    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .attr("viewBox", [0, 0, w, h])
      .attr("width", "100%")
      .attr("height", h)
      .style("background", T.chartBg)
      .style("border-radius", "8px")
      .style("font-family", "system-ui, -apple-system, sans-serif");

    // X Scale: Bi-weekly time index
    const xScale = d3
      .scaleLinear()
      .domain([0, STREAM_DATA.length - 1])
      .range([margin.left, w - margin.right]);

    // Y Scale dynamically computed from series bounds
    const yMin = d3.min(series, (layer) => d3.min(layer, (d) => d[0]));
    const yMax = d3.max(series, (layer) => d3.max(layer, (d) => d[1]));

    const yScale = d3
      .scaleLinear()
      .domain([yMin, yMax])
      .range([h - margin.bottom, margin.top]);

    // Area Generator
    const area = d3
      .area()
      .curve(d3.curveBasis)
      .x((d, i) => xScale(i))
      .y0((d) => yScale(d[0]))
      .y1((d) => yScale(d[1]));

    // Gridlines
    svg
      .append("g")
      .attr("transform", `translate(0,${h - margin.bottom})`)
      .call(
        d3
          .axisBottom(xScale)
          .ticks(12)
          .tickSize(-(h - margin.top - margin.bottom))
          .tickFormat("")
      )
      .call((g) => {
        g.select(".domain").remove();
        g.selectAll("line").style("stroke", T.grid).style("stroke-dasharray", "3,3");
      });

    // Axes
    const xAxis = d3
      .axisBottom(xScale)
      .ticks(12)
      .tickFormat((i) => MONTHS[Math.floor(i / 2)] || "");

    svg
      .append("g")
      .attr("transform", `translate(0,${h - margin.bottom})`)
      .call(xAxis)
      .call((g) => {
        g.select(".domain").style("stroke", T.border);
        g.selectAll("line").style("stroke", T.border);
        g.selectAll("text").style("fill", T.text).style("font-size", "11px").style("font-weight", "600");
      });

    const yAxis = d3.axisLeft(yScale).ticks(6).tickFormat((d) => (offsetMode === "expand" ? `${(d * 100).toFixed(0)}%` : d));

    svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(yAxis)
      .call((g) => {
        g.select(".domain").style("stroke", T.border);
        g.selectAll("line").style("stroke", T.border);
        g.selectAll("text").style("fill", T.text).style("font-size", "10px");
      });

    // Labels with arrows
    svg
      .append("text")
      .attr("x", (w + margin.left) / 2)
      .attr("y", h - 14)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("font-weight", "600")
      .style("fill", T.text)
      .text("Annual Timeline (Months) →");

    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -h / 2)
      .attr("y", 22)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("font-weight", "600")
      .style("fill", T.text)
      .text(`↑ ${offsetMode === "expand" ? "Proportional Share (%)" : "Case Density Stream"}`);

    // Tooltip
    const tooltip = d3
      .select(containerRef.current)
      .selectAll(".st-tooltip")
      .data([null])
      .join("div")
      .attr("class", "st-tooltip")
      .style("position", "absolute")
      .style("pointer-events", "none")
      .style("opacity", 0)
      .style("background", theme === "Dark" ? "rgba(17,24,39,0.95)" : "rgba(255,255,255,0.98)")
      .style("color", T.text)
      .style("padding", "8px 12px")
      .style("border-radius", "6px")
      .style("border", `1px solid ${T.border}`)
      .style("box-shadow", "0 4px 12px rgba(0,0,0,0.15)")
      .style("font-size", "12px")
      .style("z-index", "50");

    // Render Stream Paths with animated entry
    svg
      .append("g")
      .selectAll("path.stream-layer")
      .data(series)
      .join("path")
      .attr("class", "stream-layer")
      .attr("d", area)
      .attr("fill", (d, i) => palette[i % palette.length])
      .attr("fill-opacity", (d) => (activeLayer && activeLayer !== d.key ? 0.2 : 0.85))
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 0.5)
      .style("cursor", "pointer")
      .on("mouseover", function (event, d) {
        d3.select(this).attr("fill-opacity", 1);
        setActiveLayer(d.key);
        tooltip
          .style("opacity", 1)
          .html(`<div style="font-weight:700;font-size:13px;margin-bottom:2px">${d.key}</div>Click to isolate stream`)
          .style("left", `${event.offsetX + 14}px`)
          .style("top", `${event.offsetY - 14}px`);
      })
      .on("mousemove", function (event) {
        tooltip.style("left", `${event.offsetX + 14}px`).style("top", `${event.offsetY - 14}px`);
      })
      .on("mouseout", function (event, d) {
        d3.select(this).attr("fill-opacity", activeLayer && activeLayer !== d.key ? 0.2 : 0.85);
        tooltip.style("opacity", 0);
      })
      .on("click", function (event, d) {
        setActiveLayer((prev) => (prev === d.key ? null : d.key));
      });

  }, [theme, palette, offsetMode, activeLayer]);

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%", border: `1px solid ${T.border}`, borderRadius: 8, overflow: "hidden" }}>
      <svg ref={svgRef}></svg>
    </div>
  );
}

// ─── 3D UNDULATING STREAM SURFACE (THREE.JS) ─────────────────────────────────
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
    camera.position.set(20, 18, 26);
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

    // Floor & Grid
    const floorGeo = new THREE.PlaneGeometry(36, 36);
    const floorMat = new THREE.MeshStandardMaterial({
      color: theme === "Dark" ? 0x111827 : 0xf1f5f9,
      roughness: 0.9,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -8;
    floor.receiveShadow = true;
    scene.add(floor);

    const grid = new THREE.GridHelper(36, 18, theme === "Dark" ? 0x374151 : 0xcbd5e1, theme === "Dark" ? 0x1f2937 : 0xe2e8f0);
    grid.position.y = -7.95;
    scene.add(grid);

    const pivot = new THREE.Group();
    scene.add(pivot);

    // Build 3D layered ribbons for each category
    const points = STREAM_DATA.length;
    CATEGORIES.forEach((cat, catIdx) => {
      const colHex = palette[catIdx % palette.length];
      const curvePoints = [];

      STREAM_DATA.forEach((row, t) => {
        const x = (t / points) * 20 - 10;
        const y = -6 + (row[cat] / 120) * 8;
        const z = (catIdx / CATEGORIES.length) * 12 - 6;
        curvePoints.push(new THREE.Vector3(x, y, z));
      });

      const curve = new THREE.CatmullRomCurve3(curvePoints);
      const tubeGeo = new THREE.TubeGeometry(curve, 64, 0.25, 12, false);
      const tubeMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(colHex),
        roughness: 0.3,
        metalness: 0.45,
        emissive: new THREE.Color(colHex),
        emissiveIntensity: 0.25,
      });
      const tube = new THREE.Mesh(tubeGeo, tubeMat);
      tube.castShadow = true;
      pivot.add(tube);
    });

    // Orbit Dragging
    let isDragging = false, prevX = 0, prevY = 0;
    let rotX = 0.2, rotY = 0.4, autoSpin = true;
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
      rotX = Math.max(-0.6, Math.min(0.8, rotX + (e.clientY - prevY) * 0.004));
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
        💡 Drag to rotate in 3D · 3D Undulating Stream Ribbons · X=Time · Y=Volume · Z=Category
      </div>
    </div>
  );
}

// ─── MAIN STREAMGRAPH COMPONENT ──────────────────────────────────────────────
export default function StreamGraph() {
  const [viewMode, setViewMode] = useState("2d");
  const [offsetMode, setOffsetMode] = useState("wiggle");
  const [theme, setTheme] = useState("Light");
  const [colorTheme, setColorTheme] = useState("Cool");
  const [activeLayer, setActiveLayer] = useState(null);

  const T = UI_THEMES[theme];
  const palette = PALETTES[colorTheme] || PALETTES.Cool;

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

  const btnStyle = (isActive) => ({
    padding: "6px 12px",
    borderRadius: 6,
    border: `1px solid ${isActive ? palette[0] : T.border}`,
    background: isActive ? palette[0] : theme === "Dark" ? "#1f2937" : "#ffffff",
    color: isActive ? "#ffffff" : T.text,
    fontWeight: "700",
    fontSize: 11,
    cursor: "pointer",
    transition: "all 0.2s",
  });

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
          Streamgraph Transitions – Seasonal Disease & Patient Outflows
        </h2>
        <p style={{ fontSize: 13, color: T.subtext, margin: "4px 0 0 0" }}>
          Fluid continuous stream dynamics with real-time baseline offset morphing (Wiggle, Silhouette, Proportional 100%, and Stacked).
        </p>
      </div>

      {/* Controls Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginTop: 18,
          marginBottom: 12,
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
            <option value="2d">2D Streamgraph (D3)</option>
            <option value="3d">3D Stream Surface (Three.js)</option>
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

        {/* Stream Offset Modes */}
        <div style={{ display: "flex", gap: 6, marginLeft: "auto", flexWrap: "wrap" }}>
          <button onClick={() => setOffsetMode("wiggle")} style={btnStyle(offsetMode === "wiggle")}>
            Wiggle
          </button>
          <button onClick={() => setOffsetMode("silhouette")} style={btnStyle(offsetMode === "silhouette")}>
            Silhouette
          </button>
          <button onClick={() => setOffsetMode("expand")} style={btnStyle(offsetMode === "expand")}>
            100% Share
          </button>
          <button onClick={() => setOffsetMode("zero")} style={btnStyle(offsetMode === "zero")}>
            Stacked Area
          </button>
        </div>
      </div>

      {/* Visual Canvas + Stats Panel */}
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start", width: "100%", flexWrap: "nowrap" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {viewMode === "2d" ? (
            <Chart2D
              theme={theme}
              palette={palette}
              offsetMode={offsetMode}
              activeLayer={activeLayer}
              setActiveLayer={setActiveLayer}
            />
          ) : (
            <Chart3D theme={theme} palette={palette} />
          )}
        </div>
        <StatsPanel offsetMode={offsetMode} activeLayer={activeLayer} theme={theme} palette={palette} />
      </div>
    </div>
  );
}
