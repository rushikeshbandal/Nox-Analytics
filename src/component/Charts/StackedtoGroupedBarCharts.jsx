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
  Modern: ["#3b82f6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#6366f1"],
  Neon: ["#00f5ff", "#39ff14", "#ffe600", "#ff007f", "#b537f2", "#ff5400", "#00ffaa", "#ff00aa"],
  Sunset: ["#ff4e50", "#fc913a", "#f9d423", "#ede574", "#e1f5c4", "#ff6f69", "#d62828", "#f77f00"],
  Ocean: ["#03045e", "#023e8a", "#0077b6", "#0096c7", "#00b4d8", "#48cae4", "#90e0ef", "#ade8f4"],
  Emerald: ["#064e3b", "#065f46", "#047857", "#059669", "#10b981", "#34d399", "#6ee7b7", "#a7f3d0"],
};

// Demographic Age Distribution dataset across 6 major regions/states
const RAW_DATA = [
  { state: "CA", age: "<10", population: 5038433 },
  { state: "TX", age: "<10", population: 3983091 },
  { state: "FL", age: "<10", population: 2211012 },
  { state: "NY", age: "<10", population: 2319945 },
  { state: "IL", age: "<10", population: 1619682 },
  { state: "PA", age: "<10", population: 1458931 },

  { state: "CA", age: "10-19", population: 5170341 },
  { state: "TX", age: "10-19", population: 3910528 },
  { state: "FL", age: "10-19", population: 2331102 },
  { state: "NY", age: "10-19", population: 2445591 },
  { state: "IL", age: "10-19", population: 1715984 },
  { state: "PA", age: "10-19", population: 1608018 },

  { state: "CA", age: "20-29", population: 5809455 },
  { state: "TX", age: "20-29", population: 3946447 },
  { state: "FL", age: "20-29", population: 2597830 },
  { state: "NY", age: "20-29", population: 2894266 },
  { state: "IL", age: "20-29", population: 1789739 },
  { state: "PA", age: "20-29", population: 1712448 },

  { state: "CA", age: "30-39", population: 5354112 },
  { state: "TX", age: "30-39", population: 3770534 },
  { state: "FL", age: "30-39", population: 2416176 },
  { state: "NY", age: "30-39", population: 2605355 },
  { state: "IL", age: "30-39", population: 1721954 },
  { state: "PA", age: "30-39", population: 1520409 },

  { state: "CA", age: "40-49", population: 5179258 },
  { state: "TX", age: "40-49", population: 3545746 },
  { state: "FL", age: "40-49", population: 2575576 },
  { state: "NY", age: "40-49", population: 2617327 },
  { state: "IL", age: "40-49", population: 1697069 },
  { state: "PA", age: "40-49", population: 1645291 },

  { state: "CA", age: "50-59", population: 5042094 },
  { state: "TX", age: "50-59", population: 3344930 },
  { state: "FL", age: "50-59", population: 2762983 },
  { state: "NY", age: "50-59", population: 2755620 },
  { state: "IL", age: "50-59", population: 1773366 },
  { state: "PA", age: "50-59", population: 1881378 },

  { state: "CA", age: "60-69", population: 3737461 },
  { state: "TX", age: "60-69", population: 2431494 },
  { state: "FL", age: "60-69", population: 2404659 },
  { state: "NY", age: "60-69", population: 2095207 },
  { state: "IL", age: "60-69", population: 1326121 },
  { state: "PA", age: "60-69", population: 1491536 },

  { state: "CA", age: "≥70", population: 3323052 },
  { state: "TX", age: "≥70", population: 2023665 },
  { state: "FL", age: "≥70", population: 2635113 },
  { state: "NY", age: "≥70", population: 1964146 },
  { state: "IL", age: "≥70", population: 1207769 },
  { state: "PA", age: "≥70", population: 1465966 },
];

const STATES = ["CA", "TX", "FL", "NY", "IL", "PA"];
const AGES = ["<10", "10-19", "20-29", "30-39", "40-49", "50-59", "60-69", "≥70"];

