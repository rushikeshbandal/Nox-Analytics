import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import * as THREE from "three";
import { feature } from "topojson-client";

const THEMES = {
  Modern:  { High: "#10b981", Medium: "#3b82f6", Low: "#f59e0b", VeryLow: "#ef4444", base: "#cbd5e1" },
  Neon:    { High: "#39ff14", Medium: "#00f5ff", Low: "#ffae00", VeryLow: "#ff0080", base: "#1a1a2e" },
  Pastel:  { High: "#6ee7b7", Medium: "#a5b4fc", Low: "#fde68a", VeryLow: "#fca5a5", base: "#e2e8f0" },
  Sunset:  { High: "#1dd1a1", Medium: "#48dbfb", Low: "#feca57", VeryLow: "#ff6b6b", base: "#d1d5db" },
  Ocean:   { High: "#0096c7", Medium: "#00b4d8", Low: "#90e0ef", VeryLow: "#03045e", base: "#caf0f8" },
  Galaxy:  { High: "#9d4edd", Medium: "#7b2cbf", Low: "#c77dff", VeryLow: "#4a306d", base: "#e0aaff" },
  Forest:  { High: "#2d6a4f", Medium: "#52b788", Low: "#95d5b2", VeryLow: "#1b4332", base: "#d8f3dc" },
  Autumn:  { High: "#c1121f", Medium: "#9d0208", Low: "#e63946", VeryLow: "#370617", base: "#f4d35e" },
  Candy:   { High: "#06d6a0", Medium: "#3a86ff", Low: "#ffbe0b", VeryLow: "#ff006e", base: "#ffd6ff" },
  Earth:   { High: "#3a7d44", Medium: "#8b6914", Low: "#c9a96e", VeryLow: "#6b4f3c", base: "#e9d8a6" },
};

const demoData = [
  { name: "United States", value: 95, category: "High" },
  { name: "China", value: 92, category: "High" },
  { name: "India", value: 78, category: "Medium" },
  { name: "Germany", value: 88, category: "High" },
  { name: "United Kingdom", value: 86, category: "High" },
  { name: "Japan", value: 82, category: "Medium" },
  { name: "France", value: 79, category: "Medium" },
  { name: "Brazil", value: 72, category: "Medium" },
  { name: "Canada", value: 89, category: "High" },
  { name: "Australia", value: 85, category: "High" },
  { name: "Russia", value: 65, category: "Low" },
  { name: "South Korea", value: 81, category: "Medium" },
  { name: "Mexico", value: 68, category: "Low" },
  { name: "Netherlands", value: 84, category: "High" },
  { name: "Switzerland", value: 91, category: "High" },
];

const nameMap = {
  "United States of America": "United States",
  "Russian Federation": "Russia",
  "Kingdom of the Netherlands": "Netherlands",
  "Democratic Republic of the Congo": "DR Congo",
};

const shortNames = {
  "United States of America": "USA", "United Kingdom": "UK",
  "Russian Federation": "Russia", "Saudi Arabia": "Saudi",
  "South Africa": "S.Africa", "New Zealand": "NZ",
  "Papua New Guinea": "PNG", "Democratic Republic of the Congo": "DR Congo",
  "Central African Republic": "CAR", "United Arab Emirates": "UAE",
};

const getInfo = (geoName) => {
  if (!geoName) return null;
  const mapped = nameMap[geoName] || geoName;
  return demoData.find(c => c.name.toLowerCase() === mapped.toLowerCase()) || null;
};

