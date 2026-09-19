import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import * as THREE from "three";

const THEMES = {
  Modern:  ["#6366f1","#06b6d4","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899","#14b8a6","#f97316","#6b7280","#3b82f6","#84cc16","#f43f5e","#22c55e","#a855f7","#fb923c","#0ea5e9","#dc2626","#16a34a","#9333ea"],
  Neon:    ["#ff0080","#00f5ff","#39ff14","#ffae00","#ff3131","#ff6bff","#00ff9d","#ff4400","#ff00aa","#00ccff","#ff0080","#00f5ff","#39ff14","#ffae00","#ff3131","#ff6bff","#00ff9d","#ff4400","#ff00aa","#00ccff"],
  Pastel:  ["#a5b4fc","#67e8f9","#6ee7b7","#fde68a","#fca5a5","#c4b5fd","#f9a8d4","#99f6e4","#fdba74","#d1d5db","#a5b4fc","#67e8f9","#6ee7b7","#fde68a","#fca5a5","#c4b5fd","#f9a8d4","#99f6e4","#fdba74","#d1d5db"],
  Sunset:  ["#ff6b6b","#feca57","#ff9ff3","#48dbfb","#1dd1a1","#f368e0","#ff9f43","#10ac84","#5f27cd","#00d2d3","#ff6b6b","#feca57","#ff9ff3","#48dbfb","#1dd1a1","#f368e0","#ff9f43","#10ac84","#5f27cd","#00d2d3"],
  Ocean:   ["#03045e","#0077b6","#00b4d8","#90e0ef","#023e8a","#0096c7","#48cae4","#ade8f4","#caf0f8","#7ec8e3","#03045e","#0077b6","#00b4d8","#90e0ef","#023e8a","#0096c7","#48cae4","#ade8f4","#caf0f8","#7ec8e3"],
  Galaxy:  ["#4a306d","#7b2cbf","#9d4edd","#c77dff","#e0aaff","#3c1e4d","#5e2e7d","#803ead","#a24edd","#c45eed","#4a306d","#7b2cbf","#9d4edd","#c77dff","#e0aaff","#3c1e4d","#5e2e7d","#803ead","#a24edd","#c45eed"],
  Forest:  ["#1b4332","#2d6a4f","#40916c","#52b788","#74c69d","#95d5b2","#b7e4c7","#a7c957","#6a994e","#386641","#1b4332","#2d6a4f","#40916c","#52b788","#74c69d","#95d5b2","#b7e4c7","#a7c957","#6a994e","#386641"],
  Autumn:  ["#7f4f24","#936639","#a68a64","#c2c5aa","#e63946","#c1121f","#9d0208","#6a040f","#370617","#b5838d","#7f4f24","#936639","#a68a64","#c2c5aa","#e63946","#c1121f","#9d0208","#6a040f","#370617","#b5838d"],
  Candy:   ["#ff006e","#fb5607","#ffbe0b","#8338ec","#3a86ff","#06d6a0","#ef476f","#ffd166","#26547c","#05c7f2","#ff006e","#fb5607","#ffbe0b","#8338ec","#3a86ff","#06d6a0","#ef476f","#ffd166","#26547c","#05c7f2"],
  Earth:   ["#6b4f3c","#8b6914","#a07850","#b8975a","#c9a96e","#3a7d44","#2d6a4f","#1b4332","#52796f","#84a98c","#6b4f3c","#8b6914","#a07850","#b8975a","#c9a96e","#3a7d44","#2d6a4f","#1b4332","#52796f","#84a98c"],
};

const GEO_URL = "https://raw.githubusercontent.com/geohacker/india/master/district/india_district.geojson";

