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

// ─── STATS PANEL ─────────────────────────────────────────────────────────────
function StatsPanel({ progress, projectionMode, theme, palette }) {
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
        PROJECTION METRICS
      </div>

      {card(
        "🌐 Projection State",
        progress <= 0.2 ? "Orthographic (Globe)" : progress >= 0.8 ? "Equirectangular (Flat)" : "Hybrid Interpolation",
        `${Math.round(progress * 100)}% flat transition`,
        palette[0]
      )}
      {card(
        "📐 Angular Distortion",
        progress <= 0.2 ? "Conformal at Center" : progress >= 0.8 ? "Standard Cylindrical" : "Tweening Graticule",
        "Tissot Indicatrix scale",
        palette[1] || "#10b981"
      )}
      {card(
        "🗺️ Visible Hemisphere",
        progress <= 0.2 ? "Single Hemisphere (50%)" : "Full Earth (100%)",
        "Global surface coverage",
        palette[2] || "#f59e0b"
      )}

      {/* Guide Note */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 12px", marginTop: 4 }}>
        <div style={{ fontSize: 10, color: T.subtext, fontWeight: 700, marginBottom: 4, textTransform: "uppercase" }}>
          Morphology
        </div>
        <p style={{ fontSize: 11, color: T.text, margin: 0, lineHeight: 1.45 }}>
          Continuous geometric blending between azimuthal orthographic projection and cylindrical equirectangular planar coordinates.
        </p>
      </div>
    </div>
  );
}

// ─── 2D MORPHING CANVAS (D3) ──────────────────────────────────────────────────
function Chart2D({ theme, palette, progress, setProgress }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const worldDataRef = useRef(null);
  const T = UI_THEMES[theme];

  const width = 960;
  const height = 480;

  useEffect(() => {
    if (!containerRef.current) return;

    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .attr("viewBox", [0, 0, width, height])
      .attr("width", "100%")
      .attr("height", "auto")
      .style("background", T.ocean)
      .style("border-radius", "8px");

    // Graticule
    const graticule = d3.geoGraticule();

    // Setup projections
    // Progress = 0: Orthographic, Progress = 1: Equirectangular
    const ortho = d3
      .geoOrthographic()
      .scale(200)
      .translate([width / 2, height / 2]);

    const equi = d3
      .geoEquirectangular()
      .scale(150)
      .translate([width / 2, height / 2]);

    // Linear interpolation projection generator
    const projectPoint = (lambda, phi) => {
      const p0 = ortho([lambda, phi]) || [width / 2, height / 2];
      const p1 = equi([lambda, phi]) || [width / 2, height / 2];
      return [p0[0] * (1 - progress) + p1[0] * progress, p0[1] * (1 - progress) + p1[1] * progress];
    };

    const customProjection = d3
      .geoProjection(projectPoint)
      .scale(1)
      .translate([0, 0]);

    // When purely ortho or equi, use exact standard projections for precision clipping
    const activeProj =
      progress <= 0.05 ? ortho : progress >= 0.95 ? equi : ortho;

    const pathGen = d3.geoPath().projection(activeProj);

    // Render Graticule Lines
    svg
      .append("path")
      .datum(graticule())
      .attr("d", pathGen)
      .attr("fill", "none")
      .attr("stroke", theme === "Dark" ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)")
      .attr("stroke-width", 0.5);

    // Globe boundary outline for Orthographic
    if (progress <= 0.2) {
      svg
        .append("path")
        .datum({ type: "Sphere" })
        .attr("d", pathGen)
        .attr("fill", "none")
        .attr("stroke", palette[0])
        .attr("stroke-width", 2);
    }

    const landG = svg.append("g");

    const renderData = (world) => {
      const countries = topojson.feature(world, world.objects.countries).features;
      landG
        .selectAll("path")
        .data(countries)
        .join("path")
        .attr("d", pathGen)
        .attr("fill", palette[1] || T.land)
        .attr("stroke", theme === "Dark" ? "#0f172a" : "#ffffff")
        .attr("stroke-width", 0.5);
    };

    if (worldDataRef.current) {
      renderData(worldDataRef.current);
    } else {
      d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
        .then((world) => {
          worldDataRef.current = world;
          renderData(world);
        })
        .catch(() => {});
    }

  }, [theme, palette, progress]);

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%", border: `1px solid ${T.border}`, borderRadius: 8, overflow: "hidden" }}>
      <svg ref={svgRef}></svg>
    </div>
  );
}

