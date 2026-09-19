import React, { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from "d3";
import * as topojson from "topojson-client";
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
    ocean: "#c9dff0",
    land: "#86efac",
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
    ocean: "#0f172a",
    land: "#1e293b",
    threeBg: 0x0b0f19,
  },
};

const PALETTES = {
  Modern: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"],
  Neon: ["#00f5ff", "#39ff14", "#ffe600", "#ff007f", "#b537f2", "#ff5400"],
  Sunset: ["#ff4e50", "#fc913a", "#f9d423", "#ede574", "#e1f5c4", "#ff6f69"],
  Earth: ["#2d6a4f", "#40916c", "#52b788", "#74c69d", "#95d5b2", "#b7e4c7"],
  Ocean: ["#0077b6", "#0096c7", "#00b4d8", "#48cae4", "#90e0ef", "#03045e"],
};

// Key Tour Itinerary Destinations (Coordinates: [lon, lat])
const TOUR_STOPS = [
  { name: "France", capital: "Paris", coords: [2.3522, 48.8566], pop: "68M", region: "Europe" },
  { name: "Egypt", capital: "Cairo", coords: [31.2357, 30.0444], pop: "112M", region: "Africa" },
  { name: "India", capital: "New Delhi", coords: [77.2090, 28.6139], pop: "1.43B", region: "Asia" },
  { name: "Japan", capital: "Tokyo", coords: [139.6917, 35.6895], pop: "124M", region: "Asia" },
  { name: "Australia", capital: "Canberra", coords: [149.1300, -35.2809], pop: "26M", region: "Oceania" },
  { name: "United States", capital: "Washington, D.C.", coords: [-77.0369, 38.9072], pop: "340M", region: "Americas" },
  { name: "Brazil", capital: "Brasília", coords: [-47.8825, -15.7942], pop: "217M", region: "Americas" },
  { name: "South Africa", capital: "Pretoria", coords: [28.1881, -25.7461], pop: "60M", region: "Africa" },
  { name: "United Kingdom", capital: "London", coords: [-0.1278, 51.5074], pop: "68M", region: "Europe" },
];

