import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import * as THREE from "three";

const THEMES = {
  Modern:  ["#6366f1","#06b6d4","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899","#14b8a6","#f97316","#6b7280"],
  Neon:    ["#ff0080","#00f5ff","#39ff14","#ffae00","#ff3131","#ff6bff","#00ff9d","#ff4400","#ff00aa","#00ccff"],
  Pastel:  ["#a5b4fc","#67e8f9","#6ee7b7","#fde68a","#fca5a5","#c4b5fd","#f9a8d4","#99f6e4","#fdba74","#d1d5db"],
  Sunset:  ["#ff6b6b","#feca57","#ff9ff3","#48dbfb","#1dd1a1","#f368e0","#ff9f43","#10ac84","#5f27cd","#00d2d3"],
  Ocean:   ["#03045e","#0077b6","#00b4d8","#90e0ef","#023e8a","#0096c7","#48cae4","#ade8f4","#caf0f8","#7ec8e3"],
  Galaxy:  ["#4a306d","#7b2cbf","#9d4edd","#c77dff","#e0aaff","#3c1e4d","#5e2e7d","#803ead","#a24edd","#c45eed"],
  Forest:  ["#1b4332","#2d6a4f","#40916c","#52b788","#74c69d","#95d5b2","#b7e4c7","#a7c957","#6a994e","#386641"],
  Autumn:  ["#7f4f24","#936639","#a68a64","#c2c5aa","#e63946","#c1121f","#9d0208","#6a040f","#370617","#b5838d"],
  Candy:   ["#ff006e","#fb5607","#ffbe0b","#8338ec","#3a86ff","#06d6a0","#ef476f","#ffd166","#26547c","#05c7f2"],
  Earth:   ["#6b4f3c","#8b6914","#a07850","#b8975a","#c9a96e","#3a7d44","#2d6a4f","#1b4332","#52796f","#84a98c"],
};

const SAMPLE_DATA = [
  { status: "Completed",   count: 122 },
  { status: "In Progress", count: 98  },
  { status: "Pending",     count: 76  },
  { status: "In Review",   count: 54  },
  { status: "On Hold",     count: 43  },
  { status: "Cancelled",   count: 31  },
  { status: "Blocked",     count: 19  },
];

