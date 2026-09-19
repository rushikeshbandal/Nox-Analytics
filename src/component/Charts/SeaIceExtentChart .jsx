import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import * as THREE from "three";

const THEMES = {
  Modern:  { primary:"#6366f1", glow:"#a5b4fc" },
  Neon:    { primary:"#ff0080", glow:"#00f5ff"  },
  Pastel:  { primary:"#a5b4fc", glow:"#67e8f9"  },
  Sunset:  { primary:"#ff6b6b", glow:"#feca57"  },
  Ocean:   { primary:"#0077b6", glow:"#48cae4"  },
  Galaxy:  { primary:"#7b2cbf", glow:"#c77dff"  },
  Forest:  { primary:"#2d6a4f", glow:"#52b788"  },
  Autumn:  { primary:"#e63946", glow:"#f59e0b"  },
  Candy:   { primary:"#8338ec", glow:"#ff006e"  },
  Earth:   { primary:"#6b4f3c", glow:"#3a7d44"  },
};

const DATA = [
  { year:1978, extent:7.8 },
  { year:1985, extent:7.6 },
  { year:1990, extent:7.4 },
  { year:1995, extent:6.9 },
  { year:2000, extent:6.5 },
  { year:2005, extent:5.8 },
  { year:2007, extent:5.4 },
  { year:2010, extent:5.1 },
  { year:2012, extent:4.8 },
  { year:2015, extent:4.9 },
  { year:2017, extent:4.6 },
];

// ─── Shared Legend ─────────────────────────────────────────────────────────────
function LegendHTML({ theme }) {
  const t    = THEMES[theme];
  const maxV = d3.max(DATA, d=>d.extent);
  const minV = d3.min(DATA, d=>d.extent);
  const diff = (maxV - minV).toFixed(1);
  return (
    <div style={{
      background:"#fff", border:"1px solid #e2e8f0", borderRadius:8,
      padding:"12px 14px", width:155, flexShrink:0,
      boxShadow:"0 1px 4px rgba(0,0,0,0.07)", alignSelf:"flex-start",
    }}>
      <div style={{ fontSize:10, fontWeight:"bold", color:"#94a3b8", letterSpacing:"0.08em", marginBottom:8 }}>
        LEGEND
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:6 }}>
        <div style={{ width:20, height:3, background:t.primary, borderRadius:2 }} />
        <span style={{ color:"#334155", fontSize:11 }}>Sea Ice Trend</span>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:10 }}>
        <div style={{ width:10, height:10, borderRadius:"50%", background:t.glow }} />
        <span style={{ color:"#334155", fontSize:11 }}>Data point</span>
      </div>
      <div style={{ borderTop:"1px solid #e2e8f0", margin:"8px 0" }} />
      <div style={{ fontSize:10, fontWeight:"bold", color:"#94a3b8", letterSpacing:"0.08em", marginBottom:6 }}>
        STATS
      </div>
      {[
        ["Period",  "1978–2017"],
        ["Points",  DATA.length],
        ["Max",     `${maxV} M km²`],
        ["Min",     `${minV} M km²`],
        ["Decline", `−${diff} M km²`],
      ].map(([k,v]) => (
        <div key={k} style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
          <span style={{ fontSize:10, color:"#94a3b8" }}>{k}</span>
          <span style={{ fontSize:10, fontWeight:"bold", color:"#334155" }}>{v}</span>
        </div>
      ))}
      <div style={{ fontSize:9, color:"#94a3b8", marginTop:6 }}>
        Arctic Sea Ice Extent<br/>Million sq km (Sep min)
      </div>
    </div>
  );
}

