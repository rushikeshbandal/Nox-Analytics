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

const DATA = [
  { label: "Apple",   value: 120, category: "Fruit"      },
  { label: "Banana",  value: 85,  category: "Fruit"      },
  { label: "Carrot",  value: 95,  category: "Vegetable"  },
  { label: "Donut",   value: 45,  category: "Snack"      },
  { label: "Egg",     value: 60,  category: "Dairy"      },
  { label: "Fish",    value: 75,  category: "Protein"    },
  { label: "Grapes",  value: 110, category: "Fruit"      },
  { label: "Honey",   value: 30,  category: "Sweetener"  },
];

// ─── Shared legend ────────────────────────────────────────────────────────────
function LegendHTML({ categories, palette }) {
  const color = d3.scaleOrdinal().domain(categories).range(palette);
  return (
    <div style={{
      background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8,
      padding: "12px 14px", minWidth: 130, flexShrink: 0,
      boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
    }}>
      <div style={{ fontSize: 10, fontWeight: "bold", color: "#94a3b8", letterSpacing: "0.08em", marginBottom: 8 }}>
        CATEGORIES
      </div>
      {categories.map(cat => (
        <div key={cat} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 7 }}>
          <div style={{ width: 11, height: 11, borderRadius: 3, flexShrink: 0, background: color(cat) }} />
          <span style={{ color: "#334155", fontSize: 12 }}>{cat}</span>
        </div>
      ))}
    </div>
  );
}