// ─── Shared Legend ────────────────────────────────────────────────────────────
function LegendHTML({ data, palette }) {
  const color = d3.scaleOrdinal().domain(data.map(d => d.status)).range(palette);
  return (
    <div style={{
      background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8,
      padding: "12px 14px", width: 150, flexShrink: 0,
      boxShadow: "0 1px 4px rgba(0,0,0,0.07)", alignSelf: "flex-start",
    }}>
      <div style={{ fontSize: 10, fontWeight: "bold", color: "#94a3b8", letterSpacing: "0.08em", marginBottom: 8 }}>
        STATUS
      </div>
      {data.map(d => (
        <div key={d.status} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, flexShrink: 0, background: color(d.status) }} />
          <span style={{ color: "#334155", fontSize: 11, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {d.status}
          </span>
          <span style={{ color: color(d.status), fontSize: 10, fontWeight: "bold" }}>{d.count}</span>
        </div>
      ))}
      <div style={{ borderTop: "1px solid #e2e8f0", marginTop: 8, paddingTop: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 10, color: "#94a3b8" }}>Total</span>
          <span style={{ fontSize: 11, fontWeight: "bold", color: "#334155" }}>
            {data.reduce((s, d) => s + d.count, 0)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── 2D Chart ─────────────────────────────────────────────────────────────────
function Chart2D({ data, theme }) {
  const svgRef  = useRef(null);
  const palette = THEMES[theme];
  const color   = d3.scaleOrdinal().domain(data.map(d => d.status)).range(palette);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    const W = 660;
    // ── FIXED: tighter row height + more padding so bars are slim ──
    const rowH  = 34;
    const H     = data.length * rowH + 80;
    const margin = { top: 16, right: 65, bottom: 36, left: 115 };
    const cW = W - margin.left - margin.right;
    const cH = H - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox", `0 0 ${W} ${H}`).attr("preserveAspectRatio", "xMidYMid meet");
    svg.append("rect").attr("width", W).attr("height", H).attr("fill", "#f8fafc").attr("rx", 8);

    const xScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.count) * 1.15]).range([0, cW]).nice();

    // ── FIXED: higher padding = thinner bars ──
    const yScale = d3.scaleBand()
      .domain(data.map(d => d.status)).range([0, cH]).padding(0.58);

    const chart = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    // Grid
    chart.selectAll(".gx").data(xScale.ticks(5)).enter().append("line")
      .attr("x1", d => xScale(d)).attr("x2", d => xScale(d)).attr("y1", 0).attr("y2", cH)
      .attr("stroke", "#e2e8f0").attr("stroke-dasharray", "4,3").attr("stroke-width", 1);

    const tooltip = d3.select("body").append("div")
      .style("position", "absolute").style("background", "rgba(15,23,42,0.92)")
      .style("color", "#fff").style("padding", "7px 11px").style("border-radius", "6px")
      .style("font-size", "12px").style("pointer-events", "none").style("opacity", 0)
      .style("border", "1px solid #334155").style("z-index", "9999");

    const defs = svg.append("defs");

    data.forEach((d, i) => {
      const col    = color(d.status);
      const gradId = `hbg2d-${i}-${theme}`;
      const gr     = defs.append("linearGradient").attr("id", gradId).attr("x1", "0%").attr("x2", "100%");
      gr.append("stop").attr("offset", "0%").attr("stop-color", d3.color(col).brighter(0.4).formatHex()).attr("stop-opacity", 0.95);
      gr.append("stop").attr("offset", "100%").attr("stop-color", d3.color(col).darker(0.3).formatHex()).attr("stop-opacity", 0.95);

      const g = chart.append("g");
      const bw = yScale.bandwidth();
      const by = yScale(d.status);

      // Shadow — very subtle, shifted by half bar height
      g.append("rect")
        .attr("x", 2).attr("y", by + 2)
        .attr("width", xScale(d.count)).attr("height", bw)
        .attr("fill", d3.color(col).darker(0.8)).attr("rx", 3).attr("opacity", 0.12);

      // Bar
      g.append("rect")
        .attr("x", 0).attr("y", by)
        .attr("width", 0).attr("height", bw)
        .attr("fill", `url(#${gradId})`).attr("rx", 3).attr("opacity", 0.92)
        .style("cursor", "pointer")
        .on("mouseover", function (event) {
          d3.select(this).attr("opacity", 1).attr("stroke", "#fff").attr("stroke-width", 1);
          const pct = ((d.count / data.reduce((s, x) => s + x.count, 0)) * 100).toFixed(1);
          tooltip.style("opacity", 1)
            .html(`<b style="color:${col}">${d.status}</b><br/>Count: <b>${d.count}</b><br/>Share: ${pct}%`)
            .style("left", (event.pageX + 12) + "px").style("top", (event.pageY - 10) + "px");
        })
        .on("mouseout", function () {
          d3.select(this).attr("opacity", 0.92).attr("stroke", "none");
          tooltip.style("opacity", 0);
        })
        .transition().duration(700).delay(i * 60)
        .attr("width", xScale(d.count));

      // Value label
      g.append("text")
        .attr("x", xScale(d.count) + 6)
        .attr("y", by + bw / 2)
        .attr("dy", "0.35em").style("font-size", "11px").style("font-weight", "700").style("fill", col)
        .style("pointer-events", "none")
        .text(d.count);
    });

    // Y axis
    chart.append("g").call(d3.axisLeft(yScale).tickSize(0))
      .call(g => {
        g.select(".domain").remove();
        g.selectAll("text").style("font-size", "11px").style("font-weight", "600").style("fill", "#334155");
      });

    // X axis
    chart.append("g").attr("transform", `translate(0,${cH})`)
      .call(d3.axisBottom(xScale).ticks(5))
      .call(g => {
        g.select(".domain").style("stroke", "#e2e8f0");
        g.selectAll("text").style("fill", "#94a3b8").style("font-size", "10px");
      });

    svg.append("text")
      .attr("transform", `translate(${margin.left + cW / 2},${H - 4})`)
      .attr("text-anchor", "middle").style("font-size", "11px").style("fill", "#94a3b8")
      .text("Number of Tasks");

    return () => tooltip.remove();
  }, [data, theme]);

  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start", width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden" }}>
      <svg ref={svgRef} style={{ display: "block", flex: 1, minWidth: 0 }} />
      <div style={{ padding: "12px 12px 12px 0" }}>
        <LegendHTML data={data} palette={THEMES[theme]} />
      </div>
    </div>
  );
}

