import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import * as THREE from "three";

const THEMES = {
  Modern:  ["#6366f1","#06b6d4","#10b981","#f59e0b","#ef4444"],
  Neon:    ["#ff0080","#00f5ff","#39ff14","#ffae00","#ff3131"],
  Pastel:  ["#a5b4fc","#67e8f9","#6ee7b7","#fde68a","#fca5a5"],
  Sunset:  ["#ff6b6b","#feca57","#ff9ff3","#48dbfb","#1dd1a1"],
  Ocean:   ["#03045e","#0077b6","#00b4d8","#90e0ef","#caf0f8"],
  Galaxy:  ["#4a306d","#7b2cbf","#9d4edd","#c77dff","#e0aaff"],
  Forest:  ["#1b4332","#40916c","#52b788","#74c69d","#95d5b2"],
  Autumn:  ["#7f4f24","#936639","#e63946","#c1121f","#b5838d"],
  Candy:   ["#ff006e","#fb5607","#ffbe0b","#8338ec","#3a86ff"],
  Earth:   ["#6b4f3c","#8b6914","#a07850","#3a7d44","#52796f"],
};

const DATA = [
  { category: "Technology", subcategory: "Hardware",    value: 120 },
  { category: "Technology", subcategory: "Software",    value: 180 },
  { category: "Technology", subcategory: "Services",    value: 100 },
  { category: "Retail",     subcategory: "Clothing",    value: 150 },
  { category: "Retail",     subcategory: "Electronics", value: 200 },
  { category: "Retail",     subcategory: "Groceries",   value: 250 },
  { category: "Finance",    subcategory: "Banking",     value: 220 },
  { category: "Finance",    subcategory: "Insurance",   value: 140 },
  { category: "Finance",    subcategory: "Investment",  value: 180 },
];

const SUBCATS = [...new Set(DATA.map(d => d.subcategory))];

const buildCategories = () =>
  Array.from(d3.group(DATA, d => d.category), ([key, values]) => ({
    key, values, total: d3.sum(values, d => d.value),
  }));

// ─── Shared Legend ────────────────────────────────────────────────────────────
function LegendHTML({ theme }) {
  const palette = THEMES[theme];
  const color   = d3.scaleOrdinal().domain(SUBCATS).range(palette);
  const cats    = buildCategories();
  const total   = d3.sum(DATA, d => d.value);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10, flexShrink:0, alignSelf:"flex-start" }}>
      <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:8, padding:"12px 14px", width:150, boxShadow:"0 1px 4px rgba(0,0,0,0.07)" }}>
        <div style={{ fontSize:10, fontWeight:"bold", color:"#94a3b8", letterSpacing:"0.08em", marginBottom:8 }}>
          PRODUCT LINES
        </div>
        {SUBCATS.map(s => (
          <div key={s} style={{ display:"flex", alignItems:"center", gap:7, marginBottom:5 }}>
            <div style={{ width:10, height:10, borderRadius:2, flexShrink:0, background:color(s) }} />
            <span style={{ color:"#334155", fontSize:11 }}>{s}</span>
          </div>
        ))}
      </div>
      <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:8, padding:"12px 14px", width:150, boxShadow:"0 1px 4px rgba(0,0,0,0.07)" }}>
        <div style={{ fontSize:10, fontWeight:"bold", color:"#94a3b8", letterSpacing:"0.08em", marginBottom:8 }}>
          INDUSTRIES
        </div>
        {cats.map(c => (
          <div key={c.key} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
            <span style={{ color:"#334155", fontSize:11 }}>{c.key}</span>
            <span style={{ color:"#64748b", fontSize:10, fontWeight:"bold" }}>{c.total}</span>
          </div>
        ))}
        <div style={{ borderTop:"1px solid #e2e8f0", marginTop:7, paddingTop:7, display:"flex", justifyContent:"space-between" }}>
          <span style={{ color:"#334155", fontSize:11, fontWeight:"bold" }}>Total</span>
          <span style={{ color:"#6366f1", fontSize:11, fontWeight:"bold" }}>{total}</span>
        </div>
      </div>
    </div>
  );
}

