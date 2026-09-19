import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import * as THREE from "three";

const THEMES = {
  Modern: ["#6366f1","#06b6d4","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899","#14b8a6","#f97316","#6b7280",
           "#3b82f6","#84cc16","#e11d48","#0ea5e9","#d946ef","#fb923c","#a3e635","#34d399","#f472b6","#60a5fa",
           "#fbbf24","#4ade80","#818cf8","#2dd4bf","#fb7185"],
  Neon:   ["#ff0080","#00f5ff","#39ff14","#ffae00","#ff3131","#ff6bff","#00ff9d","#ff4400","#ff00aa","#00ccff",
           "#ff007f","#7fff00","#ff6600","#00ffff","#ff00ff","#ffff00","#00ff00","#ff0040","#40ff00","#0040ff",
           "#ff4040","#40ffff","#ffff40","#4040ff","#ff40ff"],
  Pastel: ["#a5b4fc","#67e8f9","#6ee7b7","#fde68a","#fca5a5","#c4b5fd","#f9a8d4","#99f6e4","#fdba74","#d1d5db",
           "#bfdbfe","#bbf7d0","#fef08a","#fed7aa","#fecdd3","#ddd6fe","#fbcfe8","#ccfbf1","#fde68a","#e9d5ff",
           "#bae6fd","#d9f99d","#fef9c3","#ffedd5","#ffe4e6"],
  Sunset: ["#ff6b6b","#feca57","#ff9ff3","#48dbfb","#1dd1a1","#f368e0","#ff9f43","#10ac84","#5f27cd","#00d2d3",
           "#ee5a24","#e55039","#f39c12","#d35400","#c0392b","#8e44ad","#2980b9","#27ae60","#16a085","#2c3e50",
           "#e74c3c","#e67e22","#f1c40f","#2ecc71","#1abc9c"],
};

const loadCSV = () =>
  fetch("/alphabet.csv")
    .then(r => r.text())
    .then(text => {
      const rows = d3.csvParse(text);
      const [labelCol, valueCol] = rows.columns;
      return rows
        .map(d => ({
          label: d[labelCol],
          value: +String(d[valueCol]).replace("%", ""),
        }))
        .filter(d => d.label && !isNaN(d.value));
    });

