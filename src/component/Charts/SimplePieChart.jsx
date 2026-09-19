import React, { useEffect, useRef, useState, Suspense } from "react";
import * as d3 from "d3";
import * as THREE from "three";

const THEMES = {
  Modern:  ["#6366f1","#06b6d4","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899","#14b8a6","#f97316","#6b7280"],
  Neon:    ["#ff0080","#00f5ff","#39ff14","#ffae00","#ff3131","#ff6bff","#00ff9d","#ff4400","#ff00aa","#00ccff"],
  Pastel:  ["#a5b4fc","#67e8f9","#6ee7b7","#fde68a","#fca5a5","#c4b5fd","#f9a8d4","#99f6e4","#fdba74","#d1d5db"],
  Sunset:  ["#ff6b6b","#feca57","#ff9ff3","#48dbfb","#1dd1a1","#f368e0","#ff9f43","#10ac84","#5f27cd","#00d2d3"],
  Ocean:   ["#03045e","#0077b6","#00b4d8","#90e0ef","#caf0f8","#023e8a","#0096c7","#48cae4","#ade8f4","#7ec8e3"],
  Galaxy:  ["#4a306d","#7b2cbf","#9d4edd","#c77dff","#e0aaff","#3c1e4d","#5e2e7d","#803ead","#a24edd","#c45eed"],
  Forest:  ["#1b4332","#2d6a4f","#40916c","#52b788","#74c69d","#95d5b2","#b7e4c7","#d8f3dc","#a7c957","#6a994e"],
  Autumn:  ["#7f4f24","#936639","#a68a64","#b6ad90","#c2c5aa","#e63946","#c1121f","#9d0208","#6a040f","#370617"],
  Candy:   ["#ff006e","#fb5607","#ffbe0b","#8338ec","#3a86ff","#06d6a0","#ef476f","#ffd166","#26547c","#05c7f2"],
  Earth:   ["#6b4f3c","#8b6914","#a07850","#b8975a","#c9a96e","#3a7d44","#2d6a4f","#1b4332","#52796f","#84a98c"],
};

// ─── 2D Chart ────────────────────────────────────────────────────────────────
function Chart2D({ data, theme }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;
    const W = svgRef.current.parentElement.offsetWidth || 800;
    const H = 450;
    const R = Math.min(W, H) / 3.2;
    // Each category gets its own distinct color from the theme palette
    const colors = d3.scaleOrdinal()
      .domain(data.map(d => d.category))
      .range(THEMES[theme]);

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("width", W).attr("height", H);

    const g = svg.append("g").attr("transform", `translate(${W / 2 - 100},${H / 2})`);
    const pie = d3.pie().value(d => d.value).padAngle(0.02);
    const arc = d3.arc().innerRadius(0).outerRadius(R).cornerRadius(5);
    const labelArc = d3.arc().innerRadius(R * 0.62).outerRadius(R * 0.62);
    const total = d3.sum(data, d => d.value);

    pie(data).forEach(d => {
      g.append("path").attr("d", arc(d))
        .attr("fill", colors(d.data.category))
        .attr("stroke", "#fff").attr("stroke-width", 2)
        .style("cursor", "pointer")
        .on("mouseover", function () { d3.select(this).transition().duration(200).attr("transform", "scale(1.03)"); })
        .on("mouseout",  function () { d3.select(this).transition().duration(200).attr("transform", "scale(1)"); });

      const pct = (d.data.value / total) * 100;
      if (pct > 5) {
        const [lx, ly] = labelArc.centroid(d);
        g.append("text").attr("transform", `translate(${lx},${ly})`)
          .attr("text-anchor", "middle").attr("dominant-baseline", "middle")
          .attr("fill", "#fff").style("font-size", "12px").style("font-weight", "bold")
          .text(`${pct.toFixed(1)}%`);
      }
    });

    // Legend
    const legendX = W / 2 + R + 30;
    const legendY = H / 2 - (data.length * 28 + 36) / 2;
    const legend = svg.append("g").attr("transform", `translate(${legendX},${legendY})`);
    legend.append("rect").attr("width", 190).attr("height", data.length * 28 + 36)
      .attr("fill", "#f8fafc").attr("stroke", "#e2e8f0").attr("stroke-width", 1).attr("rx", 8);
    legend.append("text").attr("x", 14).attr("y", 24).attr("fill", "#64748b")
      .style("font-size", "11px").style("font-weight", "bold").style("letter-spacing", "0.08em")
      .text("CATEGORIES");

    data.forEach((d, i) => {
      const row = legend.append("g").attr("transform", `translate(14,${40 + i * 28})`);
      row.append("rect").attr("width", 12).attr("height", 12).attr("rx", 3)
        .attr("fill", colors(d.category));
      row.append("text").attr("x", 20).attr("y", 10).attr("fill", "#334155")
        .style("font-size", "12px")
        .text(d.category.length > 17 ? d.category.slice(0, 15) + "…" : d.category);
      row.append("text").attr("x", 174).attr("y", 10).attr("text-anchor", "end")
        .attr("fill", colors(d.category)).style("font-size", "12px").style("font-weight", "bold")
        .text(`${((d.value / total) * 100).toFixed(1)}%`);
    });
  }, [data, theme]);

  return <svg ref={svgRef} style={{ display: "block", background: "transparent" }} />;
}

