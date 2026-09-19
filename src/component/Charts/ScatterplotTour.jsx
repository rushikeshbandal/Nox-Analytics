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
    hullFill: "rgba(59, 130, 246, 0.08)",
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
    hullFill: "rgba(59, 130, 246, 0.15)",
    threeBg: 0x0b0f19,
  },
};

const PALETTES = {
  Modern: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"],
  Neon: ["#00f5ff", "#39ff14", "#ffe600", "#ff007f", "#b537f2"],
  Sunset: ["#ff4e50", "#fc913a", "#f9d423", "#ede574", "#e1f5c4"],
  Ocean: ["#0077b6", "#00b4d8", "#90e0ef", "#03045e", "#0096c7"],
  Emerald: ["#059669", "#10b981", "#34d399", "#6ee7b7", "#047857"],
};

// ─── CLINICAL COHORTS / CLUSTER TOUR DATA ────────────────────────────────────
const CLUSTER_METADATA = [
  {
    id: 0,
    name: "Pediatric & Preventive",
    cx: 25,
    cy: 30,
    cz: 75,
    r: 12,
    count: 45,
    desc: "Low acuity baseline, early childhood and preventive checkups with rapid recovery velocity.",
    focusZoom: { k: 2.4, x: 25, y: 30 },
  },
  {
    id: 1,
    name: "Young Adult Low-Risk",
    cx: 42,
    cy: 65,
    cz: 60,
    r: 11,
    count: 50,
    desc: "Moderate biomarker activity with low hospitalization probability and high outpatient clearance.",
    focusZoom: { k: 2.3, x: 42, y: 65 },
  },
  {
    id: 2,
    name: "Chronic Metabolic",
    cx: 68,
    cy: 40,
    cz: 45,
    r: 14,
    count: 55,
    desc: "Persistent glycemic and cardiovascular biomarkers requiring ongoing clinical protocol.",
    focusZoom: { k: 2.1, x: 68, y: 40 },
  },
  {
    id: 3,
    name: "Senior Critical Acuity",
    cx: 82,
    cy: 78,
    cz: 25,
    r: 13,
    count: 40,
    desc: "Complex multi-morbidity cohort with elevated risk index requiring immediate ICU/specialist care.",
    focusZoom: { k: 2.3, x: 82, y: 78 },
  },
  {
    id: 4,
    name: "Specialized Rehabilitation",
    cx: 52,
    cy: 22,
    cz: 55,
    r: 10,
    count: 42,
    desc: "Post-surgical recovery monitoring with progressive mobility improvements and therapeutic follow-up.",
    focusZoom: { k: 2.5, x: 52, y: 22 },
  },
];

// Seedable pseudo-random generator
function makeRandom(seed = 12345) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const rng = makeRandom(42);

// Generate deterministic cluster points
const DATASET = CLUSTER_METADATA.flatMap((cluster) => {
  return Array.from({ length: cluster.count }, (_, i) => {
    const u = rng() + rng() - 1;
    const v = rng() + rng() - 1;
    const w = rng() + rng() - 1;
    const x = Math.max(5, Math.min(95, cluster.cx + u * cluster.r));
    const y = Math.max(5, Math.min(95, cluster.cy + v * cluster.r));
    const z = Math.max(5, Math.min(95, cluster.cz + w * cluster.r));
    const severityScore = y * 0.7 + x * 0.3;
    const severity =
      severityScore > 75 ? "Critical" : severityScore > 50 ? "High" : severityScore > 30 ? "Medium" : "Low";

    return {
      id: `PT-${cluster.id}-${i + 1}`,
      clusterId: cluster.id,
      clusterName: cluster.name,
      x: +x.toFixed(1),
      y: +y.toFixed(1),
      z: +z.toFixed(1),
      severity,
      age: Math.round(cluster.id === 0 ? 3 + rng() * 12 : cluster.id === 3 ? 65 + rng() * 22 : 20 + rng() * 45),
    };
  });
});

