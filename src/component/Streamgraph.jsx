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
  { month:"Jan",  Direct:1200, "Organic Search":800,  "Social Media":400, Email:300, Referral:200 },
  { month:"Feb",  Direct:1250, "Organic Search":850,  "Social Media":450, Email:320, Referral:220 },
  { month:"Mar",  Direct:1300, "Organic Search":900,  "Social Media":500, Email:350, Referral:250 },
  { month:"Apr",  Direct:1350, "Organic Search":950,  "Social Media":550, Email:380, Referral:280 },
  { month:"May",  Direct:1400, "Organic Search":1000, "Social Media":600, Email:400, Referral:300 },
  { month:"Jun",  Direct:1450, "Organic Search":1050, "Social Media":650, Email:420, Referral:320 },
  { month:"Jul",  Direct:1500, "Organic Search":1100, "Social Media":700, Email:450, Referral:350 },
  { month:"Aug",  Direct:1550, "Organic Search":1150, "Social Media":750, Email:480, Referral:380 },
  { month:"Sep",  Direct:1600, "Organic Search":1200, "Social Media":800, Email:500, Referral:400 },
  { month:"Oct",  Direct:1650, "Organic Search":1250, "Social Media":850, Email:520, Referral:420 },
  { month:"Nov",  Direct:1700, "Organic Search":1300, "Social Media":900, Email:550, Referral:450 },
  { month:"Dec",  Direct:1750, "Organic Search":1350, "Social Media":950, Email:580, Referral:480 },
];

const CATS = ["Direct","Organic Search","Social Media","Email","Referral"];

// ─── Shared Legend ────────────────────────────────────────────────────────────
function LegendHTML({ palette }) {
  const color = d3.scaleOrdinal().domain(CATS).range(palette);
  const last  = DATA[DATA.length-1];
  const total = CATS.reduce((s,c)=>s+last[c],0);

  return (
    <div style={{
      background:"#fff", border:"1px solid #e2e8f0", borderRadius:8,
      padding:"12px 14px", width:160, flexShrink:0,
      boxShadow:"0 1px 4px rgba(0,0,0,0.07)", alignSelf:"flex-start",
    }}>
      <div style={{ fontSize:10, fontWeight:"bold", color:"#94a3b8", letterSpacing:"0.08em", marginBottom:8 }}>
        TRAFFIC SOURCES
      </div>
      {CATS.map(c => (
        <div key={c} style={{ display:"flex", alignItems:"center", gap:7, marginBottom:6 }}>
          <div style={{ width:10, height:10, borderRadius:2, flexShrink:0, background:color(c) }} />
          <span style={{ color:"#334155", fontSize:10, flex:1 }}>{c}</span>
          <span style={{ color:color(c), fontSize:10, fontWeight:"bold" }}>
            {d3.format(",")(last[c])}
          </span>
        </div>
      ))}
      <div style={{ borderTop:"1px solid #e2e8f0", marginTop:8, paddingTop:8 }}>
        <div style={{ display:"flex", justifyContent:"space-between" }}>
          <span style={{ fontSize:10, color:"#94a3b8" }}>Dec total</span>
          <span style={{ fontSize:11, fontWeight:"bold", color:"#334155" }}>
            {d3.format(",")(total)}
          </span>
        </div>
        <div style={{ fontSize:9, color:"#94a3b8", marginTop:4 }}>
          Website traffic 2024<br/>streamgraph (wiggle offset)
        </div>
      </div>
    </div>
  );
}