// ─── STATS PANEL ─────────────────────────────────────────────────────────────
function StatsPanel({ layoutMode, theme, palette, activeState, activeAge }) {
  const T = UI_THEMES[theme];

  const totalPop = useMemo(() => d3.sum(RAW_DATA, (d) => d.population), []);
  const stateTotals = useMemo(() => {
    return d3.rollup(
      RAW_DATA,
      (v) => d3.sum(v, (d) => d.population),
      (d) => d.state
    );
  }, []);

  const topState = useMemo(() => {
    return d3.greatest([...stateTotals.entries()], (d) => d[1]);
  }, [stateTotals]);

  const topAge = useMemo(() => {
    const rolled = d3.rollup(
      RAW_DATA,
      (v) => d3.sum(v, (d) => d.population),
      (d) => d.age
    );
    return d3.greatest([...rolled.entries()], (d) => d[1]);
  }, []);

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
        AGGREGATE METRICS
      </div>

      {card("📐 Layout Mode", layoutMode.toUpperCase(), layoutMode === "stacked" ? "Cumulative Height" : "Side-by-side Columns", palette[0])}
      {card("👥 Total Census Pop", `${d3.format(".3s")(totalPop).replace("G", "B")}`, "Across 6 key states", palette[1] || "#10b981")}
      {card("🏆 Leading State", `${topState?.[0]} (${d3.format(".2s")(topState?.[1] || 0)})`, "Highest aggregate pop", palette[2] || "#f59e0b")}
      {card("👶 Largest Cohort", `${topAge?.[0]} Bracket`, `${d3.format(".2s")(topAge?.[1] || 0)} residents`, palette[3] || "#ef4444")}

      {/* Age Bracket Legend */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 12px", marginTop: 4 }}>
        <div style={{ fontSize: 10, color: T.subtext, fontWeight: 700, marginBottom: 8, textTransform: "uppercase" }}>
          Age Brackets
        </div>
        {AGES.map((age, i) => (
          <div key={age} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <div style={{ width: 12, height: 12, borderRadius: 2, background: palette[i % palette.length] }} />
            <span style={{ fontSize: 11, color: T.text, fontWeight: "600" }}>{age} Years</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 2D MORPHING STACKED-TO-GROUPED BARS (D3) ────────────────────────────────
function Chart2D({ theme, palette, layoutMode, setActiveState, setActiveAge }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const T = UI_THEMES[theme];

  const width = 740;
  const height = 520;
  const margin = { top: 35, right: 35, bottom: 55, left: 75 };

  useEffect(() => {
    if (!containerRef.current) return;
    const w = containerRef.current.clientWidth || width;
    const h = height;

    // Prep structured series
    const dataByState = d3.group(RAW_DATA, (d) => d.state);
    const formattedData = STATES.map((st) => {
      const entry = { state: st };
      (dataByState.get(st) || []).forEach((d) => {
        entry[d.age] = d.population;
      });
      return entry;
    });

    const stack = d3.stack().keys(AGES);
    const series = stack(formattedData);

    const maxStacked = d3.max(series, (layer) => d3.max(layer, (d) => d[1])) || 40000000;
    const maxGrouped = d3.max(RAW_DATA, (d) => d.population) || 6000000;

    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .attr("viewBox", [0, 0, w, h])
      .attr("width", "100%")
      .attr("height", h)
      .style("background", T.chartBg)
      .style("border-radius", "8px")
      .style("font-family", "system-ui, -apple-system, sans-serif");

    // X Scales
    const x0 = d3
      .scaleBand()
      .domain(STATES)
      .range([margin.left, w - margin.right])
      .padding(0.24);

    const x1 = d3.scaleBand().domain(AGES).range([0, x0.bandwidth()]).padding(0.05);

    // Y Scales
    const yStacked = d3
      .scaleLinear()
      .domain([0, maxStacked * 1.05])
      .range([h - margin.bottom, margin.top]);

    const yGrouped = d3
      .scaleLinear()
      .domain([0, maxGrouped * 1.1])
      .range([h - margin.bottom, margin.top]);

    const activeY = layoutMode === "stacked" ? yStacked : yGrouped;

    // Gridlines
    svg
      .append("g")
      .attr("class", "y-grid")
      .attr("transform", `translate(${margin.left},0)`)
      .call(
        d3
          .axisLeft(activeY)
          .ticks(8)
          .tickSize(-(w - margin.left - margin.right))
          .tickFormat("")
      )
      .call((g) => {
        g.select(".domain").remove();
        g.selectAll("line").style("stroke", T.grid).style("stroke-dasharray", "3,3");
      });

    // Axes
    const xAxisG = svg
      .append("g")
      .attr("transform", `translate(0,${h - margin.bottom})`)
      .call(d3.axisBottom(x0))
      .call((g) => {
        g.select(".domain").style("stroke", T.border);
        g.selectAll("line").style("stroke", T.border);
        g.selectAll("text").style("fill", T.text).style("font-size", "12px").style("font-weight", "700");
      });

    const yAxisG = svg
      .append("g")
      .attr("class", "y-axis")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(activeY).ticks(8).tickFormat((d) => `${(d / 1e6).toFixed(0)}M`))
      .call((g) => {
        g.select(".domain").style("stroke", T.border);
        g.selectAll("line").style("stroke", T.border);
        g.selectAll("text").style("fill", T.text).style("font-size", "11px");
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
      .text("US State / Clinical Region →");

    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -h / 2)
      .attr("y", 22)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("font-weight", "600")
      .style("fill", T.text)
      .text("↑ Resident Population (Millions)");

    // Tooltip
    const tooltip = d3
      .select(containerRef.current)
      .selectAll(".s2g-tooltip")
      .data([null])
      .join("div")
      .attr("class", "s2g-tooltip")
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

    // Layers & Bars
    const layerG = svg
      .append("g")
      .selectAll("g.layer")
      .data(series)
      .join("g")
      .attr("class", "layer")
      .attr("fill", (d, i) => palette[i % palette.length]);

    const rects = layerG
      .selectAll("rect")
      .data((d) => d.map((p) => ({ ...p, age: d.key, state: p.data.state, val: p.data[d.key] })))
      .join("rect")
      .attr("rx", 3)
      .style("cursor", "pointer")
      .on("mouseover", function (event, d) {
        d3.select(this).attr("fill-opacity", 0.75);
        setActiveState(d.state);
        setActiveAge(d.age);
        tooltip
          .style("opacity", 1)
          .html(
            `<div style="font-weight:700;font-size:13px;margin-bottom:3px">${d.state} · Age ${d.age}</div>` +
            `👥 Population: <b>${d3.format(",")(d.val)}</b>`
          )
          .style("left", `${event.offsetX + 14}px`)
          .style("top", `${event.offsetY - 14}px`);
      })
      .on("mousemove", function (event) {
        tooltip.style("left", `${event.offsetX + 14}px`).style("top", `${event.offsetY - 14}px`);
      })
      .on("mouseout", function () {
        d3.select(this).attr("fill-opacity", 1);
        tooltip.style("opacity", 0);
      });

    // Perform smooth morphing transition based on layoutMode
    if (layoutMode === "stacked") {
      rects
        .transition()
        .duration(850)
        .ease(d3.easeCubicInOut)
        .attr("x", (d) => x0(d.state))
        .attr("y", (d) => yStacked(d[1]))
        .attr("height", (d) => Math.max(0, yStacked(d[0]) - yStacked(d[1])))
        .attr("width", x0.bandwidth());
    } else {
      rects
        .transition()
        .duration(850)
        .ease(d3.easeCubicInOut)
        .attr("x", (d) => x0(d.state) + x1(d.age))
        .attr("y", (d) => yGrouped(d.val))
        .attr("height", (d) => Math.max(0, yGrouped(0) - yGrouped(d.val)))
        .attr("width", x1.bandwidth());
    }

  }, [theme, palette, layoutMode]);

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%", border: `1px solid ${T.border}`, borderRadius: 8, overflow: "hidden" }}>
      <svg ref={svgRef}></svg>
    </div>
  );
}

// ─── 3D MORPHING BARS (THREE.JS) ─────────────────────────────────────────────
function Chart3D({ theme, palette, layoutMode }) {
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

    // Floor & 3D Grid
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

    // Group data by state
    const xStateScale = d3.scalePoint().domain(STATES).range([-9, 9]).padding(0.5);
    const zAgeScale = d3.scalePoint().domain(AGES).range([-4, 4]).padding(0.5);
    const heightScale = d3.scaleLinear().domain([0, 6000000]).range([0.4, 5.5]);
    const stackedHeightScale = d3.scaleLinear().domain([0, 40000000]).range([0.4, 14]);

    STATES.forEach((st) => {
      const stateRows = RAW_DATA.filter((d) => d.state === st);
      let cumulativeH = -7.95;

      stateRows.forEach((row, i) => {
        const colHex = palette[i % palette.length];
        const hVal = heightScale(row.population);

        if (layoutMode === "stacked") {
          const sH = (row.population / 40000000) * 12;
          const boxGeo = new THREE.BoxGeometry(2, Math.max(0.1, sH), 2);
          const boxMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(colHex),
            roughness: 0.3,
            metalness: 0.4,
          });
          const bar = new THREE.Mesh(boxGeo, boxMat);
          bar.position.set(xStateScale(st), cumulativeH + sH / 2, 0);
          cumulativeH += sH;
          bar.castShadow = true;
          pivot.add(bar);
        } else {
          const boxGeo = new THREE.BoxGeometry(1.6, Math.max(0.1, hVal), 0.8);
          const boxMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(colHex),
            roughness: 0.3,
            metalness: 0.4,
          });
          const bar = new THREE.Mesh(boxGeo, boxMat);
          bar.position.set(xStateScale(st), -7.95 + hVal / 2, zAgeScale(row.age));
          bar.castShadow = true;
          pivot.add(bar);
        }
      });
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
  }, [theme, palette, layoutMode]);

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
        💡 Drag to rotate in 3D · Mode: {layoutMode.toUpperCase()} · X=State · Y=Pop · Z=Age
      </div>
    </div>
  );
}