// ─── STATS PANEL ─────────────────────────────────────────────────────────────
function StatsPanel({ currentStop, stopIndex, theme, palette }) {
  const T = UI_THEMES[theme];

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
        TOUR ITINERARY
      </div>

      {card("📍 Current Destination", currentStop.name, `Stop #${stopIndex + 1} of ${TOUR_STOPS.length}`, palette[0])}
      {card("🏛️ Capital City", currentStop.capital, currentStop.region, palette[1] || "#10b981")}
      {card("👥 Population", currentStop.pop, "National Census", palette[2] || "#f59e0b")}
      {card(
        "🌐 Coordinates",
        `${currentStop.coords[1].toFixed(1)}°N, ${currentStop.coords[0].toFixed(1)}°E`,
        "Geodesic Centroid",
        palette[3] || "#ef4444"
      )}

      {/* Itinerary Checklist */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 12px", marginTop: 4 }}>
        <div style={{ fontSize: 10, color: T.subtext, fontWeight: 700, marginBottom: 6, textTransform: "uppercase" }}>
          Flight Itinerary
        </div>
        {TOUR_STOPS.map((s, idx) => (
          <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: idx === stopIndex ? palette[0] : T.border,
              }}
            />
            <span
              style={{
                fontSize: 11,
                color: idx === stopIndex ? palette[0] : T.text,
                fontWeight: idx === stopIndex ? "700" : "500",
              }}
            >
              {s.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 2D ANIMATED D3 WORLD TOUR GLOBE ──────────────────────────────────────────
function Chart2D({ theme, palette, currentStop, stopIndex }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const currentRotationRef = useRef([0, 0]);
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

    const projection = d3
      .geoOrthographic()
      .scale(220)
      .translate([width / 2, height / 2])
      .clipAngle(90);

    const pathGen = d3.geoPath().projection(projection);
    const graticule = d3.geoGraticule();

    // Ocean Circle
    svg
      .append("circle")
      .attr("cx", width / 2)
      .attr("cy", height / 2)
      .attr("r", 220)
      .attr("fill", T.ocean)
      .attr("stroke", palette[0])
      .attr("stroke-width", 2);

    // Graticule
    const gratPath = svg
      .append("path")
      .datum(graticule())
      .attr("fill", "none")
      .attr("stroke", theme === "Dark" ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)")
      .attr("stroke-width", 0.5);

    const landGroup = svg.append("g");
    const pinGroup = svg.append("g");

    // Load Topojson Land
    d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
      .then((world) => {
        const countries = topojson.feature(world, world.objects.countries).features;
        const paths = landGroup
          .selectAll("path")
          .data(countries)
          .join("path")
          .attr("d", pathGen)
          .attr("fill", palette[1] || T.land)
          .attr("stroke", theme === "Dark" ? "#0f172a" : "#ffffff")
          .attr("stroke-width", 0.5);

        // Smooth flight animation to currentStop coordinates
        const targetCoords = currentStop.coords;
        const targetRot = [-targetCoords[0], -targetCoords[1]];
        const interpolator = d3.geoInterpolate(
          [-currentRotationRef.current[0], -currentRotationRef.current[1]],
          targetCoords
        );

        d3.transition()
          .duration(1600)
          .ease(d3.easeCubicInOut)
          .tween("rotate", () => (t) => {
            const p = interpolator(t);
            projection.rotate([-p[0], -p[1]]);
            currentRotationRef.current = [-p[0], -p[1]];
            paths.attr("d", pathGen);
            gratPath.attr("d", pathGen);

            // Update pin
            const projCoord = projection(targetCoords);
            pinGroup.selectAll("*").remove();
            if (projCoord) {
              pinGroup
                .append("circle")
                .attr("cx", projCoord[0])
                .attr("cy", projCoord[1])
                .attr("r", 8)
                .attr("fill", palette[3] || "#ef4444")
                .attr("stroke", "#ffffff")
                .attr("stroke-width", 2);

              pinGroup
                .append("text")
                .attr("x", projCoord[0])
                .attr("y", projCoord[1] - 14)
                .attr("text-anchor", "middle")
                .attr("font-size", "13px")
                .attr("font-weight", "800")
                .attr("fill", palette[3] || "#ef4444")
                .text(`${currentStop.name} (${currentStop.capital})`);
            }
          });
      })
      .catch(() => {});

  }, [theme, palette, currentStop]);

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%", border: `1px solid ${T.border}`, borderRadius: 8, overflow: "hidden" }}>
      <svg ref={svgRef}></svg>
    </div>
  );
}

// ─── 3D ORTHOGRAPHIC FLIGHT GLOBE (THREE.JS) ──────────────────────────────────
function Chart3D({ theme, palette, currentStop }) {
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
    camera.position.set(0, 0, 22);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    el.appendChild(renderer.domElement);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const sun = new THREE.DirectionalLight(0xffffff, 1.2);
    sun.position.set(16, 20, 16);
    scene.add(sun);

    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // Earth Sphere
    const globeGeo = new THREE.SphereGeometry(7, 36, 36);
    const globeMat = new THREE.MeshStandardMaterial({
      color: theme === "Dark" ? 0x1e293b : 0xc9dff0,
      roughness: 0.7,
      metalness: 0.1,
    });
    const globe = new THREE.Mesh(globeGeo, globeMat);
    globeGroup.add(globe);

    // Wireframe Grid
    const wireGeo = new THREE.SphereGeometry(7.05, 24, 24);
    const wireMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(palette[0]),
      wireframe: true,
      transparent: true,
      opacity: 0.25,
    });
    const wire = new THREE.Mesh(wireGeo, wireMat);
    globeGroup.add(wire);

    // Add 3D pins for all tour stops
    const pinRadius = 7.1;
    TOUR_STOPS.forEach((stop) => {
      const [lon, lat] = stop.coords;
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      const x = -(pinRadius * Math.sin(phi) * Math.cos(theta));
      const z = pinRadius * Math.sin(phi) * Math.sin(theta);
      const y = pinRadius * Math.cos(phi);

      const isCurrent = stop.name === currentStop.name;
      const pinGeo = new THREE.SphereGeometry(isCurrent ? 0.35 : 0.18, 16, 16);
      const pinMat = new THREE.MeshStandardMaterial({
        color: isCurrent ? new THREE.Color(palette[3] || 0xef4444) : new THREE.Color(palette[1] || 0x10b981),
        emissive: isCurrent ? new THREE.Color(palette[3] || 0xef4444) : new THREE.Color(0x000000),
        emissiveIntensity: isCurrent ? 0.6 : 0,
      });
      const pin = new THREE.Mesh(pinGeo, pinMat);
      pin.position.set(x, y, z);
      globeGroup.add(pin);
    });

    // Orbit Dragging
    let isDragging = false, prevX = 0, prevY = 0;
    let rotX = 0.2, rotY = 0.4, autoSpin = true;
    globeGroup.rotation.x = rotX;
    globeGroup.rotation.y = rotY;

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
      rotX = Math.max(-0.8, Math.min(0.8, rotX + (e.clientY - prevY) * 0.004));
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
      globeGroup.rotation.y = rotY;
      globeGroup.rotation.x = rotX;
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
  }, [theme, palette, currentStop]);

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
        💡 Drag to rotate 3D Flight Globe · Glowing destination markers
      </div>
    </div>
  );
}