// ─── 2D Chart ─────────────────────────────────────────────────────────────────
function Chart2D({ theme }) {
  const svgRef  = useRef(null);
  const palette = THEMES[theme];
  const color   = d3.scaleOrdinal().domain(CATS).range(palette);

  useEffect(() => {
    if (!svgRef.current) return;

    const W = 620, H = 400;
    const margin = { top:20, right:20, bottom:44, left:54 };
    const cW = W - margin.left - margin.right;
    const cH = H - margin.top  - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox",`0 0 ${W} ${H}`).attr("preserveAspectRatio","xMidYMid meet");
    svg.append("rect").attr("width",W).attr("height",H).attr("fill","#f8fafc").attr("rx",8);

    const stack = d3.stack().keys(CATS)
      .order(d3.stackOrderInsideOut)
      .offset(d3.stackOffsetWiggle);
    const stacked = stack(DATA);

    const x = d3.scalePoint().domain(DATA.map(d=>d.month)).range([0,cW]).padding(0);
    const y = d3.scaleLinear()
      .domain([d3.min(stacked,s=>d3.min(s,d=>d[0])), d3.max(stacked,s=>d3.max(s,d=>d[1]))])
      .range([cH,0]);

    const chart = svg.append("g").attr("transform",`translate(${margin.left},${margin.top})`);

    // Tooltip
    const tooltip = d3.select("body").append("div")
      .style("position","absolute").style("background","rgba(15,23,42,0.92)")
      .style("color","#fff").style("padding","8px 12px").style("border-radius","6px")
      .style("font-size","12px").style("pointer-events","none").style("opacity",0)
      .style("border","1px solid #334155").style("z-index","9999");

    const area = d3.area()
      .x(d=>x(d.data.month))
      .y0(d=>y(d[0])).y1(d=>y(d[1]))
      .curve(d3.curveBasis);

    // Gradient defs
    const defs = svg.append("defs");
    CATS.forEach((c,i) => {
      const gr = defs.append("linearGradient").attr("id",`stg${i}-${theme}`)
        .attr("x1","0%").attr("x2","100%");
      gr.append("stop").attr("offset","0%").attr("stop-color",palette[i]).attr("stop-opacity",0.7);
      gr.append("stop").attr("offset","50%").attr("stop-color",palette[i]).attr("stop-opacity",0.9);
      gr.append("stop").attr("offset","100%").attr("stop-color",palette[i]).attr("stop-opacity",0.75);
    });

    // Streams
    stacked.forEach((layer, i) => {
      const col = palette[i];
      chart.append("path").datum(layer)
        .attr("d", area)
        .attr("fill",`url(#stg${i}-${theme})`)
        .attr("stroke",col).attr("stroke-width",0.8).attr("opacity",0.88)
        .style("cursor","pointer")
        .on("mouseover", function(event) {
          d3.select(this).attr("opacity",1).attr("stroke-width",2);
          // find nearest month
          const [mx] = d3.pointer(event);
          const monthIdx = Math.round((mx/cW)*(DATA.length-1));
          const row = DATA[Math.max(0,Math.min(DATA.length-1,monthIdx))];
          tooltip.style("opacity",1)
            .html(`<b style="color:${col}">${CATS[i]}</b><br/>${row.month}: <b>${d3.format(",")(row[CATS[i]])}</b>`)
            .style("left",(event.pageX+12)+"px").style("top",(event.pageY-10)+"px");
        })
        .on("mouseout", function() {
          d3.select(this).attr("opacity",0.88).attr("stroke-width",0.8);
          tooltip.style("opacity",0);
        });

      // Stream label at peak
      const peak = layer.reduce((best,d) => (d[1]-d[0]) > (best[1]-best[0]) ? d : best);
      const lx   = x(peak.data.month);
      const ly   = y((peak[0]+peak[1])/2);
      const bw   = peak[1]-peak[0];
      if (bw > 80) {
        chart.append("text").attr("x",lx).attr("y",ly)
          .attr("text-anchor","middle").attr("dominant-baseline","middle")
          .style("font-size","9px").style("font-weight","700")
          .style("fill","#fff").style("pointer-events","none")
          .text(CATS[i].split(" ")[0]);
      }
    });

    // Center baseline
    chart.append("line")
      .attr("x1",0).attr("x2",cW).attr("y1",y(0)).attr("y2",y(0))
      .attr("stroke","#94a3b8").attr("stroke-dasharray","4,3").attr("stroke-width",1).attr("opacity",0.4);

    // X axis
    chart.append("g").attr("transform",`translate(0,${cH})`)
      .call(d3.axisBottom(x).tickSize(0))
      .call(g => { g.select(".domain").style("stroke","#e2e8f0"); g.selectAll("text").style("fill","#64748b").style("font-size","10px"); });

    // Y axis
    chart.append("g")
      .call(d3.axisLeft(y).ticks(4).tickFormat(d=>d3.format(".2s")(Math.abs(d))))
      .call(g => { g.select(".domain").remove(); g.selectAll("line").remove(); g.selectAll("text").style("fill","#94a3b8").style("font-size","9px"); });

    svg.append("text").attr("transform",`translate(${margin.left+cW/2},${H-4})`)
      .attr("text-anchor","middle").style("font-size","11px").style("fill","#94a3b8").text("Month (2024)");
    svg.append("text").attr("transform","rotate(-90)").attr("x",-(margin.top+cH/2)).attr("y",14)
      .attr("text-anchor","middle").style("font-size","11px").style("fill","#94a3b8").text("Traffic Volume");

    return () => tooltip.remove();
  }, [theme]);

  return (
    <div style={{ display:"flex", gap:12, alignItems:"flex-start", width:"100%", border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden" }}>
      <svg ref={svgRef} style={{ display:"block", flex:1, minWidth:0, height:400 }} />
      <div style={{ padding:"12px 12px 12px 0" }}>
        <LegendHTML palette={palette} />
      </div>
    </div>
  );
}

// ─── 3D Chart ─────────────────────────────────────────────────────────────────
function Chart3D({ theme }) {
  const mountRef   = useRef(null);
  const overlayRef = useRef(null);
  const palette    = THEMES[theme];

  useEffect(() => {
    if (!mountRef.current) return;
    const el  = mountRef.current;
    const W   = el.offsetWidth || 620, H = 400;

    const scene  = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);
    const camera = new THREE.PerspectiveCamera(38, W/H, 0.1, 200);
    camera.position.set(0, 10, 18);
    camera.lookAt(0, 2, 0);

    const renderer = new THREE.WebGLRenderer({ antialias:true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    renderer.shadowMap.enabled=true;
    el.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff,0.7));
    const sun = new THREE.DirectionalLight(0xffffff,1.0);
    sun.position.set(6,14,10); sun.castShadow=true; scene.add(sun);
    const rimL = new THREE.PointLight(new THREE.Color(palette[0]),0.45,60);
    rimL.position.set(-10,6,-6); scene.add(rimL);
    scene.add(new THREE.HemisphereLight(0xffffff,0xe0e7ff,0.4));

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(32,20),
      new THREE.MeshStandardMaterial({ color:0xf1f5f9, roughness:0.9 })
    );
    floor.rotation.x=-Math.PI/2; floor.receiveShadow=true; scene.add(floor);
    scene.add(new THREE.GridHelper(32,28,0xcccccc,0xe2e8f0));

    // Layout: months along X, categories along Z
    const nM     = DATA.length;
    const nC     = CATS.length;
    const spanX  = 18;
    const gapZ   = 1.0;
    const totalZ = (nC-1)*gapZ;
    const barW   = spanX/nM * 0.72;
    const maxVal = d3.max(DATA, row => CATS.reduce((s,c)=>s+row[c],0));
    const maxH   = 9;

    const pivot        = new THREE.Group();
    const labelAnchors = [];

    CATS.forEach((cat, ci) => {
      const col  = new THREE.Color(palette[ci]);
      const zPos = -totalZ/2 + ci*gapZ;

      DATA.forEach((row, mi) => {
        const bh  = Math.max(0.06, (row[cat]/maxVal)*maxH*2);
        const xPos = -spanX/2 + (mi/(nM-1))*spanX;

        const geo  = new THREE.BoxGeometry(barW, bh, 0.65);
        const mat  = new THREE.MeshStandardMaterial({
          color:col, roughness:0.25, metalness:0.4,
          emissive:col, emissiveIntensity:0.1,
          transparent:true, opacity:0.9,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(xPos, bh/2, zPos);
        mesh.castShadow=true; pivot.add(mesh);

        const eg  = new THREE.EdgesGeometry(geo);
        const el2 = new THREE.LineSegments(eg, new THREE.LineBasicMaterial({ color:0xffffff, transparent:true, opacity:0.35 }));
        el2.position.set(xPos, bh/2, zPos); pivot.add(el2);

        // Cap
        const capC = col.clone().lerp(new THREE.Color(0xffffff),0.25);
        const cap  = new THREE.Mesh(
          new THREE.BoxGeometry(barW,0.06,0.65),
          new THREE.MeshStandardMaterial({ color:capC, emissive:capC, emissiveIntensity:1.2, roughness:0.04, metalness:1 })
        );
        cap.position.set(xPos, bh+0.03, zPos); pivot.add(cap);
      });

      // Category label at right end
      labelAnchors.push({
        x: spanX/2+0.8, y:1.2, z:zPos,
        text: cat.split(" ")[0],
        col: palette[ci], isMonth:false,
      });
    });

    // Month labels at front of first row
    DATA.forEach((row, mi) => {
      if (mi===0||mi===nM-1||mi%2===0) {
        labelAnchors.push({
          x: -spanX/2+(mi/(nM-1))*spanX,
          y: -0.65, z: totalZ/2+0.8,
          text: row.month, col:"#64748b", isMonth:true,
        });
      }
    });

    scene.add(pivot);

    const toScreen = (x3,y3,z3) => {
      const v = new THREE.Vector3(x3,y3,z3).project(camera);
      return { sx:(v.x*0.5+0.5)*W, sy:(-v.y*0.5+0.5)*H, behind:v.z>1 };
    };

    let isDragging=false, prevX=0, prevY=0, rotX=0.22, rotY=0, autoSpin=true;
    const onDown = e => { isDragging=true; prevX=e.clientX; prevY=e.clientY; autoSpin=false; renderer.domElement.style.cursor="grabbing"; };
    const onUp   = () => { isDragging=false; renderer.domElement.style.cursor="grab"; };
    const onMove = e => {
      if (!isDragging) return;
      rotY += (e.clientX-prevX)*0.006;
      rotX  = Math.max(-0.8,Math.min(0.8,rotX+(e.clientY-prevY)*0.004));
      prevX=e.clientX; prevY=e.clientY;
    };
    renderer.domElement.addEventListener("mousedown",onDown);
    window.addEventListener("mouseup",onUp);
    window.addEventListener("mousemove",onMove);
    renderer.domElement.style.cursor="grab";

    let animId;
    const animate = () => {
      animId=requestAnimationFrame(animate);
      if (autoSpin) rotY+=0.003;
      pivot.rotation.y=rotY; pivot.rotation.x=rotX;
      camera.updateMatrixWorld();

      if (overlayRef.current) {
        overlayRef.current.querySelectorAll(".sglbl").forEach((div,i) => {
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

    return () => {
      cancelAnimationFrame(animId);
      renderer.domElement.removeEventListener("mousedown",onDown);
      window.removeEventListener("mouseup",onUp);
      window.removeEventListener("mousemove",onMove);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [theme]);

  return (
    <div style={{ display:"flex", gap:12, alignItems:"flex-start", width:"100%", border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden" }}>
      <div style={{ position:"relative", flex:1, minWidth:0 }}>
        <div ref={mountRef} style={{ width:"100%", height:400, cursor:"grab" }} />

        <div ref={overlayRef} style={{ position:"absolute", inset:0, pointerEvents:"none" }}>
          {/* Category labels at right edge */}
          {CATS.map((c,i) => (
            <div key={`c${i}`} className="sglbl" style={{
              position:"absolute", transform:"translate(0,-50%)",
              background:THEMES[theme][i], color:"#fff",
              fontSize:9, fontWeight:"bold", padding:"2px 6px", borderRadius:3,
              whiteSpace:"nowrap", transition:"opacity 0.1s", pointerEvents:"none",
              boxShadow:"0 1px 3px rgba(0,0,0,0.15)",
            }}>
              {c.split(" ")[0]}
            </div>
          ))}
          {/* Month labels */}
          {DATA.filter((_,i)=>i===0||i===DATA.length-1||i%2===0).map((row,i) => (
            <div key={`m${i}`} className="sglbl" style={{
              position:"absolute", transform:"translate(-50%,0%)",
              background:"rgba(255,255,255,0.90)", color:"#64748b",
              fontSize:9, fontWeight:"600", padding:"1px 4px", borderRadius:2,
              border:"1px solid #e2e8f0", whiteSpace:"nowrap",
              transition:"opacity 0.1s", pointerEvents:"none",
            }}>
              {row.month}
            </div>
          ))}
        </div>

        <div style={{ padding:"7px 14px", background:"#f8fafc", borderTop:"1px solid #e2e8f0", fontSize:11, color:"#94a3b8" }}>
          💡 Drag to rotate · auto-spins · X-axis = Month · Z-axis = Traffic Source
        </div>
      </div>

      <div style={{ padding:"12px 12px 12px 0" }}>
        <LegendHTML palette={THEMES[theme]} />
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const Streamgraph = () => {
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
        <div style={{ fontSize:16, fontWeight:"bold", color:"#1e293b" }}>Website Traffic Streamgraph</div>
        <div style={{ fontSize:12, color:"#94a3b8", marginTop:2 }}>
          Monthly traffic by source · 2024 · wiggle-offset streamgraph
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
        ? <Chart2D key={`2d-${theme}`} theme={theme} />
        : <Chart3D key={`3d-${theme}`} theme={theme} />
      }
    </div>
  );
};

export default Streamgraph;