// ─── 2D Chart ──────────────────────────────────────────────────────────────────
function Chart2D({ theme }) {
  const svgRef = useRef(null);
  const t      = THEMES[theme];

  useEffect(() => {
    if (!svgRef.current) return;

    const W = 580, H = 400;
    const margin = { top:22, right:20, bottom:50, left:56 };
    const cW = W - margin.left - margin.right;
    const cH = H - margin.top  - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox",`0 0 ${W} ${H}`).attr("preserveAspectRatio","xMidYMid meet");
    svg.append("rect").attr("width",W).attr("height",H).attr("fill","#f8fafc").attr("rx",8);

    const x = d3.scaleLinear().domain(d3.extent(DATA,d=>d.year)).range([0,cW]);
    const y = d3.scaleLinear().domain([4,8.2]).range([cH,0]);

    const chart = svg.append("g").attr("transform",`translate(${margin.left},${margin.top})`);

    // Grid
    y.ticks(5).forEach(v => {
      chart.append("line").attr("x1",0).attr("x2",cW).attr("y1",y(v)).attr("y2",y(v))
        .attr("stroke","#e2e8f0").attr("stroke-dasharray","4,3").attr("stroke-width",1);
    });

    // Gradient defs
    const defs = svg.append("defs");
    const gr   = defs.append("linearGradient").attr("id",`sig-${theme}`)
      .attr("x1","0%").attr("x2","0%").attr("y1","0%").attr("y2","100%");
    gr.append("stop").attr("offset","0%").attr("stop-color",t.primary).attr("stop-opacity",0.45);
    gr.append("stop").attr("offset","100%").attr("stop-color",t.primary).attr("stop-opacity",0.05);

    // Area fill
    chart.append("path").datum(DATA)
      .attr("fill",`url(#sig-${theme})`)
      .attr("d", d3.area().x(d=>x(d.year)).y0(cH).y1(d=>y(d.extent)).curve(d3.curveMonotoneX));

    // Shadow line
    chart.append("path").datum(DATA)
      .attr("fill","none").attr("stroke","#cbd5e1").attr("stroke-width",4).attr("opacity",0.35)
      .attr("d", d3.line().x(d=>x(d.year)+2).y(d=>y(d.extent)+2).curve(d3.curveMonotoneX));

    // Main line
    chart.append("path").datum(DATA)
      .attr("fill","none").attr("stroke",t.primary).attr("stroke-width",2.5)
      .attr("stroke-linejoin","round").attr("stroke-linecap","round")
      .attr("d", d3.line().x(d=>x(d.year)).y(d=>y(d.extent)).curve(d3.curveMonotoneX));

    // Tooltip
    const tooltip = d3.select("body").append("div")
      .style("position","absolute").style("background","rgba(15,23,42,0.92)")
      .style("color","#fff").style("padding","8px 12px").style("border-radius","6px")
      .style("font-size","12px").style("pointer-events","none").style("opacity",0)
      .style("border","1px solid #334155").style("z-index","9999");

    // Dots + labels
    DATA.forEach(d => {
      chart.append("circle")
        .attr("cx",x(d.year)).attr("cy",y(d.extent)).attr("r",5)
        .attr("fill",t.glow).attr("stroke","#fff").attr("stroke-width",1.5)
        .style("cursor","pointer")
        .on("mouseover", function(event) {
          d3.select(this).attr("r",8);
          tooltip.style("opacity",1)
            .html(`<b style="color:${t.glow}">${d.year}</b><br/>Extent: <b>${d.extent} M km²</b>`)
            .style("left",(event.pageX+12)+"px").style("top",(event.pageY-10)+"px");
        })
        .on("mouseout", function() { d3.select(this).attr("r",5); tooltip.style("opacity",0); });

      chart.append("text")
        .attr("x",x(d.year)).attr("y",y(d.extent)-9)
        .attr("text-anchor","middle")
        .style("font-size","9px").style("font-weight","700").style("fill",t.primary)
        .style("pointer-events","none").text(d.extent);
    });

    // X axis
    chart.append("g").attr("transform",`translate(0,${cH})`)
      .call(d3.axisBottom(x).tickFormat(d3.format("d")).ticks(DATA.length))
      .call(g => {
        g.select(".domain").style("stroke","#e2e8f0");
        g.selectAll("text").style("fill","#64748b").style("font-size","9px")
          .attr("transform","rotate(-30)").style("text-anchor","end");
      });

    // Y axis
    chart.append("g")
      .call(d3.axisLeft(y).ticks(5).tickFormat(d=>`${d}M`))
      .call(g => {
        g.select(".domain").remove(); g.selectAll("line").remove();
        g.selectAll("text").style("fill","#94a3b8").style("font-size","10px");
      });

    // Axis labels
    svg.append("text")
      .attr("transform",`translate(${margin.left+cW/2},${H-4})`)
      .attr("text-anchor","middle").style("font-size","11px").style("fill","#94a3b8").text("Year");
    svg.append("text")
      .attr("transform","rotate(-90)").attr("x",-(margin.top+cH/2)).attr("y",14)
      .attr("text-anchor","middle").style("font-size","11px").style("fill","#94a3b8")
      .text("OPD Registrations (Count)");

    return () => tooltip.remove();
  }, [theme]);

  return (
    <div style={{ display:"flex", gap:12, alignItems:"flex-start", width:"100%",
      border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden" }}>
      <svg ref={svgRef} style={{ display:"block", flex:1, minWidth:0, height:400 }} />
      <div style={{ padding:"12px 12px 12px 0" }}>
        <LegendHTML theme={theme} />
      </div>
    </div>
  );
}

// ─── 3D Chart ──────────────────────────────────────────────────────────────────
function Chart3D({ theme }) {
  const mountRef   = useRef(null);
  const overlayRef = useRef(null);
  const t          = THEMES[theme];

  useEffect(() => {
    if (!mountRef.current) return;
    const el = mountRef.current;
    const W  = el.offsetWidth || 580, H = 400;

    const minExtent = 4, maxExtent = 8;
    const maxH  = 8;
    const n     = DATA.length;
    // ── FIX: scale bar heights from extent range ──
    const scaleH = v => Math.max(0.15, ((v - minExtent) / (maxExtent - minExtent)) * maxH + 0.4);
    const xOf    = i => (i/(n-1))*18 - 9;

    const scene  = new THREE.Scene();
    // ── FIX: white background matches card — not dark ──
    scene.background = new THREE.Color(0xf8fafc);

    const camera = new THREE.PerspectiveCamera(40, W/H, 0.1, 200);
    camera.position.set(0, 10, 18);
    camera.lookAt(0, 3, 0);

    const renderer = new THREE.WebGLRenderer({ antialias:true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    renderer.shadowMap.enabled = true;
    el.appendChild(renderer.domElement);

    // ── FIX: no OrbitControls / CSS2DRenderer — both fail silently ──
    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.75));
    const sun = new THREE.DirectionalLight(0xffffff, 1.0);
    sun.position.set(6,14,10); sun.castShadow=true; scene.add(sun);
    const frontL = new THREE.PointLight(0xffffff, 0.5, 80);
    frontL.position.set(0,8,18); scene.add(frontL);
    const rimL = new THREE.PointLight(new THREE.Color(t.primary), 0.45, 60);
    rimL.position.set(-10,6,-6); scene.add(rimL);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xe0e7ff, 0.45));

    // Floor
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(32,20),
      new THREE.MeshStandardMaterial({ color:0xf1f5f9, roughness:0.9 })
    );
    floor.rotation.x=-Math.PI/2; floor.receiveShadow=true; scene.add(floor);
    scene.add(new THREE.GridHelper(32,28,0xcccccc,0xe2e8f0));

    const pivot        = new THREE.Group();
    const labelAnchors = [];
    const linePoints   = [];

    DATA.forEach((d, i) => {
      const bh  = scaleH(d.extent);
      const xp  = xOf(i);
      // ── FIX: use theme primary color for all bars, glow for cap ──
      const colBar  = new THREE.Color(t.primary);
      const colGlow = new THREE.Color(t.glow);

      // Shadow
      const sm = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, bh*0.1, 0.6),
        new THREE.MeshBasicMaterial({ color:0xbbbbbb, transparent:true, opacity:0.12 })
      );
      sm.position.set(xp+0.05, bh*0.05, 0.05); pivot.add(sm);

      // Main bar
      const geo = new THREE.BoxGeometry(0.6, bh, 0.6);
      const mat = new THREE.MeshStandardMaterial({
        color:colBar, roughness:0.22, metalness:0.45,
        emissive:colBar, emissiveIntensity:0.22,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(xp, bh/2, 0); mesh.castShadow=true; pivot.add(mesh);

      // Edge outline
      const eg  = new THREE.EdgesGeometry(geo);
      const el2 = new THREE.LineSegments(
        eg,
        new THREE.LineBasicMaterial({ color:0xffffff, transparent:true, opacity:0.4 })
      );
      el2.position.set(xp, bh/2, 0); pivot.add(el2);

      // Glow cap
      const capC = colBar.clone().lerp(new THREE.Color(0xffffff), 0.28);
      const cap  = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.07, 0.6),
        new THREE.MeshStandardMaterial({ color:capC, emissive:capC, emissiveIntensity:1.3, roughness:0.04, metalness:1 })
      );
      cap.position.set(xp, bh+0.035, 0); pivot.add(cap);

      // Glow sphere on top
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 10, 10),
        new THREE.MeshStandardMaterial({
          color:colGlow, emissive:colGlow, emissiveIntensity:0.85, roughness:0.1
        })
      );
      sphere.position.set(xp, bh+0.2, 0); pivot.add(sphere);

      linePoints.push(new THREE.Vector3(xp, bh, 0));

      // ── Label anchors — value above, year below floor ──
      labelAnchors.push({
        x:xp, y:bh+0.75, z:0,
        text:`${d.extent}M`, col:`#${colBar.getHexString()}`, isYear:false,
      });
      labelAnchors.push({
        x:xp, y:-0.65, z:0,
        text:String(d.year), col:"#64748b", isYear:true,
      });
    });

    // Connecting line
    pivot.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(linePoints),
      new THREE.LineBasicMaterial({ color:new THREE.Color(t.primary) })
    ));

    // ── FIX: initial rotation set before first frame ──
    let rotX=0.28, rotY=0;
    pivot.rotation.x = rotX;
    pivot.rotation.y = rotY;
    scene.add(pivot);

    const toScreen = (x3,y3,z3) => {
      const v = new THREE.Vector3(x3,y3,z3).project(camera);
      return { sx:(v.x*0.5+0.5)*W, sy:(-v.y*0.5+0.5)*H, behind:v.z>1 };
    };

    let isDragging=false, prevX=0, prevY=0, autoSpin=true;
    const onDown = e => { isDragging=true; prevX=e.clientX; prevY=e.clientY; autoSpin=false; renderer.domElement.style.cursor="grabbing"; };
    const onUp   = () => { isDragging=false; renderer.domElement.style.cursor="grab"; };
    const onMove = e => {
      if (!isDragging) return;
      rotY += (e.clientX-prevX)*0.006;
      rotX  = Math.max(-0.8,Math.min(0.8,rotX+(e.clientY-prevY)*0.004));
      prevX=e.clientX; prevY=e.clientY;
    };
    renderer.domElement.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup",   onUp);
    window.addEventListener("mousemove", onMove);
    renderer.domElement.style.cursor = "grab";

    // ── FIX: animId stored for proper cancelAnimationFrame cleanup ──
    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (autoSpin) rotY += 0.003;
      pivot.rotation.y = rotY;
      pivot.rotation.x = rotX;
      camera.updateMatrixWorld();

      if (overlayRef.current) {
        overlayRef.current.querySelectorAll(".silbl").forEach((div, i) => {
          const a      = labelAnchors[i];
          const rotVec = new THREE.Vector3(a.x,a.y,a.z).applyEuler(pivot.rotation);
          const { sx,sy,behind } = toScreen(rotVec.x,rotVec.y,rotVec.z);
          div.style.left    = `${sx}px`;
          div.style.top     = `${sy}px`;
          div.style.opacity = behind ? "0" : "1";
        });
      }
      renderer.render(scene, camera);
    };
    animate();

    // ── FIX: proper cleanup cancels animation + removes listeners + disposes renderer ──
    return () => {
      cancelAnimationFrame(animId);
      renderer.domElement.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup",   onUp);
      window.removeEventListener("mousemove", onMove);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [theme]);

  // Mirror label list for JSX
  const jsxLabels = DATA.flatMap((d,i) => [
    { text:`${d.extent}M`, col:THEMES[theme].primary, isYear:false },
    { text:String(d.year), col:"#64748b",              isYear:true  },
  ]);

  return (
    <div style={{ display:"flex", gap:12, alignItems:"flex-start", width:"100%",
      border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden" }}>
      <div style={{ position:"relative", flex:1, minWidth:0 }}>
        <div ref={mountRef} style={{ width:"100%", height:400, cursor:"grab" }} />

        {/* ── HTML label overlay replaces CSS2DRenderer ── */}
        <div ref={overlayRef} style={{ position:"absolute", inset:0, pointerEvents:"none" }}>
          {jsxLabels.map((a,i) => (
            <div key={i} className="silbl" style={{
              position:   "absolute",
              transform:  a.isYear ? "translate(-50%,0%)" : "translate(-50%,-100%)",
              background: a.isYear ? "rgba(255,255,255,0.90)" : "rgba(255,255,255,0.93)",
              color:      a.col,
              fontSize:   a.isYear ? 9 : 10,
              fontWeight: "bold",
              padding:    "2px 5px",
              borderRadius: 3,
              border:     a.isYear ? "1px solid #e2e8f0" : `1px solid ${a.col}55`,
              whiteSpace: "nowrap", transition:"opacity 0.1s", pointerEvents:"none",
              boxShadow:  "0 1px 3px rgba(0,0,0,0.08)",
            }}>
              {a.text}
            </div>
          ))}
        </div>

        <div style={{ padding:"7px 14px", background:"#f8fafc",
          borderTop:"1px solid #e2e8f0", fontSize:11, color:"#94a3b8" }}>
          💡 Drag to rotate · auto-spins until you interact
        </div>
      </div>

      <div style={{ padding:"12px 12px 12px 0" }}>
        <LegendHTML theme={theme} />
      </div>
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
const SeaIceExtentChart = () => {
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
        <div style={{ fontSize:16, fontWeight:"bold", color:"#1e293b" }}>Sea Ice Extent Chart</div>
        <div style={{ fontSize:12, color:"#94a3b8", marginTop:2 }}>
          Arctic September minimum · 1978–2017 · Million km²
        </div>
      </div>

      {/* ── FIX: dropdowns left-aligned below title ── */}
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

      {/* Chart */}
      {viewMode === "2d"
        ? <Chart2D key={`2d-${theme}`} theme={theme} />
        : <Chart3D key={`3d-${theme}`} theme={theme} />
      }
    </div>
  );
};

export default SeaIceExtentChart;