import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import * as THREE from "three";

const THEMES = {
  Modern:  "#6366f1",
  Neon:    "#ff0080",
  Pastel:  "#a5b4fc",
  Sunset:  "#ff6b6b",
  Ocean:   "#0077b6",
  Galaxy:  "#7b2cbf",
  Forest:  "#16a34a",
  Autumn:  "#f97316",
  Candy:   "#ec4899",
  Earth:   "#eab308",
};

const CONTINENTS = [
  { x:120, y:120, w:220, h:160, name:"North America" },
  { x:390, y:100, w:160, h:180, name:"Europe"        },
  { x:270, y:300, w:180, h:130, name:"South America" },
  { x:430, y:250, w:160, h:160, name:"Africa"        },
  { x:530, y:110, w:200, h:220, name:"Asia"          },
];

const LABEL_POOL = [
  "USA","CAN","MEX","BRA","ARG","CHN","IND","AUS","RUS","GER",
  "FRA","UK","JPN","KOR","ITA","ESP","POR","NLD","BEL","SWE",
  "New York","London","Tokyo","Paris","Sydney",
  "Beijing","Moscow","Berlin","Rome","Madrid",
  "Toronto","São Paulo","Cairo","Delhi","Lagos",
  "XYZ","KLM","PQR","WVU","TNZ","GHI","ABC","DEF","JKL","MNO",
  "TKY","BRZ","IND","MEX","CHI","PAK","IRN","VNM","THA","EGY",
];

function getLabels(n) {
  const out = [];
  for (let i=0; i<n; i++) out.push(LABEL_POOL[i % LABEL_POOL.length]);
  return out;
}

function applyOcclusion(svg) {
  const nodes = svg.selectAll(".label").nodes();
  svg.selectAll(".label").attr("opacity",1).attr("fill","#111");
  const boxes = nodes.map(n => ({ n, b: n.getBBox() }));
  boxes.sort((a,b) => a.b.y - b.b.y);
  for (let i=0; i<boxes.length; i++) {
    const cur = boxes[i].b;
    let occluded = false;
    for (let j=0; j<i; j++) {
      const oth = boxes[j].b;
      if (!(cur.x > oth.x+oth.width || cur.x+cur.width < oth.x ||
            cur.y > oth.y+oth.height || cur.y+cur.height < oth.y)) {
        occluded = true; break;
      }
    }
    d3.select(boxes[i].n)
      .attr("opacity", occluded ? 0.25 : 1)
      .attr("fill",    occluded ? "#94a3b8" : "#111");
  }
}

// ─── Shared Legend ─────────────────────────────────────────────────────────────
function LegendHTML({ color }) {
  return (
    <div style={{
      background:"#fff", border:"1px solid #e2e8f0", borderRadius:8,
      padding:"12px 14px", width:155, flexShrink:0,
      boxShadow:"0 1px 4px rgba(0,0,0,0.07)", alignSelf:"flex-start",
    }}>
      <div style={{ fontSize:10, fontWeight:"bold", color:"#94a3b8", letterSpacing:"0.08em", marginBottom:8 }}>
        LEGEND
      </div>
      {[
        { swatch:"rect",   col:color,      label:"Continent fill"   },
        { swatch:"circle", col:"#111",     label:"Visible label"    },
        { swatch:"circle", col:"#94a3b8",  label:"Occluded label"   },
        { swatch:"circle", col:"#dc2626",  label:"Hovered label"    },
      ].map(({ swatch, col, label }) => (
        <div key={label} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:7 }}>
          {swatch === "rect"
            ? <div style={{ width:14, height:10, borderRadius:2, background:col, opacity:0.6, flexShrink:0 }} />
            : <div style={{ width:10, height:10, borderRadius:"50%", background:col, flexShrink:0 }} />
          }
          <span style={{ color:"#334155", fontSize:11 }}>{label}</span>
        </div>
      ))}
      <div style={{ borderTop:"1px solid #e2e8f0", margin:"8px 0" }} />
      <div style={{ fontSize:10, fontWeight:"bold", color:"#94a3b8", letterSpacing:"0.08em", marginBottom:6 }}>
        REGIONS
      </div>
      {CONTINENTS.map(c => (
        <div key={c.name} style={{ display:"flex", alignItems:"center", gap:7, marginBottom:4 }}>
          <div style={{ width:8, height:8, borderRadius:2, background:color, opacity:0.6, flexShrink:0 }} />
          <span style={{ color:"#64748b", fontSize:10 }}>{c.name}</span>
        </div>
      ))}
      <div style={{ borderTop:"1px solid #e2e8f0", marginTop:8, paddingTop:8 }}>
        <div style={{ fontSize:9, color:"#94a3b8" }}>
          Hover labels to highlight<br/>Click Randomize to shuffle
        </div>
      </div>
    </div>
  );
}

