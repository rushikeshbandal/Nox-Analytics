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
  Modern: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"],
  Neon: ["#00f5ff", "#39ff14", "#ffe600", "#ff007f", "#b537f2", "#ff5400"],
  Sunset: ["#ff4e50", "#fc913a", "#f9d423", "#ede574", "#e1f5c4", "#ff6f69"],
  Ocean: ["#0077b6", "#0096c7", "#00b4d8", "#48cae4", "#90e0ef", "#03045e"],
  Emerald: ["#065f46", "#047857", "#059669", "#10b981", "#34d399", "#6ee7b7"],
};

// Hierarchical Clinical Triage & Department Nodes for Smooth Zooming
const CLINICAL_HIERARCHY = [
  {
    id: "cardio",
    name: "Cardiovascular Division",
    x: 240,
    y: 190,
    r: 130,
    cases: 4250,
    severity: "High",
    desc: "Heart failure, coronary interventions, arrhythmias, and hemodynamic monitoring.",
    children: [
      { id: "arrhythmia", name: "Cardiac Arrhythmia", x: 200, y: 155, r: 42, cases: 1420, severity: "High" },
      { id: "cad", name: "Coronary Artery", x: 275, y: 160, r: 48, cases: 1850, severity: "Critical" },
      { id: "valvular", name: "Valvular Disease", x: 240, y: 240, r: 38, cases: 980, severity: "Medium" },
    ],
  },
  {
    id: "neuro",
    name: "Neurological Sciences",
    x: 620,
    y: 180,
    r: 120,
    cases: 3680,
    severity: "Critical",
    desc: "Acute stroke management, neurodegenerative care, and epilepsy units.",
    children: [
      { id: "stroke", name: "Acute Ischemic Stroke", x: 580, y: 150, r: 45, cases: 1600, severity: "Critical" },
      { id: "epilepsy", name: "Refractory Epilepsy", x: 655, y: 155, r: 40, cases: 1120, severity: "High" },
      { id: "dementia", name: "Cognitive Disorders", x: 615, y: 230, r: 36, cases: 960, severity: "Medium" },
    ],
  },
  {
    id: "metabolic",
    name: "Endocrine & Metabolic",
    x: 290,
    y: 430,
    r: 115,
    cases: 5120,
    severity: "Medium",
    desc: "Diabetes mellitus, thyroid malignancies, and adrenal disorders.",
    children: [
      { id: "diabetes", name: "Type 1 & 2 Diabetes", x: 250, y: 410, r: 46, cases: 2800, severity: "Medium" },
      { id: "thyroid", name: "Thyroid Pathology", x: 325, y: 415, r: 38, cases: 1450, severity: "Low" },
      { id: "adrenal", name: "Metabolic Syndrome", x: 290, y: 480, r: 32, cases: 870, severity: "Medium" },
    ],
  },
  {
    id: "pulmonary",
    name: "Pulmonary & Critical Care",
    x: 650,
    y: 410,
    r: 125,
    cases: 4890,
    severity: "High",
    desc: "COPD exacerbation, severe asthma, pulmonary fibrosis, and ventilator support.",
    children: [
      { id: "copd", name: "COPD Exacerbation", x: 610, y: 380, r: 44, cases: 2150, severity: "High" },
      { id: "asthma", name: "Acute Bronchial Asthma", x: 685, y: 385, r: 40, cases: 1740, severity: "Medium" },
      { id: "ards", name: "Acute Respiratory Distress", x: 650, y: 455, r: 38, cases: 1000, severity: "Critical" },
    ],
  },
];