// ─── 2D Map ──────────────────────────────────────────────────────────────────
function Map2D({ theme }) {
  const svgRef = useRef();
  const colors = THEMES[theme];

  useEffect(() => {
    const width = 960, height = 500;
    const svg = d3.select(svgRef.current)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");
    svg.selectAll("*").remove();

    svg.append("rect").attr("width", width).attr("height", height)
      .attr("fill", "#f0f4f8").attr("rx", 8);

    const projection = d3.geoNaturalEarth1().scale(153).translate([width / 2, height / 2]);
    const path = d3.geoPath().projection(projection);

    const colorScale = d3.scaleOrdinal()
      .domain(["High", "Medium", "Low", "Very Low"])
      .range([colors.High, colors.Medium, colors.Low, colors.VeryLow]);

    const tooltip = d3.select("body").append("div")
      .style("position", "absolute").style("background", "rgba(15,23,42,0.95)")
      .style("color", "#fff").style("padding", "8px 12px").style("border-radius", "6px")
      .style("font-size", "12px").style("pointer-events", "none").style("opacity", 0)
      .style("border", "1px solid #334155").style("z-index", "9999");

    d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json").then(data => {
      const countries = feature(data, data.objects.countries);
      const mapGroup = svg.append("g");

      mapGroup.selectAll("path")
        .data(countries.features)
        .enter().append("path")
        .attr("d", path)
        .attr("fill", d => {
          const info = getInfo(d.properties.name);
          return info ? colorScale(info.category) : colors.base;
        })
        .attr("stroke", "#fff").attr("stroke-width", 0.4).attr("opacity", 0.9)
        .style("cursor", "pointer")
        .on("mouseover", function (event, d) {
          d3.select(this).transition().duration(150)
            .attr("stroke", "#1e293b").attr("stroke-width", 1.5).attr("opacity", 1);
          const info = getInfo(d.properties.name);
          tooltip.style("opacity", 1).html(
            info
              ? `<b style="color:${colorScale(info.category)}">${info.name}</b><br/>Score: ${info.value}/100<br/>Category: ${info.category}`
              : `<b>${d.properties.name || "Unknown"}</b><br/><span style="color:#94a3b8">No data</span>`
          ).style("left", (event.pageX + 12) + "px").style("top", (event.pageY - 10) + "px");
        })
        .on("mouseout", function () {
          d3.select(this).transition().duration(150)
            .attr("stroke", "#fff").attr("stroke-width", 0.4).attr("opacity", 0.9);
          tooltip.style("opacity", 0);
        });

      const labeled = countries.features
        .map(d => ({ d, area: path.area(d), centroid: path.centroid(d), name: d.properties.name || "" }))
        .filter(({ centroid, area }) =>
          area > 2500 && !isNaN(centroid[0]) && !isNaN(centroid[1]) &&
          centroid[0] > 20 && centroid[0] < width - 20 &&
          centroid[1] > 10 && centroid[1] < height - 10
        )
        .sort((a, b) => b.area - a.area);

      const placed = [];
      labeled.filter(({ centroid }) => {
        for (const p of placed) {
          const dx = centroid[0] - p[0], dy = centroid[1] - p[1];
          if (Math.sqrt(dx * dx + dy * dy) < 30) return false;
        }
        placed.push(centroid);
        return true;
      }).forEach(({ centroid, name }) => {
        const info = getInfo(name);
        const short = shortNames[name] || (name.length > 9 ? name.slice(0, 8) + "." : name);
        mapGroup.append("text")
          .attr("transform", `translate(${centroid[0]},${centroid[1]})`)
          .attr("text-anchor", "middle").attr("dy", "0.35em")
          .style("font-size", "7px").style("font-weight", "700").style("pointer-events", "none")
          .attr("stroke", "#fff").attr("stroke-width", 2.5)
          .attr("paint-order", "stroke").attr("fill", "#1e293b")
          .text(info ? `${short} (${info.value})` : short);
      });

      const leg = svg.append("g").attr("transform", `translate(14,${height - 82})`);
      leg.append("rect").attr("width", 110).attr("height", 70)
        .attr("fill", "rgba(255,255,255,0.9)").attr("stroke", "#e2e8f0").attr("rx", 6);
      [["High", colors.High], ["Medium", colors.Medium], ["Low", colors.Low], ["Very Low", colors.VeryLow]]
        .forEach(([lbl, col], i) => {
          const g = leg.append("g").attr("transform", `translate(8,${12 + i * 14})`);
          g.append("rect").attr("width", 10).attr("height", 10).attr("rx", 2).attr("fill", col);
          g.append("text").attr("x", 15).attr("y", 8.5).attr("fill", "#334155").style("font-size", "10px").text(lbl);
        });

      return () => tooltip.remove();
    }).catch(() => {
      svg.append("text").attr("x", width / 2).attr("y", height / 2)
        .attr("text-anchor", "middle").attr("fill", "#ef4444").style("font-size", "14px")
        .text("Failed to load map data.");
    });

    return () => { tooltip.remove(); };
  }, [theme]);

  return (
    <div style={{ width: "100%", borderRadius: 8, overflow: "hidden", border: "1px solid #e2e8f0" }}>
      <svg ref={svgRef} style={{ display: "block", width: "100%" }} />
    </div>
  );
}