// ─── MAIN WORLD TOUR COMPONENT ────────────────────────────────────────────────
export default function WorldTour() {
  const [viewMode, setViewMode] = useState("2d");
  const [theme, setTheme] = useState("Light");
  const [colorTheme, setColorTheme] = useState("Modern");
  const [stopIndex, setStopIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const T = UI_THEMES[theme];
  const palette = PALETTES[colorTheme] || PALETTES.Modern;
  const currentStop = TOUR_STOPS[stopIndex];

  // Auto Tour Stepper
  useEffect(() => {
    let timer;
    if (isPlaying) {
      timer = setInterval(() => {
        setStopIndex((prev) => (prev + 1) % TOUR_STOPS.length);
      }, 3500);
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
          World Tour – Geodesic Orthographic Spherical Flight
        </h2>
        <p style={{ fontSize: 13, color: T.subtext, margin: "4px 0 0 0" }}>
          Automated planetary flight touring global capitals along spherical great-circle arcs using d3.geoInterpolate.
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
            <option value="2d">2D Flight Globe (D3)</option>
            <option value="3d">3D Earth (Three.js)</option>
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

        {/* Playback & Navigation */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto", flexWrap: "wrap" }}>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            style={{ ...btnStyle, background: isPlaying ? "#ef4444" : palette[0] }}
          >
            {isPlaying ? "⏸ Pause Flight" : "▶ Resume Tour"}
          </button>

          <button
            onClick={() => {
              setIsPlaying(false);
              setStopIndex((prev) => (prev - 1 + TOUR_STOPS.length) % TOUR_STOPS.length);
            }}
            style={{ ...ddStyle, padding: "6px 10px" }}
            title="Previous Country"
          >
            ⏮
          </button>

          <button
            onClick={() => {
              setIsPlaying(false);
              setStopIndex((prev) => (prev + 1) % TOUR_STOPS.length);
            }}
            style={{ ...ddStyle, padding: "6px 10px" }}
            title="Next Country"
          >
            ⏭
          </button>

          <select
            value={stopIndex}
            onChange={(e) => {
              setIsPlaying(false);
              setStopIndex(Number(e.target.value));
            }}
            style={ddStyle}
          >
            {TOUR_STOPS.map((s, idx) => (
              <option key={s.name} value={idx}>
                {idx + 1}. {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Visual Canvas + Stats Panel */}
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start", width: "100%", flexWrap: "nowrap" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {viewMode === "2d" ? (
            <Chart2D theme={theme} palette={palette} currentStop={currentStop} stopIndex={stopIndex} />
          ) : (
            <Chart3D theme={theme} palette={palette} currentStop={currentStop} />
          )}
        </div>
        <StatsPanel currentStop={currentStop} stopIndex={stopIndex} theme={theme} palette={palette} />
      </div>
    </div>
  );
}
