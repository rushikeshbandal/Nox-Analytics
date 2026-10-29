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
    watermark: "rgba(100, 116, 139, 0.12)",
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
    watermark: "rgba(255, 255, 255, 0.08)",
    threeBg: 0x0b0f19,
  },
};

const SECTORS = ["Cardiovascular", "Metabolic", "Respiratory", "Neurology", "Musculoskeletal", "Oncology"];

const PALETTES = {
  Modern: {
    Cardiovascular: "#ef4444",
    Metabolic: "#f59e0b",
    Respiratory: "#06b6d4",
    Neurology: "#8b5cf6",
    Musculoskeletal: "#10b981",
    Oncology: "#ec4899",
  },
  Neon: {
    Cardiovascular: "#ff0055",
    Metabolic: "#ffe600",
    Respiratory: "#00f5ff",
    Neurology: "#b537f2",
    Musculoskeletal: "#39ff14",
    Oncology: "#ff00aa",
  },
  Sunset: {
    Cardiovascular: "#d62828",
    Metabolic: "#f77f00",
    Respiratory: "#fcbf49",
    Neurology: "#003049",
    Musculoskeletal: "#2a9d8f",
    Oncology: "#e76f51",
  },
  Ocean: {
    Cardiovascular: "#03045e",
    Metabolic: "#0077b6",
    Respiratory: "#00b4d8",
    Neurology: "#90e0ef",
    Musculoskeletal: "#caf0f8",
    Oncology: "#023e8a",
  },
};

// ─── ANNUAL RACE DATASET (2000 - 2024) ────────────────────────────────────────
// Realistic historical race of Top Diagnosed Conditions & Healthcare Volumes (in thousands of cases)
const CONDITIONS = [
  { name: "Hypertension", sector: "Cardiovascular", icon: "❤️" },
  { name: "Type 2 Diabetes", sector: "Metabolic", icon: "🩸" },
  { name: "Upper Respiratory Inf.", sector: "Respiratory", icon: "🫁" },
  { name: "Osteoarthritis", sector: "Musculoskeletal", icon: "🦴" },
  { name: "Depressive Disorders", sector: "Neurology", icon: "🧠" },
  { name: "Chronic Kidney Disease", sector: "Metabolic", icon: "🧪" },
  { name: "Coronary Artery Disease", sector: "Cardiovascular", icon: "💓" },
  { name: "Bronchial Asthma", sector: "Respiratory", icon: "🌬️" },
  { name: "Alzheimer's & Dementia", sector: "Neurology", icon: "🧬" },
  { name: "Solid Tumor Oncology", sector: "Oncology", icon: "🔬" },
  { name: "Chronic Back Pain", sector: "Musculoskeletal", icon: "🚶" },
  { name: "COPD / Emphysema", sector: "Respiratory", icon: "💨" },
];

// Base values and growth curves per condition
const RACE_TIMELINE = (() => {
  const years = d3.range(2000, 2025);
  const data = [];

  const baseValues = {
    "Hypertension": 1200,
    "Type 2 Diabetes": 750,
    "Upper Respiratory Inf.": 1100,
    "Osteoarthritis": 680,
    "Depressive Disorders": 420,
    "Chronic Kidney Disease": 310,
    "Coronary Artery Disease": 890,
    "Bronchial Asthma": 550,
    "Alzheimer's & Dementia": 280,
    "Solid Tumor Oncology": 340,
    "Chronic Back Pain": 620,
    "COPD / Emphysema": 490,
  };

  const growthRates = {
    "Hypertension": 1.045,
    "Type 2 Diabetes": 1.065,
    "Upper Respiratory Inf.": 1.025,
    "Osteoarthritis": 1.052,
    "Depressive Disorders": 1.085, // Fast riser in 2010s-2020s
    "Chronic Kidney Disease": 1.058,
    "Coronary Artery Disease": 1.032,
    "Bronchial Asthma": 1.042,
    "Alzheimer's & Dementia": 1.072, // Rising significantly due to aging population
    "Solid Tumor Oncology": 1.060,
    "Chronic Back Pain": 1.048,
    "COPD / Emphysema": 1.035,
  };

  for (const year of years) {
    const t = year - 2000;
    for (const c of CONDITIONS) {
      // Add realistic waves / inflections (e.g. respiratory spike around 2020-2021)
      let wave = Math.sin(t * 0.4 + c.name.length) * 40;
      if (c.name === "Upper Respiratory Inf." && year >= 2020 && year <= 2022) {
        wave += 420;
      }
      if (c.name === "Depressive Disorders" && year >= 2020) {
        wave += 280;
      }
      const val = Math.round(baseValues[c.name] * Math.pow(growthRates[c.name], t) + wave);
      data.push({
        year,
        name: c.name,
        sector: c.sector,
        icon: c.icon,
        value: Math.max(100, val),
      });
    }
  }
  return data;
})();