// ─── 3D Globe ────────────────────────────────────────────────────────────────
function Map3D({ theme }) {
  const mountRef = useRef();
  const tooltipRef = useRef();
  const colors = THEMES[theme];

  useEffect(() => {
    const el = mountRef.current;
    const tooltipEl = tooltipRef.current;
    if (!el) return;
    const W = el.offsetWidth || 960, H = 500;

    // ── Scene setup ──
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f4f8);
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 1000);
    camera.position.set(0, 0, 2.8);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    el.appendChild(renderer.domElement);

    // ── Lights ──
    scene.add(new THREE.AmbientLight(0xffffff, 1.0));
    const sun = new THREE.DirectionalLight(0xffffff, 0.8);
    sun.position.set(5, 3, 5);
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0xffffff, 0.4);
    fill.position.set(-5, -3, -5);
    scene.add(fill);

    // ── Globe sphere ──
    const globeGeo = new THREE.SphereGeometry(1, 128, 128);
    const globeMat = new THREE.MeshPhongMaterial({ color: new THREE.Color(colors.base), shininess: 8 });
    const globe = new THREE.Mesh(globeGeo, globeMat);
    scene.add(globe);

    // ── Per-country hit lookup: map pixel color → country name ──
    // We build TWO canvases:
    //   1. visCanvas  — the beautiful texture rendered on the globe
    //   2. pickCanvas — a hidden canvas where each country is painted a unique solid color
    //      We can read a pixel under the mouse and reverse-map to country name.

    const TEX = 4096; // higher res for cleaner look
    const visCanvas = document.createElement("canvas");
    visCanvas.width = TEX; visCanvas.height = TEX / 2;
    const visCtx = visCanvas.getContext("2d");

    const pickCanvas = document.createElement("canvas");
    pickCanvas.width = TEX; pickCanvas.height = TEX / 2;
    const pickCtx = pickCanvas.getContext("2d");

    // color-key → country name
    const colorKeyMap = {};

    const proj = d3.geoEquirectangular()
      .scale(TEX / (2 * Math.PI))
      .translate([TEX / 2, TEX / 4]);
    const pathGen = d3.geoPath().projection(proj);

    d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json").then(data => {
      const countries = feature(data, data.objects.countries);

      // ── Ocean background ──
      visCtx.fillStyle = colors.base;
      visCtx.fillRect(0, 0, visCanvas.width, visCanvas.height);
      pickCtx.fillStyle = "#000000";
      pickCtx.fillRect(0, 0, pickCanvas.width, pickCanvas.height);

      // ── Draw countries ──
      countries.features.forEach((f, idx) => {
        const info = getInfo(f.properties.name);

        // Visual fill
        let fill = colors.base;
        if (info) {
          if (info.category === "High") fill = colors.High;
          else if (info.category === "Medium") fill = colors.Medium;
          else if (info.category === "Low") fill = colors.Low;
          else fill = colors.VeryLow;
        }

        // Visual canvas
        visCtx.beginPath();
        pathGen.context(visCtx)(f);
        visCtx.fillStyle = fill;
        visCtx.fill();
        visCtx.strokeStyle = "#ffffff";
        visCtx.lineWidth = 0.8;
        visCtx.stroke();

        // Pick canvas — unique color per country index (idx+1 so 0 is "ocean")
        const r = Math.floor(idx / 65536) % 256;
        const g = Math.floor(idx / 256) % 256;
        const b = idx % 256;
        const key = `${r},${g},${b}`;
        colorKeyMap[key] = f.properties.name;
        const pickFill = `rgb(${r},${g},${b})`;

        pickCtx.beginPath();
        pathGen.context(pickCtx)(f);
        pickCtx.fillStyle = pickFill;
        pickCtx.fill();
      });

      // ── Country labels on vis texture ──
      visCtx.textAlign = "center";
      visCtx.textBaseline = "middle";

      const placed2 = [];
      countries.features
        .map(f => ({ f, area: d3.geoArea(f), centroid: d3.geoCentroid(f), name: f.properties.name || "" }))
        .filter(({ area }) => area > 0.015)
        .sort((a, b) => b.area - a.area)
        .forEach(({ centroid, name }) => {
          if (!centroid || isNaN(centroid[0])) return;
          const [px, py] = proj(centroid);
          if (px < 0 || px > TEX || py < 0 || py > TEX / 2) return;
          for (const p of placed2) {
            if (Math.abs(px - p[0]) < 50 && Math.abs(py - p[1]) < 25) return;
          }
          placed2.push([px, py]);

          const info = getInfo(name);
          const short = shortNames[name] || (name.length > 9 ? name.slice(0, 8) + "." : name);
          const label = info ? `${short} (${info.value})` : short;

          visCtx.font = "bold 14px sans-serif";
          visCtx.strokeStyle = "rgba(255,255,255,0.9)";
          visCtx.lineWidth = 4;
          visCtx.strokeText(label, px, py);
          visCtx.fillStyle = "#1e293b";
          visCtx.fillText(label, px, py);
        });

      // Apply visual texture
      const texture = new THREE.CanvasTexture(visCanvas);
      globe.material = new THREE.MeshPhongMaterial({ map: texture, shininess: 8 });
      globe.material.needsUpdate = true;

      // Store pick canvas for raycasting lookup
      globe.userData.pickCanvas = pickCanvas;
      globe.userData.colorKeyMap = colorKeyMap;
    });

    // ── Raycaster for hover detection ──
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let lastHovered = null;

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

        const pickCtxLocal = pc.getContext("2d");
        const pixel = pickCtxLocal.getImageData(px, py, 1, 1).data;
        const key = `${pixel[0]},${pixel[1]},${pixel[2]}`;
        const countryName = globe.userData.colorKeyMap[key];

        if (countryName && countryName !== lastHovered) {
          lastHovered = countryName;
          const info = getInfo(countryName);
          const displayName = nameMap[countryName] || countryName;

          let catColor = "#94a3b8";
          if (info) {
            if (info.category === "High") catColor = colors.High;
            else if (info.category === "Medium") catColor = colors.Medium;
            else if (info.category === "Low") catColor = colors.Low;
            else catColor = colors.VeryLow;
          }

          tooltipEl.style.opacity = "1";
          tooltipEl.innerHTML = info
            ? `<b style="color:${catColor}">${info.name}</b><br/>Score: ${info.value}/100<br/>Category: <span style="color:${catColor}">${info.category}</span>`
            : `<b>${displayName}</b><br/><span style="color:#94a3b8">No data</span>`;
        } else if (!countryName) {
          lastHovered = null;
          tooltipEl.style.opacity = "0";
        }

        // Position tooltip relative to container
        const containerRect = el.getBoundingClientRect();
        tooltipEl.style.left = (e.clientX - containerRect.left + 14) + "px";
        tooltipEl.style.top = (e.clientY - containerRect.top - 10) + "px";
      } else {
        lastHovered = null;
        tooltipEl.style.opacity = "0";
      }
    };

    renderer.domElement.addEventListener("mousemove", onMouseMove);

    // ── Drag rotation ──
    let isDragging = false, prevX = 0, prevY = 0;
    let rotX = 0.3, rotY = 0, autoSpin = true;
    const onDown = e => { isDragging = true; prevX = e.clientX; prevY = e.clientY; autoSpin = false; };
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

  return (
    <div style={{ width: "100%", borderRadius: 8, overflow: "hidden", border: "1px solid #e2e8f0", position: "relative" }}>
      <div ref={mountRef} style={{ width: "100%", height: 500 }} />
      {/* Tooltip overlay — positioned absolute inside the container */}
      <div
        ref={tooltipRef}
        style={{
          position: "absolute",
          background: "rgba(15,23,42,0.95)",
          color: "#fff",
          padding: "8px 12px",
          borderRadius: 6,
          fontSize: 12,
          pointerEvents: "none",
          opacity: 0,
          border: "1px solid #334155",
          zIndex: 9999,
          transition: "opacity 0.15s",
          lineHeight: "1.6",
          whiteSpace: "nowrap",
          top: 0,
          left: 0,
        }}
      />
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────
const WorldMap1 = () => {
  const [viewMode, setViewMode] = useState("2d");
  const [theme, setTheme] = useState("Modern");

  const dropdownStyle = {
    padding: "5px 10px", borderRadius: 6,
    border: "1px solid #e2e8f0", background: "#fff",
    color: "#334155", fontWeight: "500", cursor: "pointer", fontSize: 12, outline: "none",
  };

  return (
    <div style={{
      background: "#ffffff", borderRadius: 12,
      padding: "20px 24px 28px 24px", width: "100%",
      boxShadow: "0 1px 3px rgba(0,0,0,0.08)", boxSizing: "border-box",
    }}>
      <div style={{ marginBottom: 4 }}>
        <div style={{ fontSize: 16, fontWeight: "bold", color: "#1e293b" }}>World Map</div>
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "flex-end", marginTop: 12, marginBottom: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <label style={{ fontSize: 11, color: "#94a3b8", fontWeight: "600" }}>View</label>
          <select value={viewMode} onChange={e => setViewMode(e.target.value)} style={dropdownStyle}>
            <option value="2d">2D</option>
            <option value="3d">3D</option>
          </select>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <label style={{ fontSize: 11, color: "#94a3b8", fontWeight: "600" }}>Color Theme</label>
          <select value={theme} onChange={e => setTheme(e.target.value)} style={dropdownStyle}>
            {Object.keys(THEMES).map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
      </div>

      {viewMode === "2d" ? <Map2D theme={theme} /> : <Map3D theme={theme} />}
    </div>
  );
};

export default WorldMap1;