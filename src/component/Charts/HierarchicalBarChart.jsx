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
    barBg: "#f1f5f9",
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
    barBg: "#1e293b",
    threeBg: 0x0b0f19,
  },
};

const PALETTES = {
  Modern: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"],
  Neon: ["#00f5ff", "#39ff14", "#ffe600", "#ff007f", "#b537f2", "#ff5400"],
  Sunset: ["#ff4e50", "#fc913a", "#f9d423", "#ede574", "#e1f5c4", "#ff6f69"],
  Emerald: ["#047857", "#059669", "#10b981", "#34d399", "#6ee7b7", "#a7f3d0"],
  Ocean: ["#0077b6", "#0096c7", "#00b4d8", "#48cae4", "#90e0ef", "#03045e"],
};

// Hierarchical Clinical Budget & Expenditure Tree Data
const HIERARCHY_DATA = {
  name: "Hospital Operating Portfolio",
  value: 48500000,
  children: [
    {
      name: "Surgical Inpatient Ward",
      value: 18200000,
      children: [
        { name: "Neurosurgery OR", value: 5800000 },
        { name: "Cardiothoracic Suite", value: 5400000 },
        { name: "Orthopedic Surgery", value: 4200000 },
        { name: "General Trauma OR", value: 2800000 },
      ],
    },
    {
      name: "Outpatient & Specialty Clinics",
      value: 12400000,
      children: [
        { name: "Oncology Infusion Care", value: 4600000 },
        { name: "Cardiovascular OPD", value: 3800000 },
        { name: "Endocrinology Center", value: 2400000 },
        { name: "Pulmonary Medicine", value: 1600000 },
      ],
    },
    {
      name: "Emergency & Trauma Center",
      value: 9500000,
      children: [
        { name: "Level 1 Resuscitation", value: 3900000 },
        { name: "Emergency Observation", value: 2800000 },
        { name: "Rapid Triage & Screening", value: 1600000 },
        { name: "EMS Transport Fleet", value: 1200000 },
      ],
    },
    {
      name: "Diagnostics & Imaging",
      value: 5200000,
      children: [
        { name: "MRI & CT Diagnostics", value: 2600000 },
        { name: "Pathology & Genomics Lab", value: 1700000 },
        { name: "Ultrasound & Fluoroscopy", value: 900000 },
      ],
    },
    {
      name: "Clinical Pharmacy",
      value: 3200000,
      children: [
        { name: "Specialty Biologics", value: 1600000 },
        { name: "Inpatient Formulary", value: 1100000 },
        { name: "Chemotherapy Compounding", value: 500000 },
      ],
    },
  ],
};

// ─── STATS PANEL ─────────────────────────────────────────────────────────────
function StatsPanel({ currentNode, theme, palette }) {
  const T = UI_THEMES[theme];

  const childCount = currentNode.children ? currentNode.children.length : 0;
  const largestChild = useMemo(() => {
    if (!currentNode.children || !currentNode.children.length) return null;
    return d3.greatest(currentNode.children, (d) => d.value);
  }, [currentNode]);

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
        DRILLDOWN METRICS
      </div>

      {card("📁 Active Node", currentNode.name, childCount ? `${childCount} sub-departments` : "Leaf item", palette[0])}
      {card(
        "💰 Allocated Capital",
        `$${(currentNode.value / 1e6).toFixed(2)}M`,
        "Fiscal Year Allocation",
        palette[1] || "#10b981"
      )}
      {largestChild &&
        card(
          "🏆 Leading Department",
          largestChild.name,
          `$${(largestChild.value / 1e6).toFixed(2)}M (${((largestChild.value / currentNode.value) * 100).toFixed(0)}%)`,
          palette[2] || "#f59e0b"
        )}

      {/* Drilldown Instructions */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 12px", marginTop: 4 }}>
        <div style={{ fontSize: 10, color: T.subtext, fontWeight: 700, marginBottom: 4, textTransform: "uppercase" }}>
          How to Navigate
        </div>
        <p style={{ fontSize: 11, color: T.text, margin: 0, lineHeight: 1.45 }}>
          Click any bar to drill down into its sub-departments. Use the breadcrumb links above to navigate back up the hierarchy.
        </p>
      </div>
    </div>
  );
}