// ─── STATS PANEL ─────────────────────────────────────────────────────────────
function StatsPanel({ currentYearData, year, theme, palette }) {
  const T = UI_THEMES[theme];

  const leader = currentYearData[0];
  const totalCases = useMemo(() => d3.sum(currentYearData, (d) => d.value), [currentYearData]);
  const avgCases = useMemo(() => Math.round(d3.mean(currentYearData, (d) => d.value) || 0), [currentYearData]);
  const topSector = useMemo(() => {
    const rolled = d3.rollup(currentYearData, (v) => d3.sum(v, (d) => d.value), (d) => d.sector);
    return d3.greatest([...rolled.entries()], (d) => d[1]);
  }, [currentYearData]);

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
        RACE LEADERBOARD ({year})
      </div>

      {card(
        "👑 #1 Leading Diagnosis",
        `${leader?.icon} ${leader?.name}`,
        `${d3.format(",")(leader?.value)}k annual cases`,
        palette[leader?.sector] || "#ef4444"
      )}
      {card(
        "📊 Total OPD Volume",
        `${d3.format(",")(totalCases)}k`,
        "Sum of top 10 conditions",
        palette[topSector?.[0]] || "#3b82f6"
      )}
      {card(
        "📈 Top Clinical Domain",
        topSector?.[0] || "Cardiovascular",
        `${d3.format(",")(topSector?.[1] || 0)}k combined volume`,
        palette[topSector?.[0]] || "#10b981"
      )}
      {card("⚡ Average per Condition", `${d3.format(",")(avgCases)}k`, "Mean clinical cases", "#8b5cf6")}

      {/* Sector Legend */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 12px", marginTop: 4 }}>
        <div style={{ fontSize: 10, color: T.subtext, fontWeight: 700, marginBottom: 8, textTransform: "uppercase" }}>
          Clinical Specialties
        </div>
        {SECTORS.map((s) => (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: palette[s] || "#3b82f6" }} />
            <span style={{ fontSize: 11, color: T.text, fontWeight: "600" }}>{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 2D ANIMATED BAR CHART RACE (D3) ─────────────────────────────────────────
function Chart2D({ theme, palette, year, currentYearData }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const T = UI_THEMES[theme];

  const width = 740;
  const height = 540;
  const margin = { top: 35, right: 110, bottom: 85, left: 190 };
  const topN = 10;
  const barHeight = 28;
  const barGap = 6;

  useEffect(() => {
    if (!containerRef.current) return;
    const w = containerRef.current.clientWidth || width;
    const h = height;

    const svg = d3
      .select(svgRef.current)
      .attr("viewBox", [0, 0, w, h])
      .attr("width", "100%")
      .attr("height", h)
      .style("background", T.chartBg)
      .style("border-radius", "8px")
      .style("font-family", "system-ui, -apple-system, sans-serif");

    // Background Year layer (positioned completely clear of bars & data values)
    let bgLayer = svg.select(".bg-layer");
    if (bgLayer.empty()) {
      bgLayer = svg.append("g").attr("class", "bg-layer").style("pointer-events", "none");
    }
    let watermark = bgLayer.select(".race-watermark");
    if (watermark.empty()) {
      watermark = bgLayer
        .append("text")
        .attr("class", "race-watermark")
        .attr("x", w - margin.right + 30)
        .attr("y", h - 16)
        .attr("text-anchor", "end")
        .attr("font-size", "56px")
        .attr("font-weight", "900")
        .attr("fill", T.watermark)
        .style("user-select", "none");
    }
    watermark.attr("x", w - margin.right + 30).attr("y", h - 16).text(year);

    // X Scale based on max value of current year
    const maxValue = d3.max(currentYearData, (d) => d.value) || 1000;
    const xScale = d3
      .scaleLinear()
      .domain([0, maxValue * 1.1])
      .range([margin.left, w - margin.right]);

    // Top X Axis
    let topAxisG = svg.select(".top-axis");
    if (topAxisG.empty()) {
      topAxisG = svg.append("g").attr("class", "top-axis");
    }
    topAxisG
      .attr("transform", `translate(0,${margin.top})`)
      .transition()
      .duration(400)
      .ease(d3.easeLinear)
      .call(
        d3
          .axisTop(xScale)
          .ticks(6)
          .tickFormat((d) => `${d3.format(",")(d)}k`)
      )
      .call((g) => {
        g.select(".domain").style("stroke", T.border);
        g.selectAll("line").style("stroke", T.border);
        g.selectAll("text").style("fill", T.text).style("font-size", "11px");
      });

    // Horizontal Grid Lines
    const chartBottom = margin.top + 8 + topN * (barHeight + barGap) + 4;
    let gridG = svg.select(".race-grid");
    if (gridG.empty()) {
      gridG = svg.append("g").attr("class", "race-grid");
    }
    gridG
      .attr("transform", `translate(0,${chartBottom})`)
      .call(
        d3
          .axisBottom(xScale)
          .ticks(6)
          .tickSize(-(chartBottom - margin.top))
          .tickFormat("")
      )
      .call((g) => {
        g.select(".domain").remove();
        g.selectAll("line").style("stroke", T.grid).style("stroke-dasharray", "3,3");
      });

    // Label with arrow
    let bottomLabel = svg.select(".bottom-lbl");
    if (bottomLabel.empty()) {
      bottomLabel = svg
        .append("text")
        .attr("class", "bottom-lbl")
        .attr("x", margin.left + 140)
        .attr("y", chartBottom + 26)
        .attr("text-anchor", "start")
        .style("font-size", "12px")
        .style("font-weight", "600")
        .style("fill", T.text)
        .text("Annual Patient Cases (Thousands) →");
    } else {
      bottomLabel.attr("x", margin.left + 140).attr("y", chartBottom + 26);
    }

    // Bars Group
    let barsContainer = svg.select(".bars-group");
    if (barsContainer.empty()) {
      barsContainer = svg.append("g").attr("class", "bars-group");
    }

    const dataSlice = currentYearData.slice(0, topN);

    // D3 Data Join by condition name
    const bars = barsContainer.selectAll("g.race-bar").data(dataSlice, (d) => d.name);

    // Enter
    const barsEnter = bars
      .enter()
      .append("g")
      .attr("class", "race-bar")
      .attr("transform", (d, i) => `translate(0,${margin.top + 8 + i * (barHeight + barGap)})`);

    barsEnter
      .append("rect")
      .attr("x", margin.left)
      .attr("height", barHeight)
      .attr("rx", 5)
      .attr("fill", (d) => palette[d.sector] || "#3b82f6")
      .attr("fill-opacity", 0.9)
      .attr("width", 0);

    // Rank Badge (#1, #2, #3, ...)
    barsEnter
      .append("text")
      .attr("class", "bar-rank")
      .attr("x", margin.left - 165)
      .attr("y", barHeight / 2)
      .attr("dy", ".35em")
      .attr("font-size", "11px")
      .attr("font-weight", "800")
      .attr("fill", (d, i) => (i === 0 ? "#eab308" : i === 1 ? "#94a3b8" : i === 2 ? "#b45309" : T.subtext))
      .text((d, i) => `#${i + 1}`);

    // Condition Name Label
    barsEnter
      .append("text")
      .attr("class", "bar-title")
      .attr("x", margin.left - 12)
      .attr("y", barHeight / 2)
      .attr("dy", ".35em")
      .attr("text-anchor", "end")
      .attr("font-size", "12px")
      .attr("font-weight", "700")
      .attr("fill", T.text)
      .text((d) => `${d.icon} ${d.name}`);

    // Value Number Ticker
    barsEnter
      .append("text")
      .attr("class", "bar-val")
      .attr("x", (d) => xScale(d.value) + 10)
      .attr("y", barHeight / 2)
      .attr("dy", ".35em")
      .attr("font-size", "12px")
      .attr("font-weight", "800")
      .attr("fill", T.text)
      .text((d) => `${d3.format(",")(d.value)}k`);

    // Merge & Update with transition
    const barsMerge = barsEnter.merge(bars);

    barsMerge
      .transition()
      .duration(450)
      .ease(d3.easeCubicInOut)
      .attr("transform", (d, i) => `translate(0,${margin.top + 8 + i * (barHeight + barGap)})`);

    barsMerge
      .select("rect")
      .transition()
      .duration(450)
      .attr("fill", (d) => palette[d.sector] || "#3b82f6")
      .attr("width", (d) => Math.max(0, xScale(d.value) - margin.left));

    barsMerge
      .select(".bar-rank")
      .text((d, i) => `#${i + 1}`)
      .attr("fill", (d, i) => (i === 0 ? "#eab308" : i === 1 ? "#94a3b8" : i === 2 ? "#b45309" : T.subtext));

    barsMerge
      .select(".bar-val")
      .transition()
      .duration(450)
      .attr("x", (d) => xScale(d.value) + 10)
      .tween("text", function (d) {
        const currentText = this.textContent.replace(/[^0-9]/g, "");
        const prevVal = +currentText || d.value;
        const interpolator = d3.interpolateNumber(prevVal, d.value);
        return function (t) {
          this.textContent = `${d3.format(",")(Math.round(interpolator(t)))}k`;
        };
      });

    // Exit
    bars.exit().transition().duration(300).style("opacity", 0).remove();

  }, [theme, palette, year, currentYearData]);

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%", border: `1px solid ${T.border}`, borderRadius: 8, overflow: "hidden" }}>
      <svg ref={svgRef}></svg>
    </div>
  );
}

// ─── 3D STADIUM BAR CHART RACE (THREE.JS) ────────────────────────────────────
function Chart3D({ theme, palette, year, currentYearData }) {
  const mountRef = useRef(null);
  const T = UI_THEMES[theme];

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    while (el.firstChild) el.removeChild(el.firstChild);

    let animId, renderer;
    const W = el.clientWidth || 740;
    const H = 540;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(T.threeBg);

    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 1000);
    camera.position.set(0, 3, 26);
    camera.lookAt(-1, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    el.appendChild(renderer.domElement);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.85));
    const sun = new THREE.DirectionalLight(0xffffff, 1.2);
    sun.position.set(16, 24, 18);
    sun.castShadow = true;
    scene.add(sun);

    // Floor & 3D Grid
    const floorGeo = new THREE.PlaneGeometry(42, 36);
    const floorMat = new THREE.MeshStandardMaterial({
      color: theme === "Dark" ? 0x111827 : 0xf1f5f9,
      roughness: 0.9,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -8;
    floor.receiveShadow = true;
    scene.add(floor);

    const grid = new THREE.GridHelper(42, 21, theme === "Dark" ? 0x374151 : 0xcbd5e1, theme === "Dark" ? 0x1f2937 : 0xe2e8f0);
    grid.position.y = -7.95;
    scene.add(grid);

    const pivot = new THREE.Group();
    scene.add(pivot);

    // 3D Extruded Horizontal Bars with Labels and Data Values
    const top10 = currentYearData.slice(0, 10);
    const maxVal = d3.max(top10, (d) => d.value) || 1000;
    const barWidthScale = d3.scaleLinear().domain([0, maxVal]).range([0.5, 13]);

    top10.forEach((d, i) => {
      const colHex = palette[d.sector] || "#3b82f6";
      const w = barWidthScale(d.value);
      const boxGeo = new THREE.BoxGeometry(w, 0.8, 1.2);
      const boxMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(colHex),
        roughness: 0.25,
        metalness: 0.5,
        emissive: new THREE.Color(colHex),
        emissiveIntensity: i === 0 ? 0.45 : 0.15,
      });
      const barMesh = new THREE.Mesh(boxGeo, boxMat);
      // Align left at x = -6.5
      barMesh.position.set(-6.5 + w / 2, 5.2 - i * 1.3, 0);
      barMesh.castShadow = true;
      pivot.add(barMesh);

      // Backplate marker
      const markerGeo = new THREE.BoxGeometry(0.2, 0.9, 1.3);
      const markerMat = new THREE.MeshBasicMaterial({ color: i === 0 ? 0xeab308 : 0x94a3b8 });
      const marker = new THREE.Mesh(markerGeo, markerMat);
      marker.position.set(-6.6, 5.2 - i * 1.3, 0);
      pivot.add(marker);

      // ─── 3D Data Value Badge Sprite (tip of bar) ───
      const valCanvas = document.createElement("canvas");
      valCanvas.width = 190;
      valCanvas.height = 54;
      const vctx = valCanvas.getContext("2d");
      vctx.fillStyle = theme === "Dark" ? "rgba(17, 24, 39, 0.94)" : "rgba(255, 255, 255, 0.96)";
      vctx.beginPath();
      vctx.roundRect(3, 3, 184, 48, 8);
      vctx.fill();
      vctx.strokeStyle = colHex;
      vctx.lineWidth = 2.5;
      vctx.stroke();

      vctx.font = "bold 24px system-ui, -apple-system, sans-serif";
      vctx.fillStyle = colHex;
      vctx.textAlign = "center";
      vctx.textBaseline = "middle";
      vctx.fillText(`${d3.format(",")(d.value)}k`, 95, 27);

      const valTexture = new THREE.CanvasTexture(valCanvas);
      valTexture.minFilter = THREE.LinearFilter;
      const valSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: valTexture, transparent: true }));
      valSprite.scale.set(1.9, 0.54, 1);
      valSprite.position.set(-6.5 + w + 1.15, 5.2 - i * 1.3, 0);
      pivot.add(valSprite);

      // ─── Condition Name & Rank Sprite (left side) ───
      const nameCanvas = document.createElement("canvas");
      nameCanvas.width = 340;
      nameCanvas.height = 54;
      const nctx = nameCanvas.getContext("2d");
      nctx.fillStyle = theme === "Dark" ? "rgba(17, 24, 39, 0.92)" : "rgba(255, 255, 255, 0.95)";
      nctx.beginPath();
      nctx.roundRect(3, 3, 334, 48, 8);
      nctx.fill();
      nctx.strokeStyle = i === 0 ? "#eab308" : (theme === "Dark" ? "#374151" : "#cbd5e1");
      nctx.lineWidth = 2;
      nctx.stroke();

      nctx.font = "bold 22px system-ui, -apple-system, sans-serif";
      nctx.fillStyle = i === 0 ? "#eab308" : (theme === "Dark" ? "#94a3b8" : "#64748b");
      nctx.textAlign = "left";
      nctx.textBaseline = "middle";
      nctx.fillText(`#${i + 1}`, 14, 27);

      nctx.fillStyle = theme === "Dark" ? "#f8fafc" : "#0f172a";
      nctx.fillText(d.name, 62, 27);

      const nameTexture = new THREE.CanvasTexture(nameCanvas);
      nameTexture.minFilter = THREE.LinearFilter;
      const nameSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: nameTexture, transparent: true }));
      nameSprite.scale.set(3.4, 0.54, 1);
      nameSprite.position.set(-8.6, 5.2 - i * 1.3, 0);
      pivot.add(nameSprite);
    });

    // ─── 3D Year Display Banner ───
    const yrCanvas = document.createElement("canvas");
    yrCanvas.width = 240;
    yrCanvas.height = 70;
    const yctx = yrCanvas.getContext("2d");
    yctx.fillStyle = theme === "Dark" ? "rgba(17, 24, 39, 0.95)" : "rgba(255, 255, 255, 0.95)";
    yctx.beginPath();
    yctx.roundRect(4, 4, 232, 62, 12);
    yctx.fill();
    yctx.strokeStyle = palette.Cardiovascular || "#ef4444";
    yctx.lineWidth = 3;
    yctx.stroke();

    yctx.font = "bold 36px system-ui, -apple-system, sans-serif";
    yctx.fillStyle = palette.Cardiovascular || "#ef4444";
    yctx.textAlign = "center";
    yctx.textBaseline = "middle";
    yctx.fillText(`YEAR: ${year}`, 120, 35);

    const yrTexture = new THREE.CanvasTexture(yrCanvas);
    yrTexture.minFilter = THREE.LinearFilter;
    const yrSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: yrTexture, transparent: true }));
    yrSprite.scale.set(3.0, 0.88, 1);
    yrSprite.position.set(-1, 7.3, 0);
    pivot.add(yrSprite);

    // Orbit Dragging
    let isDragging = false, prevX = 0, prevY = 0;
    let rotX = 0.15, rotY = 0.25, autoSpin = true;
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
      rotX = Math.max(-0.5, Math.min(0.7, rotX + (e.clientY - prevY) * 0.004));
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
  }, [theme, palette, year, currentYearData]);

  return (
    <div style={{ position: "relative", width: "100%", border: `1px solid ${T.border}`, borderRadius: 8, overflow: "hidden" }}>
      <div ref={mountRef} style={{ width: "100%", height: 540 }} />
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
        💡 Drag to rotate in 3D · 3D Extruded Stadium Bars · Data Values Visible at Bar Ends
      </div>
    </div>
  );
}