// ─── Shared Legend ────────────────────────────────────────────────────────────
function LegendHTML({ districts, palette }) {
  if (!districts.length) return null;
  const color = d3.scaleOrdinal().domain(districts.map(d=>d.properties.NAME_2)).range(palette);
  return (
    <div style={{
      background:"#fff", border:"1px solid #e2e8f0", borderRadius:8,
      padding:"12px 14px", width:160, flexShrink:0,
      boxShadow:"0 1px 4px rgba(0,0,0,0.07)", alignSelf:"flex-start",
      maxHeight:460, overflowY:"auto",
    }}>
      <div style={{ fontSize:10, fontWeight:"bold", color:"#94a3b8", letterSpacing:"0.08em", marginBottom:8 }}>
        DISTRICTS ({districts.length})
      </div>
      {districts.map(d => (
        <div key={d.properties.NAME_2} style={{ display:"flex", alignItems:"center", gap:7, marginBottom:4 }}>
          <div style={{ width:9, height:9, borderRadius:2, flexShrink:0, background:color(d.properties.NAME_2) }} />
          <span style={{ color:"#334155", fontSize:10 }}>{d.properties.NAME_2}</span>
        </div>
      ))}
    </div>
  );
}

// ─── 2D Map ───────────────────────────────────────────────────────────────────
function Map2D({ districts, theme }) {
  const svgRef  = useRef(null);
  const palette = THEMES[theme];

  useEffect(() => {
    if (!svgRef.current || !districts.length) return;

    const W = 620, H = 440;
    const color = d3.scaleOrdinal().domain(districts.map(d=>d.properties.NAME_2)).range(palette);

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox",`0 0 ${W} ${H}`).attr("preserveAspectRatio","xMidYMid meet");
    svg.append("rect").attr("width",W).attr("height",H).attr("fill","#f0f4f8").attr("rx",8);

    const fc   = { type:"FeatureCollection", features:districts };
    const proj = d3.geoMercator().fitSize([W-40, H-40], fc);
    const path = d3.geoPath().projection(proj);

    const g = svg.append("g").attr("transform","translate(20,20)");

    // Zoom
    svg.call(
      d3.zoom().scaleExtent([1,8]).on("zoom", event => g.attr("transform", event.transform))
    );

    // Tooltip
    const tooltip = d3.select("body").append("div")
      .style("position","absolute").style("background","rgba(15,23,42,0.92)")
      .style("color","#fff").style("padding","8px 12px").style("border-radius","6px")
      .style("font-size","12px").style("pointer-events","none").style("opacity",0)
      .style("border","1px solid #334155").style("z-index","9999");

    // District fills
    g.selectAll("path").data(districts).enter().append("path")
      .attr("d", path)
      .attr("fill", d => color(d.properties.NAME_2))
      .attr("stroke","#fff").attr("stroke-width",1).attr("opacity",0.88)
      .style("cursor","pointer")
      .on("mouseover", function(event,d) {
        d3.select(this).attr("stroke","#1e293b").attr("stroke-width",2).attr("opacity",1);
        tooltip.style("opacity",1)
          .html(`<b style="color:${color(d.properties.NAME_2)}">${d.properties.NAME_2}</b><br/><span style="color:#94a3b8">Maharashtra, India</span>`)
          .style("left",(event.pageX+12)+"px").style("top",(event.pageY-10)+"px");
      })
      .on("mousemove", event => tooltip.style("left",(event.pageX+12)+"px").style("top",(event.pageY-10)+"px"))
      .on("mouseout", function() {
        d3.select(this).attr("stroke","#fff").attr("stroke-width",1).attr("opacity",0.88);
        tooltip.style("opacity",0);
      });

    // District labels — only show if centroid is inside bounds
    g.selectAll(".lbl").data(districts).enter().append("text")
      .attr("class","lbl")
      .attr("transform", d => `translate(${path.centroid(d)})`)
      .attr("text-anchor","middle").attr("dominant-baseline","middle")
      .style("font-size","8px").style("font-weight","700")
      .style("fill","#1e293b").style("pointer-events","none")
      .style("text-shadow","0 0 3px #fff")
      .text(d => d.properties.NAME_2);

    // Zoom hint
    svg.append("text")
      .attr("x",W-8).attr("y",H-8).attr("text-anchor","end")
      .style("font-size","10px").style("fill","#94a3b8")
      .text("🔍 Scroll to zoom · Drag to pan");

    return () => tooltip.remove();
  }, [districts, theme]);

  return (
    <div style={{ display:"flex", gap:12, alignItems:"flex-start", width:"100%", border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden" }}>
      <svg ref={svgRef} style={{ display:"block", flex:1, minWidth:0, height:440 }} />
      <div style={{ padding:"12px 12px 12px 0" }}>
        <LegendHTML districts={districts} palette={palette} />
      </div>
    </div>
  );
}

// ─── 3D Map ───────────────────────────────────────────────────────────────────
function Map3D({ districts, theme }) {
  const mountRef   = useRef(null);
  const overlayRef = useRef(null);
  const palette    = THEMES[theme];

  useEffect(() => {
    if (!mountRef.current || !districts.length) return;
    const el  = mountRef.current;
    const W   = el.offsetWidth || 620, H = 440;
    const color = d3.scaleOrdinal().domain(districts.map(d=>d.properties.NAME_2)).range(palette);

    const fc   = { type:"FeatureCollection", features:districts };
    const proj = d3.geoMercator().fitSize([W, H], fc);
    const path = d3.geoPath().projection(proj);

    const scene  = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f4f8);
    const camera = new THREE.PerspectiveCamera(42, W/H, 0.1, 200);
    camera.position.set(0, 0, 14);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias:true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    renderer.shadowMap.enabled = true;
    el.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const sun = new THREE.DirectionalLight(0xffffff, 1.0);
    sun.position.set(6,14,10); sun.castShadow=true;
    scene.add(sun);
    scene.add(new THREE.HemisphereLight(0xffffff,0xe0e7ff,0.4));

    // Build canvas texture
    const texW=1024, texH=Math.round(1024*(H/W));
    const canvas = document.createElement("canvas");
    canvas.width=texW; canvas.height=texH;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle="#f0f4f8"; ctx.fillRect(0,0,texW,texH);

    const texProj = d3.geoMercator().fitSize([texW,texH],fc);
    const texPath = d3.geoPath().projection(texProj).context(ctx);

    districts.forEach(d => {
      ctx.beginPath(); texPath(d);
      ctx.fillStyle = color(d.properties.NAME_2);
      ctx.globalAlpha = 0.88; ctx.fill(); ctx.globalAlpha=1;
      ctx.strokeStyle="#fff"; ctx.lineWidth=1.5; ctx.stroke();
    });

    // District name labels on texture
    districts.forEach(d => {
      const [cx,cy] = texPath.centroid(d);
      if (!cx || !cy || isNaN(cx) || isNaN(cy)) return;
      ctx.font = "bold 11px sans-serif";
      ctx.fillStyle="#1e293b";
      ctx.textAlign="center";
      ctx.textBaseline="middle";
      ctx.fillText(d.properties.NAME_2.length>10 ? d.properties.NAME_2.slice(0,9)+"." : d.properties.NAME_2, cx, cy);
    });

    // Map plane
    const aspect = texW/texH;
    const planeH = 10, planeW = planeH*aspect;
    const plane  = new THREE.Mesh(
      new THREE.PlaneGeometry(planeW, planeH),
      new THREE.MeshStandardMaterial({
        map: new THREE.CanvasTexture(canvas),
        roughness: 0.6, metalness: 0.05,
      })
    );
    plane.receiveShadow=true;
    scene.add(plane);

    // Extruded district blocks
    const pivot = new THREE.Group();
    const labelAnchors = [];

    districts.forEach((d, i) => {
      const [cx,cy] = path.centroid(d);
      if (!cx || !cy || isNaN(cx) || isNaN(cy)) return;

      // Map screen coords → 3D
      const x3 = ((cx/W)-0.5)*planeW;
      const y3 = -((cy/H)-0.5)*planeH;

      const col = new THREE.Color(color(d.properties.NAME_2));
      const geo = new THREE.BoxGeometry(0.18, 0.18, 0.18);
      const mat = new THREE.MeshStandardMaterial({
        color:col, roughness:0.25, metalness:0.4,
        emissive:col, emissiveIntensity:0.15,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x3, y3, 0.12);
      mesh.castShadow=true;
      pivot.add(mesh);

      labelAnchors.push({ x:x3, y:y3, z:0.35, text:d.properties.NAME_2 });
    });

    scene.add(pivot);

    const toScreen = (x3,y3,z3) => {
      const v = new THREE.Vector3(x3,y3,z3).project(camera);
      return { sx:(v.x*0.5+0.5)*W, sy:(-v.y*0.5+0.5)*H, behind:v.z>1 };
    };

    // Drag + auto-tilt
    let isDragging=false, prevX=0, prevY=0, rotX=0.25, rotY=0, autoSpin=true;
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
      animId = requestAnimationFrame(animate);
      if (autoSpin) rotY+=0.004;
      plane.rotation.y=rotY; plane.rotation.x=rotX;
      pivot.rotation.y=rotY; pivot.rotation.x=rotX;
      camera.updateMatrixWorld();

      if (overlayRef.current) {
        overlayRef.current.querySelectorAll(".dlbl").forEach((div,i) => {
          const a      = labelAnchors[i];
          const rotVec = new THREE.Vector3(a.x,a.y,a.z)
            .applyEuler(new THREE.Euler(rotX, rotY, 0,"XYZ"));
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
  }, [districts, theme]);

  return (
    <div style={{ display:"flex", gap:12, alignItems:"flex-start", width:"100%", border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden" }}>
      <div style={{ position:"relative", flex:1, minWidth:0 }}>
        <div ref={mountRef} style={{ width:"100%", height:440, cursor:"grab" }} />

        {/* Projected HTML district labels */}
        <div ref={overlayRef} style={{ position:"absolute", inset:0, pointerEvents:"none" }}>
          {districts.map((d,i) => {
            const col = THEMES[theme][i%THEMES[theme].length];
            return (
              <div key={i} className="dlbl" style={{
                position:"absolute", transform:"translate(-50%,-130%)",
                background:col, color:"#fff",
                fontSize:8, fontWeight:"bold",
                padding:"1px 4px", borderRadius:2, whiteSpace:"nowrap",
                transition:"opacity 0.1s", pointerEvents:"none",
                boxShadow:"0 1px 3px rgba(0,0,0,0.2)",
              }}>
                {d.properties.NAME_2}
              </div>
            );
          })}
        </div>

        <div style={{ padding:"7px 14px", background:"#f8fafc", borderTop:"1px solid #e2e8f0", fontSize:11, color:"#94a3b8" }}>
          💡 Drag to rotate · auto-spins until you interact
        </div>
      </div>

      <div style={{ padding:"12px 12px 12px 0" }}>
        <LegendHTML districts={districts} palette={THEMES[theme]} />
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const VectorTilesMap = () => {
  const [viewMode,   setViewMode]   = useState("2d");
  const [theme,      setTheme]      = useState("Modern");
  const [districts,  setDistricts]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [dataInfo,   setDataInfo]   = useState("");

  useEffect(() => {
    d3.json(GEO_URL).then(geo => {
      const mh = geo.features.filter(d => d.properties.NAME_1 === "Maharashtra");
      setDistricts(mh);
      setDataInfo(`${mh.length} districts · Maharashtra, India`);
      setLoading(false);
    }).catch(() => {
      setDataInfo("Failed to load GeoJSON");
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
        <div style={{ fontSize:16, fontWeight:"bold", color:"#1e293b" }}>Vector Tiles Map</div>
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
      <div style={{ minHeight:440 }}>
        {loading ? (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:440, color:"#94a3b8", fontSize:15 }}>
            Loading district data…
          </div>
        ) : viewMode === "2d" ? (
          <Map2D key={`2d-${theme}`} districts={districts} theme={theme} />
        ) : (
          <Map3D key={`3d-${theme}`} districts={districts} theme={theme} />
        )}
      </div>
    </div>
  );
};

export default VectorTilesMap;