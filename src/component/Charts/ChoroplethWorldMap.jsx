import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import * as THREE from "three";
import { feature } from "topojson-client";

const THEMES = {
  Modern:  d3.schemeBlues[7],
  Neon:    ["#0d0221","#1a0533","#3d0066","#7400b8","#9b00e8","#c800ff","#e066ff"],
  Pastel:  ["#f0f4ff","#c5d8ff","#9bbcff","#70a0ff","#4584ff","#1a68ff","#004ccc"],
  Sunset:  ["#fff3e0","#ffe0b2","#ffcc80","#ffb74d","#ffa726","#ff8f00","#e65100"],
  Ocean:   ["#e0f7fa","#b2ebf2","#80deea","#4dd0e1","#26c6da","#00acc1","#006064"],
  Galaxy:  ["#1a0033","#2d0057","#44007a","#6600bb","#8800dd","#aa00ff","#cc66ff"],
  Forest:  ["#f1f8e9","#dcedc8","#c5e1a5","#aed581","#8bc34a","#558b2f","#1b5e20"],
  Autumn:  ["#fff8e1","#ffecb3","#ffe082","#ffd54f","#ffca28","#ff8f00","#e65100"],
  Candy:   ["#fce4ec","#f8bbd0","#f48fb1","#f06292","#ec407a","#c2185b","#880e4f"],
  Earth:   ["#efebe9","#d7ccc8","#bcaaa4","#a1887f","#795548","#4e342e","#1a0a00"],
};

const demoData = [
  { name: "United States",    value: 92 },
  { name: "Canada",           value: 88 },
  { name: "Germany",          value: 85 },
  { name: "United Kingdom",   value: 84 },
  { name: "France",           value: 80 },
  { name: "Japan",            value: 82 },
  { name: "Australia",        value: 86 },
  { name: "Switzerland",      value: 91 },
  { name: "Sweden",           value: 89 },
  { name: "Norway",           value: 90 },
  { name: "Denmark",          value: 87 },
  { name: "Netherlands",      value: 83 },
  { name: "Singapore",        value: 88 },
  { name: "China",            value: 65 },
  { name: "South Korea",      value: 70 },
  { name: "Spain",            value: 62 },
  { name: "Italy",            value: 60 },
  { name: "Russia",           value: 48 },
  { name: "Brazil",           value: 52 },
  { name: "Mexico",           value: 45 },
  { name: "Turkey",           value: 44 },
  { name: "Poland",           value: 58 },
  { name: "Saudi Arabia",     value: 55 },
  { name: "India",            value: 42 },
  { name: "Indonesia",        value: 35 },
  { name: "Pakistan",         value: 20 },
  { name: "Nigeria",          value: 18 },
  { name: "Egypt",            value: 25 },
  { name: "South Africa",     value: 30 },
  { name: "Bangladesh",       value: 15 },
];

const nameMap = {
  "United States of America": "United States",
  "Russian Federation":       "Russia",
  "Kingdom of the Netherlands": "Netherlands",
};

const getInfo = (geoName) => {
  if (!geoName) return null;
  const mapped = nameMap[geoName] || geoName;
  return demoData.find(c => c.name.toLowerCase() === mapped.toLowerCase()) || null;
};

const getCategory = (v) => {
  if (v >= 80) return "Very High";
  if (v >= 60) return "High";
  if (v >= 40) return "Medium";
  if (v >= 20) return "Low";
  return "Very Low";
};