// ─── MAIN STACKED-TO-GROUPED COMPONENT ───────────────────────────────────────
export default function StackedtoGroupedBarCharts() {
  const [viewMode, setViewMode] = useState("2d");
  const [layoutMode, setLayoutMode] = useState("stacked");
  const [theme, setTheme] = useState("Light");
  const [colorTheme, setColorTheme] = useState("Modern");
  const [activeState, setActiveState] = useState(null);
  const [activeAge, setActiveAge] = useState(null);

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

  const modeBtnStyle = (isActive) => ({
    padding: "6px 14px",
    borderRadius: 6,
    border: `1px solid ${isActive ? palette[0] : T.border}`,
    background: isActive ? palette[0] : theme === "Dark" ? "#1f2937" : "#ffffff",
    color: isActive ? "#ffffff" : T.text,
    fontWeight: "700",
    fontSize: 12,
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
          Stacked-to-Grouped Bars – Demographic & Age Distribution
        </h2>
        <p style={{ fontSize: 13, color: T.subtext, margin: "4px 0 0 0" }}>
          Smooth animated morphological transitions between stacked towers and grouped side-by-side comparative bars.
        </p>
      </div>

      {/* Controls Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginTop: 18,
          marginBottom: 20,
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
            <option value="2d">2D Morphing (D3)</option>
            <option value="3d">3D Stadium (Three.js)</option>
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

        {/* Layout Mode Switcher */}
        <div style={{ display: "flex", gap: 6, marginLeft: "auto" }}>
          <button onClick={() => setLayoutMode("stacked")} style={modeBtnStyle(layoutMode === "stacked")}>
            Stacked View
          </button>
          <button onClick={() => setLayoutMode("grouped")} style={modeBtnStyle(layoutMode === "grouped")}>
            Grouped View
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
              layoutMode={layoutMode}
              setActiveState={setActiveState}
              setActiveAge={setActiveAge}
            />
          ) : (
            <Chart3D theme={theme} palette={palette} layoutMode={layoutMode} />
          )}
        </div>
        <StatsPanel
          layoutMode={layoutMode}
          theme={theme}
          palette={palette}
          activeState={activeState}
          activeAge={activeAge}
        />
      </div>
    </div>
  );
}