// ─── STATS PANEL ─────────────────────────────────────────────────────────────
function StatsPanel({ activeClusterId, activePoint, theme, palette }) {
  const T = UI_THEMES[theme];
  const activeCluster = CLUSTER_METADATA.find((c) => c.id === activeClusterId);
  const clusterPoints = useMemo(() => {
    if (activeClusterId === -1) return DATASET;
    return DATASET.filter((d) => d.clusterId === activeClusterId);
  }, [activeClusterId]);

  const avgX = useMemo(() => d3.mean(clusterPoints, (d) => d.x)?.toFixed(1), [clusterPoints]);
  const avgY = useMemo(() => d3.mean(clusterPoints, (d) => d.y)?.toFixed(1), [clusterPoints]);
  const criticalCount = useMemo(() => clusterPoints.filter((d) => d.severity === "Critical").length, [clusterPoints]);
  const col = activeClusterId === -1 ? palette[0] : palette[activeClusterId % palette.length];

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
        COHORT METRICS
      </div>

      {card(
        "🎯 Current View",
        activeClusterId === -1 ? "Full Overview" : activeCluster?.name,
        activeClusterId === -1 ? "All 5 cohorts combined" : `Cohort ID #${activeClusterId + 1}`,
        col
      )}
      {card("👥 Patient Count", `${clusterPoints.length} pts`, `${((clusterPoints.length / DATASET.length) * 100).toFixed(0)}% of dataset`, palette[1] || "#10b981")}
      {card("📈 Mean Biomarker", `${avgX} / 100`, "Horizontal Axis Score", palette[2] || "#f59e0b")}
      {card("⚠️ Avg Risk Acuity", `${avgY} / 100`, "Vertical Axis Index", palette[3] || "#ef4444")}
      {card("🚨 Critical Cases", `${criticalCount} patients`, "High priority triage", criticalCount > 10 ? "#ef4444" : "#10b981")}

      {/* Cohort Clinical Summary */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 12px", marginTop: 4 }}>
        <div style={{ fontSize: 10, color: T.subtext, fontWeight: 700, marginBottom: 4, textTransform: "uppercase" }}>
          Clinical Profile
        </div>
        <p style={{ fontSize: 11, color: T.text, margin: 0, lineHeight: 1.45 }}>
          {activeClusterId === -1
            ? "Multi-dimensional exploration of outpatient cohorts segmented by clinical biomarker and severity vectors."
            : activeCluster?.desc}
        </p>
      </div>
    </div>
  );
}