// ─── 3D Chart ─────────────────────────────────────────────────────────────────
function Chart3D({ data, theme }) {
  const mountRef   = useRef(null);
  const overlayRef = useRef(null);
  const palette    = THEMES[theme];
  const color      = d3.scaleOrdinal().domain(data.map(d => d.status)).range(palette);

  useEffect(() => {
    if (!mountRef.current || !data.length) return;
    const el       = mountRef.current;
    const W        = el.offsetWidth || 660;
    // ── FIXED: taller canvas so tallest bar (Completed) is never clipped ──
    const H        = 560;
    const maxCount = d3.max(data, d => d.count);

    const scene  = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);

    // ── FIXED: camera higher + further back for full view ──
    const camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 200);
    camera.position.set(0, 12, 20);
    camera.lookAt(0, 3, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    el.appendChild(renderer.domElement);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.65));
    const sun = new THREE.DirectionalLight(0xffffff, 1.1);
    sun.position.set(6, 14, 10); sun.castShadow = true;
    scene.add(sun);
    // ── FIXED: fill light so back faces stay lit when rotated ──
    const fill = new THREE.DirectionalLight(0xffffff, 0.5);
    fill.position.set(-6, 10, -8);
    scene.add(fill);
    const rimL = new THREE.PointLight(0x6366f1, 0.55);
    rimL.position.set(-10, 6, -6);
    scene.add(rimL);
    const rimR = new THREE.PointLight(0x06b6d4, 0.45);
    rimR.position.set(10, 4, 8);
    scene.add(rimR);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xe0e7ff, 0.4));

    // Floor + grid — enlarged to match new camera
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(36, 22),
      new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.9 })
    );
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true;
    scene.add(floor);
    scene.add(new THREE.GridHelper(36, 30, 0xcccccc, 0xe2e8f0));

    const maxBarH = 10;
    const barW    = Math.max(0.45, Math.min(0.8, 8 / data.length));
    const barD    = barW;
    const spacing = barW * 1.75;
    const pivot   = new THREE.Group();
    const labelAnchors = [];

    data.forEach((d, i) => {
      const bh   = Math.max(0.12, (d.count / maxCount) * maxBarH);
      const hex  = color(d.status);
      const col  = new THREE.Color(hex);
      const xPos = (i - (data.length - 1) / 2) * spacing;

      // Shadow
      const sm = new THREE.Mesh(
        new THREE.BoxGeometry(barW, bh * 0.18, barD),
        new THREE.MeshBasicMaterial({ color: 0xbbbbbb, transparent: true, opacity: 0.15 })
      );
      sm.position.set(xPos + 0.07, bh * 0.09, 0.07);
      pivot.add(sm);

      // Main bar
      const geo = new THREE.BoxGeometry(barW, bh, barD);
      const mat = new THREE.MeshStandardMaterial({
        color: col, roughness: 0.22, metalness: 0.45,
        emissive: col, emissiveIntensity: 0.12,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(xPos, bh / 2, 0);
      mesh.castShadow = true;
      pivot.add(mesh);

      // Edge outline
      const edgesLine = new THREE.LineSegments(
        new THREE.EdgesGeometry(geo),
        new THREE.LineBasicMaterial({ color: 0xffffff })
      );
      edgesLine.position.set(xPos, bh / 2, 0);
      pivot.add(edgesLine);

      // Glow cap
      const capCol = col.clone().lerp(new THREE.Color(0xffffff), 0.25);
      const cap    = new THREE.Mesh(
        new THREE.BoxGeometry(barW, 0.07, barD),
        new THREE.MeshStandardMaterial({ color: capCol, emissive: capCol, emissiveIntensity: 1.2, roughness: 0.04, metalness: 1 })
      );
      cap.position.set(xPos, bh + 0.035, 0);
      pivot.add(cap);

      labelAnchors.push({ x: xPos, y: bh + 0.6,  z: 0 }); // value above bar
      labelAnchors.push({ x: xPos, y: -0.6,        z: 0 }); // label below
    });

    scene.add(pivot);

    const toScreen = (x3, y3, z3) => {
      const v = new THREE.Vector3(x3, y3, z3).project(camera);
      return { sx: (v.x * 0.5 + 0.5) * W, sy: (-v.y * 0.5 + 0.5) * H, behind: v.z > 1 };
    };

    // ── FIXED: shallower initial tilt + tighter clamp ──
    let isDragging = false, prevX = 0, prevY = 0;
    let rotX = 0.10, rotY = 0, autoSpin = true;

    const onDown = e => { isDragging = true; prevX = e.clientX; prevY = e.clientY; autoSpin = false; renderer.domElement.style.cursor = "grabbing"; };
    const onUp   = () => { isDragging = false; renderer.domElement.style.cursor = "grab"; };
    const onMove = e => {
      if (!isDragging) return;
      rotY += (e.clientX - prevX) * 0.006;
      rotX  = Math.max(-0.5, Math.min(0.5, rotX + (e.clientY - prevY) * 0.004));
      prevX = e.clientX; prevY = e.clientY;
    };

    renderer.domElement.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("mousemove", onMove);
    renderer.domElement.style.cursor = "grab";

    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (autoSpin) rotY += 0.003;
      pivot.rotation.y = rotY;
      pivot.rotation.x = rotX;
      camera.updateMatrixWorld();

      if (overlayRef.current) {
        overlayRef.current.querySelectorAll(".lbl3d").forEach((elDiv, i) => {
          const a      = labelAnchors[i];
          const rotVec = new THREE.Vector3(a.x, a.y, a.z).applyEuler(pivot.rotation);
          const { sx, sy, behind } = toScreen(rotVec.x, rotVec.y, rotVec.z);
          elDiv.style.left    = `${sx}px`;
          elDiv.style.top     = `${sy}px`;
          elDiv.style.opacity = behind ? "0" : "1";
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

  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start", width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden" }}>
      <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
        {/* ── FIXED: height matches renderer ── */}
        <div ref={mountRef} style={{ width: "100%", height: 560, cursor: "grab" }} />

        {/* Projected HTML labels */}
        <div ref={overlayRef} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {data.flatMap((d, i) => {
            const col = THEMES[theme][i % THEMES[theme].length];
            return [
              <div key={`v${i}`} className="lbl3d" style={{
                position: "absolute", transform: "translate(-50%,-100%)",
                background: "rgba(255,255,255,0.93)", color: col,
                fontSize: 10, fontWeight: "bold", padding: "2px 6px", borderRadius: 3,
                border: `1px solid ${col}55`, whiteSpace: "nowrap",
                transition: "opacity 0.1s", pointerEvents: "none",
                boxShadow: "0 1px 3px rgba(0,0,0,0.10)",
              }}>
                {d.count}
              </div>,
              <div key={`c${i}`} className="lbl3d" style={{
                position: "absolute", transform: "translate(-50%, 0%)",
                background: "rgba(255,255,255,0.90)", color: "#334155",
                fontSize: 9, fontWeight: "600", padding: "2px 5px", borderRadius: 3,
                border: "1px solid #e2e8f0", whiteSpace: "nowrap",
                transition: "opacity 0.1s", pointerEvents: "none",
                maxWidth: 84, overflow: "hidden", textOverflow: "ellipsis",
              }}>
                {d.status}
              </div>,
            ];
          })}
        </div>

        <div style={{ padding: "7px 14px", background: "#f8fafc", borderTop: "1px solid #e2e8f0", fontSize: 11, color: "#94a3b8" }}>
          💡 Drag to rotate · auto-spins until you interact
        </div>
      </div>

      <div style={{ padding: "12px 12px 12px 0" }}>
        <LegendHTML data={data} palette={THEMES[theme]} />
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const HorizontalBarchartCsv = () => {
  const [viewMode, setViewMode] = useState("2d");
  const [theme,    setTheme]    = useState("Modern");

  const total = SAMPLE_DATA.reduce((s, d) => s + d.count, 0);

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
        <div style={{ fontSize: 16, fontWeight: "bold", color: "#1e293b" }}>Horizontal Bar Chart</div>
        <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
          {SAMPLE_DATA.length} statuses · {total} total tasks
        </div>
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
        ? <Chart2D key="2d" data={SAMPLE_DATA} theme={theme} />
        : <Chart3D key="3d" data={SAMPLE_DATA} theme={theme} />
      }
    </div>
  );
};

export default HorizontalBarchartCsv;