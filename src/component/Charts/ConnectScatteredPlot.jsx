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
  Modern: ["#3b82f6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"],
  Neon: ["#00f5ff", "#ff007f", "#39ff14", "#ffe600", "#b537f2", "#ff5400"],
  Sunset: ["#ff4e50", "#fc913a", "#f9d423", "#ede574", "#e1f5c4", "#ff6f69"],
  Emerald: ["#059669", "#10b981", "#34d399", "#6ee7b7", "#a7f3d0", "#047857"],
  Cyberpunk: ["#f72585", "#7209b7", "#3a0ca3", "#4361ee", "#4cc9f0", "#f15bb5"],
};

// ─── CLASSIC US DRIVING & GASOLINE DATA (1956 - 2010) ──────────────────────
// Historical economic dataset: Miles driven per person vs Gas price (2010 USD/gal)
const DRIVING_DATA = [
  { year: 1956, miles: 3675, gas: 2.38, event: "Interstate Highway Act" },
  { year: 1957, miles: 3706, gas: 2.40 },
  { year: 1958, miles: 3766, gas: 2.30 },
  { year: 1959, miles: 3905, gas: 2.31 },
  { year: 1960, miles: 3935, gas: 2.29 },
  { year: 1961, miles: 4016, gas: 2.27 },
  { year: 1962, miles: 4141, gas: 2.25 },
  { year: 1963, miles: 4241, gas: 2.22 },
  { year: 1964, miles: 4364, gas: 2.20 },
  { year: 1965, miles: 4460, gas: 2.24 },
  { year: 1966, miles: 4600, gas: 2.26 },
  { year: 1967, miles: 4700, gas: 2.28 },
  { year: 1968, miles: 4880, gas: 2.27 },
  { year: 1969, miles: 5040, gas: 2.29, event: "Peak Muscle Car Era" },
  { year: 1970, miles: 5120, gas: 2.27 },
  { year: 1971, miles: 5280, gas: 2.22 },
  { year: 1972, miles: 5460, gas: 2.16 },
  { year: 1973, miles: 5580, gas: 2.28, event: "OPEC Oil Embargo" },
  { year: 1974, miles: 5390, gas: 2.87, event: "Gas Shortage Crunch" },
  { year: 1975, miles: 5470, gas: 2.76 },
  { year: 1976, miles: 5690, gas: 2.75 },
  { year: 1977, miles: 5880, gas: 2.77 },
  { year: 1978, miles: 6110, gas: 2.72 },
  { year: 1979, miles: 6050, gas: 3.26, event: "Iranian Revolution" },
  { year: 1980, miles: 5980, gas: 3.65, event: "Record Gas Price Peak" },
  { year: 1981, miles: 6020, gas: 3.51 },
  { year: 1982, miles: 6140, gas: 3.10 },
  { year: 1983, miles: 6330, gas: 2.82 },
  { year: 1984, miles: 6510, gas: 2.65 },
  { year: 1985, miles: 6730, gas: 2.58 },
  { year: 1986, miles: 7010, gas: 1.86, event: "1986 Oil Glut Crash" },
  { year: 1987, miles: 7280, gas: 1.88 },
  { year: 1988, miles: 7570, gas: 1.82 },
  { year: 1989, miles: 7800, gas: 1.89 },
  { year: 1990, miles: 7920, gas: 2.06, event: "Gulf War Spike" },
  { year: 1991, miles: 7990, gas: 1.95 },
  { year: 1992, miles: 8180, gas: 1.88 },
  { year: 1993, miles: 8350, gas: 1.81 },
  { year: 1994, miles: 8520, gas: 1.76 },
  { year: 1995, miles: 8740, gas: 1.77 },
  { year: 1996, miles: 8900, gas: 1.83 },
  { year: 1997, miles: 9140, gas: 1.82 },
  { year: 1998, miles: 9380, gas: 1.55, event: "All-Time Low Gas Price" },
  { year: 1999, miles: 9550, gas: 1.68, event: "SUV Popularity Boom" },
  { year: 2000, miles: 9680, gas: 2.05 },
  { year: 2001, miles: 9780, gas: 1.95 },
  { year: 2002, miles: 9940, gas: 1.84 },
  { year: 2003, miles: 10020, gas: 2.01 },
  { year: 2004, miles: 10180, gas: 2.30 },
  { year: 2005, miles: 10240, gas: 2.76, event: "Hurricane Katrina" },
  { year: 2006, miles: 10260, gas: 3.01 },
  { year: 2007, miles: 10320, gas: 3.19 },
  { year: 2008, miles: 10010, gas: 3.68, event: "Global Financial Crisis" },
  { year: 2009, miles: 9980, gas: 2.52, event: "Great Recession Slump" },
  { year: 2010, miles: 10080, gas: 2.94, event: "Recovery Cycle" },
];