function LegendPanel({ data, palette }) {
  return (
    <div style={{
      background: "#fff",
      border: "1px solid #e2e8f0",
      borderRadius: 8,
      padding: "14px 16px",
      width: 170,
      flexShrink: 0,
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      alignSelf: "flex-start",
      fontFamily: "Inter, system-ui, sans-serif",
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.1em", marginBottom: 10 }}>
        LETTERS
      </div>
      {data.map((d, i) => (
        <div key={d.label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <div style={{
            width: 10, height: 10, borderRadius: 2, flexShrink: 0,
            background: palette[i % palette.length],
          }} />
          <span style={{ color: "#334155", fontSize: 11, flex: 1 }}>{d.label}</span>
        </div>
      ))}
      <div style={{ borderTop: "1px solid #e2e8f0", margin: "12px 0 10px" }} />
      <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.1em", marginBottom: 10 }}>
        FREQUENCY
      </div>
      {data.map((d, i) => (
        <div key={d.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
          <span style={{ color: "#334155", fontSize: 11 }}>{d.label}</span>
          <span style={{ color: palette[i % palette.length], fontSize: 10, fontWeight: 700 }}>
            {d.value.toFixed(4)}
          </span>
        </div>
      ))}
    </div>
  );
}

function Chart2D({ data, theme }) {
  const svgRef  = useRef(null);
  const palette = THEMES[theme];

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    const W = 700, H = 560;
    const margin = { top: 20, right: 24, bottom: 52, left: 44 };
    const iW = W - margin.left - margin.right;
    const iH = H - margin.top  - margin.bottom;
    const maxVal = d3.max(data, d => d.value);

    const x = d3.scaleLinear().domain([0, maxVal * 1.08]).range([0, iW]).nice();
    const y = d3.scaleBand().domain(data.map(d => d.label)).range([0, iH]).padding(0.28);

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox", `0 0 ${W} ${H}`).attr("preserveAspectRatio", "xMidYMid meet");

    svg.append("rect")
      .attr("width", W).attr("height", H)
      .attr("fill", "#f8fafc").attr("rx", 10);

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    g.append("g")
      .selectAll("line")
      .data(x.ticks(8))
      .enter().append("line")
      .attr("x1", d => x(d)).attr("x2", d => x(d))
      .attr("y1", 0).attr("y2", iH)
      .attr("stroke", "#e2e8f0").attr("stroke-dasharray", "4,3");

    const tip = d3.select("body").append("div")
      .style("position", "absolute")
      .style("background", "rgba(15,23,42,0.92)")
      .style("color", "#fff")
      .style("padding", "8px 12px")
      .style("border-radius", "7px")
      .style("font-size", "12px")
      .style("font-family", "Inter,system-ui,sans-serif")
      .style("pointer-events", "none")
      .style("opacity", 0)
      .style("z-index", "9999")
      .style("border", "1px solid #334155");

    g.selectAll(".bar")
      .data(data).enter()
      .append("rect").attr("class", "bar")
      .attr("x", 0)
      .attr("y", d => y(d.label))
      .attr("width",  d => x(d.value))
      .attr("height", y.bandwidth())
      .attr("rx", 4)
      .attr("fill",   (d, i) => palette[i % palette.length])
      .attr("opacity", 0.9)
      .style("cursor", "pointer")
      .on("mouseover", function(event, d) {
        d3.select(this).attr("opacity", 1).attr("filter", "drop-shadow(0 3px 10px rgba(0,0,0,0.2))");
        tip.style("opacity", 1)
          .html(`<b>${d.label}</b><br/>Frequency: <b>${d.value.toFixed(5)}</b>`)
          .style("left", (event.pageX + 14) + "px")
          .style("top",  (event.pageY - 12) + "px");
      })
      .on("mousemove", function(event) {
        tip.style("left", (event.pageX + 14) + "px").style("top", (event.pageY - 12) + "px");
      })
      .on("mouseout", function() {
        d3.select(this).attr("opacity", 0.9).attr("filter", null);
        tip.style("opacity", 0);
      });

    g.selectAll(".val")
      .data(data).enter()
      .append("text").attr("class", "val")
      .filter(d => x(d.value) > 38)
      .attr("x", d => x(d.value) - 7)
      .attr("y", d => y(d.label) + y.bandwidth() / 2)
      .attr("dy", "0.35em").attr("text-anchor", "end")
      .style("fill", "#fff").style("font-size", "10px").style("font-weight", "700")
      .style("pointer-events", "none")
      .text(d => d.value.toFixed(2));

    g.selectAll(".lbl")
      .data(data).enter()
      .append("text").attr("class", "lbl")
      .attr("x", -8)
      .attr("y", d => y(d.label) + y.bandwidth() / 2)
      .attr("dy", "0.35em").attr("text-anchor", "end")
      .style("font-size", "11px").style("font-weight", "700")
      .style("fill", (d, i) => palette[i % palette.length])
      .text(d => d.label);

    g.append("g")
      .attr("transform", `translate(0,${iH})`)
      .call(d3.axisBottom(x).ticks(8).tickFormat(d => d.toFixed(2)))
      .call(ax => {
        ax.select(".domain").style("stroke", "#e2e8f0");
        ax.selectAll("line").style("stroke", "#e2e8f0");
        ax.selectAll("text").style("fill", "#64748b").style("font-size", "10px");
      });

    svg.append("text")
      .attr("x", margin.left + iW / 2).attr("y", H - 16)
      .attr("text-anchor", "middle")
      .style("font-size", "11px").style("fill", "#94a3b8")
      .text("Letter Frequency · alphabet.csv");

    return () => tip.remove();
  }, [data, theme]);

  return (
    <div style={{
      display: "flex", gap: 14, alignItems: "flex-start", width: "100%",
      border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden",
      background: "#fff",
    }}>
      <svg ref={svgRef} style={{ display: "block", flex: 1, minWidth: 0, height: 560 }} />
      <div style={{ padding: "14px 14px 14px 0" }}>
        <LegendPanel data={data} palette={THEMES[theme]} />
      </div>
    </div>
  );
}

function Chart3D({ data, theme }) {
  const mountRef   = useRef(null);
  const overlayRef = useRef(null);
  const palette    = THEMES[theme];

  useEffect(() => {
    if (!mountRef.current || !data.length) return;
    const el = mountRef.current;
    const W  = el.offsetWidth || 700;
    const H  = 560;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f2f5);

    const camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 500);
    camera.position.set(0, 12, 26);
    camera.lookAt(0, 1, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    el.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const sun = new THREE.DirectionalLight(0xffffff, 0.9);
    sun.position.set(10, 20, 14);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -50, right: 50, top: 40, bottom: -40, far: 120 });
    scene.add(sun);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xdde4f0, 0.5));

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(80, 30),
      new THREE.MeshStandardMaterial({ color: 0xe8ecf0, roughness: 1 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const grid = new THREE.GridHelper(80, 40, 0xc0c8d4, 0xd4d8e0);
    grid.position.y = 0.01;
    scene.add(grid);

    const maxVal  = d3.max(data, d => d.value);
    const MAX_H   = 10;
    const spacing = 56 / data.length;
    const barW    = spacing * 0.65;

    const pivot        = new THREE.Group();
    const labelAnchors = [];

    data.forEach((d, i) => {
      const bh  = Math.max((d.value / maxVal) * MAX_H, 0.12);
      const xp  = (i - (data.length - 1) / 2) * spacing;
      const col = new THREE.Color(palette[i % palette.length]);

      const sm = new THREE.Mesh(
        new THREE.BoxGeometry(barW * 1.1, 0.05, barW * 1.1),
        new THREE.MeshBasicMaterial({ color: 0x888888, transparent: true, opacity: 0.13 })
      );
      sm.position.set(xp + 0.05, 0.025, 0.05);
      pivot.add(sm);

      const bar = new THREE.Mesh(
        new THREE.BoxGeometry(barW, bh, barW),
        new THREE.MeshStandardMaterial({
          color: col, roughness: 0.25, metalness: 0.4,
          emissive: col, emissiveIntensity: 0.12,
        })
      );
      bar.position.set(xp, bh / 2, 0);
      bar.castShadow = true;
      bar.receiveShadow = true;
      pivot.add(bar);

      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(barW, bh, barW)),
        new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 })
      );
      edges.position.set(xp, bh / 2, 0);
      pivot.add(edges);

      const capC = col.clone().lerp(new THREE.Color(0xffffff), 0.35);
      const cap = new THREE.Mesh(
        new THREE.BoxGeometry(barW, 0.08, barW),
        new THREE.MeshStandardMaterial({
          color: capC, emissive: capC,
          emissiveIntensity: 1.4, roughness: 0.02, metalness: 1,
        })
      );
      cap.position.set(xp, bh + 0.04, 0);
      pivot.add(cap);

      labelAnchors.push({ x: xp, y: bh + 0.7, z: 0, text: d.value.toFixed(3), col: `#${col.getHexString()}`, type: "value" });
      labelAnchors.push({ x: xp, y: -0.7,      z: 0, text: d.label,            col: `#${col.getHexString()}`, type: "letter" });
    });

    scene.add(pivot);

    const toScreen = (x3, y3, z3) => {
      const v = new THREE.Vector3(x3, y3, z3).project(camera);
      return { sx: (v.x * 0.5 + 0.5) * W, sy: (-v.y * 0.5 + 0.5) * H, behind: v.z > 1 };
    };

    let isDragging = false, prevX = 0, prevY = 0, rotX = 0.32, rotY = 0, autoSpin = true;
    pivot.rotation.x = rotX;
    pivot.rotation.y = rotY;

    const onDown = e => {
      isDragging = true; autoSpin = false;
      prevX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
      prevY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
      renderer.domElement.style.cursor = "grabbing";
    };
    const onUp   = () => { isDragging = false; renderer.domElement.style.cursor = "grab"; };
    const onMove = e => {
      if (!isDragging) return;
      const cx = e.clientX ?? e.touches?.[0]?.clientX ?? prevX;
      const cy = e.clientY ?? e.touches?.[0]?.clientY ?? prevY;
      rotY += (cx - prevX) * 0.006;
      rotX  = Math.max(-0.75, Math.min(0.95, rotX + (cy - prevY) * 0.004));
      prevX = cx; prevY = cy;
    };

    renderer.domElement.addEventListener("mousedown",  onDown);
    window.addEventListener("mouseup",   onUp);
    window.addEventListener("mousemove", onMove);
    renderer.domElement.addEventListener("touchstart", onDown, { passive: true });
    renderer.domElement.addEventListener("touchend",   onUp);
    renderer.domElement.addEventListener("touchmove",  onMove, { passive: true });
    renderer.domElement.style.cursor = "grab";

    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (autoSpin) rotY += 0.0025;
      pivot.rotation.y = rotY;
      pivot.rotation.x = rotX;
      camera.updateMatrixWorld();

      if (overlayRef.current) {
        overlayRef.current.querySelectorAll(".ol3d").forEach((div, i) => {
          const a  = labelAnchors[i];
          const rv = new THREE.Vector3(a.x, a.y, a.z).applyEuler(pivot.rotation);
          const { sx, sy, behind } = toScreen(rv.x, rv.y, rv.z);
          div.style.left    = `${sx}px`;
          div.style.top     = `${sy}px`;
          div.style.opacity = behind ? "0" : "1";
        });
      }
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      renderer.domElement.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup",   onUp);
      window.removeEventListener("mousemove", onMove);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [data, theme]);

  const overlayLabels = data.flatMap((d, i) => {
    const col = palette[i % palette.length];
    return [
      { text: d.value.toFixed(3), col, type: "value"  },
      { text: d.label,            col, type: "letter" },
    ];
  });

  return (
    <div style={{
      display: "flex", gap: 14, alignItems: "flex-start", width: "100%",
      border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden",
      background: "#fff",
    }}>
      <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
        <div ref={mountRef} style={{ width: "100%", height: 560, cursor: "grab" }} />

        <div ref={overlayRef} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {overlayLabels.map((a, i) => (
            <div key={i} className="ol3d" style={{
              position:      "absolute",
              transform:     a.type === "letter" ? "translate(-50%, 0%)" : "translate(-50%, -100%)",
              background:    "rgba(255,255,255,0.94)",
              color:         a.col,
              fontSize:      a.type === "letter" ? 10 : 9,
              fontWeight:    "bold",
              fontFamily:    "Inter,system-ui,sans-serif",
              padding:       "2px 6px",
              borderRadius:  4,
              border:        `1px solid ${a.col}60`,
              whiteSpace:    "nowrap",
              pointerEvents: "none",
              boxShadow:     "0 1px 4px rgba(0,0,0,0.1)",
              transition:    "opacity 0.08s",
            }}>
              {a.text}
            </div>
          ))}
        </div>

        <div style={{
          padding: "8px 16px", background: "#f8fafc",
          borderTop: "1px solid #e2e8f0", fontSize: 11, color: "#94a3b8",
          fontFamily: "Inter,system-ui,sans-serif",
        }}>
          💡 Drag to rotate · auto-spins · Each bar = one letter · Colors = theme
        </div>
      </div>

      <div style={{ padding: "14px 14px 14px 0" }}>
        <LegendPanel data={data} palette={THEMES[theme]} />
      </div>
    </div>
  );
}