// ─── 2D GUIDED TOUR SCATTERPLOT (D3) ─────────────────────────────────────────
function Chart2D({ theme, palette, activeClusterId, setActiveClusterId, setActivePoint }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const zoomRef = useRef(null);
  const gRef = useRef(null);
  const T = UI_THEMES[theme];

  const width = 740;
  const height = 520;
  const margin = { top: 35, right: 35, bottom: 55, left: 65 };

  // Set up initial D3 canvas
  useEffect(() => {
    if (!containerRef.current) return;
    const w = containerRef.current.clientWidth || width;
    const h = height;

    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .attr("viewBox", [0, 0, w, h])
      .attr("width", "100%")
      .attr("height", h)
      .style("background", T.chartBg)
      .style("border-radius", "8px")
      .style("font-family", "system-ui, -apple-system, sans-serif");

    // Clip path for zoomed content
    svg
      .append("defs")
      .append("clipPath")
      .attr("id", "tour-clip")
      .append("rect")
      .attr("x", margin.left)
      .attr("y", margin.top)
      .attr("width", w - margin.left - margin.right)
      .attr("height", h - margin.top - margin.bottom);

    const xScale = d3
      .scaleLinear()
      .domain([0, 100])
      .range([margin.left, w - margin.right]);

    const yScale = d3
      .scaleLinear()
      .domain([0, 100])
      .range([h - margin.bottom, margin.top]);

    // Gridlines
    svg
      .append("g")
      .attr("transform", `translate(0,${h - margin.bottom})`)
      .call(
        d3
          .axisBottom(xScale)
          .ticks(10)
          .tickSize(-(h - margin.top - margin.bottom))
          .tickFormat("")
      )
      .call((g) => {
        g.select(".domain").remove();
        g.selectAll("line").style("stroke", T.grid).style("stroke-dasharray", "3,3");
      });

    svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(
        d3
          .axisLeft(yScale)
          .ticks(10)
          .tickSize(-(w - margin.left - margin.right))
          .tickFormat("")
      )
      .call((g) => {
        g.select(".domain").remove();
        g.selectAll("line").style("stroke", T.grid).style("stroke-dasharray", "3,3");
      });

    // Axes
    const xAxis = d3.axisBottom(xScale).ticks(10);
    const yAxis = d3.axisLeft(yScale).ticks(10);

    svg
      .append("g")
      .attr("transform", `translate(0,${h - margin.bottom})`)
      .call(xAxis)
      .call((g) => {
        g.select(".domain").style("stroke", T.border);
        g.selectAll("line").style("stroke", T.border);
        g.selectAll("text").style("fill", T.text).style("font-size", "11px");
      });

    svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(yAxis)
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
      .text("Clinical Biomarker Index (0 – 100) →");

    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -h / 2)
      .attr("y", 22)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("font-weight", "600")
      .style("fill", T.text)
      .text("↑ Health Acuity & Risk Index (0 – 100)");

    // Zoomable Main Group
    const contentG = svg.append("g").attr("clip-path", "url(#tour-clip)");
    const zoomGroup = contentG.append("g").attr("class", "zoom-target");
    gRef.current = zoomGroup;

    // Tooltip
    const tooltip = d3
      .select(containerRef.current)
      .selectAll(".tour-tooltip")
      .data([null])
      .join("div")
      .attr("class", "tour-tooltip")
      .style("position", "absolute")
      .style("pointer-events", "none")
      .style("opacity", 0)
      .style("background", theme === "Dark" ? "rgba(17,24,39,0.95)" : "rgba(255,255,255,0.98)")
      .style("color", T.text)
      .style("padding", "9px 13px")
      .style("border-radius", "6px")
      .style("border", `1px solid ${T.border}`)
      .style("box-shadow", "0 4px 12px rgba(0,0,0,0.15)")
      .style("font-size", "12px")
      .style("z-index", "50");

    // Render cluster hulls & centroids
    CLUSTER_METADATA.forEach((c) => {
      const cPoints = DATASET.filter((d) => d.clusterId === c.id).map((d) => [xScale(d.x), yScale(d.y)]);
      const hull = d3.polygonHull(cPoints);
      const col = palette[c.id % palette.length];

      if (hull) {
        zoomGroup
          .append("path")
          .attr("class", `hull hull-${c.id}`)
          .attr("d", `M${hull.join("L")}Z`)
          .attr("fill", col)
          .attr("fill-opacity", 0.08)
          .attr("stroke", col)
          .attr("stroke-width", 1.5)
          .attr("stroke-dasharray", "4,4");
      }

      // Centroid icon with pulsing effect
      const centroidG = zoomGroup.append("g").attr("transform", `translate(${xScale(c.cx)},${yScale(c.cy)})`);
      centroidG.append("circle").attr("r", 10).attr("fill", col).attr("fill-opacity", 0.15);
      centroidG.append("circle").attr("r", 4).attr("fill", col).attr("stroke", "#ffffff").attr("stroke-width", 1.5);
      centroidG
        .append("text")
        .attr("y", -12)
        .attr("text-anchor", "middle")
        .attr("font-size", "10px")
        .attr("font-weight", "700")
        .attr("fill", col)
        .text(c.name);
    });

    // Render Patient Dots
    zoomGroup
      .selectAll("circle.pt-dot")
      .data(DATASET)
      .join("circle")
      .attr("class", "pt-dot")
      .attr("cx", (d) => xScale(d.x))
      .attr("cy", (d) => yScale(d.y))
      .attr("r", 4.5)
      .attr("fill", (d) => palette[d.clusterId % palette.length])
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 1)
      .style("cursor", "pointer")
      .on("mouseover", function (event, d) {
        d3.select(this).attr("r", 7).attr("stroke-width", 2);
        setActivePoint(d);
        tooltip
          .style("opacity", 1)
          .html(
            `<div style="font-weight:700;color:${palette[d.clusterId % palette.length]};font-size:13px;margin-bottom:3px">${d.id} · ${d.clusterName}</div>` +
            `🔬 Biomarker: <b>${d.x}</b><br/>` +
            `⚠️ Risk Index: <b>${d.y}</b><br/>` +
            `🩺 Severity: <b>${d.severity}</b> · Age: <b>${d.age}</b>`
          )
          .style("left", `${event.offsetX + 16}px`)
          .style("top", `${event.offsetY - 16}px`);
      })
      .on("mousemove", function (event) {
        tooltip.style("left", `${event.offsetX + 16}px`).style("top", `${event.offsetY - 16}px`);
      })
      .on("mouseout", function () {
        d3.select(this).attr("r", 4.5).attr("stroke-width", 1);
        tooltip.style("opacity", 0);
        setActivePoint(null);
      })
      .on("click", function (event, d) {
        setActiveClusterId(d.clusterId);
      });

    // D3 Zoom handler
    const zoom = d3
      .zoom()
      .scaleExtent([0.8, 6])
      .on("zoom", (event) => {
        zoomGroup.attr("transform", event.transform);
      });

    zoomRef.current = { zoom, svg, xScale, yScale, w, h };
    svg.call(zoom);

  }, [theme, palette]);

  // Handle activeClusterId change with smooth animation zoom transition
  useEffect(() => {
    if (!zoomRef.current || !gRef.current) return;
    const { zoom, svg, xScale, yScale, w, h } = zoomRef.current;

    // Highlight/dim points depending on active cluster
    gRef.current
      .selectAll("circle.pt-dot")
      .transition()
      .duration(600)
      .attr("opacity", (d) => (activeClusterId === -1 || d.clusterId === activeClusterId ? 1 : 0.15))
      .attr("r", (d) => (d.clusterId === activeClusterId ? 5.5 : 4.5));

    gRef.current
      .selectAll(".hull")
      .transition()
      .duration(600)
      .attr("fill-opacity", (d, i, nodes) => {
        const isTarget = nodes[i].classList.contains(`hull-${activeClusterId}`);
        return isTarget ? 0.22 : 0.04;
      });

    if (activeClusterId === -1) {
      // Zoom out to overview
      svg.transition().duration(1000).call(zoom.transform, d3.zoomIdentity);
    } else {
      // Zoom into target cluster smoothly
      const c = CLUSTER_METADATA.find((item) => item.id === activeClusterId);
      if (!c) return;

      const targetX = xScale(c.cx);
      const targetY = yScale(c.cy);
      const scale = c.focusZoom.k;
      const tx = w / 2 - scale * targetX;
      const ty = h / 2 - scale * targetY;

      svg
        .transition()
        .duration(1200)
        .ease(d3.easeCubicInOut)
        .call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
    }
  }, [activeClusterId]);

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%", border: `1px solid ${T.border}`, borderRadius: 8, overflow: "hidden" }}>
      <svg ref={svgRef}></svg>
    </div>
  );
}