// ─── STATS PANEL ─────────────────────────────────────────────────────────────
function StatsPanel({ activeNode, theme, palette }) {
  const T = UI_THEMES[theme];

  const totalCases = useMemo(() => d3.sum(CLINICAL_HIERARCHY, (d) => d.cases), []);
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
        ZOOM TARGET METRICS
      </div>

      {card(
        "🎯 Focused Unit",
        activeNode?.name || "Hospital Overview",
        activeNode ? `Severity: ${activeNode.severity}` : "4 Main Clinical Divisions",
        palette[0]
      )}
      {card(
        "👥 Patient Inflow",
        `${d3.format(",")(activeNode?.cases || totalCases)} cases`,
        activeNode ? "Within selected unit" : "Campus total",
        palette[1] || "#10b981"
      )}
      {card(
        "🚨 Triage Acuity",
        activeNode?.severity || "Mixed Cohort",
        activeNode?.desc || "Click any inner or outer bubble to smoothly zoom",
        palette[2] || "#f59e0b"
      )}

      {/* Division Legend */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 12px", marginTop: 4 }}>
        <div style={{ fontSize: 10, color: T.subtext, fontWeight: 700, marginBottom: 8, textTransform: "uppercase" }}>
          Clinical Divisions
        </div>
        {CLINICAL_HIERARCHY.map((div, i) => (
          <div key={div.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: palette[i % palette.length] }} />
            <span style={{ fontSize: 11, color: T.text, fontWeight: "600" }}>{div.name.split(" ")[0]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 2D SMOOTH ZOOM CANVAS (D3 INTERPOLATE ZOOM) ──────────────────────────────
function Chart2D({ theme, palette, activeNode, setActiveNode, resetSignal }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const zoomToRef = useRef(null);
  const T = UI_THEMES[theme];

  const width = 880;
  const height = 580;

  useEffect(() => {
    if (!containerRef.current) return;
    const w = width;
    const h = height;

    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .attr("viewBox", [0, 0, w, h])
      .attr("width", "100%")
      .attr("height", "auto")
      .style("background", T.chartBg)
      .style("border-radius", "8px")
      .style("font-family", "system-ui, -apple-system, sans-serif")
      .style("cursor", "crosshair");

    // Background Click -> Reset Zoom
    svg
      .append("rect")
      .attr("width", w)
      .attr("height", h)
      .attr("fill", "transparent")
      .on("click", () => {
        zoomTo(w / 2, h / 2, w / 2);
        setActiveNode(null);
      });

    // Tooltip
    const tooltip = d3
      .select(containerRef.current)
      .selectAll(".sz-tooltip")
      .data([null])
      .join("div")
      .attr("class", "sz-tooltip")
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

    // Parent Divisions (Outer Circles)
    const divisionG = svg.append("g").attr("class", "divisions");

    CLINICAL_HIERARCHY.forEach((div, divIdx) => {
      const col = palette[divIdx % palette.length];
      const g = divisionG.append("g").attr("class", `div-group-${div.id}`);

      // Parent Circle
      g.append("circle")
        .attr("cx", div.x)
        .attr("cy", div.y)
        .attr("r", div.r)
        .attr("fill", col)
        .attr("fill-opacity", 0.12)
        .attr("stroke", col)
        .attr("stroke-width", 2)
        .style("cursor", "pointer")
        .on("mouseover", function (event) {
          d3.select(this).attr("fill-opacity", 0.22);
          tooltip
            .style("opacity", 1)
            .html(
              `<div style="font-weight:700;color:${col};font-size:13px">${div.name}</div>` +
              `🏥 Inflow: <b>${d3.format(",")(div.cases)}</b> cases<br/>` +
              `<span style="font-size:10px;color:${T.subtext}">Click to zoom into division</span>`
            )
            .style("left", `${event.offsetX + 14}px`)
            .style("top", `${event.offsetY - 14}px`);
        })
        .on("mousemove", function (event) {
          tooltip.style("left", `${event.offsetX + 14}px`).style("top", `${event.offsetY - 14}px`);
        })
        .on("mouseout", function () {
          d3.select(this).attr("fill-opacity", 0.12);
          tooltip.style("opacity", 0);
        })
        .on("click", (event) => {
          event.stopPropagation();
          zoomTo(div.x, div.y, div.r);
          setActiveNode(div);
        });

      // Division Title
      g.append("text")
        .attr("x", div.x)
        .attr("y", div.y - div.r - 8)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("font-weight", "800")
        .attr("fill", col)
        .style("pointer-events", "none")
        .text(div.name);

      // Child Sub-specialty Circles
      div.children.forEach((child) => {
        g.append("circle")
          .attr("cx", child.x)
          .attr("cy", child.y)
          .attr("r", child.r)
          .attr("fill", col)
          .attr("fill-opacity", 0.75)
          .attr("stroke", "#ffffff")
          .attr("stroke-width", 1.5)
          .style("cursor", "pointer")
          .on("mouseover", function (event) {
            d3.select(this).attr("fill-opacity", 1).attr("r", child.r + 3);
            tooltip
              .style("opacity", 1)
              .html(
                `<div style="font-weight:700;color:${col};font-size:13px">${child.name}</div>` +
                `🔬 Inflow: <b>${d3.format(",")(child.cases)}</b> cases<br/>` +
                `⚠️ Acuity: <b>${child.severity}</b><br/>` +
                `<span style="font-size:10px;color:${T.subtext}">Click to zoom target</span>`
              )
              .style("left", `${event.offsetX + 14}px`)
              .style("top", `${event.offsetY - 14}px`);
          })
          .on("mousemove", function (event) {
            tooltip.style("left", `${event.offsetX + 14}px`).style("top", `${event.offsetY - 14}px`);
          })
          .on("mouseout", function () {
            d3.select(this).attr("fill-opacity", 0.75).attr("r", child.r);
            tooltip.style("opacity", 0);
          })
          .on("click", (event) => {
            event.stopPropagation();
            zoomTo(child.x, child.y, child.r);
            setActiveNode(child);
          });

        // Child Label
        g.append("text")
          .attr("x", child.x)
          .attr("y", child.y + 3)
          .attr("text-anchor", "middle")
          .attr("font-size", "10px")
          .attr("font-weight", "700")
          .attr("fill", "#ffffff")
          .style("pointer-events", "none")
          .text(child.name.split(" ")[0]);
      });
    });

    // d3.interpolateZoom Smooth Zoom Engine
    let currentTransform = [w / 2, h / 2, w];

    const zoomTo = (targetX, targetY, targetRadius) => {
      const targetW = targetRadius * 2.8;
      const interpolator = d3.interpolateZoom(currentTransform, [targetX, targetY, targetW]);

      svg
        .transition()
        .duration(1200)
        .ease(d3.easeCubicInOut)
        .tween("smooth-zoom", () => (t) => {
          const [cx, cy, viewW] = interpolator(t);
          const viewH = (viewW * h) / w;
          svg.attr("viewBox", [cx - viewW / 2, cy - viewH / 2, viewW, viewH]);
        })
        .on("end", () => {
          currentTransform = [targetX, targetY, targetW];
        });
    };

    zoomToRef.current = zoomTo;

  }, [theme, palette]);

  // Handle external reset signal
  useEffect(() => {
    if (zoomToRef.current && resetSignal) {
      zoomToRef.current(width / 2, height / 2, width / 2);
    }
  }, [resetSignal]);

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%", border: `1px solid ${T.border}`, borderRadius: 8, overflow: "hidden" }}>
      <svg ref={svgRef}></svg>
    </div>
  );
}

// ─── 3D HIERARCHICAL CLOUD (THREE.JS) ────────────────────────────────────────
function Chart3D({ theme, palette, activeNode }) {
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
    camera.position.set(18, 16, 26);
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

    // Render 3D department spheres
    const divScaleX = d3.scaleLinear().domain([100, 800]).range([-8, 8]);
    const divScaleY = d3.scaleLinear().domain([100, 500]).range([6, -4]);

    CLINICAL_HIERARCHY.forEach((div, divIdx) => {
      const colHex = palette[divIdx % palette.length];
      const isTarget = !activeNode || activeNode.id === div.id;

      // Outer bounding wireframe sphere
      const outerGeo = new THREE.SphereGeometry(div.r / 30, 24, 24);
      const outerMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(colHex),
        transparent: true,
        opacity: isTarget ? 0.25 : 0.08,
        wireframe: true,
      });
      const outerMesh = new THREE.Mesh(outerGeo, outerMat);
      outerMesh.position.set(divScaleX(div.x), divScaleY(div.y), 0);
      pivot.add(outerMesh);

      // Child solid spheres
      div.children.forEach((child) => {
        const cGeo = new THREE.SphereGeometry(child.r / 35, 24, 24);
        const cMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(colHex),
          roughness: 0.3,
          metalness: 0.45,
          emissive: new THREE.Color(colHex),
          emissiveIntensity: activeNode && activeNode.id === child.id ? 0.6 : 0.2,
        });
        const cMesh = new THREE.Mesh(cGeo, cMat);
        cMesh.position.set(divScaleX(child.x), divScaleY(child.y), 0);
        cMesh.castShadow = true;
        pivot.add(cMesh);
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
  }, [theme, palette, activeNode]);

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
        💡 Drag to rotate in 3D · 3D Clinical Clusters · Multi-scale Zoom
      </div>
    </div>
  );
}

// ─── MAIN SMOOTH ZOOM COMPONENT ──────────────────────────────────────────────
export default function SmoothZoom() {
  const [viewMode, setViewMode] = useState("2d");
  const [theme, setTheme] = useState("Light");
  const [colorTheme, setColorTheme] = useState("Modern");
  const [activeNode, setActiveNode] = useState(null);
  const [resetCount, setResetCount] = useState(0);

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
          Smooth Zooming – Consultation Severity & Department Breakdown
        </h2>
        <p style={{ fontSize: 13, color: T.subtext, margin: "4px 0 0 0" }}>
          Cinematic camera interpolation across hierarchical clinical divisions using d3.interpolateZoom · Click any bubble to dive in.
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
            <option value="2d">2D Smooth Zoom (D3)</option>
            <option value="3d">3D Nested Spheres (Three.js)</option>
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

        {/* Reset Zoom Button */}
        <button
          onClick={() => {
            setActiveNode(null);
            setResetCount((prev) => prev + 1);
          }}
          style={{ ...btnStyle, marginLeft: "auto" }}
        >
          🔍 Reset to Overview
        </button>
      </div>

      {/* Breadcrumbs Navigation */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18, fontSize: 12 }}>
        <span style={{ color: T.subtext, fontWeight: "600" }}>Location:</span>
        <span
          onClick={() => {
            setActiveNode(null);
            setResetCount((prev) => prev + 1);
          }}
          style={{ color: palette[0], fontWeight: "700", cursor: "pointer" }}
        >
          Hospital Overview
        </span>
        {activeNode && (
          <>
            <span style={{ color: T.subtext }}>›</span>
            <span style={{ color: T.text, fontWeight: "700" }}>{activeNode.name}</span>
          </>
        )}
      </div>

      {/* Visual Canvas + Stats Panel */}
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start", width: "100%", flexWrap: "nowrap" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {viewMode === "2d" ? (
            <Chart2D
              theme={theme}
              palette={palette}
              activeNode={activeNode}
              setActiveNode={setActiveNode}
              resetSignal={resetCount}
            />
          ) : (
            <Chart3D theme={theme} palette={palette} activeNode={activeNode} />
          )}
        </div>
        <StatsPanel activeNode={activeNode} theme={theme} palette={palette} />
      </div>
    </div>
  );
}