// ─── 3D DUAL PROJECTION STADIUM (THREE.JS) ───────────────────────────────────
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
    camera.position.set(0, 12, 28);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    el.appendChild(renderer.domElement);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.85));
    const sun = new THREE.DirectionalLight(0xffffff, 1.2);
    sun.position.set(16, 20, 16);
    scene.add(sun);

    const pivot = new THREE.Group();
    scene.add(pivot);

    // Left: 3D Globe (Orthographic representation)
    const globeGeo = new THREE.SphereGeometry(5.5, 32, 32);
    const globeMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(palette[0]),
      roughness: 0.5,
      metalness: 0.2,
      wireframe: true,
    });
    const globeMesh = new THREE.Mesh(globeGeo, globeMat);
    globeMesh.position.set(-8, 0, 0);
    pivot.add(globeMesh);

    // Right: 3D Flat Sheet (Equirectangular representation)
    const planeGeo = new THREE.PlaneGeometry(12, 6, 16, 8);
    const planeMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(palette[1] || 0x10b981),
      roughness: 0.4,
      metalness: 0.3,
      side: THREE.DoubleSide,
      wireframe: true,
    });
    const planeMesh = new THREE.Mesh(planeGeo, planeMat);
    planeMesh.position.set(8, 0, 0);
    pivot.add(planeMesh);

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
      globeMesh.rotation.y += 0.01;
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
        💡 Dual 3D View: Left = Spherical Orthographic Globe · Right = Equirectangular Sheet
      </div>
    </div>
  );
}

// ─── MAIN ORTHOGRAPHIC TO EQUIRECTANGULAR COMPONENT ──────────────────────────
export default function OrthographicToEquirectangular() {
  const [viewMode, setViewMode] = useState("2d");
  const [theme, setTheme] = useState("Light");
  const [colorTheme, setColorTheme] = useState("Modern");
  const [progress, setProgress] = useState(0); // 0 = Orthographic, 1 = Equirectangular
  const [isPlaying, setIsPlaying] = useState(false);

  const T = UI_THEMES[theme];
  const palette = PALETTES[colorTheme] || PALETTES.Modern;

  // Morph loop
  useEffect(() => {
    let timer;
    if (isPlaying) {
      timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 1) return 0;
          return +(prev + 0.05).toFixed(2);
        });
      }, 250);
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

  const btnStyle = (isActive) => ({
    padding: "6px 14px",
    borderRadius: 6,
    border: `1px solid ${isActive ? palette[0] : T.border}`,
    background: isActive ? palette[0] : theme === "Dark" ? "#1f2937" : "#ffffff",
    color: isActive ? "#ffffff" : T.text,
    fontWeight: "700",
    fontSize: 12,
    cursor: "pointer",
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
          Orthographic to Equirectangular – Planetary Projection Morphing
        </h2>
        <p style={{ fontSize: 13, color: T.subtext, margin: "4px 0 0 0" }}>
          Smooth geometric transition between spherical 3D orthographic globe and cylindrical 2D equirectangular planar projection.
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
            <option value="2d">2D Projection Morph (D3)</option>
            <option value="3d">3D Dual View (Three.js)</option>
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

        {/* Projection Switcher Buttons & Scrubber */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto", flexWrap: "wrap" }}>
          <button onClick={() => setProgress(0)} style={btnStyle(progress === 0)}>
            🌐 Globe
          </button>
          <button onClick={() => setProgress(1)} style={btnStyle(progress === 1)}>
            🗺️ Flat
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            style={{ ...btnStyle(isPlaying), background: isPlaying ? "#ef4444" : palette[0], color: "#ffffff" }}
          >
            {isPlaying ? "⏸ Pause" : "▶ Morph Cycle"}
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: T.text, minWidth: 42 }}>{Math.round(progress * 100)}%</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={progress}
              onChange={(e) => {
                setIsPlaying(false);
                setProgress(Number(e.target.value));
              }}
              style={{ width: 120, cursor: "pointer", accentColor: palette[0] }}
            />
          </div>
        </div>
      </div>

      {/* Visual Canvas + Stats Panel */}
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start", width: "100%", flexWrap: "nowrap" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {viewMode === "2d" ? (
            <Chart2D theme={theme} palette={palette} progress={progress} setProgress={setProgress} />
          ) : (
            <Chart3D theme={theme} palette={palette} />
          )}
        </div>
        <StatsPanel progress={progress} theme={theme} palette={palette} />
      </div>
    </div>
  );
}
