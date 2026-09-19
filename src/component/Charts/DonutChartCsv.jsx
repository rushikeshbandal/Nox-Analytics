import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import * as THREE from "three";

const THEMES = {
  Modern:  ["#6366f1","#06b6d4","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899","#14b8a6","#f97316","#6b7280","#3b82f6","#84cc16"],
  Neon:    ["#ff0080","#00f5ff","#39ff14","#ffae00","#ff3131","#ff6bff","#00ff9d","#ff4400","#ff00aa","#00ccff","#ff0080","#00f5ff"],
  Pastel:  ["#a5b4fc","#67e8f9","#6ee7b7","#fde68a","#fca5a5","#c4b5fd","#f9a8d4","#99f6e4","#fdba74","#d1d5db","#a5b4fc","#67e8f9"],
  Sunset:  ["#ff6b6b","#feca57","#ff9ff3","#48dbfb","#1dd1a1","#f368e0","#ff9f43","#10ac84","#5f27cd","#00d2d3","#ff6b6b","#feca57"],
  Ocean:   ["#03045e","#0077b6","#00b4d8","#90e0ef","#023e8a","#0096c7","#48cae4","#ade8f4","#caf0f8","#7ec8e3","#03045e","#0077b6"],
  Galaxy:  ["#4a306d","#7b2cbf","#9d4edd","#c77dff","#e0aaff","#3c1e4d","#5e2e7d","#803ead","#a24edd","#c45eed","#4a306d","#7b2cbf"],
  Forest:  ["#1b4332","#2d6a4f","#40916c","#52b788","#74c69d","#95d5b2","#b7e4c7","#a7c957","#6a994e","#386641","#1b4332","#2d6a4f"],
  Autumn:  ["#7f4f24","#936639","#a68a64","#c2c5aa","#e63946","#c1121f","#9d0208","#6a040f","#370617","#b5838d","#7f4f24","#936639"],
  Candy:   ["#ff006e","#fb5607","#ffbe0b","#8338ec","#3a86ff","#06d6a0","#ef476f","#ffd166","#26547c","#05c7f2","#ff006e","#fb5607"],
  Earth:   ["#6b4f3c","#8b6914","#a07850","#b8975a","#c9a96e","#3a7d44","#2d6a4f","#1b4332","#52796f","#84a98c","#6b4f3c","#8b6914"],
};

const FALLBACK = [
  { label:"Gaming Laptops",     value:450 },
  { label:"Ultrabooks",         value:380 },
  { label:"Business Laptops",   value:320 },
  { label:"Budget Laptops",     value:290 },
  { label:"Student Laptops",    value:350 },
  { label:"Workstation",        value:210 },
  { label:"2-in-1 Laptops",     value:180 },
  { label:"Premium Laptops",    value:160 },
  { label:"Chromebooks",        value:270 },
  { label:"Rugged Laptops",     value: 90 },
];