// ─── 2D Chart ──────────────────────────────────────────────────────────────────
function Chart2D({ color, labelPositions, onRandomize }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current) return;
    const W = 620, H = 420;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox",`0 0 ${W} ${H}`).attr("preserveAspectRatio","xMidYMid meet");
    svg.append("rect").attr("width",W).attr("height",H).attr("fill","#f8fafc").attr("rx",8);

    // Defs — simple drop shadow for 2D
    const defs = svg.append("defs");
    defs.append("filter").attr("id","sh2d")
      .append("feDropShadow")
      .attr("dx",2).attr("dy",3).attr("stdDeviation",3).attr("flood-opacity",0.18);

    // Continents
    const mapG = svg.append("g");
    CONTINENTS.forEach(c => {
      mapG.append("rect")
        .attr("x",c.x).attr("y",c.y).attr("width",c.w).attr("height",c.h)
        .attr("rx",14).attr("fill",color).attr("opacity",0.22)
        .attr("stroke",d3.color(color).darker(0.8)).attr("stroke-width",1.5);
      mapG.append("text")
        .attr("x",c.x+c.w/2).attr("y",c.y+c.h/2+5)
        .attr("text-anchor","middle").style("font-size","11px")
        .style("font-weight","700").style("fill","#334155")
        .style("pointer-events","none").text(c.name);
    });

    // Labels
    const labelG = svg.append("g");
    const labels = getLabels(50);
    labelG.selectAll("text").data(labels.map((t,i) => ({
      t, x:labelPositions[i].x, y:labelPositions[i].y
    }))).enter().append("text")
      .attr("class","label")
      .attr("x", d=>d.x).attr("y", d=>d.y)
      .attr("text-anchor","middle").attr("cursor","pointer")
      .style("font-size", d => d.t.length<=3?"13px":"11px")
      .style("font-weight", d => d.t.length<=3?"bold":"normal")
      .style("fill","#111")
      .text(d=>d.t)
      .on("mouseover", function() {
        d3.select(this).attr("fill","#dc2626").style("font-weight","bold").raise();
        applyOcclusion(svg);
      })
      .on("mouseout", function() {
        svg.selectAll(".label")
          .attr("fill","#111")
          .style("font-weight", d => d.t?.length<=3?"bold":"normal");
        applyOcclusion(svg);
      });

    applyOcclusion(svg);

    // Randomize button
    const btnG = svg.append("g").attr("transform",`translate(${W-150},${H-44})`).style("cursor","pointer")
      .on("click", onRandomize);
    btnG.append("rect").attr("width",130).attr("height",30).attr("rx",6).attr("fill",color);
    btnG.append("text").attr("x",65).attr("y",19).attr("text-anchor","middle")
      .attr("fill","#fff").style("font-size","11px").style("font-weight","bold")
      .style("pointer-events","none").text("Randomize Labels");

  }, [color, labelPositions]);

  return <svg ref={svgRef} style={{ display:"block", width:"100%", height:420 }} />;
}