// ─── 2D Chart ─────────────────────────────────────────────────────────────────
function Chart2D({ theme }) {
  const svgRef  = useRef(null);
  const palette = THEMES[theme];
  const color   = d3.scaleOrdinal().domain(SUBCATS).range(palette);

  useEffect(() => {
    if (!svgRef.current) return;

    const W = 660, H = 420;
    const margin = { top:20, right:20, bottom:50, left:46 };
    const cW = W - margin.left - margin.right;
    const cH = H - margin.top  - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox",`0 0 ${W} ${H}`).attr("preserveAspectRatio","xMidYMid meet");
    svg.append("rect").attr("width",W).attr("height",H).attr("fill","#f8fafc").attr("rx",8);

    const cats       = buildCategories();
    const grandTotal = d3.sum(cats, c => c.total);
    const xScale     = d3.scaleLinear().domain([0,grandTotal]).range([0,cW]);
    const yScale     = d3.scaleLinear().domain([0,1]).range([cH,0]);
    const chart      = svg.append("g").attr("transform",`translate(${margin.left},${margin.top})`);

    [0,0.25,0.5,0.75,1].forEach(t => {
      chart.append("line")
        .attr("x1",0).attr("x2",cW).attr("y1",yScale(t)).attr("y2",yScale(t))
        .attr("stroke","#e2e8f0").attr("stroke-dasharray","4,3").attr("stroke-width",1);
    });

    const tooltip = d3.select("body").append("div")
      .style("position","absolute").style("background","rgba(15,23,42,0.92)")
      .style("color","#fff").style("padding","8px 12px").style("border-radius","6px")
      .style("font-size","12px").style("pointer-events","none").style("opacity",0)
      .style("border","1px solid #334155").style("z-index","9999");

    let currentX = 0;
    cats.forEach((cat, ci) => {
      const catW      = xScale(cat.total);
      const subTotals = d3.rollup(cat.values, v => d3.sum(v,d=>d.value), d=>d.subcategory);
      let currentY    = cH;

      SUBCATS.forEach(sub => {
        const val = subTotals.get(sub) || 0;
        if (!val) return;
        const rH  = (val / cat.total) * cH;
        const rY  = currentY - rH;
        const col = color(sub);
        const pct = ((val / grandTotal)*100).toFixed(1);

        chart.append("rect")
          .attr("x",currentX+3).attr("y",rY+3)
          .attr("width",catW-4).attr("height",rH)
          .attr("fill",d3.color(col).darker(0.8)).attr("rx",3).attr("opacity",0.15);

        chart.append("rect")
          .attr("x",currentX+1).attr("y",rY)
          .attr("width",catW-2).attr("height",rH)
          .attr("fill",col).attr("rx",3)
          .attr("stroke","#fff").attr("stroke-width",1.5).attr("opacity",0.9)
          .style("cursor","pointer")
          .on("mouseover", function(event) {
            d3.select(this).attr("opacity",1).attr("stroke-width",2.5);
            tooltip.style("opacity",1)
              .html(`<b style="color:${col}">${sub}</b><br/>Industry: ${cat.key}<br/>Value: <b>${val}</b><br/>Share: ${pct}%`)
              .style("left",(event.pageX+12)+"px").style("top",(event.pageY-10)+"px");
          })
          .on("mouseout", function() {
            d3.select(this).attr("opacity",0.9).attr("stroke-width",1.5);
            tooltip.style("opacity",0);
          });

        if (rH>26 && catW>55) {
          chart.append("text")
            .attr("x",currentX+catW/2).attr("y",rY+rH/2)
            .attr("text-anchor","middle").attr("dominant-baseline","middle")
            .style("font-size","10px").style("font-weight","700")
            .style("fill","#fff").style("pointer-events","none")
            .text(val>99 ? `${sub.slice(0,4)}: ${val}` : val);
        }
        currentY -= rH;
      });

      chart.append("text")
        .attr("x",currentX+catW/2).attr("y",cH+20)
        .attr("text-anchor","middle").style("font-size","11px").style("font-weight","700")
        .style("fill","#334155").text(cat.key);

      chart.append("text")
        .attr("x",currentX+catW/2).attr("y",cH+34)
        .attr("text-anchor","middle").style("font-size","9px")
        .style("fill","#94a3b8").text(`${((cat.total/grandTotal)*100).toFixed(0)}%`);

      if (ci < cats.length-1) {
        chart.append("line")
          .attr("x1",currentX+catW).attr("x2",currentX+catW)
          .attr("y1",0).attr("y2",cH)
          .attr("stroke","#fff").attr("stroke-width",2);
      }
      currentX += catW;
    });

    chart.append("g")
      .call(d3.axisLeft(yScale).tickFormat(d3.format(".0%")).ticks(5).tickSize(0))
      .call(g => { g.select(".domain").remove(); g.selectAll("text").style("font-size","10px").style("fill","#94a3b8"); });

    svg.append("text")
      .attr("transform",`translate(${margin.left+cW/2},${H-4})`)
      .attr("text-anchor","middle").style("font-size","10px").style("fill","#94a3b8")
      .text("Width = Ward Occupancy Share · Height = Hospital Cost Share");

    return () => tooltip.remove();
  }, [theme]);

  return (
    <div style={{ display:"flex", gap:12, alignItems:"flex-start", width:"100%", border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden" }}>
      <svg ref={svgRef} style={{ display:"block", flex:1, minWidth:0, height:420 }} />
      <div style={{ padding:"12px 12px 12px 0" }}>
        <LegendHTML theme={theme} />
      </div>
    </div>
  );
}

// ─── 3D Chart ─────────────────────────────────────────────────────────────────
function Chart3D({ theme }) {
  const mountRef   = useRef(null);
  const overlayRef = useRef(null);
  const palette    = THEMES[theme];
  const color      = d3.scaleOrdinal().domain(SUBCATS).range(palette);

  useEffect(() => {
    if (!mountRef.current) return;
    const el = mountRef.current;
    const W  = el.offsetWidth || 660;

    // ← FIXED: taller canvas so chart is not squished or clipped at top
    const H = 520;

    const scene  = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);

    // ← FIXED: pull camera back + higher angle so full chart is visible with space at top
    const camera = new THREE.PerspectiveCamera(38, W / H, 0.1, 200);
    camera.position.set(0, 13, 22);
    camera.lookAt(0, 3, 0);

    const renderer = new THREE.WebGLRenderer({ antialias:true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    el.appendChild(renderer.domElement);

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.65));
    const sun = new THREE.DirectionalLight(0xffffff, 1.1);
    sun.position.set(6, 14, 10); sun.castShadow = true;
    scene.add(sun);
    scene.add(new THREE.PointLight(0x6366f1, 0.55, 80));
    scene.add(new THREE.HemisphereLight(0xffffff, 0xe0e7ff, 0.4));

    // Floor — larger so it doesn't look cut off
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(44, 28),
      new THREE.MeshStandardMaterial({ color:0xf1f5f9, roughness:0.9 })
    );
    floor.rotation.x = -Math.PI/2; floor.receiveShadow = true;
    scene.add(floor);
    scene.add(new THREE.GridHelper(44, 36, 0xcccccc, 0xe2e8f0));

    const cats       = buildCategories();
    const grandTotal = d3.sum(cats, c => c.total);

    // ← FIXED: normalise block heights so tallest stack fills ~70% of view
    // Each category stack height is proportional to its share of grand total
    const BASE_H   = 9;   // height if a category were 100% of total
    const maxW     = 13;
    const depth    = 2.0;
    const pivot    = new THREE.Group();
    const labelAnchors = [];

    let currentX = -maxW / 2;

    cats.forEach((cat, ci) => {
      const catW      = (cat.total / grandTotal) * maxW;
      const subTotals = d3.rollup(cat.values, v => d3.sum(v,d=>d.value), d=>d.subcategory);
      const xCenter   = currentX + catW / 2;

      // Total stack height for this category proportional to its share
      const stackH    = (cat.total / grandTotal) * BASE_H * cats.length * 0.75;
      let currentY    = 0;

      SUBCATS.forEach(sub => {
        const val = subTotals.get(sub) || 0;
        if (!val) return;
        const bH  = (val / cat.total) * stackH;
        const col = new THREE.Color(color(sub));

        const geo = new THREE.BoxGeometry(catW - 0.1, bH, depth);
        const mat = new THREE.MeshStandardMaterial({
          color:col, roughness:0.22, metalness:0.4,
          emissive:col, emissiveIntensity:0.1,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(xCenter, currentY + bH/2, 0);
        mesh.castShadow = true;
        pivot.add(mesh);

        // Edge outline
        const eg = new THREE.EdgesGeometry(geo);
        const el2 = new THREE.LineSegments(eg, new THREE.LineBasicMaterial({ color:0xffffff }));
        el2.position.set(xCenter, currentY + bH/2, 0);
        pivot.add(el2);

        // Glow cap
        const capCol = col.clone().lerp(new THREE.Color(0xffffff), 0.25);
        const cap    = new THREE.Mesh(
          new THREE.BoxGeometry(catW - 0.1, 0.07, depth),
          new THREE.MeshStandardMaterial({ color:capCol, emissive:capCol, emissiveIntensity:1.2, roughness:0.04, metalness:1 })
        );
        cap.position.set(xCenter, currentY + bH + 0.035, 0);
        pivot.add(cap);

        // Label anchor inside block
        if (bH > 1.0) {
          labelAnchors.push({ x:xCenter, y:currentY+bH/2, z:depth/2+0.1, text:`${sub}: ${val}`, col:color(sub), isCategory:false });
        }

        currentY += bH;
      });

      // Category label — pushed further below floor so it doesn't overlap blocks
      labelAnchors.push({ x:xCenter, y:-0.9, z:0, text:cat.key, col:"#334155", isCategory:true });

      // Vertical divider between categories
      if (ci < cats.length-1) {
        const stackH2 = (cat.total / grandTotal) * BASE_H * cats.length * 0.75;
        const div = new THREE.Mesh(
          new THREE.BoxGeometry(0.06, stackH2 + 0.5, depth + 0.2),
          new THREE.MeshBasicMaterial({ color:0xffffff, transparent:true, opacity:0.55 })
        );
        div.position.set(currentX + catW, stackH2 / 2, 0);
        pivot.add(div);
      }

      currentX += catW;
    });

    // ← FIXED: shift pivot down slightly so there's headroom above tallest block
    pivot.position.y = -1.5;
    scene.add(pivot);

    const toScreen = (x3, y3, z3) => {
      const v = new THREE.Vector3(x3, y3, z3).project(camera);
      return { sx:(v.x*0.5+0.5)*W, sy:(-v.y*0.5+0.5)*H, behind:v.z>1 };
    };

    // Drag orbit
    let isDragging=false, prevX=0, prevY=0, rotX=0.22, rotY=0, autoSpin=true;
    const onDown = e => { isDragging=true; prevX=e.clientX; prevY=e.clientY; autoSpin=false; renderer.domElement.style.cursor="grabbing"; };
    const onUp   = () => { isDragging=false; renderer.domElement.style.cursor="grab"; };
    const onMove = e => {
      if (!isDragging) return;
      rotY += (e.clientX-prevX)*0.006;
      rotX  = Math.max(-0.8, Math.min(0.8, rotX+(e.clientY-prevY)*0.004));
      prevX=e.clientX; prevY=e.clientY;
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
        overlayRef.current.querySelectorAll(".m3lbl").forEach((elDiv, i) => {
          const a      = labelAnchors[i];
          // Apply pivot rotation + pivot world offset
          const local  = new THREE.Vector3(a.x, a.y, a.z);
          const rotVec = local.applyEuler(pivot.rotation);
          rotVec.y    += pivot.position.y;
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
  }, [theme]);

  return (
    <div style={{ display:"flex", gap:12, alignItems:"flex-start", width:"100%", border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden" }}>
      <div style={{ position:"relative", flex:1, minWidth:0 }}>

        {/* ← FIXED: mountRef div uses height:520 matching the renderer */}
        <div ref={mountRef} style={{ width:"100%", height:520, cursor:"grab" }} />

        {/* Projected labels */}
        <div ref={overlayRef} style={{ position:"absolute", inset:0, pointerEvents:"none" }}>
          {labelAnchorsForJSX(theme).map((a, i) => (
            <div key={i} className="m3lbl" style={{
              position:"absolute",
              transform: a.isCategory ? "translate(-50%,0%)" : "translate(-50%,-50%)",
              background: a.isCategory ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.93)",
              color: a.isCategory ? "#334155" : a.col,
              fontSize: a.isCategory ? 10 : 9,
              fontWeight:"bold",
              padding:"2px 6px", borderRadius:3,
              border: a.isCategory ? "1px solid #e2e8f0" : `1px solid ${a.col}55`,
              whiteSpace:"nowrap",
              transition:"opacity 0.1s", pointerEvents:"none",
              boxShadow:"0 1px 3px rgba(0,0,0,0.10)",
            }}>
              {a.text}
            </div>
          ))}
        </div>

        <div style={{ padding:"7px 14px", background:"#f8fafc", borderTop:"1px solid #e2e8f0", fontSize:11, color:"#94a3b8" }}>
          💡 Drag to rotate · auto-spins until you interact · Width = industry size · Height = product share
        </div>
      </div>

      <div style={{ padding:"12px 12px 12px 0" }}>
        <LegendHTML theme={theme} />
      </div>
    </div>
  );
}

// Pre-build label list for JSX render — mirrors useEffect labelAnchors order
function labelAnchorsForJSX(theme) {
  const palette    = THEMES[theme];
  const color      = d3.scaleOrdinal().domain(SUBCATS).range(palette);
  const cats       = buildCategories();
  const grandTotal = d3.sum(cats, c => c.total);
  const BASE_H     = 9;
  const out        = [];

  cats.forEach(cat => {
    const subTotals = d3.rollup(cat.values, v => d3.sum(v,d=>d.value), d=>d.subcategory);
    const stackH    = (cat.total / grandTotal) * BASE_H * cats.length * 0.75;
    let   currentY  = 0;

    SUBCATS.forEach(sub => {
      const val = subTotals.get(sub) || 0;
      if (!val) return;
      const bH = (val / cat.total) * stackH;
      if (bH > 1.0) {
        out.push({ text:`${sub}: ${val}`, col:color(sub), isCategory:false });
      }
      currentY += bH;
    });

    out.push({ text:cat.key, col:"#334155", isCategory:true });
  });

  return out;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const MarimekkoChart = () => {
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
      // ← FIXED: increased bottom padding so chart has breathing room
      padding:"20px 24px 40px 24px",
      width:"100%",
      boxShadow:"0 1px 3px rgba(0,0,0,0.08)", boxSizing:"border-box",
    }}>
      {/* Title */}
      <div style={{ marginBottom:4 }}>
        <div style={{ fontSize:16, fontWeight:"bold", color:"#1e293b" }}>Marimekko Chart</div>
        <div style={{ fontSize:12, color:"#94a3b8", marginTop:2 }}>
          Sales by industry (width) and product line (height) · Values in $M
        </div>
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

      {viewMode === "2d"
        ? <Chart2D key="2d" theme={theme} />
        : <Chart3D key="3d" theme={theme} />
      }
    </div>
  );
};

export default MarimekkoChart;