// ─── Shared Legend ────────────────────────────────────────────────────────────
function LegendHTML({ data, palette, total }) {
  const color = d3.scaleOrdinal().domain(data.map(d=>d.label)).range(palette);
  return (
    <div style={{
      background:"#fff", border:"1px solid #e2e8f0", borderRadius:8,
      padding:"12px 14px", width:165, flexShrink:0,
      boxShadow:"0 1px 4px rgba(0,0,0,0.07)", alignSelf:"flex-start",
      maxHeight:420, overflowY:"auto",
    }}>
      <div style={{ fontSize:10, fontWeight:"bold", color:"#94a3b8", letterSpacing:"0.08em", marginBottom:4 }}>
        CATEGORIES
      </div>
      <div style={{ fontSize:9, color:"#94a3b8", marginBottom:8 }}>
        Total: <b style={{ color:"#334155" }}>{total.toLocaleString()}</b>
      </div>
      {data.map(d => {
        const pct = ((d.value/total)*100).toFixed(1);
        return (
          <div key={d.label} style={{ display:"flex", alignItems:"center", gap:7, marginBottom:5 }}>
            <div style={{ width:9, height:9, borderRadius:2, flexShrink:0, background:color(d.label) }} />
            <span style={{ color:"#334155", fontSize:10, flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {d.label}
            </span>
            <span style={{ color:color(d.label), fontSize:9, fontWeight:"bold", flexShrink:0 }}>
              {pct}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── 2D Chart ─────────────────────────────────────────────────────────────────
function Chart2D({ data, theme }) {
  const svgRef  = useRef(null);
  const palette = THEMES[theme];
  const color   = d3.scaleOrdinal().domain(data.map(d=>d.label)).range(palette);
  const total   = d3.sum(data, d=>d.value);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    const W = 420, H = 420;
    const cx = W/2, cy = H/2;
    const R  = Math.min(W,H)/2 - 24;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox",`0 0 ${W} ${H}`).attr("preserveAspectRatio","xMidYMid meet");
    svg.append("rect").attr("width",W).attr("height",H).attr("fill","#f8fafc").attr("rx",8);

    const pie = d3.pie().value(d=>d.value).sort(null).padAngle(0.025);
    const arc = d3.arc().innerRadius(R*0.55).outerRadius(R).cornerRadius(5);
    const arcHover = d3.arc().innerRadius(R*0.55).outerRadius(R*1.06).cornerRadius(5);

    // Tooltip
    const tooltip = d3.select("body").append("div")
      .style("position","absolute").style("background","rgba(15,23,42,0.92)")
      .style("color","#fff").style("padding","8px 12px").style("border-radius","6px")
      .style("font-size","12px").style("pointer-events","none").style("opacity",0)
      .style("border","1px solid #334155").style("z-index","9999");

    const g = svg.append("g").attr("transform",`translate(${cx},${cy})`);

    const slices = g.selectAll(".arc").data(pie(data)).enter().append("g");

    slices.append("path")
      .attr("d", arc)
      .attr("fill", d => color(d.data.label))
      .attr("stroke","#fff").attr("stroke-width",2).attr("opacity",0.9)
      .style("cursor","pointer")
      .on("mouseover", function(event,d) {
        d3.select(this).transition().duration(200).attr("d", arcHover(d)).attr("opacity",1);
        const pct = ((d.data.value/total)*100).toFixed(1);
        tooltip.style("opacity",1)
          .html(`<b style="color:${color(d.data.label)}">${d.data.label}</b><br/>Value: <b>${d.data.value.toLocaleString()}</b><br/>Share: ${pct}%`)
          .style("left",(event.pageX+12)+"px").style("top",(event.pageY-10)+"px");
      })
      .on("mouseout", function(event,d) {
        d3.select(this).transition().duration(200).attr("d", arc(d)).attr("opacity",0.9);
        tooltip.style("opacity",0);
      });

    // Percentage labels inside slices
    slices.append("text")
      .attr("transform", d => `translate(${arc.centroid(d)})`)
      .attr("text-anchor","middle").attr("dominant-baseline","middle")
      .style("font-size","9px").style("font-weight","700")
      .style("fill","#fff").style("pointer-events","none")
      .text(d => {
        const pct = ((d.data.value/total)*100);
        return pct >= 4 ? `${pct.toFixed(1)}%` : "";
      });

    // Center total
    g.append("text").attr("text-anchor","middle").attr("y",-12)
      .style("font-size","22px").style("font-weight","bold").style("fill","#1e293b")
      .text(total.toLocaleString());
    g.append("text").attr("text-anchor","middle").attr("y",14)
      .style("font-size","11px").style("fill","#94a3b8").text("Total Sales");

    return () => tooltip.remove();
  }, [data, theme]);

  return (
    <div style={{ display:"flex", gap:12, alignItems:"flex-start", width:"100%", border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden" }}>
      <svg ref={svgRef} style={{ display:"block", flex:1, minWidth:0, height:420 }} />
      <div style={{ padding:"12px 12px 12px 0" }}>
        <LegendHTML data={data} palette={palette} total={total} />
      </div>
    </div>
  );
}

// ─── 3D Chart ─────────────────────────────────────────────────────────────────
function Chart3D({ data, theme }) {
  const mountRef   = useRef(null);
  const overlayRef = useRef(null);
  const palette    = THEMES[theme];
  const color      = d3.scaleOrdinal().domain(data.map(d=>d.label)).range(palette);
  const total      = d3.sum(data, d=>d.value);

  useEffect(() => {
    if (!mountRef.current || !data.length) return;
    const el = mountRef.current;
    const W  = el.offsetWidth || 500, H = 420;

    const scene  = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);
    const camera = new THREE.PerspectiveCamera(42, W/H, 0.1, 200);
    camera.position.set(0, 7, 14);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias:true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    renderer.shadowMap.enabled=true;
    el.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff,0.75));
    const sun = new THREE.DirectionalLight(0xffffff,1.0);
    sun.position.set(6,12,8); sun.castShadow=true; scene.add(sun);
    const rimL = new THREE.PointLight(new THREE.Color(palette[0]),0.45,60);
    rimL.position.set(-8,5,-5); scene.add(rimL);
    scene.add(new THREE.HemisphereLight(0xffffff,0xe0e7ff,0.4));

    // Floor
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(28,20),
      new THREE.MeshStandardMaterial({ color:0xf1f5f9, roughness:0.9 })
    );
    floor.rotation.x=-Math.PI/2; floor.position.y=-0.1; floor.receiveShadow=true; scene.add(floor);
    scene.add(new THREE.GridHelper(28,24,0xcccccc,0xe2e8f0));

    // 3D donut — wedge-shaped CylinderGeometry segments
    const pie    = d3.pie().value(d=>d.value).sort(null).padAngle(0.04);
    const slices = pie(data);
    const outerR = 4.5, innerR = 2.2, height3D = 0.7;
    const pivot  = new THREE.Group();
    const labelAnchors = [];

    slices.forEach((slice,i) => {
      const midAngle  = (slice.startAngle + slice.endAngle) / 2;
      const spanAngle = slice.endAngle - slice.startAngle;
      const segs      = Math.max(3, Math.round(spanAngle * 12));
      const col       = new THREE.Color(color(slice.data.label));

      // Build wedge via Shape
      const shape = new THREE.Shape();
      shape.moveTo(Math.cos(slice.startAngle)*outerR, Math.sin(slice.startAngle)*outerR);
      for (let j=0; j<=segs; j++) {
        const a = slice.startAngle + (j/segs)*spanAngle;
        shape.lineTo(Math.cos(a)*outerR, Math.sin(a)*outerR);
      }
      for (let j=segs; j>=0; j--) {
        const a = slice.startAngle + (j/segs)*spanAngle;
        shape.lineTo(Math.cos(a)*innerR, Math.sin(a)*innerR);
      }
      shape.closePath();

      const geo = new THREE.ExtrudeGeometry(shape, { depth:height3D, bevelEnabled:false });
      const mat = new THREE.MeshStandardMaterial({
        color:col, roughness:0.25, metalness:0.4,
        emissive:col, emissiveIntensity:0.1,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = -Math.PI/2;
      mesh.position.y = 0;
      mesh.castShadow=true;
      pivot.add(mesh);

      // Cap outline
      const edgesGeo  = new THREE.EdgesGeometry(geo);
      const edgesLine = new THREE.LineSegments(edgesGeo, new THREE.LineBasicMaterial({ color:0xffffff, transparent:true, opacity:0.4 }));
      edgesLine.rotation.x = -Math.PI/2;
      pivot.add(edgesLine);

      // Glow ring on top face — thin flat torus arc approximation via line
      const capR = (outerR+innerR)/2;
      const capCol = col.clone().lerp(new THREE.Color(0xffffff),0.3);
      const capMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.05, 0.05),
        new THREE.MeshStandardMaterial({ color:capCol, emissive:capCol, emissiveIntensity:1.2, roughness:0.04 })
      );
      capMesh.position.set(Math.cos(midAngle)*capR, height3D*0.5+0.04, -Math.sin(midAngle)*capR);
      pivot.add(capMesh);

      // Label anchor (midpoint of arc, outside)
      const pct      = ((slice.data.value/total)*100).toFixed(1);
      const labelRad = outerR + 0.9;
      labelAnchors.push({
        x: Math.cos(midAngle)*labelRad,
        y: height3D/2,
        z: -Math.sin(midAngle)*labelRad,
        text: `${slice.data.label.split(" ")[0]} ${pct}%`,
        col: color(slice.data.label),
      });
    });

    scene.add(pivot);

    const toScreen = (x3,y3,z3) => {
      const v = new THREE.Vector3(x3,y3,z3).project(camera);
      return { sx:(v.x*0.5+0.5)*W, sy:(-v.y*0.5+0.5)*H, behind:v.z>1 };
    };

    let isDragging=false, prevX=0, prevY=0, rotX=0.35, rotY=0, autoSpin=true;
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
      if (autoSpin) rotY+=0.005;
      pivot.rotation.y=rotY; pivot.rotation.x=rotX;
      camera.updateMatrixWorld();

      if (overlayRef.current) {
        overlayRef.current.querySelectorAll(".dnlbl").forEach((div,i) => {
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
  }, [data, theme]);

  return (
    <div style={{ display:"flex", gap:12, alignItems:"flex-start", width:"100%", border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden" }}>
      <div style={{ position:"relative", flex:1, minWidth:0 }}>
        <div ref={mountRef} style={{ width:"100%", height:420, cursor:"grab" }} />

        <div ref={overlayRef} style={{ position:"absolute", inset:0, pointerEvents:"none" }}>
          {data.map((d,i) => {
            const col = THEMES[theme][i%THEMES[theme].length];
            return (
              <div key={i} className="dnlbl" style={{
                position:"absolute", transform:"translate(-50%,-50%)",
                background:"rgba(255,255,255,0.93)", color:col,
                fontSize:9, fontWeight:"bold",
                padding:"2px 5px", borderRadius:3,
                border:`1px solid ${col}55`,
                whiteSpace:"nowrap", transition:"opacity 0.1s", pointerEvents:"none",
                boxShadow:"0 1px 3px rgba(0,0,0,0.10)",
              }}>
                {d.label.split(" ")[0]} {((d.value/d3.sum(data,x=>x.value))*100).toFixed(1)}%
              </div>
            );
          })}
        </div>

        <div style={{ padding:"7px 14px", background:"#f8fafc", borderTop:"1px solid #e2e8f0", fontSize:11, color:"#94a3b8" }}>
          💡 Drag to rotate · auto-spins until you interact
        </div>
      </div>

      <div style={{ padding:"12px 12px 12px 0" }}>
        <LegendHTML data={data} palette={THEMES[theme]} total={d3.sum(data,d=>d.value)} />
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const DonutChartCsv = () => {
  const [viewMode,  setViewMode]  = useState("2d");
  const [theme,     setTheme]     = useState("Modern");
  const [chartData, setChartData] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [dataInfo,  setDataInfo]  = useState("");

  useEffect(() => {
    d3.csv("/DonutChartcsv.csv")
      .then(rows => {
        const cols      = Object.keys(rows[0] || {});
        const catCol    = cols.find(c => /cat|label/i.test(c)) || cols[0];
        const valCol    = cols.find(c => /sales|value|count/i.test(c)) || cols[1];
        const processed = rows
          .map(r => ({ label:r[catCol]||"Unknown", value:parseFloat(r[valCol])||0 }))
          .filter(d => d.value > 0)
          .sort((a,b) => b.value - a.value);
        setChartData(processed);
        setDataInfo(`${processed.length} categories · from CSV`);
        setLoading(false);
      })
      .catch(() => {
        setChartData(FALLBACK);
        setDataInfo("Sample data (CSV not found)");
        setLoading(false);
      });
  }, []);

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
        <div style={{ fontSize:16, fontWeight:"bold", color:"#1e293b" }}>Donut Chart</div>
        <div style={{ fontSize:12, color:"#94a3b8", marginTop:2 }}>{dataInfo || "Loading…"}</div>
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

      {/* Chart */}
      <div style={{ minHeight:420 }}>
        {loading ? (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:420, color:"#94a3b8", fontSize:15 }}>
            Loading data…
          </div>
        ) : viewMode === "2d" ? (
          <Chart2D key={`2d-${theme}`} data={chartData} theme={theme} />
        ) : (
          <Chart3D key={`3d-${theme}`} data={chartData} theme={theme} />
        )}
      </div>
    </div>
  );
};

export default DonutChartCsv;