// ─── 3D Chart ──────────────────────────────────────────────────────────────────
function Chart3D({ color, labelPositions, onRandomize, overlayRef }) {
  const mountRef = useRef(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const el = mountRef.current;
    const W  = el.offsetWidth || 620, H = 420;

    const scene  = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);
    const camera = new THREE.PerspectiveCamera(42, W/H, 0.1, 200);
    camera.position.set(0, 7, 16);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias:true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    renderer.shadowMap.enabled = true;
    el.appendChild(renderer.domElement);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.75));
    const sun = new THREE.DirectionalLight(0xffffff, 0.9);
    sun.position.set(6,12,10); sun.castShadow=true; scene.add(sun);
    const rimL = new THREE.PointLight(new THREE.Color(color), 0.45, 60);
    rimL.position.set(-10,6,-6); scene.add(rimL);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xe0e7ff, 0.4));

    // Floor
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(28,18),
      new THREE.MeshStandardMaterial({ color:0xf1f5f9, roughness:0.9 })
    );
    floor.rotation.x=-Math.PI/2; floor.receiveShadow=true; scene.add(floor);
    scene.add(new THREE.GridHelper(28,24,0xcccccc,0xe2e8f0));

    const pivot        = new THREE.Group();
    const labelAnchors = [];

    // ── Map W=14, H=9 in 3D space (centred at origin) ──
    const MAP_W=14, MAP_H=9;

    // Map plane
    const mapCanvas  = document.createElement("canvas");
    mapCanvas.width  = 700; mapCanvas.height = 450;
    const ctx        = mapCanvas.getContext("2d");
    ctx.fillStyle    = "#dbeafe"; ctx.fillRect(0,0,700,450);
    // Draw continent rects on canvas
    const scaleX = 700/MAP_W, scaleZ = 450/MAP_H;
    CONTINENTS.forEach(c => {
      // Convert from SVG coords (620×420) to map canvas coords
      const cx = ((c.x + c.w/2)/620)*700;
      const cy = ((c.y + c.h/2)/420)*450;
      const cw = (c.w/620)*700, ch = (c.h/420)*450;
      const col3 = d3.color(color);
      ctx.fillStyle = `rgba(${d3.rgb(col3).r},${d3.rgb(col3).g},${d3.rgb(col3).b},0.35)`;
      ctx.strokeStyle= d3.rgb(col3).darker(0.8).toString();
      ctx.lineWidth  = 2;
      roundRect(ctx, cx-cw/2, cy-ch/2, cw, ch, 12);
      ctx.fill(); ctx.stroke();
      ctx.font      = "bold 16px sans-serif";
      ctx.fillStyle = "#1e293b";
      ctx.textAlign = "center";
      ctx.fillText(c.name, cx, cy+5);
    });

    const mapTex  = new THREE.CanvasTexture(mapCanvas);
    mapTex.needsUpdate = true;
    const mapPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(MAP_W, MAP_H),
      new THREE.MeshStandardMaterial({ map:mapTex, roughness:0.6, metalness:0.04, side:THREE.FrontSide })
    );
    mapPlane.rotation.x = -Math.PI/2;
    mapPlane.position.y = 0.01;
    mapPlane.receiveShadow = true;
    pivot.add(mapPlane);

    // Map border
    const border = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(MAP_W,0.02,MAP_H)),
      new THREE.LineBasicMaterial({ color:0x94a3b8 })
    );
    border.position.y = 0.02; pivot.add(border);

    // ── 3D label pillars at label positions ──
    const labels = getLabels(50);
    labels.forEach((lbl, i) => {
      const pos = labelPositions[i];
      // Convert label SVG coords (620×420) → plane 3D coords
      const lx3 = ((pos.x/620) - 0.5)*MAP_W;
      const lz3 = -((pos.y/420) - 0.5)*MAP_H;
      const bh  = lbl.length <= 3 ? 0.6 : 0.35;
      const col = new THREE.Color(color);

      const geo  = new THREE.BoxGeometry(0.18, bh, 0.18);
      const mat  = new THREE.MeshStandardMaterial({
        color:col, roughness:0.25, metalness:0.45,
        emissive:col, emissiveIntensity:0.22,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(lx3, bh/2, lz3);
      mesh.castShadow=true; pivot.add(mesh);

      // Cap
      const capC = col.clone().lerp(new THREE.Color(0xffffff),0.3);
      const cap  = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.05, 0.2),
        new THREE.MeshStandardMaterial({ color:capC, emissive:capC, emissiveIntensity:1.2, roughness:0.04 })
      );
      cap.position.set(lx3, bh+0.025, lz3); pivot.add(cap);

      labelAnchors.push({ x:lx3, y:bh+0.45, z:lz3, text:lbl });
    });

    let rotX=0.52, rotY=0.1, autoSpin=true, isDragging=false, prevX=0, prevY=0;
    pivot.rotation.x = rotX;
    pivot.rotation.y = rotY;
    scene.add(pivot);

    const toScreen = (x3,y3,z3) => {
      const v = new THREE.Vector3(x3,y3,z3).project(camera);
      return { sx:(v.x*0.5+0.5)*W, sy:(-v.y*0.5+0.5)*H, behind:v.z>1 };
    };

    const onDown = e=>{ isDragging=true; prevX=e.clientX; prevY=e.clientY; autoSpin=false; renderer.domElement.style.cursor="grabbing"; };
    const onUp   = ()=>{ isDragging=false; renderer.domElement.style.cursor="grab"; };
    const onMove = e=>{
      if (!isDragging) return;
      rotY += (e.clientX-prevX)*0.005;
      rotX  = Math.max(0.05, Math.min(1.2, rotX+(e.clientY-prevY)*0.004));
      prevX=e.clientX; prevY=e.clientY;
    };
    renderer.domElement.addEventListener("mousedown",onDown);
    window.addEventListener("mouseup",  onUp);
    window.addEventListener("mousemove",onMove);
    renderer.domElement.style.cursor="grab";

    let animId;
    const animate = () => {
      animId=requestAnimationFrame(animate);
      if (autoSpin) rotY+=0.003;
      pivot.rotation.y=rotY; pivot.rotation.x=rotX;
      camera.updateMatrixWorld();

      if (overlayRef.current) {
        overlayRef.current.querySelectorAll(".oc3lbl").forEach((div,i) => {
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
      window.removeEventListener("mouseup",  onUp);
      window.removeEventListener("mousemove",onMove);
      mapTex.dispose();
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [color, labelPositions]);

  const labels = getLabels(50);
  return (
    <div style={{ position:"relative", width:"100%", height:420 }}>
      <div ref={mountRef} style={{ width:"100%", height:420, cursor:"grab" }} />
      <div ref={overlayRef} style={{ position:"absolute", inset:0, pointerEvents:"none" }}>
        {labels.map((lbl,i) => (
          <div key={i} className="oc3lbl" style={{
            position:"absolute", transform:"translate(-50%,-100%)",
            background:"rgba(255,255,255,0.93)", color:THEMES[
              Object.keys(THEMES).find(k=>THEMES[k]===color)||"Modern"
            ]||color,
            fontSize: lbl.length<=3 ? 10 : 8,
            fontWeight:"bold",
            padding:"2px 5px", borderRadius:3,
            border:`1px solid ${color}55`,
            whiteSpace:"nowrap", transition:"opacity 0.1s", pointerEvents:"none",
            boxShadow:"0 1px 3px rgba(0,0,0,0.10)",
          }}>
            {lbl}
          </div>
        ))}
      </div>
      {/* Randomize button overlay */}
      <button
        onClick={onRandomize}
        style={{
          position:"absolute", bottom:8, right:8,
          background:color, color:"#fff", border:"none",
          padding:"6px 14px", borderRadius:6,
          fontSize:11, fontWeight:"bold", cursor:"pointer",
          boxShadow:`0 2px 6px ${color}66`,
        }}
      >
        Randomize Labels
      </button>
    </div>
  );
}

// ── canvas roundRect helper ──────────────────────────────────────────────────
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.lineTo(x+w-r, y); ctx.arcTo(x+w, y, x+w, y+r, r);
  ctx.lineTo(x+w, y+h-r); ctx.arcTo(x+w, y+h, x+w-r, y+h, r);
  ctx.lineTo(x+r, y+h); ctx.arcTo(x, y+h, x, y+h-r, r);
  ctx.lineTo(x, y+r); ctx.arcTo(x, y, x+r, y, r);
  ctx.closePath();
}

// ─── Main ──────────────────────────────────────────────────────────────────────
const Occlusion = () => {
  const [viewMode,   setViewMode]   = useState("2d");
  const [theme,      setTheme]      = useState("Modern");
  const [labelPos,   setLabelPos]   = useState(() =>
    Array.from({ length:50 }, () => ({
      x: 80  + Math.random()*480,
      y: 80  + Math.random()*290,
    }))
  );
  const overlayRef = useRef(null);
  const color      = THEMES[theme];

  const randomize = () => setLabelPos(
    Array.from({ length:50 }, () => ({
      x: 80  + Math.random()*480,
      y: 80  + Math.random()*290,
    }))
  );

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
        <div style={{ fontSize:16, fontWeight:"bold", color:"#1e293b" }}>Map Label Occlusion Demo</div>
        <div style={{ fontSize:12, color:"#94a3b8", marginTop:2 }}>
          Overlapping labels are dimmed · hover to highlight · randomize to reshuffle
        </div>
      </div>

      {/* ── FIX: dropdowns left-aligned below title, consistent with all other charts ── */}
      <div style={{ display:"flex", gap:10, alignItems:"flex-end", marginTop:12, marginBottom:20 }}>
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
            {Object.keys(THEMES).map(k=><option key={k} value={k}>{k}</option>)}
          </select>
        </div>
      </div>

      {/* Chart + legend side-by-side */}
      <div style={{ display:"flex", gap:12, alignItems:"flex-start", width:"100%",
        border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden" }}>
        <div style={{ flex:1, minWidth:0 }}>
          {viewMode==="2d" ? (
            <Chart2D
              key={`2d-${theme}-${JSON.stringify(labelPos)}`}
              color={color}
              labelPositions={labelPos}
              onRandomize={randomize}
            />
          ) : (
            <Chart3D
              key={`3d-${theme}-${JSON.stringify(labelPos)}`}
              color={color}
              labelPositions={labelPos}
              onRandomize={randomize}
              overlayRef={overlayRef}
            />
          )}
        </div>
        <div style={{ padding:"12px 12px 12px 0" }}>
          <LegendHTML color={color} />
        </div>
      </div>
    </div>
  );
};

export default Occlusion;