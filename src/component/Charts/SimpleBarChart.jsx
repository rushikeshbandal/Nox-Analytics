import React, { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import * as THREE from "three";
import ColorWheel from "../colorwheel.jsx";

// ═══════════════════════════════════════════════════════════
// PALETTE ENGINE — shared with all charts via localStorage + custom event
// ═══════════════════════════════════════════════════════════
const PALETTE_KEY   = "avie_palette";
const PALETTE_EVENT = "avie_paletteChanged";

const BASE_THEMES = {
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

// Load any saved overrides for the current theme from localStorage
const loadOverrides = (theme) => {
  try {
    const raw = localStorage.getItem(`${PALETTE_KEY}_bar_${theme}`);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
};

// Save overrides and broadcast to other charts
const saveOverrides = (theme, overrides) => {
  localStorage.setItem(`${PALETTE_KEY}_bar_${theme}`, JSON.stringify(overrides));
  window.dispatchEvent(new CustomEvent(PALETTE_EVENT, {
    detail: { source: "SimpleBarChart", theme, overrides }
  }));
};

// Merge base theme colors with any saved per-slot overrides
const buildPalette = (theme, overrides) => {
  const base = [...BASE_THEMES[theme]];
  Object.entries(overrides).forEach(([idx, color]) => { base[parseInt(idx)] = color; });
  return base;
};

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// ─── Legend ───────────────────────────────────────────────────────────────────
function LegendHTML({ data, palette, onColorClick }) {
  return (
    <div style={{
      background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8,
      padding: "12px 14px", width: 145, flexShrink: 0,
      boxShadow: "0 1px 4px rgba(0,0,0,0.07)", alignSelf: "flex-start",
    }}>
      <div style={{ fontSize: 10, fontWeight: "bold", color: "#94a3b8", letterSpacing: "0.08em", marginBottom: 8 }}>
        MONTHS · click swatch to edit
      </div>
      {data.map((d, i) => (
        <div key={d.month} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
          {/* Clickable color swatch */}
          <div
            title={`Edit color for ${d.month}`}
            onClick={() => onColorClick(i)}
            style={{
              width: 12, height: 12, borderRadius: 3, flexShrink: 0,
              background: palette[i % palette.length],
              cursor: "pointer", border: "1.5px solid rgba(0,0,0,0.12)",
              transition: "transform 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.35)"}
            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
          />
          <span style={{ color: "#334155", fontSize: 11, flex: 1 }}>{d.month}</span>
          <span style={{ color: "#94a3b8", fontSize: 10 }}>{d.electronics + d.clothing}</span>
        </div>
      ))}
    </div>
  );
}

// ─── 2D Chart ─────────────────────────────────────────────────────────────────
function Chart2D({ data, palette, onBarClick }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    const W = 700, H = 420;
    const margin = { top: 24, right: 20, bottom: 52, left: 60 };
    const cW = W - margin.left - margin.right;
    const cH = H - margin.top  - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox", `0 0 ${W} ${H}`).attr("preserveAspectRatio", "xMidYMid meet");
    svg.append("rect").attr("width", W).attr("height", H).attr("fill", "#f8fafc").attr("rx", 8);

    // Per-month gradients using current palette
    const defs = svg.append("defs");
    data.forEach((_, i) => {
      const c  = palette[i % palette.length];
      const gr = defs.append("linearGradient")
        .attr("id", `bar-grad-${i}`)
        .attr("x1","0%").attr("x2","0%").attr("y1","0%").attr("y2","100%");
      gr.append("stop").attr("offset","0%").attr("stop-color", c).attr("stop-opacity", 0.95);
      gr.append("stop").attr("offset","100%").attr("stop-color", c).attr("stop-opacity", 0.5);
    });

    const chart = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const x    = d3.scaleBand().domain(data.map(d => d.month)).range([0, cW]).padding(0.22);
    const xSub = d3.scaleBand().domain(["electronics","clothing"]).range([0, x.bandwidth()]).padding(0.1);
    const maxY = d3.max(data, d => Math.max(d.electronics, d.clothing));
    const y    = d3.scaleLinear().domain([0, maxY * 1.2]).range([cH, 0]).nice();

    // Grid lines
    chart.selectAll(".gy").data(y.ticks(5)).enter().append("line")
      .attr("x1",0).attr("x2",cW).attr("y1",d=>y(d)).attr("y2",d=>y(d))
      .attr("stroke","#e2e8f0").attr("stroke-width",1).attr("stroke-dasharray","4,3");

    // Tooltip
    const tip = d3.select("body").append("div")
      .style("position","absolute").style("background","rgba(15,23,42,0.92)")
      .style("color","#fff").style("padding","7px 11px").style("border-radius","6px")
      .style("font-size","12px").style("pointer-events","none").style("opacity",0)
      .style("border","1px solid #334155").style("z-index","9999");

    // Bars
    data.forEach((monthData, mi) => {
      const col = palette[mi % palette.length];
      [["electronics", 0], ["clothing", 1]].forEach(([cat, ci]) => {
        const val  = monthData[cat];
        if (!val) return;
        const xPos = x(monthData.month) + xSub(cat);
        const bw   = xSub.bandwidth();
        const grp  = chart.append("g");

        // Drop shadow
        grp.append("rect")
          .attr("x", xPos+3).attr("y", y(val)+3)
          .attr("width", bw).attr("height", cH - y(val))
          .attr("fill", d3.color(col)?.darker(0.8) ?? col)
          .attr("rx", 5).attr("opacity", 0.15);

        // Bar — clickable to open color wheel for this month index
        grp.append("rect")
          .attr("x", xPos).attr("y", cH)
          .attr("width", bw).attr("height", 0)
          .attr("fill", `url(#bar-grad-${mi})`)
          .attr("rx", 5)
          .attr("opacity", ci === 0 ? 0.95 : 0.65)
          .attr("stroke","rgba(255,255,255,0.5)").attr("stroke-width", 0.6)
          .style("cursor","pointer")
          .on("mouseover", function(event) {
            d3.select(this).attr("opacity", 1).attr("stroke","#fff").attr("stroke-width", 1.5);
            tip.style("opacity",1)
              .html(`<b style="color:${col}">${monthData.month}</b><br/>${cat === "electronics" ? "Electronics" : "Clothing"}: $${val}<br/><span style="color:#94a3b8;font-size:10px">Click to change color</span>`)
              .style("left",(event.pageX+12)+"px").style("top",(event.pageY-10)+"px");
          })
          .on("mouseout", function() {
            d3.select(this).attr("opacity", ci === 0 ? 0.95 : 0.65)
              .attr("stroke","rgba(255,255,255,0.5)").attr("stroke-width", 0.6);
            tip.style("opacity",0);
          })
          .on("click", function(event) {
            event.stopPropagation();
            tip.style("opacity",0);
            onBarClick(mi); // open color wheel for this month's palette slot
          })
          .transition().duration(700).delay(mi * 40)
          .attr("y", y(val)).attr("height", cH - y(val));

        // Value label
        if (cH - y(val) > 22) {
          grp.append("text")
            .attr("x", xPos + bw/2).attr("y", y(val) - 5)
            .attr("text-anchor","middle").attr("fill","#64748b")
            .style("font-size","9px").style("font-weight","700")
            .text(`$${val}`);
        }
      });
    });

    // X axis
    chart.append("g").attr("transform",`translate(0,${cH})`)
      .call(d3.axisBottom(x).tickSize(0))
      .call(g => {
        g.select(".domain").style("stroke","#e2e8f0");
        g.selectAll("text").attr("fill","#64748b").style("font-size","10px")
          .attr("transform","rotate(-30)").style("text-anchor","end");
      });

    // Y axis
    chart.append("g")
      .call(d3.axisLeft(y).ticks(5).tickFormat(d => `$${d}`))
      .call(g => {
        g.select(".domain").remove(); g.selectAll("line").remove();
        g.selectAll("text").attr("fill","#94a3b8").style("font-size","10px");
      });

    // Axis labels
    svg.append("text")
      .attr("transform",`translate(${margin.left + cW/2},${H-4})`)
      .attr("text-anchor","middle").style("font-size","11px").style("fill","#94a3b8").text("Month");
    svg.append("text")
      .attr("transform","rotate(-90)").attr("x",-(margin.top + cH/2)).attr("y",14)
      .attr("text-anchor","middle").style("font-size","11px").style("fill","#94a3b8").text("Revenue ($)");

    return () => tip.remove();
  }, [data, palette]);

  return (
    <div style={{ display:"flex", gap:12, alignItems:"flex-start", width:"100%", border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden" }}>
      <svg ref={svgRef} style={{ display:"block", flex:1, minWidth:0, height:420 }} />
    </div>
  );
}

// ─── 3D Chart ─────────────────────────────────────────────────────────────────
function Chart3D({ data, palette, onBarClick }) {
  const mountRef   = useRef(null);
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!mountRef.current || !data.length) return;
    const el = mountRef.current;
    const W  = el.offsetWidth || 700, H = 420;

    const scene  = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);
    const camera = new THREE.PerspectiveCamera(40, W/H, 0.1, 500);
    camera.position.set(0, 18, 38);
    camera.lookAt(0, 4, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    el.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const sun = new THREE.DirectionalLight(0xffffff, 1.1);
    sun.position.set(15,30,20); sun.castShadow=true; scene.add(sun);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xdddddd, 0.4));

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(80,50),
      new THREE.MeshStandardMaterial({ color:0xf1f5f9, roughness:0.9 })
    );
    floor.rotation.x=-Math.PI/2; floor.receiveShadow=true; scene.add(floor);
    scene.add(new THREE.GridHelper(80,30,0xcccccc,0xe2e8f0));

    const maxVal = d3.max(data, d => Math.max(d.electronics, d.clothing));
    const maxH   = 14, totalW = 55;
    const nM     = data.length;
    const bw     = (totalW/nM)*0.42;
    const bd     = bw*1.3;
    const gap    = bw*0.25;
    const pivot  = new THREE.Group();
    const labelAnchors = [];
    // Store mesh → month index map for raycasting
    const meshToMonth = new Map();

    data.forEach((monthData, mi) => {
      const hexCol = palette[mi % palette.length];
      const col    = new THREE.Color(hexCol);
      const xBase  = -totalW/2 + (mi/(nM-1))*totalW;

      ["electronics","clothing"].forEach((cat, ci) => {
        const val = monthData[cat];
        if (!val) return;
        const bh   = Math.max((val/maxVal)*maxH, 0.15);
        const xo   = (ci-0.5)*(bw+gap);
        const xPos = xBase+xo;
        const barCol = ci===0 ? col.clone() : col.clone().lerp(new THREE.Color(0xffffff), 0.35);

        const geo  = new THREE.BoxGeometry(bw, bh, bd);
        const mat  = new THREE.MeshStandardMaterial({
          color:barCol, roughness:0.3, metalness:0.35,
          emissive:barCol, emissiveIntensity:0.07,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(xPos, bh/2, 0);
        mesh.castShadow=true;
        pivot.add(mesh);
        meshToMonth.set(mesh, mi); // record which month index this bar belongs to

        const cap = new THREE.Mesh(
          new THREE.BoxGeometry(bw,0.07,bd),
          new THREE.MeshStandardMaterial({ color:barCol, emissive:barCol, emissiveIntensity:1.0, roughness:0.05, metalness:1 })
        );
        cap.position.set(xPos, bh+0.035, 0);
        pivot.add(cap);

        const edges = new THREE.EdgesGeometry(geo);
        const line  = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color:0xffffff, linewidth:1 }));
        line.position.copy(mesh.position);
        pivot.add(line);

        labelAnchors.push({ x:xPos, y:bh+0.6, z:0, text:`${monthData.month} ${cat==="electronics"?"E":"C"}: $${val}`, color:hexCol });
      });
    });

    scene.add(pivot);

    // Raycaster for click on 3D bars
    const raycaster = new THREE.Raycaster();
    const mouse     = new THREE.Vector2();
    const onCanvasClick = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX-rect.left)/rect.width)*2-1;
      mouse.y = -((e.clientY-rect.top)/rect.height)*2+1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects([...meshToMonth.keys()]);
      if (hits.length > 0) {
        const mi = meshToMonth.get(hits[0].object);
        if (mi !== undefined) onBarClick(mi);
      }
    };
    renderer.domElement.addEventListener("click", onCanvasClick);

    const toScreen = (x3,y3,z3) => {
      const v = new THREE.Vector3(x3,y3,z3).project(camera);
      return { sx:(v.x*0.5+0.5)*W, sy:(-v.y*0.5+0.5)*H, behind:v.z>1 };
    };

    let isDragging=false, prevX=0, prevY=0, rotX=0.28, rotY=-0.3, autoSpin=true;
    const onDown = e=>{ isDragging=true; prevX=e.clientX; prevY=e.clientY; autoSpin=false; renderer.domElement.style.cursor="grabbing"; };
    const onUp   = ()=>{ isDragging=false; renderer.domElement.style.cursor="grab"; };
    const onMove = e=>{
      if (!isDragging) return;
      rotY+=(e.clientX-prevX)*0.007;
      rotX=Math.max(-0.7,Math.min(0.8,rotX+(e.clientY-prevY)*0.004));
      prevX=e.clientX; prevY=e.clientY;
    };
    renderer.domElement.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("mousemove", onMove);
    renderer.domElement.style.cursor="grab";

    let animId;
    const animate = () => {
      animId=requestAnimationFrame(animate);
      if (autoSpin) rotY+=0.003;
      pivot.rotation.y=rotY; pivot.rotation.x=rotX;
      camera.updateMatrixWorld();
      if (overlayRef.current) {
        overlayRef.current.querySelectorAll(".bar3d-lbl").forEach((el2,i) => {
          const a   = labelAnchors[i];
          const vec = new THREE.Vector3(a.x,a.y,a.z).applyEuler(pivot.rotation);
          const {sx,sy,behind} = toScreen(vec.x,vec.y,vec.z);
          el2.style.left=`${sx}px`; el2.style.top=`${sy}px`; el2.style.opacity=behind?"0":"1";
        });
      }
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      renderer.domElement.removeEventListener("click", onCanvasClick);
      renderer.domElement.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("mousemove", onMove);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [data, palette]);

  return (
    <div style={{ display:"flex", gap:12, alignItems:"flex-start", width:"100%", border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden" }}>
      <div style={{ position:"relative", flex:1, minWidth:0 }}>
        <div ref={mountRef} style={{ width:"100%", height:420, cursor:"grab" }} />
        <div ref={overlayRef} style={{ position:"absolute", inset:0, pointerEvents:"none" }}>
          {data.flatMap((d,mi) =>
            ["electronics","clothing"].map((cat,ci) => {
              if (!d[cat]) return null;
              const hexCol = palette[mi%palette.length];
              return (
                <div key={`${mi}-${ci}`} className="bar3d-lbl" style={{
                  position:"absolute", transform:"translate(-50%,-100%)",
                  background:"rgba(255,255,255,0.92)", color:hexCol,
                  fontSize:9, fontWeight:"bold", padding:"2px 5px",
                  borderRadius:3, border:`1px solid ${hexCol}66`,
                  whiteSpace:"nowrap", transition:"opacity 0.1s",
                  pointerEvents:"none", lineHeight:1.4, boxShadow:"0 1px 3px rgba(0,0,0,0.12)",
                }}>
                  {d.month} {cat==="electronics"?"E":"C"}: ${d[cat]}
                </div>
              );
            }).filter(Boolean)
          )}
        </div>
        <div style={{ padding:"7px 14px", background:"#f8fafc", borderTop:"1px solid #e2e8f0", fontSize:11, color:"#94a3b8" }}>
          💡 Drag to rotate · Click a bar to change its color
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const SimpleBarChart = () => {
  const [viewMode,  setViewMode]  = useState("2d");
  const [theme,     setTheme]     = useState("Modern");
  const [overrides, setOverrides] = useState(() => loadOverrides("Modern"));
  const [chartData, setChartData] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [dataInfo,  setDataInfo]  = useState("");

  // Color wheel state
  const [showWheel,   setShowWheel]   = useState(false);
  const [editSlot,    setEditSlot]    = useState(null); // palette index being edited

  // Rebuild palette by merging base theme + overrides
  const palette = buildPalette(theme, overrides);

  // When theme changes, load its saved overrides
  useEffect(() => {
    setOverrides(loadOverrides(theme));
  }, [theme]);

  // Listen for palette changes from other charts / palette manager
  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.source === "SimpleBarChart") return; // skip own events
      if (e.detail?.theme === theme && e.detail?.overrides) {
        setOverrides(e.detail.overrides);
      }
      // Legacy paletteChanged support
      if (e.detail?.palette?.primaryColors?.length) {
        const colors = e.detail.palette.primaryColors;
        const next   = {};
        colors.forEach((c, i) => { next[i] = c; });
        setOverrides(next);
        saveOverrides(theme, next);
      }
    };
    window.addEventListener(PALETTE_EVENT,    handler);
    window.addEventListener("paletteChanged", handler);
    return () => {
      window.removeEventListener(PALETTE_EVENT,    handler);
      window.removeEventListener("paletteChanged", handler);
    };
  }, [theme]);

  // Open color wheel for a specific palette slot (month index)
  const openWheel = useCallback((slotIndex) => {
    setEditSlot(slotIndex);
    setShowWheel(true);
  }, []);

  // Apply color from wheel → update that palette slot
  const handleApplyColor = useCallback((colors, meta) => {
    const newColor = colors[0];
    const idx      = meta?.slotIndex ?? editSlot;
    if (idx === null || idx === undefined) return;
    const next = { ...overrides, [idx]: newColor };
    setOverrides(next);
    saveOverrides(theme, next);
    setShowWheel(false);
  }, [overrides, theme, editSlot]);

  // Reset all overrides for current theme
  const resetTheme = () => {
    setOverrides({});
    saveOverrides(theme, {});
  };

  // Data fetch
  useEffect(() => {
    fetch("https://fakestoreapi.com/products")
      .then(r => r.json())
      .then(products => {
        const data = MONTHS.map(month => ({ month, electronics:0, clothing:0 }));
        products.forEach((p, idx) => {
          const mi = idx%12;
          if (p.category==="electronics") data[mi].electronics+=Math.round(p.price);
          if (p.category==="men's clothing"||p.category==="women's clothing") data[mi].clothing+=Math.round(p.price);
        });
        setChartData(data);
        setDataInfo("Monthly revenue · Fake Store API");
        setLoading(false);
      })
      .catch(() => {
        setChartData(MONTHS.map((month,i)=>({
          month,
          electronics:120+i*30+Math.floor(Math.sin(i)*40),
          clothing:   80+i*20+Math.floor(Math.cos(i)*30),
        })));
        setDataInfo("Sample data (API unavailable)");
        setLoading(false);
      });
  }, []);

  const ddStyle = {
    padding:"5px 10px", borderRadius:6, border:"1px solid #e2e8f0",
    background:"#fff", color:"#334155", fontWeight:"500",
    cursor:"pointer", fontSize:12, outline:"none",
  };

  const hasOverrides = Object.keys(overrides).length > 0;

  return (
    <div style={{ background:"#ffffff", borderRadius:12, padding:"20px 24px 32px", width:"100%", boxShadow:"0 1px 3px rgba(0,0,0,0.08)", boxSizing:"border-box" }}>
      <div style={{ marginBottom:4 }}>
        <div style={{ fontSize:16, fontWeight:"bold", color:"#1e293b" }}>Simple Bar Chart</div>
        <div style={{ fontSize:12, color:"#94a3b8", marginTop:2 }}>{dataInfo||"Loading…"}</div>
      </div>

      <div style={{ display:"flex", gap:10, alignItems:"flex-end", marginTop:12, marginBottom:20, flexWrap:"wrap" }}>
        <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
          <label style={{ fontSize:11, color:"#94a3b8", fontWeight:"600" }}>View</label>
          <select value={viewMode} onChange={e=>setViewMode(e.target.value)} style={ddStyle}>
            <option value="2d">2D</option>
            <option value="3d">3D</option>
          </select>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
          <label style={{ fontSize:11, color:"#94a3b8", fontWeight:"600" }}>Color Theme</label>
          <select value={theme} onChange={e=>setTheme(e.target.value)} style={ddStyle}>
            {Object.keys(BASE_THEMES).map(k=><option key={k} value={k}>{k}</option>)}
          </select>
        </div>
        {hasOverrides && (
          <button onClick={resetTheme} style={{ ...ddStyle, marginTop:16, background:"#fef2f2", color:"#ef4444", border:"1px solid #fecaca" }}>
            ↺ Reset colors
          </button>
        )}
        {/* Mini palette preview */}
        <div style={{ display:"flex", gap:3, alignItems:"flex-end", marginTop:16 }}>
          {palette.slice(0,10).map((c,i)=>(
            <div key={i} title={`Slot ${i} · ${c}\nClick to edit`}
              onClick={() => openWheel(i)}
              style={{ width:16, height:16, borderRadius:3, background:c, cursor:"pointer",
                border: i===editSlot&&showWheel ? "2px solid #1e293b" : "1px solid rgba(0,0,0,0.12)",
                transition:"transform 0.15s" }}
              onMouseEnter={e=>e.currentTarget.style.transform="scale(1.4)"}
              onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}
            />
          ))}
        </div>
      </div>

      <div style={{ minHeight:420 }}>
        {loading ? (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:420, color:"#94a3b8", fontSize:15 }}>Loading data…</div>
        ) : (
          <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
            <div style={{ flex:1, minWidth:0 }}>
              {viewMode==="2d"
                ? <Chart2D  key={`2d-${theme}`}  data={chartData} palette={palette} onBarClick={openWheel} />
                : <Chart3D  key={`3d-${theme}`}  data={chartData} palette={palette} onBarClick={openWheel} />
              }
            </div>
            <LegendHTML data={chartData} palette={palette} onColorClick={openWheel} />
          </div>
        )}
      </div>

      {/* Color Wheel Modal */}
      {showWheel && editSlot !== null && (
        <ColorWheel
          onClose={() => setShowWheel(false)}
          onApply={(colors, meta) => handleApplyColor(colors, { ...meta, slotIndex: editSlot })}
          initialColor={palette[editSlot] ?? "#6366f1"}
          categoryName={chartData[editSlot]?.month ?? `Slot ${editSlot}`}
        />
      )}
    </div>
  );
};

export default SimpleBarChart;