// ─── 3D TOUR POINT CLOUD (THREE.JS) ──────────────────────────────────────────
function Chart3D({ theme, palette, activeClusterId }) {
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
    camera.position.set(20, 18, 24);
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

    // 3D Scales: X = Biomarker (0-100), Y = Risk (0-100), Z = Recovery (0-100)
    const xScale = d3.scaleLinear().domain([0, 100]).range([-10, 10]);
    const yScale = d3.scaleLinear().domain([0, 100]).range([-6, 8]);
    const zScale = d3.scaleLinear().domain([0, 100]).range([-8, 8]);

    // Add 3D spheres for each patient
    DATASET.forEach((d) => {
      const isTarget = activeClusterId === -1 || d.clusterId === activeClusterId;
      const colHex = palette[d.clusterId % palette.length];
      const sphereGeo = new THREE.SphereGeometry(isTarget ? 0.35 : 0.2, 16, 16);
      const sphereMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(colHex),
        roughness: 0.3,
        metalness: 0.5,
        transparent: true,
        opacity: isTarget ? 0.95 : 0.15,
        emissive: new THREE.Color(colHex),
        emissiveIntensity: isTarget ? 0.4 : 0.05,
      });
      const sphere = new THREE.Mesh(sphereGeo, sphereMat);
      sphere.position.set(xScale(d.x), yScale(d.y), zScale(d.z));
      sphere.castShadow = true;
      pivot.add(sphere);
    });

    // Cluster Centroid Highlights
    CLUSTER_METADATA.forEach((c) => {
      const colHex = palette[c.id % palette.length];
      const isTarget = activeClusterId === -1 || c.id === activeClusterId;
      const torusGeo = new THREE.TorusGeometry(1.6, 0.08, 12, 32);
      const torusMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(colHex),
        transparent: true,
        opacity: isTarget ? 0.8 : 0.2,
      });
      const torus = new THREE.Mesh(torusGeo, torusMat);
      torus.position.set(xScale(c.cx), yScale(c.cy), zScale(c.cz));
      torus.rotation.x = Math.PI / 2;
      pivot.add(torus);
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
  }, [theme, palette, activeClusterId]);

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
        💡 Drag to rotate in 3D · X=Biomarker · Y=Risk · Z=Recovery Velocity
      </div>
    </div>
  );
}