// ─── STATS PANEL ─────────────────────────────────────────────────────────────
function StatsPanel({ currentYear, activePoint, theme, palette }) {
  const T = UI_THEMES[theme];
  const mainCol = palette[0];
  const secCol = palette[1];
  const accentCol = palette[4] || "#ef4444";

  const maxGas = useMemo(() => d3.greatest(DRIVING_DATA, (d) => d.gas), []);
  const minGas = useMemo(() => d3.least(DRIVING_DATA, (d) => d.gas), []);
  const maxMiles = useMemo(() => d3.greatest(DRIVING_DATA, (d) => d.miles), []);
  const current = activePoint || DRIVING_DATA.find((d) => d.year === currentYear) || DRIVING_DATA[DRIVING_DATA.length - 1];

  const card = (label, value, sub, col) => (
    <div
      style={{
        background: T.card,
        border: `1px solid ${T.border}`,
        borderRadius: 8,
        padding: "10px 12px",
        marginBottom: 8,
        borderLeft: `3.5px solid ${col}`,
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      <div style={{ fontSize: 10, color: T.subtext, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </div>
      <div style={{ fontSize: 15, fontWeight: 800, color: col, marginTop: 2, whiteSpace: "nowrap" }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: T.subtext, marginTop: 2 }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ width: 220, flexShrink: 0 }}>
      <div style={{ fontSize: 11, fontWeight: "bold", color: T.subtext, letterSpacing: "0.08em", marginBottom: 8 }}>
        TRAJECTORY METRICS
      </div>

      {card("📍 Selected Year", `${current.year}`, current.event || "Historical Trend", mainCol)}
      {card("⛽ Gas Price", `$${current.gas.toFixed(2)} / gal`, `Adjusted for inflation`, secCol)}
      {card("🚗 Miles Driven", `${d3.format(",")(current.miles)} mi`, `Per capita annually`, palette[2] || "#10b981")}
      {card("🔥 Record High Gas", `$${maxGas.gas.toFixed(2)} (${maxGas.year})`, maxGas.event, accentCol)}
      {card("❄️ Cheapest Gas", `$${minGas.gas.toFixed(2)} (${minGas.year})`, minGas.event, palette[3] || "#f59e0b")}
      {card("🏆 Peak Driving", `${d3.format(",")(maxMiles.miles)} mi`, `Year ${maxMiles.year}`, palette[5] || "#8b5cf6")}

      {/* Historical Milestones Guide */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 12px", marginTop: 4 }}>
        <div style={{ fontSize: 10, color: T.subtext, fontWeight: 700, marginBottom: 6, textTransform: "uppercase" }}>
          Key Inflection Points
        </div>
        {DRIVING_DATA.filter((d) => d.event).slice(0, 5).map((d) => (
          <div key={d.year} style={{ fontSize: 10, color: T.text, marginBottom: 5, display: "flex", gap: 6 }}>
            <span style={{ fontWeight: 700, color: mainCol }}>{d.year}:</span>
            <span style={{ color: T.subtext }}>{d.event}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 2D CONNECTED SCATTERPLOT (D3) ───────────────────────────────────────────
function Chart2D({ theme, palette, currentYear, setCurrentYear, setActivePoint }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const T = UI_THEMES[theme];

  useEffect(() => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth || 740;
    const height = 520;
    const margin = { top: 35, right: 35, bottom: 55, left: 65 };

    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .attr("viewBox", [0, 0, width, height])
      .attr("width", "100%")
      .attr("height", height)
      .style("background", T.chartBg)
      .style("border-radius", "8px")
      .style("font-family", "system-ui, -apple-system, sans-serif");

    // Defs for gradients & arrow markers
    const defs = svg.append("defs");
    const marker = defs
      .append("marker")
      .attr("id", "arrow-head")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 14)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto");
    marker.append("path").attr("d", "M0,-4L10,0L0,4").attr("fill", palette[0]);

    // Scales
    const xScale = d3
      .scaleLinear()
      .domain([3400, 10800])
      .range([margin.left, width - margin.right]);

    const yScale = d3
      .scaleLinear()
      .domain([1.4, 4.0])
      .range([height - margin.bottom, margin.top]);

    // Grid lines
    svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(
        d3
          .axisBottom(xScale)
          .ticks(8)
          .tickSize(-(height - margin.top - margin.bottom))
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
          .ticks(7)
          .tickSize(-(width - margin.left - margin.right))
          .tickFormat("")
      )
      .call((g) => {
        g.select(".domain").remove();
        g.selectAll("line").style("stroke", T.grid).style("stroke-dasharray", "3,3");
      });

    // Axes
    const xAxis = d3
      .axisBottom(xScale)
      .ticks(8)
      .tickFormat((d) => d3.format(",")(d));
    const yAxis = d3
      .axisLeft(yScale)
      .ticks(7)
      .tickFormat((d) => `$${d.toFixed(2)}`);

    svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
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

    // Axis Labels with Arrows
    svg
      .append("text")
      .attr("x", (width + margin.left) / 2)
      .attr("y", height - 12)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("font-weight", "600")
      .style("fill", T.text)
      .text("Miles Driven Per Capita (Annual) →");

    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("font-weight", "600")
      .style("fill", T.text)
      .text("↑ Price of Gasoline per Gallon (Adjusted USD)");

    // Slice data up to currentYear for animation/scrubbing
    const visibleData = DRIVING_DATA.filter((d) => d.year <= currentYear);

    // Connected Line Generator
    const line = d3
      .line()
      .x((d) => xScale(d.miles))
      .y((d) => yScale(d.gas))
      .curve(d3.curveCatmullRom.alpha(0.5));

    // Full Ghost Trajectory (softly visible)
    svg
      .append("path")
      .datum(DRIVING_DATA)
      .attr("fill", "none")
      .attr("stroke", T.border)
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "4,4")
      .attr("opacity", 0.5)
      .attr("d", line);

    // Active Connected Path
    const path = svg
      .append("path")
      .datum(visibleData)
      .attr("fill", "none")
      .attr("stroke", palette[0])
      .attr("stroke-width", 3)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("d", line);

    // Tooltip Element
    const tooltip = d3
      .select(containerRef.current)
      .selectAll(".cs-tooltip")
      .data([null])
      .join("div")
      .attr("class", "cs-tooltip")
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

    // Crosshairs
    const focusG = svg.append("g").style("display", "none");
    const vLine = focusG.append("line").attr("stroke", palette[0]).attr("stroke-dasharray", "3,3").attr("y1", margin.top).attr("y2", height - margin.bottom);
    const hLine = focusG.append("line").attr("stroke", palette[0]).attr("stroke-dasharray", "3,3").attr("x1", margin.left).attr("x2", width - margin.right);

    // Data points / circles
    const circles = svg
      .append("g")
      .selectAll("circle")
      .data(visibleData)
      .join("circle")
      .attr("cx", (d) => xScale(d.miles))
      .attr("cy", (d) => yScale(d.gas))
      .attr("r", (d) => (d.year === currentYear ? 7 : d.event ? 5 : 3.5))
      .attr("fill", (d) => (d.year === currentYear ? palette[4] || "#ef4444" : d.event ? palette[1] : palette[0]))
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.2)
      .style("cursor", "pointer");

    // Landmark year labels (avoid overcrowding, show milestone years)
    const landmarkYears = new Set([1956, 1965, 1973, 1974, 1980, 1986, 1990, 1998, 2005, 2008, 2010]);
    svg
      .append("g")
      .selectAll("text.year-lbl")
      .data(visibleData.filter((d) => landmarkYears.has(d.year) || d.year === currentYear))
      .join("text")
      .attr("class", "year-lbl")
      .attr("x", (d) => xScale(d.miles) + 8)
      .attr("y", (d) => yScale(d.gas) - 6)
      .attr("font-size", (d) => (d.year === currentYear ? "12px" : "10px"))
      .attr("font-weight", (d) => (d.year === currentYear ? "bold" : "600"))
      .attr("fill", (d) => (d.year === currentYear ? palette[4] || "#ef4444" : T.text))
      .text((d) => d.year);

    // Mouse Interaction
    circles
      .on("mouseover", function (event, d) {
        d3.select(this).attr("r", 8).attr("stroke-width", 2);
        focusG.style("display", null);
        vLine.attr("x1", xScale(d.miles)).attr("x2", xScale(d.miles));
        hLine.attr("y1", yScale(d.gas)).attr("y2", yScale(d.gas));
        setActivePoint(d);

        tooltip
          .style("opacity", 1)
          .html(
            `<div style="font-weight:700;color:${palette[0]};font-size:13px;margin-bottom:3px">${d.year} ${d.event ? `· ${d.event}` : ""}</div>` +
            `⛽ Gas Price: <b>$${d.gas.toFixed(2)}</b> / gal<br/>` +
            `🚗 Miles Driven: <b>${d3.format(",")(d.miles)} mi</b>`
          )
          .style("left", `${event.offsetX + 16}px`)
          .style("top", `${event.offsetY - 16}px`);
      })
      .on("mousemove", function (event) {
        tooltip.style("left", `${event.offsetX + 16}px`).style("top", `${event.offsetY - 16}px`);
      })
      .on("mouseout", function (event, d) {
        d3.select(this).attr("r", d.year === currentYear ? 7 : d.event ? 5 : 3.5).attr("stroke-width", 1.2);
        focusG.style("display", "none");
        tooltip.style("opacity", 0);
        setActivePoint(null);
      })
      .on("click", function (event, d) {
        setCurrentYear(d.year);
      });

  }, [theme, palette, currentYear]);

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%", border: `1px solid ${T.border}`, borderRadius: 8, overflow: "hidden" }}>
      <svg ref={svgRef}></svg>
    </div>
  );
}

// ─── 3D CONNECTED SCATTERPLOT (THREE.JS) ─────────────────────────────────────
function Chart3D({ theme, palette, currentYear }) {
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
    camera.position.set(20, 16, 26);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    el.appendChild(renderer.domElement);

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.75));
    const sun = new THREE.DirectionalLight(0xffffff, 1.1);
    sun.position.set(12, 22, 15);
    sun.castShadow = true;
    scene.add(sun);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 0.4));

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

    // Scales for 3D Space: X = Miles, Y = Gas, Z = Time/Year
    const xScale = d3.scaleLinear().domain([3400, 10800]).range([-10, 10]);
    const yScale = d3.scaleLinear().domain([1.4, 4.0]).range([-6, 8]);
    const zScale = d3.scaleLinear().domain([1956, 2010]).range([-10, 10]);

    // Construct 3D trajectory curve
    const points3D = DRIVING_DATA.map((d) => new THREE.Vector3(xScale(d.miles), yScale(d.gas), zScale(d.year)));
    const curve = new THREE.CatmullRomCurve3(points3D);
    const tubeGeo = new THREE.TubeGeometry(curve, 100, 0.12, 12, false);
    const tubeMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(palette[0]),
      roughness: 0.3,
      metalness: 0.5,
      emissive: new THREE.Color(palette[0]),
      emissiveIntensity: 0.25,
    });
    const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
    tubeMesh.castShadow = true;
    pivot.add(tubeMesh);

    // Spheres for each data point
    DRIVING_DATA.forEach((d) => {
      const isCurrent = d.year === currentYear;
      const isEvent = !!d.event;
      const r = isCurrent ? 0.45 : isEvent ? 0.32 : 0.2;
      const colHex = isCurrent ? palette[4] || "#ef4444" : isEvent ? palette[1] : palette[0];
      const sphereGeo = new THREE.SphereGeometry(r, 16, 16);
      const sphereMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(colHex),
        metalness: 0.6,
        roughness: 0.2,
        emissive: new THREE.Color(colHex),
        emissiveIntensity: isCurrent ? 0.6 : 0.2,
      });
      const sphere = new THREE.Mesh(sphereGeo, sphereMat);
      sphere.position.set(xScale(d.miles), yScale(d.gas), zScale(d.year));
      sphere.castShadow = true;
      pivot.add(sphere);

      // Vertical drop stem down to floor
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(xScale(d.miles), yScale(d.gas), zScale(d.year)),
        new THREE.Vector3(xScale(d.miles), -7.95, zScale(d.year)),
      ]);
      const lineMat = new THREE.LineBasicMaterial({
        color: theme === "Dark" ? 0x374151 : 0xcbd5e1,
        transparent: true,
        opacity: isEvent ? 0.6 : 0.2,
      });
      const stem = new THREE.Line(lineGeo, lineMat);
      pivot.add(stem);
    });

    // Orbit Interaction
    let isDragging = false;
    let prevX = 0, prevY = 0;
    let rotX = 0.2, rotY = 0.4;
    let autoSpin = true;

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
  }, [theme, palette, currentYear]);

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
        💡 Drag to rotate in 3D · Auto-spins · X=Miles · Y=Gas Price · Z=Time (Year)
      </div>
    </div>
  );
}

