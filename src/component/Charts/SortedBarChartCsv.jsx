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

const FALLBACK = [
  { category: "Electronics",      value: 45000 },
  { category: "Clothing",         value: 38000 },
  { category: "Sports",           value: 35000 },
  { category: "Food & Beverages", value: 32000 },
  { category: "Furniture",        value: 29000 },
  { category: "Home Decor",       value: 27000 },
  { category: "Books",            value: 21000 },
  { category: "Toys",             value: 18000 },
  { category: "Beauty",           value: 16000 },
  { category: "Kitchenware",      value: 12500 },
];

// ─── Shared Legend ────────────────────────────────────────────────────────────
function LegendHTML({ data, palette }) {
  const color = d3.scaleOrdinal().domain(data.map(d => d.category)).range(palette);
  return (
    <div style={{
      background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8,
      padding: "12px 14px", width: 150, flexShrink: 0,
      boxShadow: "0 1px 4px rgba(0,0,0,0.07)", alignSelf: "flex-start",
    }}>
      <div style={{ fontSize: 10, fontWeight: "bold", color: "#94a3b8", letterSpacing: "0.08em", marginBottom: 8 }}>
        CATEGORIES
      </div>
      {data.map(d => (
        <div key={d.category} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, flexShrink: 0, background: color(d.category) }} />
          <span style={{ color: "#334155", fontSize: 11, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {d.category}
          </span>
          <span style={{ color: color(d.category), fontSize: 10, fontWeight: "bold" }}>
            {d.value >= 1000 ? `${(d.value / 1000).toFixed(0)}k` : d.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── 2D Chart ─────────────────────────────────────────────────────────────────
function Chart2D({ data, theme }) {
  const svgRef  = useRef(null);
  const palette = THEMES[theme];
  const color   = d3.scaleOrdinal().domain(data.map(d => d.category)).range(palette);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    const W = 660, H = 420;
    // ── extra top margin so value labels above tallest bar never clip ──
    const margin = { top: 36, right: 20, bottom: 80, left: 60 };
    const cW = W - margin.left - margin.right;
    const cH = H - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox", `0 0 ${W} ${H}`).attr("preserveAspectRatio", "xMidYMid meet");
    svg.append("rect").attr("width", W).attr("height", H).attr("fill", "#f8fafc").attr("rx", 8);

    const xScale = d3.scaleBand().domain(data.map(d => d.category)).range([0, cW]).padding(0.32);
    const yScale = d3.scaleLinear().domain([0, d3.max(data, d => d.value) * 1.18]).range([cH, 0]).nice();

    const chart = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    // Grid
    yScale.ticks(5).forEach(t => {
      chart.append("line")
        .attr("x1", 0).attr("x2", cW).attr("y1", yScale(t)).attr("y2", yScale(t))
        .attr("stroke", "#e2e8f0").attr("stroke-dasharray", "4,3").attr("stroke-width", 1);
    });

    // Gradient defs
    const defs = svg.append("defs");
    data.forEach((d, i) => {
      const c  = color(d.category);
      const gr = defs.append("linearGradient")
        .attr("id", `sbg-${i}-${theme}`).attr("x1", "0%").attr("x2", "0%").attr("y1", "0%").attr("y2", "100%");
      gr.append("stop").attr("offset", "0%").attr("stop-color", d3.color(c).brighter(0.4).formatHex()).attr("stop-opacity", 0.95);
      gr.append("stop").attr("offset", "100%").attr("stop-color", d3.color(c).darker(0.4).formatHex()).attr("stop-opacity", 0.92);
    });

    // Tooltip
    const tooltip = d3.select("body").append("div")
      .style("position", "absolute").style("background", "rgba(15,23,42,0.92)")
      .style("color", "#fff").style("padding", "7px 11px").style("border-radius", "6px")
      .style("font-size", "12px").style("pointer-events", "none").style("opacity", 0)
      .style("border", "1px solid #334155").style("z-index", "9999");

    // Bars
    data.forEach((d, i) => {
      const col = color(d.category);
      const g   = chart.append("g");

      // Shadow
      g.append("rect")
        .attr("x", xScale(d.category) + 3).attr("y", yScale(d.value) + 3)
        .attr("width", xScale.bandwidth()).attr("height", cH - yScale(d.value))
        .attr("fill", d3.color(col).darker(0.8)).attr("rx", 5).attr("opacity", 0.15);

      // Bar
      g.append("rect")
        .attr("x", xScale(d.category)).attr("y", cH)
        .attr("width", xScale.bandwidth()).attr("height", 0)
        .attr("fill", `url(#sbg-${i}-${theme})`).attr("rx", 5).attr("opacity", 0.92)
        .style("cursor", "pointer")
        .on("mouseover", function (event) {
          d3.select(this).attr("opacity", 1).attr("stroke", "#fff").attr("stroke-width", 1.5);
          tooltip.style("opacity", 1)
            .html(`<b style="color:${col}">${d.category}</b><br/>Sales: <b>${d.value.toLocaleString()}</b>`)
            .style("left", (event.pageX + 12) + "px").style("top", (event.pageY - 10) + "px");
        })
        .on("mouseout", function () {
          d3.select(this).attr("opacity", 0.92).attr("stroke", "none");
          tooltip.style("opacity", 0);
        })
        .transition().duration(700).delay(i * 40)
        .attr("y", yScale(d.value)).attr("height", cH - yScale(d.value));

      // Value label — sits above bar with room in the new top margin
      g.append("text")
        .attr("x", xScale(d.category) + xScale.bandwidth() / 2)
        .attr("y", yScale(d.value) - 6)
        .attr("text-anchor", "middle").style("font-size", "9px").style("font-weight", "700").style("fill", "#334155")
        .style("pointer-events", "none")
        .text(d.value >= 1000 ? `${(d.value / 1000).toFixed(0)}k` : d.value);
    });

    // X axis
    chart.append("g").attr("transform", `translate(0,${cH})`)
      .call(d3.axisBottom(xScale).tickSize(0))
      .call(g => {
        g.select(".domain").style("stroke", "#e2e8f0");
        g.selectAll("text")
          .style("fill", "#334155").style("font-size", "10px").style("font-weight", "600")
          .attr("transform", "rotate(-35)").style("text-anchor", "end");
      });

    // Y axis
    chart.append("g")
      .call(d3.axisLeft(yScale).ticks(5).tickFormat(d => d >= 1000 ? `${d / 1000}k` : d))
      .call(g => {
        g.select(".domain").remove(); g.selectAll("line").remove();
        g.selectAll("text").style("fill", "#94a3b8").style("font-size", "10px");
      });

    // Y label
    svg.append("text")
      .attr("transform", "rotate(-90)").attr("x", -(margin.top + cH / 2)).attr("y", 14)
      .attr("text-anchor", "middle").style("font-size", "11px").style("fill", "#94a3b8").text("Sales ($)");

    return () => tooltip.remove();
  }, [data, theme]);

  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start", width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden" }}>
      <svg ref={svgRef} style={{ display: "block", flex: 1, minWidth: 0, height: 420 }} />
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
  const color      = d3.scaleOrdinal().domain(data.map(d => d.category)).range(palette);

  useEffect(() => {
    if (!mountRef.current || !data.length) return;
    const el     = mountRef.current;
    const W      = el.offsetWidth || 660;
    // ── FIXED: taller canvas so tallest bar (Electronics) is never clipped ──
    const H      = 580;
    const maxVal = d3.max(data, d => d.value);

    const scene  = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);

    // ── FIXED: camera higher + further back for full view of all bars ──
    const camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 200);
    camera.position.set(0, 14, 24);
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
    // ── FIXED: fill light from behind so back faces are lit when rotated ──
    const fill = new THREE.DirectionalLight(0xffffff, 0.5);
    fill.position.set(-6, 10, -8);
    scene.add(fill);
    const rimL = new THREE.PointLight(0x6366f1, 0.6);
    rimL.position.set(-10, 6, -6);
    scene.add(rimL);
    const rimR = new THREE.PointLight(0x06b6d4, 0.5);
    rimR.position.set(10, 4, 8);
    scene.add(rimR);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xe0e7ff, 0.4));

    // Floor + grid — enlarged to match wider camera
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(42, 26),
      new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.9 })
    );
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true;
    scene.add(floor);
    scene.add(new THREE.GridHelper(42, 34, 0xcccccc, 0xe2e8f0));

    const maxBarH = 10;
    const barW    = Math.max(0.4, Math.min(0.8, 10 / data.length));
    const barD    = barW;
    const spacing = barW * 1.7;
    const pivot   = new THREE.Group();
    const labelAnchors = [];

    data.forEach((d, i) => {
      const bh   = Math.max(0.1, (d.value / maxVal) * maxBarH);
      const hex  = color(d.category);
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

      // Label anchors: value above cap, category below floor
      labelAnchors.push({ x: xPos, y: bh + 0.65, z: 0 }); // value
      labelAnchors.push({ x: xPos, y: -0.6,       z: 0 }); // category
    });

    scene.add(pivot);

    const toScreen = (x3, y3, z3) => {
      const v = new THREE.Vector3(x3, y3, z3).project(camera);
      return { sx: (v.x * 0.5 + 0.5) * W, sy: (-v.y * 0.5 + 0.5) * H, behind: v.z > 1 };
    };

    // ── FIXED: shallower initial tilt + tighter clamp to prevent bars going off-screen ──
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
        <div ref={mountRef} style={{ width: "100%", height: 580, cursor: "grab" }} />

        {/* Projected HTML labels */}
        <div ref={overlayRef} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {data.flatMap((d, i) => {
            const col = THEMES[theme][i % THEMES[theme].length];
            return [
              // Value label above bar
              <div key={`v${i}`} className="lbl3d" style={{
                position: "absolute", transform: "translate(-50%,-100%)",
                background: "rgba(255,255,255,0.93)", color: col,
                fontSize: 10, fontWeight: "bold", padding: "2px 6px", borderRadius: 3,
                border: `1px solid ${col}55`, whiteSpace: "nowrap",
                transition: "opacity 0.1s", pointerEvents: "none",
                boxShadow: "0 1px 3px rgba(0,0,0,0.10)",
              }}>
                {d.value >= 1000 ? `${(d.value / 1000).toFixed(0)}k` : d.value}
              </div>,
              // Category label below floor
              <div key={`c${i}`} className="lbl3d" style={{
                position: "absolute", transform: "translate(-50%, 0%)",
                background: "rgba(255,255,255,0.88)", color: "#334155",
                fontSize: 9, fontWeight: "600", padding: "2px 5px", borderRadius: 3,
                border: "1px solid #e2e8f0", whiteSpace: "nowrap",
                transition: "opacity 0.1s", pointerEvents: "none",
                maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis",
              }}>
                {d.category.length > 10 ? d.category.slice(0, 9) + "." : d.category}
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
const SortedBarChartCsv = () => {
  const [viewMode,  setViewMode]  = useState("2d");
  const [theme,     setTheme]     = useState("Modern");
  const [chartData, setChartData] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [dataInfo,  setDataInfo]  = useState("");

  useEffect(() => {
    d3.csv("/SortedBarChartCsv.csv")
      .then(rows => {
        const processed = rows
          .map(r => ({ category: r["Category"] || "Unknown", value: parseFloat(r["Sales"]) || 0 }))
          .filter(d => d.value > 0)
          .sort((a, b) => b.value - a.value);
        setChartData(processed);
        setDataInfo(`${processed.length} categories · sorted by sales`);
        setLoading(false);
      })
      .catch(() => {
        const sorted = [...FALLBACK].sort((a, b) => b.value - a.value);
        setChartData(sorted);
        setDataInfo("Demo data (CSV not found) · sorted by sales");
        setLoading(false);
      });
  }, []);

  const ddStyle = {
    padding: "5px 10px", borderRadius: 6, border: "1px solid #e2e8f0",
    background: "#fff", color: "#334155", fontWeight: "500",
    cursor: "pointer", fontSize: 12, outline: "none",
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, color: "#94a3b8", fontSize: 15 }}>
      Loading data…
    </div>
  );

  return (
    <div style={{
      background: "#ffffff", borderRadius: 12,
      padding: "20px 24px 32px 24px", width: "100%",
      boxShadow: "0 1px 3px rgba(0,0,0,0.08)", boxSizing: "border-box",
    }}>
      <div style={{ marginBottom: 4 }}>
        <div style={{ fontSize: 16, fontWeight: "bold", color: "#1e293b" }}>Sorted Bar Chart</div>
        <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{dataInfo}</div>
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
        ? <Chart2D key="2d" data={chartData} theme={theme} />
        : <Chart3D key="3d" data={chartData} theme={theme} />
      }
    </div>
  );
};

export default SortedBarChartCsv;