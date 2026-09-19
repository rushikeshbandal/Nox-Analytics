import React, { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import * as THREE from "three";
import ColorWheel from "../colorwheel.jsx";

// ═══════════════════════════════════════════════════════════
// PALETTE ENGINE — same pattern as SimpleBarChart
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

const loadOverrides = (theme) => {
  try {
    const raw = localStorage.getItem(`${PALETTE_KEY}_donut_${theme}`);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
};

const saveOverrides = (theme, overrides) => {
  localStorage.setItem(`${PALETTE_KEY}_donut_${theme}`, JSON.stringify(overrides));
  window.dispatchEvent(new CustomEvent(PALETTE_EVENT, {
    detail: { source: "DonutChart1", theme, overrides }
  }));
};

const buildPalette = (theme, overrides) => {
  const base = [...BASE_THEMES[theme]];
  Object.entries(overrides).forEach(([idx, color]) => { base[parseInt(idx)] = color; });
  return base;
};

const FALLBACK = [
  { label:"Electronics",     value:6 },
  { label:"Jewelery",        value:4 },
  { label:"Men's Clothing",  value:4 },
  { label:"Women's Clothing",value:6 },
];

// ─── Legend ───────────────────────────────────────────────────────────────────
function LegendHTML({ data, palette, onColorClick }) {
  const total = d3.sum(data, d => d.value);
  return (
    <div style={{
      background:"#fff", border:"1px solid #e2e8f0", borderRadius:8,
      padding:"12px 14px", width:185, flexShrink:0,
      boxShadow:"0 1px 4px rgba(0,0,0,0.07)", alignSelf:"flex-start",
    }}>
      <div style={{ fontSize:10, fontWeight:"bold", color:"#94a3b8", letterSpacing:"0.08em", marginBottom:8 }}>
        CATEGORIES · click swatch to edit
      </div>
      {data.map((d, i) => {
        const c   = palette[i % palette.length];
        const pct = ((d.value/total)*100).toFixed(1);
        return (
          <div key={d.label} style={{ display:"flex", alignItems:"center", gap:7, marginBottom:6 }}>
            <div
              title={`Edit color for ${d.label}`}
              onClick={() => onColorClick(i)}
              style={{
                width:12, height:12, borderRadius:3, flexShrink:0, background:c,
                cursor:"pointer", border:"1.5px solid rgba(0,0,0,0.12)",
                transition:"transform 0.15s",
              }}
              onMouseEnter={e=>e.currentTarget.style.transform="scale(1.35)"}
              onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}
            />
            <span style={{ color:"#334155", fontSize:11, flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {d.label}
            </span>
            <span style={{ color:c, fontSize:10, fontWeight:"bold", flexShrink:0 }}>
              {d.value} · {pct}%
            </span>
          </div>
        );
      })}
      <div style={{ borderTop:"1px solid #e2e8f0", marginTop:8, paddingTop:8, display:"flex", justifyContent:"space-between" }}>
        <span style={{ fontSize:10, color:"#94a3b8" }}>Total products</span>
        <span style={{ fontSize:11, fontWeight:"bold", color:"#334155" }}>{total}</span>
      </div>
    </div>
  );
}

// ─── 2D Chart ─────────────────────────────────────────────────────────────────
function Chart2D({ data, palette, onSliceClick }) {
  const svgRef = useRef(null);
  const total  = d3.sum(data, d => d.value);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    const W = 420, H = 420;
    const R = Math.min(W,H)/2 - 20;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox",`0 0 ${W} ${H}`).attr("preserveAspectRatio","xMidYMid meet");
    svg.append("rect").attr("width",W).attr("height",H).attr("fill","#f8fafc").attr("rx",8);

    // Color scale keyed by index for precise per-slice control
    const colorOf = (i) => palette[i % palette.length];

    const pie  = d3.pie().value(d=>d.value).sort(null).padAngle(0.025);
    const arc  = d3.arc().innerRadius(R*0.52).outerRadius(R).cornerRadius(5);
    const arcH = d3.arc().innerRadius(R*0.52).outerRadius(R*1.06).cornerRadius(5);

    const tip = d3.select("body").append("div")
      .style("position","absolute").style("background","rgba(15,23,42,0.92)")
      .style("color","#fff").style("padding","8px 12px").style("border-radius","6px")
      .style("font-size","12px").style("pointer-events","none").style("opacity",0)
      .style("border","1px solid #334155").style("z-index","9999");

    const g = svg.append("g").attr("transform",`translate(${W/2},${H/2})`);

    const slicesData = pie(data);

    const slices = g.selectAll(".arc")
      .data(slicesData)
      .enter().append("g");

    slices.append("path")
      .attr("d", arc)
      // Use the datum's original index for color — not D3's internal index
      .attr("fill", (d,i) => colorOf(i))
      .attr("stroke","#fff").attr("stroke-width",2).attr("opacity",0.9)
      .style("cursor","pointer")
      .on("mouseover", function(event,d) {
        const i   = slicesData.indexOf(d);
        const col = colorOf(i);
        d3.select(this).transition().duration(180).attr("d",arcH(d)).attr("opacity",1);
        const pct = ((d.data.value/total)*100).toFixed(1);
        tip.style("opacity",1)
          .html(`<b style="color:${col}">${d.data.label}</b><br/>Products: <b>${d.data.value}</b><br/>Share: ${pct}%<br/><span style="color:#94a3b8;font-size:10px">Click to change color</span>`)
          .style("left",(event.pageX+12)+"px").style("top",(event.pageY-10)+"px");
      })
      .on("mouseout", function(event,d) {
        d3.select(this).transition().duration(180).attr("d",arc(d)).attr("opacity",0.9);
        tip.style("opacity",0);
      })
      .on("click", function(event, d) {
        event.stopPropagation();
        tip.style("opacity",0);
        const i = slicesData.indexOf(d);
        onSliceClick(i);
      });

    // Percentage labels
    slices.append("text")
      .attr("transform", d=>`translate(${arc.centroid(d)})`)
      .attr("text-anchor","middle").attr("dominant-baseline","middle")
      .style("font-size","10px").style("font-weight","700").style("fill","#fff")
      .style("pointer-events","none")
      .text((d,i) => ((d.data.value/total)*100)>=5 ? `${((d.data.value/total)*100).toFixed(0)}%` : "");

    // Center
    g.append("text").attr("text-anchor","middle").attr("y",-12)
      .style("font-size","22px").style("font-weight","bold").style("fill","#1e293b")
      .text(total);
    g.append("text").attr("text-anchor","middle").attr("y",12)
      .style("font-size","11px").style("fill","#94a3b8").text("products");

    return () => tip.remove();
  }, [data, palette]);

  return (
    <div style={{ display:"flex", gap:12, alignItems:"flex-start", width:"100%", border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden" }}>
      <svg ref={svgRef} style={{ display:"block", flex:1, minWidth:0, height:420 }} />
    </div>
  );
}

// ─── 3D Chart ─────────────────────────────────────────────────────────────────
function Chart3D({ data, palette, onSliceClick }) {
  const mountRef   = useRef(null);
  const overlayRef = useRef(null);
  const total      = d3.sum(data, d=>d.value);

  useEffect(() => {
    if (!mountRef.current || !data.length) return;
    const el = mountRef.current;
    const W  = el.offsetWidth || 500, H = 420;

    const scene  = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);
    const camera = new THREE.PerspectiveCamera(45, W/H, 0.1, 100);
    camera.position.set(0,3.5,7);
    camera.lookAt(0,0,0);

    const renderer = new THREE.WebGLRenderer({ antialias:true });
    renderer.setSize(W,H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    renderer.shadowMap.enabled=true;
    el.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff,0.8));
    const sun=new THREE.DirectionalLight(0xffffff,0.9);
    sun.position.set(5,10,8); sun.castShadow=true; scene.add(sun);
    const back=new THREE.DirectionalLight(0xffffff,0.35);
    back.position.set(-5,-3,-6); scene.add(back);

    const floor=new THREE.Mesh(
      new THREE.PlaneGeometry(20,14),
      new THREE.MeshStandardMaterial({ color:0xf1f5f9, roughness:0.9 })
    );
    floor.rotation.x=-Math.PI/2; floor.position.y=-0.12; floor.receiveShadow=true; scene.add(floor);
    scene.add(new THREE.GridHelper(20,18,0xcccccc,0xe2e8f0));

    const pie    = d3.pie().value(d=>d.value).sort(null).padAngle(0.04);
    const slices = pie(data);
    const outerR = 2.4, innerR = 1.1, depth = 0.7;
    const pivot  = new THREE.Group();
    const labelAnchors  = [];
    const meshToSlice   = new Map(); // THREE.Mesh → slice index

    slices.forEach((slice, i) => {
      const spanA  = slice.endAngle - slice.startAngle;
      const segs   = Math.max(4, Math.round(spanA*14));
      const hexCol = palette[i % palette.length];
      const col    = new THREE.Color(hexCol);
      const midA   = (slice.startAngle + slice.endAngle) / 2;

      const shape = new THREE.Shape();
      shape.moveTo(Math.cos(slice.startAngle)*outerR, Math.sin(slice.startAngle)*outerR);
      for (let j=0; j<=segs; j++) {
        const a = slice.startAngle+(j/segs)*spanA;
        shape.lineTo(Math.cos(a)*outerR, Math.sin(a)*outerR);
      }
      for (let j=segs; j>=0; j--) {
        const a = slice.startAngle+(j/segs)*spanA;
        shape.lineTo(Math.cos(a)*innerR, Math.sin(a)*innerR);
      }
      shape.closePath();

      const geo  = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled:false });
      const mat  = new THREE.MeshStandardMaterial({
        color:col, roughness:0.25, metalness:0.35,
        emissive:col, emissiveIntensity:0.08,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x=-Math.PI/2;
      mesh.castShadow=true;
      pivot.add(mesh);
      meshToSlice.set(mesh, i); // map mesh → slice index

      const eg  = new THREE.EdgesGeometry(geo);
      const el2 = new THREE.LineSegments(eg, new THREE.LineBasicMaterial({ color:0xffffff, transparent:true, opacity:0.4 }));
      el2.rotation.x=-Math.PI/2; pivot.add(el2);

      const capR   = (outerR+innerR)/2;
      const capCol = col.clone().lerp(new THREE.Color(0xffffff),0.3);
      const capMesh= new THREE.Mesh(
        new THREE.BoxGeometry(0.06,0.06,0.06),
        new THREE.MeshStandardMaterial({ color:capCol, emissive:capCol, emissiveIntensity:1.2 })
      );
      capMesh.position.set(Math.cos(midA)*capR, depth*0.5+0.05, -Math.sin(midA)*capR);
      pivot.add(capMesh);

      const labelR = outerR+0.7;
      const pct    = ((slice.data.value/total)*100).toFixed(1);
      labelAnchors.push({
        x:Math.cos(midA)*labelR, y:depth/2, z:-Math.sin(midA)*labelR,
        text:`${slice.data.label.split(" ")[0]} ${pct}%`, col:hexCol,
      });
    });

    scene.add(pivot);

    // Raycaster — click slice to open wheel
    const raycaster = new THREE.Raycaster();
    const mouse     = new THREE.Vector2();
    const onCanvasClick = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX-rect.left)/rect.width)*2-1;
      mouse.y = -((e.clientY-rect.top)/rect.height)*2+1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects([...meshToSlice.keys()]);
      if (hits.length>0) {
        const si = meshToSlice.get(hits[0].object);
        if (si!==undefined) onSliceClick(si);
      }
    };
    renderer.domElement.addEventListener("click", onCanvasClick);

    const toScreen = (x3,y3,z3) => {
      const v=new THREE.Vector3(x3,y3,z3).project(camera);
      return { sx:(v.x*0.5+0.5)*W, sy:(-v.y*0.5+0.5)*H, behind:v.z>1 };
    };

    let isDragging=false, prevX=0, prevY=0, rotX=0.35, rotY=0, autoSpin=true;
    const onDown=e=>{ isDragging=true; prevX=e.clientX; prevY=e.clientY; autoSpin=false; renderer.domElement.style.cursor="grabbing"; };
    const onUp=()=>{ isDragging=false; renderer.domElement.style.cursor="grab"; };
    const onMove=e=>{
      if (!isDragging) return;
      rotY+=(e.clientX-prevX)*0.006;
      rotX=Math.max(-0.8,Math.min(0.8,rotX+(e.clientY-prevY)*0.004));
      prevX=e.clientX; prevY=e.clientY;
    };
    renderer.domElement.addEventListener("mousedown",onDown);
    window.addEventListener("mouseup",onUp);
    window.addEventListener("mousemove",onMove);
    renderer.domElement.style.cursor="grab";

    let animId;
    const animate=()=>{
      animId=requestAnimationFrame(animate);
      if (autoSpin) rotY+=0.005;
      pivot.rotation.y=rotY; pivot.rotation.x=rotX;
      camera.updateMatrixWorld();
      if (overlayRef.current) {
        overlayRef.current.querySelectorAll(".d1lbl").forEach((div,i)=>{
          const a=labelAnchors[i];
          const rotVec=new THREE.Vector3(a.x,a.y,a.z).applyEuler(pivot.rotation);
          const {sx,sy,behind}=toScreen(rotVec.x,rotVec.y,rotVec.z);
          div.style.left=`${sx}px`; div.style.top=`${sy}px`; div.style.opacity=behind?"0":"1";
        });
      }
      renderer.render(scene,camera);
    };
    animate();

    return ()=>{
      cancelAnimationFrame(animId);
      renderer.domElement.removeEventListener("click",onCanvasClick);
      renderer.domElement.removeEventListener("mousedown",onDown);
      window.removeEventListener("mouseup",onUp);
      window.removeEventListener("mousemove",onMove);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [data, palette]);

  return (
    <div style={{ display:"flex", gap:12, alignItems:"flex-start", width:"100%", border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden" }}>
      <div style={{ position:"relative", flex:1, minWidth:0 }}>
        <div ref={mountRef} style={{ width:"100%", height:420, cursor:"grab" }} />
        <div ref={overlayRef} style={{ position:"absolute", inset:0, pointerEvents:"none" }}>
          {data.map((d,i)=>(
            <div key={i} className="d1lbl" style={{
              position:"absolute", transform:"translate(-50%,-50%)",
              background:"rgba(255,255,255,0.93)",
              color:palette[i%palette.length],
              fontSize:9, fontWeight:"bold", padding:"2px 6px", borderRadius:3,
              border:`1px solid ${palette[i%palette.length]}55`,
              whiteSpace:"nowrap", transition:"opacity 0.1s", pointerEvents:"none",
              boxShadow:"0 1px 3px rgba(0,0,0,0.10)",
            }}>
              {d.label.split(" ")[0]} · {((d.value/total)*100).toFixed(1)}%
            </div>
          ))}
        </div>
        <div style={{ padding:"7px 14px", background:"#f8fafc", borderTop:"1px solid #e2e8f0", fontSize:11, color:"#94a3b8" }}>
          💡 Drag to rotate · Click a slice to change its color
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const DonutChart1 = () => {
  const [viewMode,  setViewMode]  = useState("2d");
  const [theme,     setTheme]     = useState("Modern");
  const [overrides, setOverrides] = useState(() => loadOverrides("Modern"));
  const [data,      setData]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [dataInfo,  setDataInfo]  = useState("");

  // Color wheel state
  const [showWheel, setShowWheel] = useState(false);
  const [editSlot,  setEditSlot]  = useState(null); // palette slot index being edited

  const palette = buildPalette(theme, overrides);

  // Reload overrides when theme switches
  useEffect(() => { setOverrides(loadOverrides(theme)); }, [theme]);

  // Listen for palette changes from other charts / palette manager
  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.source === "DonutChart1") return;
      if (e.detail?.theme === theme && e.detail?.overrides) {
        setOverrides(e.detail.overrides);
      }
      if (e.detail?.palette?.primaryColors?.length) {
        const colors = e.detail.palette.primaryColors;
        const next   = {};
        colors.forEach((c,i) => { next[i]=c; });
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

  const openWheel = useCallback((slotIndex) => {
    setEditSlot(slotIndex);
    setShowWheel(true);
  }, []);

  const handleApplyColor = useCallback((colors, meta) => {
    const newColor = colors[0];
    const idx      = meta?.slotIndex ?? editSlot;
    if (idx === null || idx === undefined) return;
    const next = { ...overrides, [idx]: newColor };
    setOverrides(next);
    saveOverrides(theme, next);
    setShowWheel(false);
  }, [overrides, theme, editSlot]);

  const resetTheme = () => { setOverrides({}); saveOverrides(theme, {}); };
  const hasOverrides = Object.keys(overrides).length > 0;

  // Data fetch
  useEffect(() => {
    fetch("https://fakestoreapi.com/products")
      .then(r=>r.json())
      .then(products=>{
        const map={};
        products.forEach(p=>{ map[p.category]=(map[p.category]||0)+1; });
        const rows=Object.entries(map).map(([label,value])=>({ label, value }));
        setData(rows);
        setDataInfo(`${products.length} products · ${rows.length} categories · FakeStore API`);
        setLoading(false);
      })
      .catch(()=>{
        setData(FALLBACK);
        setDataInfo("Sample data (API unavailable)");
        setLoading(false);
      });
  }, []);

  const ddStyle = {
    padding:"5px 10px", borderRadius:6, border:"1px solid #e2e8f0",
    background:"#fff", color:"#334155", fontWeight:"500",
    cursor:"pointer", fontSize:12, outline:"none",
  };

  return (
    <div style={{ background:"#ffffff", borderRadius:12, padding:"20px 24px 32px", width:"100%", boxShadow:"0 1px 3px rgba(0,0,0,0.08)", boxSizing:"border-box" }}>
      <div style={{ marginBottom:4 }}>
        <div style={{ fontSize:16, fontWeight:"bold", color:"#1e293b" }}>Donut Chart</div>
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
        {/* Mini palette strip */}
        <div style={{ display:"flex", gap:3, alignItems:"flex-end", marginTop:16 }}>
          {data.map((_,i) => (
            <div key={i} title={`Slot ${i} · ${palette[i%palette.length]}\nClick to edit`}
              onClick={() => openWheel(i)}
              style={{
                width:16, height:16, borderRadius:3, background:palette[i%palette.length],
                cursor:"pointer",
                border: i===editSlot&&showWheel ? "2px solid #1e293b" : "1px solid rgba(0,0,0,0.12)",
                transition:"transform 0.15s",
              }}
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
                ? <Chart2D key={`2d-${theme}`} data={data} palette={palette} onSliceClick={openWheel} />
                : <Chart3D key={`3d-${theme}`} data={data} palette={palette} onSliceClick={openWheel} />
              }
            </div>
            <LegendHTML data={data} palette={palette} onColorClick={openWheel} />
          </div>
        )}
      </div>

      {/* Color Wheel Modal */}
      {showWheel && editSlot !== null && (
        <ColorWheel
          onClose={() => setShowWheel(false)}
          onApply={(colors, meta) => handleApplyColor(colors, { ...meta, slotIndex: editSlot })}
          initialColor={palette[editSlot % palette.length] ?? "#6366f1"}
          categoryName={data[editSlot]?.label ?? `Slot ${editSlot}`}
        />
      )}
    </div>
  );
};

export default DonutChart1;