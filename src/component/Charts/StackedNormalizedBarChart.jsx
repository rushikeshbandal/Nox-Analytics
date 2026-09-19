import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import * as THREE from "three";

const AGES = ["<10","10-19","20-29","30-39","40-49","50-59","60-69","70-79","≥80"];

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

const getTotal = (row) => AGES.reduce((s, k) => s + (row[k] || 0), 0);

// ─── Legend ───────────────────────────────────────────────────────────────────
function LegendHTML({ theme, topStates }) {
  const palette = THEMES[theme];
  const color   = d3.scaleOrdinal().domain(AGES).range(palette);
  return (
    <div style={{
      background:"#fff", border:"1px solid #e2e8f0", borderRadius:8,
      padding:"12px 14px", width:160, flexShrink:0,
      boxShadow:"0 1px 4px rgba(0,0,0,0.07)", alignSelf:"flex-start",
    }}>
      <div style={{ fontSize:10, fontWeight:"bold", color:"#94a3b8", letterSpacing:"0.08em", marginBottom:8 }}>
        AGE GROUPS
      </div>
      {AGES.map(k => (
        <div key={k} style={{ display:"flex", alignItems:"center", gap:7, marginBottom:5 }}>
          <div style={{ width:10, height:10, borderRadius:2, flexShrink:0, background:color(k) }} />
          <span style={{ color:"#334155", fontSize:11 }}>{k}</span>
        </div>
      ))}
      {topStates && topStates.length > 0 && <>
        <div style={{ borderTop:"1px solid #e2e8f0", margin:"10px 0" }} />
        <div style={{ fontSize:10, fontWeight:"bold", color:"#94a3b8", letterSpacing:"0.08em", marginBottom:8 }}>
          TOP STATES
        </div>
        {topStates.map(r => (
          <div key={r.name} style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
            <span style={{ color:"#334155", fontSize:11 }}>{r.name}</span>
            <span style={{ color:"#64748b", fontSize:10, fontWeight:"600" }}>{(r.total/1e6).toFixed(1)}M</span>
          </div>
        ))}
      </>}
    </div>
  );
}