// ─── 2D Chart ─────────────────────────────────────────────────────────────────
function Chart2D({ theme }) {
  const svgRef = useRef(null);
  const palette    = THEMES[theme];
  const categories = [...new Set(DATA.map(d => d.category))];
  const color      = d3.scaleOrdinal().domain(categories).range(palette);

  useEffect(() => {
    if (!svgRef.current) return;

    const W = 680, H = 420;
    const margin = { top: 16, right: 60, bottom: 40, left: 90 };
    const cW = W - margin.left - margin.right;
    const cH = H - margin.top  - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox", `0 0 ${W} ${H}`).attr("preserveAspectRatio", "xMidYMid meet");
    svg.append("rect").attr("width", W).attr("height", H).attr("fill", "#f8fafc").attr("rx", 8);

    const xScale = d3.scaleLinear()
      .domain([0, d3.max(DATA, d => d.value) * 1.15])
      .range([0, cW]).nice();
    const yScale = d3.scaleBand()
      .domain(DATA.map(d => d.label))
      .range([0, cH]).padding(0.28);

    const chart = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    // Grid
    chart.append("g")
      .call(d3.axisBottom(xScale).tickFormat("").tickSize(cH).ticks(6))
      .call(g => { g.select(".domain").remove(); g.selectAll("line").style("stroke","#e2e8f0").style("stroke-dasharray","4,3"); });

    // Tooltip
    const tooltip = d3.select("body").append("div")
      .style("position","absolute").style("background","rgba(15,23,42,0.92)")
      .style("color","#fff").style("padding","7px 11px").style("border-radius","6px")
      .style("font-size","12px").style("pointer-events","none").style("opacity",0)
      .style("border","1px solid #334155").style("z-index","9999");

    // Bars
    DATA.forEach(d => {
      const g = chart.append("g").attr("transform", `translate(0,${yScale(d.label)})`);

      // Shadow
      g.append("rect")
        .attr("x", 4).attr("y", 4)
        .attr("width", xScale(d.value))
        .attr("height", yScale.bandwidth())
        .attr("fill", d3.color(color(d.category)).darker(0.8))
        .attr("rx", 6).attr("opacity", 0.25);

      // Bar
      g.append("rect")
        .attr("width", 0)
        .attr("height", yScale.bandwidth())
        .attr("fill", color(d.category))
        .attr("rx", 6).attr("opacity", 0.9)
        .style("cursor", "pointer")
        .on("mouseover", function (event) {
          d3.select(this).attr("opacity", 1);
          tooltip.style("opacity", 1)
            .html(`<b style="color:${color(d.category)}">${d.label}</b><br/>Category: ${d.category}<br/>Value: ${d.value}`)
            .style("left", (event.pageX + 12) + "px").style("top", (event.pageY - 10) + "px");
        })
        .on("mouseout", function () { d3.select(this).attr("opacity", 0.9); tooltip.style("opacity", 0); })
        .transition().duration(800)
        .attr("width", xScale(d.value));

      // Value label
      g.append("text")
        .attr("x", xScale(d.value) + 8)
        .attr("y", yScale.bandwidth() / 2)
        .attr("dy", "0.35em")
        .style("font-size", "11px").style("font-weight", "700").style("fill", "#334155")
        .style("pointer-events", "none")
        .text(d.value);
    });

    // Y axis
    chart.append("g")
      .call(d3.axisLeft(yScale).tickSize(0))
      .call(g => {
        g.select(".domain").remove();
        g.selectAll("text").style("font-size","12px").style("font-weight","600").style("fill","#334155");
      });

    // X axis
    chart.append("g").attr("transform", `translate(0,${cH})`)
      .call(d3.axisBottom(xScale).ticks(6))
      .call(g => {
        g.select(".domain").style("stroke","#e2e8f0");
        g.selectAll("text").style("fill","#64748b").style("font-size","10px");
      });

    // X label
    svg.append("text")
      .attr("transform", `translate(${margin.left + cW / 2},${H - 4})`)
      .attr("text-anchor","middle").style("font-size","11px").style("fill","#94a3b8")
      .text("Value");

    return () => tooltip.remove();
  }, [theme]);

  return (
    <div style={{ display:"flex", gap:12, alignItems:"flex-start", width:"100%", border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden" }}>
      <svg ref={svgRef} style={{ display:"block", flex:1, minWidth:0, height:420 }} />
      <div style={{ padding:"12px 12px 12px 0", flexShrink:0 }}>
        <LegendHTML categories={[...new Set(DATA.map(d => d.category))]} palette={palette} />
      </div>
    </div>
  );
}

// ─── 3D Chart ─────────────────────────────────────────────────────────────────
function Chart3D({ theme }) {
  const mountRef   = useRef(null);
  const overlayRef = useRef(null);
  const palette    = THEMES[theme];
  const categories = [...new Set(DATA.map(d => d.category))];
  const color      = d3.scaleOrdinal().domain(categories).range(palette);

  useEffect(() => {
    if (!mountRef.current) return;
    const el  = mountRef.current;
    const W   = el.offsetWidth || 680, H = 420;
    const maxVal = d3.max(DATA, d => d.value);

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);
    const camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 200);
    camera.position.set(0, 7, 16);
    camera.lookAt(0, 2, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    el.appendChild(renderer.domElement);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.75));
    const dir = new THREE.DirectionalLight(0xffffff, 1.0);
    dir.position.set(6, 12, 8); dir.castShadow = true;
    scene.add(dir);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xdddddd, 0.4));

    // Floor grid
    const grid = new THREE.GridHelper(24, 24, 0xcccccc, 0xe2e8f0);
    grid.position.y = -0.01;
    scene.add(grid);

    // Bars — horizontal layout matching 2D (bars extend along X axis)
    const pivot    = new THREE.Group();
    const barH     = 0.55;  // bar cross-section height
    const barD     = 0.55;  // bar depth
    const maxLen   = 9;     // max bar length along X
    const spacing  = 1.2;   // vertical spacing between bars
    const label3Dpos = [];  // for HTML overlay labels

    DATA.forEach((d, i) => {
      const barLen  = (d.value / maxVal) * maxLen;
      const col     = new THREE.Color(color(d.category));
      const yPos    = (DATA.length - 1 - i) * spacing;  // top-to-bottom matches 2D

      // Shadow bar
      const shadowGeo = new THREE.BoxGeometry(barLen, barH * 0.3, barD * 0.3);
      const shadowMat = new THREE.MeshBasicMaterial({ color: 0xcccccc, transparent: true, opacity: 0.25 });
      const shadow    = new THREE.Mesh(shadowGeo, shadowMat);
      shadow.position.set(barLen / 2, yPos - barH / 2 - 0.05, 0);
      pivot.add(shadow);

      // Main bar
      const geo  = new THREE.BoxGeometry(barLen, barH, barD);
      const mat  = new THREE.MeshPhongMaterial({ color: col, shininess: 50, transparent: true, opacity: 0.92 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(barLen / 2, yPos, 0);
      mesh.castShadow = true;
      pivot.add(mesh);

      // Edge outline
      const edges = new THREE.EdgesGeometry(geo);
      const line  = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 1 }));
      line.position.copy(mesh.position);
      pivot.add(line);

      // Store label anchor: tip of bar + a bit right, vertically centered
      label3Dpos.push({ x: barLen + 0.3, y: yPos, label: d.label, value: d.value, category: d.category });
    });

    scene.add(pivot);

    // Project 3D → screen
    const toScreen = (x3, y3, z3) => {
      const v = new THREE.Vector3(x3, y3, z3).project(camera);
      return { sx: (v.x * 0.5 + 0.5) * W, sy: (-v.y * 0.5 + 0.5) * H, behind: v.z > 1 };
    };

    // Drag orbit
    let isDragging = false, prevX = 0, prevY = 0, rotX = 0.18, rotY = 0, autoSpin = true;
    const onDown = e => { isDragging = true; prevX = e.clientX; prevY = e.clientY; autoSpin = false; };
    const onUp   = () => { isDragging = false; };
    const onMove = e => {
      if (!isDragging) return;
      rotY += (e.clientX - prevX) * 0.006;
      rotX += (e.clientY - prevY) * 0.004;
      rotX  = Math.max(-0.9, Math.min(0.9, rotX));
      prevX = e.clientX; prevY = e.clientY;
    };
    renderer.domElement.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("mousemove", onMove);

    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (autoSpin) rotY += 0.003;
      pivot.rotation.y = rotY;
      pivot.rotation.x = rotX;

      // Update HTML overlay labels
      if (overlayRef.current) {
        // Compute pivot world matrix manually for label projection
        camera.updateMatrixWorld();
        const els = overlayRef.current.querySelectorAll(".bar-label");
        els.forEach((el, i) => {
          const lp   = label3Dpos[i];
          // Transform point through pivot rotation
          const vec  = new THREE.Vector3(lp.x, lp.y, 0);
          vec.applyEuler(pivot.rotation);
          const { sx, sy, behind } = toScreen(vec.x, vec.y, vec.z);
          el.style.left    = `${sx}px`;
          el.style.top     = `${sy}px`;
          el.style.opacity = behind ? "0" : "1";
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
  }, [theme]);

  return (
    <div style={{ display:"flex", gap:12, alignItems:"flex-start", width:"100%", border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden" }}>
      {/* Canvas + overlay */}
      <div style={{ position:"relative", flex:1, minWidth:0 }}>
        <div ref={mountRef} style={{ width:"100%", height:420 }} />

        {/* HTML value labels projected onto bars */}
        <div ref={overlayRef} style={{ position:"absolute", inset:0, pointerEvents:"none" }}>
          {DATA.map((d, i) => (
            <div key={i} className="bar-label" style={{
              position:"absolute", transform:"translate(-50%,-50%)",
              background:"rgba(15,23,42,0.78)", color:"#fff",
              fontSize:11, fontWeight:"bold", padding:"2px 6px",
              borderRadius:4, border:`1px solid ${color(d.category)}55`,
              whiteSpace:"nowrap", transition:"opacity 0.1s", pointerEvents:"none",
            }}>
              {d.label}: {d.value}
            </div>
          ))}
        </div>

        <div style={{ padding:"7px 14px", background:"#f8fafc", borderTop:"1px solid #e2e8f0", fontSize:11, color:"#94a3b8" }}>
          💡 Drag to rotate · auto-spins until you interact
        </div>
      </div>

      {/* Legend — outside canvas, no overlap */}
      <div style={{ padding:"12px 12px 12px 0", flexShrink:0 }}>
        <LegendHTML categories={[...new Set(DATA.map(d => d.category))]} palette={palette} />
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const HorizontalBarChart1 = () => {
  const [viewMode, setViewMode] = useState("2d");
  const [theme,    setTheme]    = useState("Modern");

  const ddStyle = {
    padding:"5px 10px", borderRadius:6, border:"1px solid #e2e8f0",
    background:"#fff", color:"#334155", fontWeight:"500",
    cursor:"pointer", fontSize:12, outline:"none",
  };

  return (
    <div style={{
      background:"#ffffff", borderRadius:12,
      padding:"20px 24px 32px 24px", width:"100%",
      boxShadow:"0 1px 3px rgba(0,0,0,0.08)", boxSizing:"border-box",
    }}>
      {/* Title */}
      <div style={{ marginBottom:4 }}>
        <div style={{ fontSize:16, fontWeight:"bold", color:"#1e293b" }}>Horizontal Bar Chart</div>
        <div style={{ fontSize:12, color:"#94a3b8", marginTop:2 }}>Item values by category</div>
      </div>

      {/* Dropdowns */}
      <div style={{ display:"flex", gap:10, alignItems:"flex-end", marginTop:12, marginBottom:20 }}>
        <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
          <label style={{ fontSize:11, color:"#94a3b8", fontWeight:"600" }}>View</label>
          <select value={viewMode} onChange={e => setViewMode(e.target.value)} style={ddStyle}>
            <option value="2d">2D</option>
            <option value="3d">3D</option>
          </select>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
          <label style={{ fontSize:11, color:"#94a3b8", fontWeight:"600" }}>Color Theme</label>
          <select value={theme} onChange={e => setTheme(e.target.value)} style={ddStyle}>
            {Object.keys(THEMES).map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
      </div>

      {/* Chart — key forces clean remount on view switch */}
      {viewMode === "2d"
        ? <Chart2D key="2d" theme={theme} />
        : <Chart3D key="3d" theme={theme} />
      }
    </div>
  );
};

export default HorizontalBarChart1;