// ─── MAIN CONNECTED SCATTERPLOT COMPONENT ────────────────────────────────────
export default function ConnectScatteredplot() {
  const [viewMode, setViewMode] = useState("2d");
  const [theme, setTheme] = useState("Light");
  const [colorTheme, setColorTheme] = useState("Modern");
  const [currentYear, setCurrentYear] = useState(2010);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activePoint, setActivePoint] = useState(null);

  const T = UI_THEMES[theme];
  const palette = PALETTES[colorTheme] || PALETTES.Modern;

  // Animation playback
  useEffect(() => {
    let timer;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentYear((prev) => {
          if (prev >= 2010) {
            setIsPlaying(false);
            return 2010;
          }
          return prev + 1;
        });
      }, 400);
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
    transition: "opacity 0.2s",
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: "800", color: T.text, margin: 0 }}>
            Connected Scatterplot – US Driving vs. Gasoline Cost (1956–2010)
          </h2>
          <p style={{ fontSize: 13, color: T.subtext, margin: "4px 0 0 0" }}>
            Visualizes trajectory through time: annual miles driven per capita vs. price of gas per gallon with historical inflection points.
          </p>
        </div>
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
            <option value="2d">2D Chart (D3)</option>
            <option value="3d">3D Trajectory (Three.js)</option>
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

        {/* Playback Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
          <button
            onClick={() => {
              if (currentYear >= 2010) setCurrentYear(1956);
              setIsPlaying(!isPlaying);
            }}
            style={btnStyle}
          >
            {isPlaying ? "⏸ Pause" : currentYear >= 2010 ? "🔄 Replay" : "▶ Play Timeline"}
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: T.text, minWidth: 38 }}>{currentYear}</span>
            <input
              type="range"
              min={1956}
              max={2010}
              value={currentYear}
              onChange={(e) => {
                setIsPlaying(false);
                setCurrentYear(Number(e.target.value));
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
            <Chart2D
              theme={theme}
              palette={palette}
              currentYear={currentYear}
              setCurrentYear={setCurrentYear}
              setActivePoint={setActivePoint}
            />
          ) : (
            <Chart3D theme={theme} palette={palette} currentYear={currentYear} />
          )}
        </div>
        <StatsPanel currentYear={currentYear} activePoint={activePoint} theme={theme} palette={palette} />
      </div>
    </div>
  );
}