// ─── 2D HIERARCHICAL DRILLDOWN BARS (D3) ──────────────────────────────────────
function Chart2D({ theme, palette, currentNode, onSelectNode }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const T = UI_THEMES[theme];

  const width = 740;
  const height = 520;
  const margin = { top: 35, right: 90, bottom: 45, left: 210 };
  const barHeight = 42;

  const items = currentNode.children || [currentNode];

  useEffect(() => {
    if (!containerRef.current) return;
    const w = containerRef.current.clientWidth || width;
    const h = height;

    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .attr("viewBox", [0, 0, w, h])
      .attr("width", "100%")
      .attr("height", "auto")
      .style("background", T.chartBg)
      .style("border-radius", "8px")
      .style("font-family", "system-ui, -apple-system, sans-serif");

    const maxVal = d3.max(items, (d) => d.value) || 1000;
    const xScale = d3
      .scaleLinear()
      .domain([0, maxVal * 1.1])
      .range([margin.left, w - margin.right]);

    // Top Axis
    svg
      .append("g")
      .attr("transform", `translate(0,${margin.top})`)
      .call(d3.axisTop(xScale).ticks(6).tickFormat((d) => `$${(d / 1e6).toFixed(1)}M`))
      .call((g) => {
        g.select(".domain").style("stroke", T.border);
        g.selectAll("line").style("stroke", T.border);
        g.selectAll("text").style("fill", T.text).style("font-size", "11px");
      });

    // Vertical Gridlines
    svg
      .append("g")
      .attr("transform", `translate(0,${h - margin.bottom})`)
      .call(
        d3
          .axisBottom(xScale)
          .ticks(6)
          .tickSize(-(h - margin.top - margin.bottom))
          .tickFormat("")
      )
      .call((g) => {
        g.select(".domain").remove();
        g.selectAll("line").style("stroke", T.grid).style("stroke-dasharray", "3,3");
      });

    // Label with arrow
    svg
      .append("text")
      .attr("x", (w + margin.left) / 2)
      .attr("y", h - 14)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("font-weight", "600")
      .style("fill", T.text)
      .text("Allocated Departmental Capital (USD Millions) →");

    // Tooltip
    const tooltip = d3
      .select(containerRef.current)
      .selectAll(".hb-tooltip")
      .data([null])
      .join("div")
      .attr("class", "hb-tooltip")
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

    // Bars
    const barG = svg.append("g");

    items.forEach((d, i) => {
      const g = barG
        .append("g")
        .attr("transform", `translate(0,${margin.top + 16 + i * (barHeight + 8)})`)
        .style("cursor", d.children ? "pointer" : "default");

      const col = palette[i % palette.length];

      // Bar Background Slot
      g.append("rect")
        .attr("x", margin.left)
        .attr("width", w - margin.left - margin.right)
        .attr("height", barHeight)
        .attr("rx", 5)
        .attr("fill", T.barBg);

      // Active Bar
      g.append("rect")
        .attr("x", margin.left)
        .attr("width", 0)
        .attr("height", barHeight)
        .attr("rx", 5)
        .attr("fill", col)
        .transition()
        .duration(600)
        .delay(i * 60)
        .ease(d3.easeCubicOut)
        .attr("width", Math.max(0, xScale(d.value) - margin.left));

      // Label: Department Name
      g.append("text")
        .attr("x", margin.left - 12)
        .attr("y", barHeight / 2)
        .attr("dy", ".35em")
        .attr("text-anchor", "end")
        .attr("font-size", "12px")
        .attr("font-weight", "700")
        .attr("fill", T.text)
        .text(`${d.children ? "▶ " : ""}${d.name}`);

      // Label: Value
      g.append("text")
        .attr("x", xScale(d.value) + 10)
        .attr("y", barHeight / 2)
        .attr("dy", ".35em")
        .attr("font-size", "12px")
        .attr("font-weight", "800")
        .attr("fill", T.text)
        .text(`$${(d.value / 1e6).toFixed(2)}M`);

      // Mouse Events
      g.on("mouseover", function (event) {
        tooltip
          .style("opacity", 1)
          .html(
            `<div style="font-weight:700;color:${col};font-size:13px">${d.name}</div>` +
            `💰 Budget: <b>$${d3.format(",")(d.value)}</b><br/>` +
            (d.children ? `<span style="font-size:10px;color:${T.subtext}">Click to drill into ${d.children.length} sub-units</span>` : "")
          )
          .style("left", `${event.offsetX + 14}px`)
          .style("top", `${event.offsetY - 14}px`);
      })
        .on("mousemove", function (event) {
          tooltip.style("left", `${event.offsetX + 14}px`).style("top", `${event.offsetY - 14}px`);
        })
        .on("mouseout", function () {
          tooltip.style("opacity", 0);
        })
        .on("click", function () {
          if (d.children) {
            onSelectNode(d);
          }
        });
    });

  }, [theme, palette, currentNode]);

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%", border: `1px solid ${T.border}`, borderRadius: 8, overflow: "hidden" }}>
      <svg ref={svgRef}></svg>
    </div>
  );
}