// ─── MAIN SCATTERPLOT TOUR COMPONENT ─────────────────────────────────────────
export default function ScatterplotTour() {
  const [viewMode, setViewMode] = useState("2d");
  const [theme, setTheme] = useState("Light");
  const [colorTheme, setColorTheme] = useState("Modern");
  const [activeClusterId, setActiveClusterId] = useState(-1);
  const [isTourRunning, setIsTourRunning] = useState(false);
  const [activePoint, setActivePoint] = useState(null);

  const T = UI_THEMES[theme];
  const palette = PALETTES[colorTheme] || PALETTES.Modern;

  // Auto Tour Stepper
  useEffect(() => {
    let timer;
    if (isTourRunning) {
      timer = setInterval(() => {
        setActiveClusterId((prev) => {
          if (prev >= CLUSTER_METADATA.length - 1) {
            setIsTourRunning(false);
            return -1; // Reset to overview at end of tour
          }
          return prev + 1;
        });
      }, 3500);
    }
    return () => clearInterval(timer);
  }, [isTourRunning]);

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
          Scatterplot Tour – Outpatient Clinical Cohort Analysis
        </h2>
        <p style={{ fontSize: 13, color: T.subtext, margin: "4px 0 0 0" }}>
          Guided interactive camera tour through 5 multi-dimensional patient clusters · Smooth animated transitions and convex hull boundaries.
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
            <option value="2d">2D Guided Tour (D3)</option>
            <option value="3d">3D Point Cloud (Three.js)</option>
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

        {/* Tour Play Button */}
        <button
          onClick={() => {
            if (activeClusterId >= CLUSTER_METADATA.length - 1) setActiveClusterId(0);
            setIsTourRunning(!isTourRunning);
          }}
          style={{
            ...btnStyle(isTourRunning),
            background: isTourRunning ? "#ef4444" : palette[0],
            color: "#ffffff",
            marginLeft: "auto",
          }}
        >
          {isTourRunning ? "⏸ Pause Tour" : "▶ Start Guided Tour"}
        </button>
      </div>

      {/* Cluster Tour Quick Navigation Bar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: T.subtext }}>TOUR STEPS:</span>
        <button
          onClick={() => {
            setIsTourRunning(false);
            setActiveClusterId(-1);
          }}
          style={btnStyle(activeClusterId === -1)}
        >
          🌍 Full Overview
        </button>
        {CLUSTER_METADATA.map((c) => (
          <button
            key={c.id}
            onClick={() => {
              setIsTourRunning(false);
              setActiveClusterId(c.id);
            }}
            style={btnStyle(activeClusterId === c.id)}
          >
            {c.id + 1}. {c.name}
          </button>
        ))}
      </div>

      {/* Visual Canvas + Stats Panel */}
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start", width: "100%", flexWrap: "nowrap" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {viewMode === "2d" ? (
            <Chart2D
              theme={theme}
              palette={palette}
              activeClusterId={activeClusterId}
              setActiveClusterId={setActiveClusterId}
              setActivePoint={setActivePoint}
            />
          ) : (
            <Chart3D theme={theme} palette={palette} activeClusterId={activeClusterId} />
          )}
        </div>
        <StatsPanel activeClusterId={activeClusterId} activePoint={activePoint} theme={theme} palette={palette} />
      </div>
    </div>
  );
}