// ─── 3D Chart ────────────────────────────────────────────────────────────────
function Chart3D({ data, theme }) {
  const mountRef   = useRef(null);
  const overlayRef = useRef(null);
  const stateRef   = useRef({ rotY: 0, autoRotate: true, isDragging: false, prevX: 0 });

  useEffect(() => {
    if (!mountRef.current || !data.length) return;
    const el     = mountRef.current;
    const W      = el.offsetWidth || 800;
    const H      = 450;
    // Each category gets its own distinct color
    const palette = THEMES[theme];
    const total   = data.reduce((s, d) => s + d.value, 0);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);

    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
    camera.position.set(0, 4, 7);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    el.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const dir = new THREE.DirectionalLight(0xffffff, 1.0);
    dir.position.set(4, 8, 6);
    scene.add(dir);
    const fill = new THREE.DirectionalLight(0xaabbcc, 0.4);
    fill.position.set(-4, 4, -4);
    scene.add(fill);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xdddddd, 0.5));

    const grid = new THREE.GridHelper(10, 24, 0xcccccc, 0xe2e8f0);
    grid.position.y = -0.6;
    scene.add(grid);

    const pie  = d3.pie().value(d => d.value).sort(null);
    const arcs = pie(data);
    const DEPTH = 0.5, RADIUS = 2.5, SEG = 64;
    const label3DPositions = [];

    arcs.forEach((arc, i) => {
      const spanAngle = arc.endAngle - arc.startAngle;
      const midAngle  = arc.startAngle + spanAngle / 2 - Math.PI / 2;
      // Each slice gets a unique color from the palette
      const sliceColor = palette[i % palette.length];

      const geo = new THREE.CylinderGeometry(RADIUS, RADIUS, DEPTH, SEG, 1, false, arc.startAngle - Math.PI / 2, spanAngle);
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(sliceColor),
        roughness: 0.3, metalness: 0.12,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(Math.cos(midAngle) * 0.05, 0, Math.sin(midAngle) * 0.05);
      scene.add(mesh);

      const edges = new THREE.EdgesGeometry(geo);
      const line  = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xffffff }));
      line.position.copy(mesh.position);
      scene.add(line);

      label3DPositions.push(new THREE.Vector3(
        Math.cos(midAngle) * RADIUS * 0.68 + mesh.position.x,
        DEPTH / 2 + 0.18,
        Math.sin(midAngle) * RADIUS * 0.68 + mesh.position.z,
      ));
    });

    const toScreen = (v3) => {
      const v = v3.clone().project(camera);
      return { x: (v.x * 0.5 + 0.5) * W, y: (-v.y * 0.5 + 0.5) * H, behind: v.z > 1 };
    };

    const s = stateRef.current;
    s.rotY = 0; s.autoRotate = true; s.isDragging = false;
    const onDown = e => { s.isDragging = true; s.prevX = e.clientX; s.autoRotate = false; };
    const onUp   = () => { s.isDragging = false; };
    const onMove = e => { if (!s.isDragging) return; s.rotY += (e.clientX - s.prevX) * 0.008; s.prevX = e.clientX; };
    renderer.domElement.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("mousemove", onMove);

    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (s.autoRotate) s.rotY += 0.005;
      camera.position.x = Math.sin(s.rotY) * 7;
      camera.position.z = Math.cos(s.rotY) * 7;
      camera.lookAt(0, 0, 0);
      camera.updateMatrixWorld();

      if (overlayRef.current) {
        overlayRef.current.querySelectorAll(".sl").forEach((el, i) => {
          const { x, y, behind } = toScreen(label3DPositions[i]);
          const pct = (data[i].value / total) * 100;
          el.style.left    = `${x}px`;
          el.style.top     = `${y}px`;
          el.style.opacity = behind || pct < 4 ? "0" : "1";
        });
      }
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
  }, [data, theme]);

  const palette = THEMES[theme];
  const total   = data.reduce((s, d) => s + d.value, 0);

  return (
    <div style={{ position: "relative", width: "100%", height: 450 }}>
      <div ref={mountRef} style={{ width: "100%", height: 450 }} />

      {/* % labels projected onto slices */}
      <div ref={overlayRef} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {data.map((d, i) => (
          <div key={i} className="sl" style={{
            position: "absolute", transform: "translate(-50%,-50%)",
            background: "rgba(15,23,42,0.82)", color: "#fff",
            fontSize: 12, fontWeight: "bold", padding: "3px 8px",
            borderRadius: 4, border: `1px solid ${palette[i % palette.length]}55`,
            whiteSpace: "nowrap", transition: "opacity 0.12s", pointerEvents: "none",
          }}>
            {((d.value / total) * 100).toFixed(1)}%
          </div>
        ))}
      </div>

      {/* Legend — each category its own color */}
      <div style={{
        position: "absolute", top: 12, right: 12,
        background: "#ffffff", border: "1px solid #e2e8f0",
        borderRadius: 8, padding: "12px 14px", minWidth: 175,
        boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
      }}>
        <div style={{ fontSize: 11, fontWeight: "bold", color: "#94a3b8", letterSpacing: "0.08em", marginBottom: 10 }}>
          CATEGORIES
        </div>
        {data.map((d, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
            <div style={{
              width: 11, height: 11, borderRadius: 3, flexShrink: 0,
              background: palette[i % palette.length],   // ← unique color per category
            }} />
            <span style={{ color: "#334155", fontSize: 12, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {d.category}
            </span>
            <span style={{ color: palette[i % palette.length], fontSize: 12, fontWeight: "bold", minWidth: 40, textAlign: "right" }}>
              {((d.value / total) * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>

      <div style={{ position: "absolute", bottom: 10, left: 12, color: "#94a3b8", fontSize: 11 }}>
        💡 Drag to rotate · auto-spins until you interact
      </div>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────
export default function PieChart() {
  const [data,     setData]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [theme,    setTheme]    = useState("Modern");
  const [viewMode, setViewMode] = useState("2d");

  useEffect(() => {
    fetch("https://fakestoreapi.com/products")
      .then(r => r.json())
      .then(products => {
        const map = {};
        products.forEach(p => { map[p.category] = (map[p.category] || 0) + 1; });
        setData(Object.entries(map).map(([category, value]) => ({ category, value })));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const dropdownStyle = {
    padding: "5px 10px", borderRadius: 6,
    border: "1px solid #e2e8f0", background: "#fff",
    color: "#334155", fontWeight: "500", cursor: "pointer",
    fontSize: 12, outline: "none",
  };

  return (
    <div style={{
      background: "#ffffff",
      borderRadius: 12,
      padding: "20px 24px 32px 24px",
      width: "100%",
      boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
      color: "#1e293b",
      boxSizing: "border-box",
    }}>
      {/* Title + subtitle */}
      <div style={{ marginBottom: 4 }}>
        <div style={{ fontSize: 16, fontWeight: "bold", color: "#1e293b" }}>
          Pie Chart
        </div>
      </div>

      {/* Controls — two dropdowns left-aligned below title */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 12, marginBottom: 20 }}>

        {/* View dropdown — 2D / 3D */}
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <label style={{ fontSize: 11, color: "#94a3b8", fontWeight: "600" }}>View</label>
          <select value={viewMode} onChange={e => setViewMode(e.target.value)} style={dropdownStyle}>
            <option value="2d">2D</option>
            <option value="3d">3D</option>
          </select>
        </div>

        {/* Theme dropdown — 10 color themes */}
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <label style={{ fontSize: 11, color: "#94a3b8", fontWeight: "600" }}>Color Theme</label>
          <select value={theme} onChange={e => setTheme(e.target.value)} style={dropdownStyle}>
            {Object.keys(THEMES).map(k => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </div>

      </div>

      {/* Chart area */}
      <div style={{ width: "100%", minHeight: 450 }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 450, color: "#94a3b8", fontSize: 15 }}>
            Loading…
          </div>
        ) : viewMode === "2d" ? (
          <Chart2D data={data} theme={theme} />
        ) : (
          <Suspense fallback={
            <div style={{ color: "#94a3b8", height: 450, display: "flex", alignItems: "center", justifyContent: "center" }}>
              Initialising 3D…
            </div>
          }>
            <Chart3D data={data} theme={theme} />
          </Suspense>
        )}
      </div>
    </div>
  );
}