const ProjectCompletionBarChart = () => {
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [view,    setView]    = useState("2D");
  const [theme,   setTheme]   = useState("Modern");

  useEffect(() => {
    loadCSV()
      .then(d  => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const ddStyle = {
    padding: "5px 12px", borderRadius: 7, border: "1px solid #e2e8f0",
    background: "#fff", color: "#334155", fontWeight: "500",
    cursor: "pointer", fontSize: 13, outline: "none",
    fontFamily: "Inter,system-ui,sans-serif",
  };

  return (
    <div style={{
      background: "#ffffff", borderRadius: 12, padding: "20px 24px 32px",
      width: "100%", boxSizing: "border-box", fontFamily: "Inter,system-ui,sans-serif",
    }}>
      <div style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: "#1e293b" }}>
          Project Completion Bar Chart
        </div>
        <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 3 }}>
          Letter frequency · alphabet.csv
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, alignItems: "flex-end", marginTop: 14, marginBottom: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>View</label>
          <select value={view} onChange={e => setView(e.target.value)} style={ddStyle}>
            <option value="2D">2D</option>
            <option value="3D">3D</option>
          </select>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>Color Theme</label>
          <select value={theme} onChange={e => setTheme(e.target.value)} style={ddStyle}>
            {Object.keys(THEMES).map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
      </div>

      <div style={{ minHeight: 560 }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 560, color: "#94a3b8", fontSize: 15 }}>
            Loading alphabet.csv…
          </div>
        ) : view === "2D" ? (
          <Chart2D key={`2d-${theme}`} data={data} theme={theme} />
        ) : (
          <Chart3D key={`3d-${theme}`} data={data} theme={theme} />
        )}
      </div>
    </div>
  );
};

export default ProjectCompletionBarChart;