// ─── 2D Choropleth ────────────────────────────────────────────────────────────
function Map2D({ theme }) {
  const svgRef = useRef(null);
  const colors = THEMES[theme];

  useEffect(() => {
    if (!svgRef.current) return;
    const W = 860, H = 460;
    const colorScale = d3.scaleQuantize().domain([0, 100]).range(colors);

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox", `0 0 ${W} ${H}`).attr("preserveAspectRatio", "xMidYMid meet");
    svg.append("rect").attr("width", W).attr("height", H).attr("fill", "#f0f4f8").attr("rx", 8);

    const proj = d3.geoNaturalEarth1().scale(138).translate([W / 2, H / 2]);
    const path = d3.geoPath().projection(proj);

    const tooltip = d3.select("body").append("div")
      .style("position", "absolute").style("background", "rgba(15,23,42,0.95)")
      .style("color", "#fff").style("padding", "8px 12px").style("border-radius", "6px")
      .style("font-size", "12px").style("pointer-events", "none").style("opacity", 0)
      .style("border", "1px solid #334155").style("z-index", "9999");

    d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json").then(worldData => {
      const countries = feature(worldData, worldData.objects.countries).features;

      svg.append("g").selectAll("path").data(countries).enter().append("path")
        .attr("d", path)
        .attr("fill", d => {
          const info = getInfo(d.properties.name);
          return info ? colorScale(info.value) : "#cbd5e1";
        })
        .attr("stroke", "#fff").attr("stroke-width", 0.4).attr("opacity", 0.92)
        .style("cursor", "pointer")
        .on("mouseover", function (event, d) {
          d3.select(this).transition().duration(150).attr("stroke", "#1e293b").attr("stroke-width", 1.5).attr("opacity", 1);
          const info = getInfo(d.properties.name);
          tooltip.style("opacity", 1).html(
            info
              ? `<b style="color:${colorScale(info.value)}">${info.name}</b><br/>Value: ${info.value}/100<br/>Category: ${getCategory(info.value)}`
              : `<b>${d.properties.name || "Unknown"}</b><br/><span style="color:#94a3b8">No data</span>`
          ).style("left", (event.pageX + 12) + "px").style("top", (event.pageY - 10) + "px");
        })
        .on("mousemove", event => {
          tooltip.style("left", (event.pageX + 12) + "px").style("top", (event.pageY - 10) + "px");
        })
        .on("mouseout", function () {
          d3.select(this).transition().duration(150).attr("stroke", "#fff").attr("stroke-width", 0.4).attr("opacity", 0.92);
          tooltip.style("opacity", 0);
        });

      // Gradient legend bar
      const defs = svg.append("defs");
      const grad = defs.append("linearGradient").attr("id", "cmap-grad").attr("x1", "0%").attr("x2", "100%");
      colors.forEach((c, i) => grad.append("stop").attr("offset", `${(i / (colors.length - 1)) * 100}%`).attr("stop-color", c));

      const legW = 220, legH = 12, legX = W - legW - 16, legY = H - 48;
      const leg = svg.append("g").attr("transform", `translate(${legX},${legY})`);
      leg.append("rect").attr("width", legW).attr("height", legH).attr("fill", "url(#cmap-grad)").attr("rx", 3).attr("stroke", "#cbd5e1").attr("stroke-width", 0.5);
      const legScale = d3.scaleLinear().domain([0, 100]).range([0, legW]);
      leg.append("g").attr("transform", `translate(0,${legH})`).call(d3.axisBottom(legScale).ticks(5))
        .call(g => { g.select(".domain").remove(); g.selectAll("text").style("font-size", "9px").attr("fill", "#64748b"); g.selectAll("line").attr("stroke", "#94a3b8"); });
      leg.append("text").attr("x", 0).attr("y", -5).style("font-size", "10px").style("font-weight", "bold").attr("fill", "#64748b").text("Value Scale (0–100)");

      // Category key — bottom-left
      const cats = [["Very High", "80-100", colorScale(90)], ["High", "60-79", colorScale(70)], ["Medium", "40-59", colorScale(50)], ["Low", "20-39", colorScale(30)], ["Very Low", "0-19", colorScale(10)]];
      const ck = svg.append("g").attr("transform", `translate(12,${H - cats.length * 18 - 28})`);
      ck.append("rect").attr("width", 140).attr("height", cats.length * 18 + 22).attr("fill", "rgba(255,255,255,0.88)").attr("stroke", "#e2e8f0").attr("rx", 6);
      ck.append("text").attr("x", 8).attr("y", 14).style("font-size", "10px").style("font-weight", "bold").attr("fill", "#64748b").text("CATEGORIES");
      cats.forEach(([label, range, col], i) => {
        const row = ck.append("g").attr("transform", `translate(8,${22 + i * 18})`);
        row.append("rect").attr("width", 10).attr("height", 10).attr("rx", 2).attr("fill", col);
        row.append("text").attr("x", 15).attr("y", 9).style("font-size", "9px").attr("fill", "#334155").text(`${label}: ${range}`);
      });
    }).catch(() => {
      svg.append("text").attr("x", W / 2).attr("y", H / 2).attr("text-anchor", "middle").attr("fill", "#ef4444").text("Failed to load map.");
    });

    return () => tooltip.remove();
  }, [theme]);

  return (
    <div style={{ width: "100%", borderRadius: 8, overflow: "hidden", border: "1px solid #e2e8f0" }}>
      <svg ref={svgRef} style={{ display: "block", width: "100%" }} />
    </div>
  );
}