// ─── 3D HIERARCHICAL STADIUM BARS (THREE.JS) ─────────────────────────────────
function Chart3D({ theme, palette, currentNode }) {
  const mountRef = useRef(null);
  const T = UI_THEMES[theme];

  const items = currentNode.children || [currentNode];

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
    camera.position.set(18, 16, 24);
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

    // 3D Horizontal Bars
    const maxVal = d3.max(items, (d) => d.value) || 1000;
    const barScale = d3.scaleLinear().domain([0, maxVal]).range([1, 14]);

    items.forEach((d, i) => {
      const colHex = palette[i % palette.length];
      const w = barScale(d.value);
      const boxGeo = new THREE.BoxGeometry(w, 0.9, 1.4);
      const boxMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(colHex),
        roughness: 0.25,
        metalness: 0.5,
        emissive: new THREE.Color(colHex),
        emissiveIntensity: 0.25,
      });
      const barMesh = new THREE.Mesh(boxGeo, boxMat);
      barMesh.position.set(-7 + w / 2, 4 - i * 1.6, 0);
      barMesh.castShadow = true;
      pivot.add(barMesh);
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
  }, [theme, palette, items]);

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
        💡 3D Extruded Hierarchical Bars · Click 2D bars to drill down
      </div>
    </div>
  );
}

// ─── MAIN HIERARCHICAL BAR CHART COMPONENT ────────────────────────────────────
export default function HierarchicalBarChart() {
  const [viewMode, setViewMode] = useState("2d");
  const [theme, setTheme] = useState("Light");
  const [colorTheme, setColorTheme] = useState("Modern");
  const [breadcrumbStack, setBreadcrumbStack] = useState([HIERARCHY_DATA]);

  const currentNode = breadcrumbStack[breadcrumbStack.length - 1];
  const T = UI_THEMES[theme];
  const palette = PALETTES[colorTheme] || PALETTES.Modern;

  const handleSelectNode = (childNode) => {
    setBreadcrumbStack((prev) => [...prev, childNode]);
  };

  const handleBreadcrumbClick = (index) => {
    setBreadcrumbStack((prev) => prev.slice(0, index + 1));
  };

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
          Hierarchical Bar Chart – Multi-Tier Department Drilldown
        </h2>
        <p style={{ fontSize: 13, color: T.subtext, margin: "4px 0 0 0" }}>
          Interactive drilldown into divisional budget allocations and operational sub-departments with breadcrumb trail.
        </p>
      </div>

      {/* Controls Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginTop: 18,
          marginBottom: 14,
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
            <option value="2d">2D Drilldown (D3)</option>
            <option value="3d">3D Bars (Three.js)</option>
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

        {breadcrumbStack.length > 1 && (
          <button
            onClick={() => setBreadcrumbStack((prev) => prev.slice(0, prev.length - 1))}
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
            ← Back Up Level
          </button>
        )}
      </div>

      {/* Breadcrumb Trail */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18, fontSize: 12, flexWrap: "wrap" }}>
        <span style={{ color: T.subtext, fontWeight: "600" }}>Hierarchy:</span>
        {breadcrumbStack.map((node, i) => (
          <React.Fragment key={node.name}>
            {i > 0 && <span style={{ color: T.subtext }}>›</span>}
            <span
              onClick={() => handleBreadcrumbClick(i)}
              style={{
                color: i === breadcrumbStack.length - 1 ? T.text : palette[0],
                fontWeight: i === breadcrumbStack.length - 1 ? "800" : "600",
                cursor: i === breadcrumbStack.length - 1 ? "default" : "pointer",
                textDecoration: i === breadcrumbStack.length - 1 ? "none" : "underline",
              }}
            >
              {node.name}
            </span>
          </React.Fragment>
        ))}
      </div>

      {/* Visual Canvas + Stats Panel */}
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start", width: "100%", flexWrap: "nowrap" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {viewMode === "2d" ? (
            <Chart2D
              theme={theme}
              palette={palette}
              currentNode={currentNode}
              onSelectNode={handleSelectNode}
            />
          ) : (
            <Chart3D theme={theme} palette={palette} currentNode={currentNode} />
          )}
        </div>
        <StatsPanel currentNode={currentNode} theme={theme} palette={palette} />
      </div>
    </div>
  );
}