// ─── 2D Chart ─────────────────────────────────────────────────────────────────
function Chart2D({ rows, theme }) {
  const svgRef = useRef(null);
  const palette = THEMES[theme];
  const color   = d3.scaleOrdinal().domain(AGES).range(palette);

  // sort by total population desc
  const sorted = [...rows].sort((a, b) => getTotal(b) - getTotal(a));

  useEffect(() => {
    if (!svgRef.current || !rows.length) return;

    const W      = 680;
    const rowH   = 22;
    const margin = { top:32, right:16, bottom:16, left:52 };
    const H      = sorted.length * rowH + margin.top + margin.bottom;

    const ageKeys = AGES.filter(k => rows[0] && rows[0][k] !== undefined);

    const series = d3.stack()
      .keys(ageKeys)
      .offset(d3.stackOffsetExpand)(sorted);

    const x = d3.scaleLinear().domain([0,1]).range([margin.left, W - margin.right]);
    const y = d3.scaleBand()
      .domain(sorted.map(d => d.name))
      .range([margin.top, H - margin.bottom])
      .padding(0.18);

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("width", W).attr("height", H);
    svg.append("rect").attr("width",W).attr("height",H).attr("fill","#f8fafc").attr("rx",8);

    // Grid
    svg.append("g").attr("transform",`translate(0,${H-margin.bottom})`)
      .call(d3.axisBottom(x).tickFormat("").tickSize(-(H-margin.top-margin.bottom)).ticks(5))
      .call(g => { g.select(".domain").remove(); g.selectAll("line").style("stroke","#e2e8f0").style("stroke-dasharray","4,3"); });

    // Tooltip
    const tooltip = d3.select("body").append("div")
      .style("position","absolute").style("background","rgba(15,23,42,0.92)")
      .style("color","#fff").style("padding","8px 12px").style("border-radius","6px")
      .style("font-size","12px").style("pointer-events","none").style("opacity",0)
      .style("border","1px solid #334155").style("z-index","9999");

    // Stacked bars
    series.forEach(layer => {
      svg.append("g").selectAll("rect").data(layer).enter().append("rect")
        .attr("x",      d => x(d[0]))
        .attr("y",      d => y(d.data.name))
        .attr("width",  d => Math.max(0, x(d[1]) - x(d[0])))
        .attr("height", y.bandwidth())
        .attr("fill",   color(layer.key))
        .attr("rx", 2).attr("opacity", 0.88)
        .attr("stroke","#fff").attr("stroke-width",0.4)
        .style("cursor","pointer")
        .on("mouseover", function(event, d) {
          d3.select(this).attr("opacity",1);
          const pct = ((d[1]-d[0])*100).toFixed(1);
          const val = d.data[layer.key];
          tooltip.style("opacity",1)
            .html(
              `<b style="color:${color(layer.key)}">${layer.key}</b><br/>` +
              `State: ${d.data.name}<br/>` +
              `Population: <b>${val ? val.toLocaleString() : 0}</b><br/>` +
              `Share: <b>${pct}%</b>`
            )
            .style("left",(event.pageX+12)+"px").style("top",(event.pageY-10)+"px");
        })
        .on("mouseout", function() { d3.select(this).attr("opacity",0.88); tooltip.style("opacity",0); });

      // Percentage labels inside wide segments
      svg.append("g").selectAll("text").data(layer).enter().append("text")
        .filter(d => (x(d[1]) - x(d[0])) > 34)
        .attr("x",  d => (x(d[0])+x(d[1]))/2)
        .attr("y",  d => y(d.data.name) + y.bandwidth()/2)
        .attr("dy","0.35em").attr("text-anchor","middle")
        .attr("fill","#fff").style("font-size","8px").style("font-weight","700")
        .style("pointer-events","none")
        .text(d => `${((d[1]-d[0])*100).toFixed(0)}%`);
    });

    // Top axis (%)
    svg.append("g").attr("transform",`translate(0,${margin.top})`)
      .call(d3.axisTop(x).ticks(5).tickFormat(d3.format(".0%")))
      .call(g => { g.select(".domain").style("stroke","#e2e8f0"); g.selectAll("text").style("fill","#64748b").style("font-size","10px"); });

    // Left axis
    svg.append("g").attr("transform",`translate(${margin.left},0)`)
      .call(d3.axisLeft(y).tickSize(0).tickPadding(6))
      .call(g => { g.select(".domain").remove(); g.selectAll("text").style("fill","#334155").style("font-size","10px").style("font-weight","600"); });

    svg.append("text")
      .attr("transform",`translate(${(W+margin.left)/2},${H-2})`)
      .attr("text-anchor","middle").style("font-size","11px").style("fill","#94a3b8")
      .text("100% Normalized Population by Age Group");

    return () => tooltip.remove();
  }, [rows, theme]);

  const topStates = sorted.slice(0,8).map(r => ({ name:r.name, total:getTotal(r) }));

  return (
    <div style={{ display:"flex", gap:12, alignItems:"flex-start", width:"100%", border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden" }}>
      <div style={{ flex:1, minWidth:0, overflowY:"auto", maxHeight:560 }}>
        <svg ref={svgRef} style={{ display:"block" }} />
      </div>
      <div style={{ padding:"12px 12px 12px 0" }}>
        <LegendHTML theme={theme} topStates={topStates} />
      </div>
    </div>
  );
}

// ─── 3D Chart — AxesHelper removed, clean vertical bars, glow caps ────────────
function Chart3D({ rows, theme }) {
  const mountRef   = useRef(null);
  const overlayRef = useRef(null);
  const palette    = THEMES[theme];
  const color      = d3.scaleOrdinal().domain(AGES).range(palette);

  // Top 10 states by total population
  const top10 = [...rows]
    .sort((a, b) => getTotal(b) - getTotal(a))
    .slice(0, 10);

  useEffect(() => {
    const el = mountRef.current;
    if (!el || !top10.length) return;

    // Clear previous canvas
    while (el.firstChild) el.removeChild(el.firstChild);

    const W = el.clientWidth || 680;
    const H = 480;

    const scene  = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);

    const camera = new THREE.PerspectiveCamera(42, W/H, 0.1, 200);
    camera.position.set(0, 10, 20);
    camera.lookAt(0, 2, 0);

    const renderer = new THREE.WebGLRenderer({ antialias:true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.domElement.style.display    = "block";
    renderer.domElement.style.outline    = "none";
    renderer.domElement.style.userSelect = "none";
    el.appendChild(renderer.domElement);

    // ── Lights — NO AxesHelper ────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 0.75));
    const sun = new THREE.DirectionalLight(0xffffff, 1.0);
    sun.position.set(6,14,10); sun.castShadow=true; scene.add(sun);
    const rimL = new THREE.PointLight(new THREE.Color(palette[0]), 0.4, 60);
    rimL.position.set(-10,6,-6); scene.add(rimL);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xe0e7ff, 0.45));

    // ── Floor + clean grid ────────────────────────────────────────────────
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(44, 30),
      new THREE.MeshStandardMaterial({ color:0xf1f5f9, roughness:0.9 })
    );
    floor.rotation.x = -Math.PI/2; floor.receiveShadow=true; scene.add(floor);
    scene.add(new THREE.GridHelper(44, 36, 0xcccccc, 0xe2e8f0));

    const maxFrac  = 1 / AGES.length; // roughly equal share
    const maxH     = 8;
    const groupGap = 3.0;
    const barD     = 0.52;
    const barW     = 0.54;

    const pivot        = new THREE.Group();
    const labelAnchors = [];

    top10.forEach((row, ri) => {
      const total  = getTotal(row);
      const z      = (ri - (top10.length-1)/2) * groupGap;
      let xOffset  = -(AGES.length * (barW+0.06)) / 2;

      AGES.forEach((age, ai) => {
        const val  = row[age] || 0;
        const frac = total > 0 ? val / total : 0;
        if (frac === 0) { xOffset += barW+0.06; return; }

        // Height = normalized fraction × maxH
        const bh  = frac * maxH * (AGES.length / 1.5);
        const col = new THREE.Color(color(age));
        const xp  = xOffset + barW/2;

        // Shadow
        const sm = new THREE.Mesh(
          new THREE.BoxGeometry(barW, bh*0.08, barD),
          new THREE.MeshBasicMaterial({ color:0xbbbbbb, transparent:true, opacity:0.08 })
        );
        sm.position.set(xp+0.04, bh*0.04, z+0.04); pivot.add(sm);

        // Main bar — metallic + emissive
        const geo  = new THREE.BoxGeometry(barW, bh, barD);
        const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
          color:col, roughness:0.22, metalness:0.45,
          emissive:col, emissiveIntensity:0.22,
        }));
        mesh.position.set(xp, bh/2, z);
        mesh.castShadow = true;
        pivot.add(mesh);

        // Edge outline
        const eln = new THREE.LineSegments(
          new THREE.EdgesGeometry(geo),
          new THREE.LineBasicMaterial({ color:0xffffff, transparent:true, opacity:0.45 })
        );
        eln.position.set(xp, bh/2, z); pivot.add(eln);

        // Glow cap
        const capC = col.clone().lerp(new THREE.Color(0xffffff), 0.28);
        const cap  = new THREE.Mesh(
          new THREE.BoxGeometry(barW, 0.07, barD),
          new THREE.MeshStandardMaterial({
            color:capC, emissive:capC,
            emissiveIntensity:1.3, roughness:0.04, metalness:1,
          })
        );
        cap.position.set(xp, bh+0.035, z); pivot.add(cap);

        // Label anchors
        labelAnchors.push({ x:xp, y:bh+0.60, z, text:`${(frac*100).toFixed(1)}%`, col:`#${col.getHexString()}`, type:"value"  });
        labelAnchors.push({ x:xp, y:bh+1.30, z, text:age,                          col:`#${col.getHexString()}`, type:"age"    });
        xOffset += barW+0.06;
      });

      // State label
      labelAnchors.push({ x:0, y:-0.65, z, text:row.name, col:"#334155", type:"region" });
    });

    scene.add(pivot);

    const toScreen = (x3,y3,z3) => {
      const v = new THREE.Vector3(x3,y3,z3).project(camera);
      return { sx:(v.x*0.5+0.5)*W, sy:(-v.y*0.5+0.5)*H, behind:v.z>1 };
    };

    // Set overlay text
    if (overlayRef.current) {
      const divs = overlayRef.current.querySelectorAll(".shlbl");
      labelAnchors.forEach((a, i) => { if (divs[i]) divs[i].textContent = a.text; });
    }

    // Drag rotation + auto-spin — NO OrbitControls
    let isDragging=false, prevX=0, prevY=0,
        rotX=0.28, rotY=0, autoSpin=true;
    pivot.rotation.x = rotX;
    pivot.rotation.y = rotY;

    const onDown = e => {
      e.preventDefault();
      isDragging=true; prevX=e.clientX; prevY=e.clientY;
      autoSpin=false; renderer.domElement.style.cursor="grabbing";
    };
    const onUp   = () => { isDragging=false; renderer.domElement.style.cursor="grab"; };
    const onMove = e => {
      if (!isDragging) return;
      rotY += (e.clientX-prevX)*0.006;
      rotX  = Math.max(-0.8, Math.min(0.8, rotX+(e.clientY-prevY)*0.004));
      prevX=e.clientX; prevY=e.clientY;
    };

    renderer.domElement.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup",   onUp);
    window.addEventListener("mousemove", onMove);
    renderer.domElement.style.cursor = "grab";

    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (autoSpin) rotY += 0.004;
      pivot.rotation.y = rotY;
      pivot.rotation.x = rotX;
      camera.updateMatrixWorld();

      if (overlayRef.current) {
        overlayRef.current.querySelectorAll(".shlbl").forEach((div, i) => {
          const a = labelAnchors[i];
          if (!a) return;
          const rotVec = new THREE.Vector3(a.x,a.y,a.z).applyEuler(pivot.rotation);
          const { sx, sy, behind } = toScreen(rotVec.x, rotVec.y, rotVec.z);
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
  }, [theme, rows]);

  // JSX overlay labels — (9 ages × 2 labels) + 1 region per state × 10 states
  const jsxLabels = [];
  top10.forEach(row => {
    AGES.forEach((age, ai) => {
      const val = row[age] || 0;
      if (val === 0) return;
      const col = palette[ai % palette.length];
      jsxLabels.push({ col, type:"value" });
      jsxLabels.push({ col, type:"age"   });
    });
    jsxLabels.push({ col:"#334155", type:"region" });
  });

  const topStates = top10.map(r => ({ name:r.name, total:getTotal(r) }));

  return (
    <div style={{ display:"flex", gap:12, alignItems:"flex-start", width:"100%", border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden" }}>
      <div style={{ position:"relative", flex:1, minWidth:0, userSelect:"none" }}>
        <div ref={mountRef} style={{ width:"100%", height:480, cursor:"grab", overflow:"hidden" }} />

        {/* HTML label overlay */}
        <div ref={overlayRef} style={{ position:"absolute", inset:0, pointerEvents:"none", overflow:"hidden" }}>
          {jsxLabels.map((a, i) => (
            <div key={i} className="shlbl" style={{
              position:      "absolute",
              transform:     a.type==="region" ? "translate(-50%,0%)" : "translate(-50%,-100%)",
              background:    a.type==="region" ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.93)",
              color:         a.col,
              fontSize:      a.type==="age" ? 8 : a.type==="value" ? 9 : 10,
              fontWeight:    "bold",
              padding:       "2px 5px",
              borderRadius:  3,
              border:        a.type==="region" ? "1px solid #e2e8f0" : `1px solid ${a.col}55`,
              whiteSpace:    "nowrap",
              pointerEvents: "none",
              boxShadow:     "0 1px 3px rgba(0,0,0,0.08)",
              opacity:       0,
            }} />
          ))}
        </div>

        <div style={{ padding:"7px 14px", background:"#f8fafc", borderTop:"1px solid #e2e8f0", fontSize:11, color:"#94a3b8" }}>
          💡 Drag to rotate · auto-spins · Bar height = age share · Top 10 states by population
        </div>
      </div>

      <div style={{ padding:"12px 12px 12px 0" }}>
        <LegendHTML theme={theme} topStates={topStates} />
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const StackedNormalizedBarChart = ({
  csvPath = "/us-population-state-age.csv",
}) => {
  const [rows,     setRows]     = useState([]);
  const [theme,    setTheme]    = useState("Modern");
  const [viewMode, setViewMode] = useState("2d");
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    d3.csv(csvPath, d3.autoType)
      .then(data => { setRows(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [csvPath]);

  const ddStyle = {
    padding:"5px 10px", borderRadius:6, border:"1px solid #e2e8f0",
    background:"#fff", color:"#334155", fontWeight:"500",
    cursor:"pointer", fontSize:12, outline:"none",
  };

  return (
    <div style={{
      background:"#ffffff", borderRadius:12, padding:"20px 24px 32px 24px",
      width:"100%", boxShadow:"0 1px 3px rgba(0,0,0,0.08)", boxSizing:"border-box",
    }}>
      <div style={{ marginBottom:4 }}>
        <div style={{ fontSize:16, fontWeight:"bold", color:"#1e293b" }}>
          100% Stacked Population by Age
        </div>
        <div style={{ fontSize:12, color:"#94a3b8", marginTop:2 }}>
          US Population normalized by state · Age group share
        </div>
      </div>

      {/* Controls */}
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

      <div style={{ minHeight:480 }}>
        {loading ? (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:480, color:"#94a3b8", fontSize:15 }}>
            Loading data…
          </div>
        ) : viewMode === "2d" ? (
          <Chart2D key={`2d-${theme}`} rows={rows} theme={theme} />
        ) : (
          <Chart3D key={`3d-${theme}`} rows={rows} theme={theme} />
        )}
      </div>
    </div>
  );
};

export default StackedNormalizedBarChart;