// ─── 3D Globe ─────────────────────────────────────────────────────────────────
function Map3D({ theme }) {
  const mountRef = useRef(null);
  const tooltipRef = useRef(null);
  const colors = THEMES[theme];

  useEffect(() => {
    if (!mountRef.current) return;
    const el = mountRef.current;
    const tooltipEl = tooltipRef.current;
    const W = el.offsetWidth || 860, H = 460;
    const colorScale = d3.scaleQuantize().domain([0, 100]).range(colors);

    // ── Scene ──
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f4f8);
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
    camera.position.set(0, 0, 2.8);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    el.appendChild(renderer.domElement);

    // ── Lights ──
    scene.add(new THREE.AmbientLight(0xffffff, 1.0));
    const sun = new THREE.DirectionalLight(0xffffff, 0.8);
    sun.position.set(4, 3, 5);
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0xffffff, 0.4);
    fill.position.set(-4, -3, -5);
    scene.add(fill);

    // ── Globe sphere ──
    const globeGeo = new THREE.SphereGeometry(1, 128, 128);
    const globeMat = new THREE.MeshPhongMaterial({ color: new THREE.Color(colors[0]), shininess: 8 });
    const globe = new THREE.Mesh(globeGeo, globeMat);
    scene.add(globe);

    // ── Build visual + pick canvases ──
    const TEX = 4096;
    const visCanvas = document.createElement("canvas");
    visCanvas.width = TEX; visCanvas.height = TEX / 2;
    const visCtx = visCanvas.getContext("2d");

    const pickCanvas = document.createElement("canvas");
    pickCanvas.width = TEX; pickCanvas.height = TEX / 2;
    const pickCtx = pickCanvas.getContext("2d");

    const colorKeyMap = {}; // "r,g,b" → country name

    const proj = d3.geoEquirectangular()
      .scale(TEX / (2 * Math.PI))
      .translate([TEX / 2, TEX / 4]);

    d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json").then(worldData => {
      const countries = feature(worldData, worldData.objects.countries).features;

      // Ocean background
      visCtx.fillStyle = colors[0];
      visCtx.fillRect(0, 0, visCanvas.width, visCanvas.height);
      pickCtx.fillStyle = "#000000";
      pickCtx.fillRect(0, 0, pickCanvas.width, pickCanvas.height);

      // Draw each country on both canvases
      countries.forEach((f, idx) => {
        const info = getInfo(f.properties.name);
        const visFill = info ? colorScale(info.value) : (colors[1] || "#cbd5e1");

        // Visual canvas
        const visPathGen = d3.geoPath().projection(proj).context(visCtx);
        visCtx.beginPath();
        visPathGen(f);
        visCtx.fillStyle = visFill;
        visCtx.fill();
        visCtx.strokeStyle = "#ffffff";
        visCtx.lineWidth = 0.8;
        visCtx.stroke();

        // Pick canvas — unique solid RGB per country index
        const r = Math.floor(idx / 65536) % 256;
        const g = Math.floor(idx / 256) % 256;
        const b = idx % 256;
        colorKeyMap[`${r},${g},${b}`] = f.properties.name;

        const pickPathGen = d3.geoPath().projection(proj).context(pickCtx);
        pickCtx.beginPath();
        pickPathGen(f);
        pickCtx.fillStyle = `rgb(${r},${g},${b})`;
        pickCtx.fill();
      });

      // Country labels on visual texture
      visCtx.textAlign = "center";
      visCtx.textBaseline = "middle";
      const placed = [];
      countries
        .map(f => ({ f, area: d3.geoArea(f), c: d3.geoCentroid(f), name: f.properties.name || "" }))
        .filter(({ area }) => area > 0.012)
        .sort((a, b) => b.area - a.area)
        .forEach(({ c, name }) => {
          if (!c || isNaN(c[0])) return;
          const [px, py] = proj(c);
          if (px < 0 || px > TEX || py < 0 || py > TEX / 2) return;
          for (const p of placed) {
            if (Math.abs(px - p[0]) < 50 && Math.abs(py - p[1]) < 24) return;
          }
          placed.push([px, py]);
          const info = getInfo(name);
          const label = info
            ? `${name.length > 10 ? name.slice(0, 9) + "." : name} (${info.value})`
            : (name.length > 10 ? name.slice(0, 9) + "." : name);

          visCtx.font = "bold 14px sans-serif";
          visCtx.strokeStyle = "rgba(255,255,255,0.9)";
          visCtx.lineWidth = 4;
          visCtx.strokeText(label, px, py);
          visCtx.fillStyle = "#1e293b";
          visCtx.fillText(label, px, py);
        });

      // Apply visual texture to globe
      globe.material = new THREE.MeshPhongMaterial({ map: new THREE.CanvasTexture(visCanvas), shininess: 8 });
      globe.material.needsUpdate = true;

      // Store pick data on globe for raycasting
      globe.userData.pickCanvas = pickCanvas;
      globe.userData.colorKeyMap = colorKeyMap;
    });

    // ── Raycaster for hover ──
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let lastKey = null;

    const onMouseMove = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObject(globe);

      if (hits.length > 0 && globe.userData.pickCanvas) {
        const uv = hits[0].uv;
        const pc = globe.userData.pickCanvas;
        const px = Math.floor(uv.x * pc.width);
        const py = Math.floor((1 - uv.y) * pc.height);

        const pixel = pc.getContext("2d").getImageData(px, py, 1, 1).data;
        const key = `${pixel[0]},${pixel[1]},${pixel[2]}`;
        const countryName = globe.userData.colorKeyMap[key];

        if (countryName) {
          lastKey = key;
          const info = getInfo(countryName);
          const displayName = nameMap[countryName] || countryName;
          const valColor = info ? colorScale(info.value) : "#94a3b8";

          tooltipEl.style.opacity = "1";
          tooltipEl.innerHTML = info
            ? `<b style="color:${valColor}">${info.name}</b><br/>Value: ${info.value}/100<br/>Category: <span style="color:${valColor}">${getCategory(info.value)}</span>`
            : `<b>${displayName}</b><br/><span style="color:#94a3b8">No data</span>`;

          const containerRect = el.getBoundingClientRect();
          tooltipEl.style.left = (e.clientX - containerRect.left + 14) + "px";
          tooltipEl.style.top = (e.clientY - containerRect.top - 10) + "px";
        } else {
          lastKey = null;
          tooltipEl.style.opacity = "0";
        }
      } else {
        lastKey = null;
        tooltipEl.style.opacity = "0";
      }
    };

    renderer.domElement.addEventListener("mousemove", onMouseMove);

    // ── Drag rotation ──
    let isDragging = false, prevX = 0, prevY = 0, rotX = 0, rotY = 0, autoSpin = true;
    const onDown = e => { isDragging = true; prevX = e.clientX; prevY = e.clientY; autoSpin = false; tooltipEl.style.opacity = "0"; };
    const onUp = () => { isDragging = false; };
    const onMove = e => {
      if (!isDragging) return;
      rotY += (e.clientX - prevX) * 0.005;
      rotX += (e.clientY - prevY) * 0.003;
      rotX = Math.max(-1.2, Math.min(1.2, rotX));
      prevX = e.clientX; prevY = e.clientY;
    };
    renderer.domElement.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("mousemove", onMove);

    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (autoSpin) rotY += 0.003;
      globe.rotation.y = rotY;
      globe.rotation.x = rotX;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      renderer.domElement.removeEventListener("mousemove", onMouseMove);
      renderer.domElement.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("mousemove", onMove);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [theme]);

  // HTML legend — outside canvas
  const colorScale = d3.scaleQuantize().domain([0, 100]).range(colors);
  const cats = [
    ["Very High", "80-100", colorScale(90)],
    ["High",      "60-79",  colorScale(70)],
    ["Medium",    "40-59",  colorScale(50)],
    ["Low",       "20-39",  colorScale(30)],
    ["Very Low",  "0-19",   colorScale(10)],
  ];

  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start", width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden" }}>
      {/* Globe container — position relative for tooltip */}
      <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
        <div ref={mountRef} style={{ width: "100%", height: 460 }} />
        {/* Tooltip — absolutely positioned inside globe container */}
        <div
          ref={tooltipRef}
          style={{
            position: "absolute",
            top: 0, left: 0,
            background: "rgba(15,23,42,0.95)",
            color: "#fff",
            padding: "8px 12px",
            borderRadius: 6,
            fontSize: 12,
            lineHeight: "1.6",
            pointerEvents: "none",
            opacity: 0,
            border: "1px solid #334155",
            zIndex: 9999,
            transition: "opacity 0.15s",
            whiteSpace: "nowrap",
          }}
        />
      </div>

      {/* Legend panel */}
      <div style={{ padding: "12px 12px 12px 0", flexShrink: 0 }}>
        {/* Gradient bar */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "12px 14px", width: 160, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", marginBottom: 10 }}>
          <div style={{ fontSize: 10, fontWeight: "bold", color: "#94a3b8", letterSpacing: "0.08em", marginBottom: 8 }}>VALUE SCALE</div>
          <div style={{
            width: "100%", height: 12, borderRadius: 4, marginBottom: 4,
            background: `linear-gradient(to right, ${colors.join(",")})`,
            border: "1px solid #e2e8f0",
          }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#94a3b8" }}>
            <span>0</span><span>50</span><span>100</span>
          </div>
        </div>

        {/* Category key */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "12px 14px", width: 160, boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
          <div style={{ fontSize: 10, fontWeight: "bold", color: "#94a3b8", letterSpacing: "0.08em", marginBottom: 8 }}>CATEGORIES</div>
          {cats.map(([label, range, col]) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
              <div style={{ width: 11, height: 11, borderRadius: 2, flexShrink: 0, background: col, border: "1px solid #e2e8f0" }} />
              <div>
                <div style={{ color: "#334155", fontSize: 11, fontWeight: "600" }}>{label}</div>
                <div style={{ color: "#94a3b8", fontSize: 9 }}>{range}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Top countries */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "12px 14px", width: 160, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", marginTop: 10 }}>
          <div style={{ fontSize: 10, fontWeight: "bold", color: "#94a3b8", letterSpacing: "0.08em", marginBottom: 8 }}>TOP COUNTRIES</div>
          {[...demoData].sort((a, b) => b.value - a.value).slice(0, 6).map(d => (
            <div key={d.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
              <span style={{ color: "#334155", fontSize: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                {d.name.length > 12 ? d.name.slice(0, 11) + "." : d.name}
              </span>
              <span style={{ color: colorScale(d.value), fontSize: 10, fontWeight: "bold", marginLeft: 4 }}>{d.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const ChoroplethWorldMap = () => {
  const [viewMode, setViewMode] = useState("2d");
  const [theme, setTheme] = useState("Modern");

  const ddStyle = {
    padding: "5px 10px", borderRadius: 6, border: "1px solid #e2e8f0",
    background: "#fff", color: "#334155", fontWeight: "500",
    cursor: "pointer", fontSize: 12, outline: "none",
  };

  return (
    <div style={{
      background: "#ffffff", borderRadius: 12,
      padding: "20px 24px 32px 24px", width: "100%",
      boxShadow: "0 1px 3px rgba(0,0,0,0.08)", boxSizing: "border-box",
    }}>
      <div style={{ marginBottom: 4 }}>
        <div style={{ fontSize: 16, fontWeight: "bold", color: "#1e293b" }}>Choropleth World Map</div>
        <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>Country performance scores (0–100)</div>
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "flex-end", marginTop: 12, marginBottom: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <label style={{ fontSize: 11, color: "#94a3b8", fontWeight: "600" }}>View</label>
          <select value={viewMode} onChange={e => setViewMode(e.target.value)} style={ddStyle}>
            <option value="2d">2D</option>
            <option value="3d">3D</option>
          </select>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <label style={{ fontSize: 11, color: "#94a3b8", fontWeight: "600" }}>Color Theme</label>
          <select value={theme} onChange={e => setTheme(e.target.value)} style={ddStyle}>
            {Object.keys(THEMES).map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
      </div>

      {viewMode === "2d"
        ? <Map2D key={`2d-${theme}`} theme={theme} />
        : <Map3D key={`3d-${theme}`} theme={theme} />
      }
    </div>
  );
};

export default ChoroplethWorldMap;