// ─── MAIN BAR CHART RACE COMPONENT ───────────────────────────────────────────
export default function BarChartRace() {
  const [viewMode, setViewMode] = useState("2d");
  const [theme, setTheme] = useState("Light");
  const [colorTheme, setColorTheme] = useState("Modern");
  const [year, setYear] = useState(2000);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  const T = UI_THEMES[theme];
  const palette = PALETTES[colorTheme] || PALETTES.Modern;

  // Filtered and sorted data for the active year
  const currentYearData = useMemo(() => {
    return RACE_TIMELINE.filter((d) => d.year === year).sort((a, b) => b.value - a.value);
  }, [year]);

  // Race Loop
  useEffect(() => {
    let timer;
    if (isPlaying) {
      const interval = speed === 0.5 ? 900 : speed === 2 ? 300 : 550;
      timer = setInterval(() => {
        setYear((prev) => {
          if (prev >= 2024) {
            setIsPlaying(false);
            return 2024;
          }
          return prev + 1;
        });
      }, interval);
    }
    return () => clearInterval(timer);
  }, [isPlaying, speed]);

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
    background: palette.Cardiovascular || "#ef4444",
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
          Bar Chart Race – Top Diagnosed Clinical Conditions (2000–2024)
        </h2>
        <p style={{ fontSize: 13, color: T.subtext, margin: "4px 0 0 0" }}>
          Smooth animated ranking transitions · Real-time value ticker interpolation · Extruded 3D stadium view.
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
            <option value="2d">2D Dynamic Race (D3)</option>
            <option value="3d">3D Stadium Bars (Three.js)</option>
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
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto", flexWrap: "wrap" }}>
          <button
            onClick={() => {
              if (year >= 2024) setYear(2000);
              setIsPlaying(!isPlaying);
            }}
            style={btnStyle}
          >
            {isPlaying ? "⏸ Pause Race" : year >= 2024 ? "🔄 Restart Race" : "▶ Start Race"}
          </button>

          <button
            onClick={() => {
              setIsPlaying(false);
              setYear((prev) => Math.max(2000, prev - 1));
            }}
            style={{ ...ddStyle, padding: "6px 10px" }}
            title="Step Back"
          >
            ⏮
          </button>

          <button
            onClick={() => {
              setIsPlaying(false);
              setYear((prev) => Math.min(2024, prev + 1));
            }}
            style={{ ...ddStyle, padding: "6px 10px" }}
            title="Step Forward"
          >
            ⏭
          </button>

          <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))} style={ddStyle}>
            <option value={0.5}>0.5x Speed</option>
            <option value={1}>1.0x Speed</option>
            <option value={2}>2.0x Speed</option>
          </select>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: palette.Cardiovascular || "#ef4444", minWidth: 38 }}>
              {year}
            </span>
            <input
              type="range"
              min={2000}
              max={2024}
              value={year}
              onChange={(e) => {
                setIsPlaying(false);
                setYear(Number(e.target.value));
              }}
              style={{ width: 130, cursor: "pointer", accentColor: palette.Cardiovascular || "#ef4444" }}
            />
          </div>
        </div>
      </div>

      {/* Visual Canvas + Stats Panel */}
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start", width: "100%", flexWrap: "nowrap" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {viewMode === "2d" ? (
            <Chart2D theme={theme} palette={palette} year={year} currentYearData={currentYearData} />
          ) : (
            <Chart3D theme={theme} palette={palette} year={year} currentYearData={currentYearData} />
          )}
        </div>
        <StatsPanel currentYearData={currentYearData} year={year} theme={theme} palette={palette} />
      </div>
    </div>
  );
}
