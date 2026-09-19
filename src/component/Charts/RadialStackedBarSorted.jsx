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
  { month:"Jan", electronics:30, clothing:20, total:50  },
  { month:"Feb", electronics:50, clothing:30, total:80  },
  { month:"Mar", electronics:40, clothing:25, total:65  },
  { month:"Apr", electronics:60, clothing:35, total:95  },
  { month:"May", electronics:45, clothing:40, total:85  },
  { month:"Jun", electronics:55, clothing:45, total:100 },
  { month:"Jul", electronics:25, clothing:80, total:105 },
  { month:"Aug", electronics:70, clothing:50, total:120 },
  { month:"Sep", electronics:35, clothing:65, total:100 },
  { month:"Oct", electronics:80, clothing:40, total:120 },
  { month:"Nov", electronics:45, clothing:70, total:115 },
  { month:"Dec", electronics:90, clothing:60, total:150 },
];
const KEYS    = ["electronics","clothing"];
const SORTED  = [...DATA].sort((a,b) => a.total - b.total);
const AVG     = Math.round(d3.mean(DATA, d=>d.total));
const SUM     = d3.sum(DATA, d=>d.total);

// ─── Shared Legend ─────────────────────────────────────────────────────────────
function LegendHTML({ palette }) {
  const [c1, c2] = palette;
  const eSums = d3.sum(DATA, d=>d.electronics);
  const cSums = d3.sum(DATA, d=>d.clothing);
  return (
    <div style={{
      background:"#fff", border:"1px solid #e2e8f0", borderRadius:8,
      padding:"12px 14px", width:158, flexShrink:0,
      boxShadow:"0 1px 4px rgba(0,0,0,0.07)", alignSelf:"flex-start",
    }}>
      <div style={{ fontSize:10, fontWeight:"bold", color:"#94a3b8", letterSpacing:"0.08em", marginBottom:8 }}>
        CATEGORIES
      </div>
      {[
        { label:"Electronics", col:c1, val:eSums },
        { label:"Clothing",    col:c2, val:cSums },
      ].map(({ label,col,val }) => (
        <div key={label} style={{ display:"flex", alignItems:"center", gap:7, marginBottom:7 }}>
          <div style={{ width:10, height:10, borderRadius:2, flexShrink:0, background:col }} />
          <span style={{ color:"#334155", fontSize:11, flex:1 }}>{label}</span>
          <span style={{ color:col, fontSize:10, fontWeight:"bold" }}>{val}</span>
        </div>
      ))}
      <div style={{ borderTop:"1px solid #e2e8f0", margin:"8px 0" }} />
      <div style={{ fontSize:10, fontWeight:"bold", color:"#94a3b8", letterSpacing:"0.08em", marginBottom:6 }}>
        STATS
      </div>
      {[
        ["Months",    DATA.length],
        ["Avg total", AVG],
        ["Sum total", SUM],
        ["Peak",      d3.max(DATA,d=>d.total)],
      ].map(([k,v]) => (
        <div key={k} style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
          <span style={{ fontSize:10, color:"#94a3b8" }}>{k}</span>
          <span style={{ fontSize:10, fontWeight:"bold", color:"#334155" }}>{v}</span>
        </div>
      ))}
      <div style={{ fontSize:9, color:"#94a3b8", marginTop:6 }}>
        Sorted ascending by total
      </div>
    </div>
  );
}

// ─── 2D Radial Chart ──────────────────────────────────────────────────────────
function Chart2D({ theme }) {
  const svgRef  = useRef(null);
  const palette = THEMES[theme];
  const [c1,c2] = palette;

  useEffect(() => {
    if (!svgRef.current) return;

    const W = 520, H = 520;
    const innerR = 68, outerR = 220;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox",`0 0 ${W} ${H}`).attr("preserveAspectRatio","xMidYMid meet");
    svg.append("rect").attr("width",W).attr("height",H).attr("fill","#f8fafc").attr("rx",8);

    const stackedData = d3.stack().keys(KEYS)(SORTED);
    const maxVal = d3.max(stackedData[stackedData.length-1], d=>d[1]);

    const angleScale = d3.scaleBand()
      .domain(SORTED.map(d=>d.month))
      .range([0, 2*Math.PI]).padding(0.14);

    const rScale = d3.scaleRadial()
      .domain([0, maxVal*1.1]).range([innerR, outerR]);

    const arcFn = d3.arc()
      .innerRadius(d => rScale(d[0]))
      .outerRadius(d => rScale(d[1]))
      .startAngle(d => angleScale(d.data.month))
      .endAngle(d => angleScale(d.data.month)+angleScale.bandwidth())
      .padAngle(0.02).padRadius(innerR).cornerRadius(3);

    const g = svg.append("g").attr("transform",`translate(${W/2},${H/2})`);

    // Tooltip
    const tooltip = d3.select("body").append("div")
      .style("position","absolute").style("background","rgba(15,23,42,0.92)")
      .style("color","#fff").style("padding","8px 12px").style("border-radius","6px")
      .style("font-size","12px").style("pointer-events","none").style("opacity",0)
      .style("border","1px solid #334155").style("z-index","9999");

    // Radial grid lines
    [0.25,0.5,0.75,1].forEach(t => {
      g.append("circle").attr("r", innerR + (outerR-innerR)*t)
        .attr("fill","none").attr("stroke","#e2e8f0").attr("stroke-dasharray","3,3").attr("stroke-width",1);
    });

    // Stacked arcs
    stackedData.forEach((layer, li) => {
      const col = li===0 ? c1 : c2;
      g.selectAll(`.arc${li}`).data(layer).enter().append("path")
        .attr("class",`arc${li}`)
        .attr("d", arcFn)
        .attr("fill", col)
        .attr("stroke","#fff").attr("stroke-width",1).attr("opacity",0.9)
        .style("cursor","pointer")
        .on("mouseover", function(event,d) {
          d3.select(this).attr("opacity",1).attr("stroke","#1e293b").attr("stroke-width",1.5);
          tooltip.style("opacity",1)
            .html(
              `<b style="color:${col}">${d.data.month}</b><br/>` +
              `${KEYS[li]}: <b>${d[1]-d[0]}</b><br/>` +
              `Total: <b>${d.data.total}</b>`
            )
            .style("left",(event.pageX+12)+"px").style("top",(event.pageY-10)+"px");
        })
        .on("mouseout", function() {
          d3.select(this).attr("opacity",0.9).attr("stroke","#fff").attr("stroke-width",1);
          tooltip.style("opacity",0);
        });
    });

    // Value labels inside arcs (electronics only, if wide enough)
    stackedData[0].forEach(d => {
      const angle = angleScale(d.data.month)+angleScale.bandwidth()/2 - Math.PI/2;
      const r     = (rScale(d[0])+rScale(d[1]))/2;
      if (rScale(d[1])-rScale(d[0]) > 14) {
        g.append("text")
          .attr("transform",`translate(${Math.cos(angle)*r},${Math.sin(angle)*r})`)
          .attr("text-anchor","middle").attr("dominant-baseline","middle")
          .style("font-size","8px").style("font-weight","700").style("fill","#fff")
          .style("pointer-events","none").text(d.data.electronics);
      }
    });

    // Month labels outside
    SORTED.forEach(d => {
      const angle = angleScale(d.month)+angleScale.bandwidth()/2 - Math.PI/2;
      const r     = outerR + 22;
      g.append("text")
        .attr("transform",`translate(${Math.cos(angle)*r},${Math.sin(angle)*r})`)
        .attr("text-anchor","middle").attr("dominant-baseline","middle")
        .style("font-size","10px").style("font-weight","600").style("fill","#334155")
        .style("pointer-events","none").text(d.month);
    });

    // Center
    g.append("circle").attr("r",innerR-6)
      .attr("fill","#fff").attr("stroke","#e2e8f0").attr("stroke-width",1.5);
    g.append("text").attr("text-anchor","middle").attr("y",-10)
      .style("font-size","11px").style("font-weight","700").style("fill",c1).text("AVG");
    g.append("text").attr("text-anchor","middle").attr("y",6)
      .style("font-size","16px").style("font-weight","bold").style("fill","#1e293b").text(AVG);
    g.append("text").attr("text-anchor","middle").attr("y",20)
      .style("font-size","9px").style("fill","#94a3b8").text(`Σ ${SUM}`);

    return () => tooltip.remove();
  }, [theme]);

  return (
    <div style={{ display:"flex", gap:12, alignItems:"flex-start", width:"100%",
      border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden" }}>
      <svg ref={svgRef} style={{ display:"block", flex:1, minWidth:0, height:520 }} />
      <div style={{ padding:"12px 12px 12px 0" }}>
        <LegendHTML palette={THEMES[theme]} />
      </div>
    </div>
  );
}

// ─── 3D Radial Chart ──────────────────────────────────────────────────────────
function Chart3D({ theme }) {
  const mountRef   = useRef(null);
  const overlayRef = useRef(null);
  const palette    = THEMES[theme];
  const [c1,c2]    = palette;

  useEffect(() => {
    if (!mountRef.current) return;
    const el = mountRef.current;
    const W  = el.offsetWidth || 560, H = 520;

    const scene  = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);
    const camera = new THREE.PerspectiveCamera(40, W/H, 0.1, 200);
    camera.position.set(0, 9, 16);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias:true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    renderer.shadowMap.enabled=true;
    el.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff,0.8));
    const sun = new THREE.DirectionalLight(0xffffff,0.9);
    sun.position.set(5,12,8); sun.castShadow=true; scene.add(sun);
    const rimL = new THREE.PointLight(new THREE.Color(c1),0.4,60);
    rimL.position.set(-8,5,-6); scene.add(rimL);
    scene.add(new THREE.HemisphereLight(0xffffff,0xe0e7ff,0.4));

    // Floor
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(28,22),
      new THREE.MeshStandardMaterial({ color:0xf1f5f9, roughness:0.9 })
    );
    floor.rotation.x=-Math.PI/2; floor.receiveShadow=true; scene.add(floor);
    scene.add(new THREE.GridHelper(28,24,0xcccccc,0xe2e8f0));

    const stackedData = d3.stack().keys(KEYS)(SORTED);
    const maxVal      = d3.max(stackedData[stackedData.length-1], d=>d[1]);
    const n           = SORTED.length;
    const ringR       = 4.0;
    const maxH        = 6;
    const segW        = 0.55;
    const pivot       = new THREE.Group();
    const labelAnchors = [];

    SORTED.forEach((row, mi) => {
      const angle  = (mi/n)*Math.PI*2 - Math.PI/2;
      const cx     = Math.cos(angle)*ringR;
      const cz     = Math.sin(angle)*ringR;

      let yBase = 0;
      KEYS.forEach((key, ki) => {
        const val = row[key];
        const bh  = Math.max(0.05, (val/maxVal)*maxH);
        const col = new THREE.Color(ki===0 ? c1 : c2);

        // Shadow
        const sm = new THREE.Mesh(
          new THREE.BoxGeometry(segW,bh*0.12,segW),
          new THREE.MeshBasicMaterial({ color:0xbbbbbb, transparent:true, opacity:0.12 })
        );
        sm.position.set(cx+0.05,yBase+bh*0.06,cz+0.05); pivot.add(sm);

        // Bar segment
        const geo  = new THREE.BoxGeometry(segW,bh,segW);
        const mat  = new THREE.MeshStandardMaterial({
          color:col, roughness:0.22, metalness:0.4,
          emissive:col, emissiveIntensity:0.1,
        });
        const mesh = new THREE.Mesh(geo,mat);
        mesh.position.set(cx,yBase+bh/2,cz);
        mesh.castShadow=true; pivot.add(mesh);

        // Edges
        const eg  = new THREE.EdgesGeometry(geo);
        const el2 = new THREE.LineSegments(eg, new THREE.LineBasicMaterial({ color:0xffffff, transparent:true, opacity:0.35 }));
        el2.position.set(cx,yBase+bh/2,cz); pivot.add(el2);

        // Glow cap on top segment
        if (ki===KEYS.length-1) {
          const capC = col.clone().lerp(new THREE.Color(0xffffff),0.25);
          const cap  = new THREE.Mesh(
            new THREE.BoxGeometry(segW,0.06,segW),
            new THREE.MeshStandardMaterial({ color:capC, emissive:capC, emissiveIntensity:1.2, roughness:0.04, metalness:1 })
          );
          cap.position.set(cx,yBase+bh+0.03,cz); pivot.add(cap);

          // Total label above stack
          labelAnchors.push({
            x: cx, y: yBase+bh+0.55, z: cz,
            text: `${row.month}`, col:"#334155", isMonth:true,
          });
        }

        yBase += bh;
      });
    });

    // Inner ring indicator
    const ringGeo = new THREE.TorusGeometry(ringR, 0.04, 8, 80);
    pivot.add(new THREE.Mesh(ringGeo,
      new THREE.MeshStandardMaterial({ color:new THREE.Color(c1), roughness:0.3, metalness:0.5 })
    ));

    // Center cylinder
    const centerCyl = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5,0.5,0.08,32),
      new THREE.MeshStandardMaterial({ color:new THREE.Color(c1), roughness:0.3, metalness:0.5 })
    );
    pivot.add(centerCyl);
    labelAnchors.push({ x:0, y:0.35, z:0, text:`AVG ${AVG}`, col:c1, isMonth:false });

    scene.add(pivot);

    const toScreen = (x3,y3,z3) => {
      const v = new THREE.Vector3(x3,y3,z3).project(camera);
      return { sx:(v.x*0.5+0.5)*W, sy:(-v.y*0.5+0.5)*H, behind:v.z>1 };
    };

    let isDragging=false, prevX=0, prevY=0, rotX=0.35, rotY=0, autoSpin=true;
    const onDown = e=>{ isDragging=true; prevX=e.clientX; prevY=e.clientY; autoSpin=false; renderer.domElement.style.cursor="grabbing"; };
    const onUp   = ()=>{ isDragging=false; renderer.domElement.style.cursor="grab"; };
    const onMove = e=>{
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
      if (autoSpin) rotY+=0.004;
      pivot.rotation.y=rotY; pivot.rotation.x=rotX;
      camera.updateMatrixWorld();

      if (overlayRef.current) {
        overlayRef.current.querySelectorAll(".rslbl").forEach((div,i) => {
          const a      = labelAnchors[i];
          const rotVec = new THREE.Vector3(a.x,a.y,a.z).applyEuler(pivot.rotation);
          const {sx,sy,behind} = toScreen(rotVec.x,rotVec.y,rotVec.z);
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

  // Mirror label list for JSX
  const jsxLabels = SORTED.map(row => ({
    text: row.month, col:"#334155", isMonth:true,
  }));
  jsxLabels.push({ text:`AVG ${AVG}`, col:THEMES[theme][0], isMonth:false });

  return (
    <div style={{ display:"flex", gap:12, alignItems:"flex-start", width:"100%",
      border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden" }}>
      <div style={{ position:"relative", flex:1, minWidth:0 }}>
        <div ref={mountRef} style={{ width:"100%", height:520, cursor:"grab" }} />

        <div ref={overlayRef} style={{ position:"absolute", inset:0, pointerEvents:"none" }}>
          {jsxLabels.map((a,i) => (
            <div key={i} className="rslbl" style={{
              position:"absolute",
              transform: a.isMonth ? "translate(-50%,-100%)" : "translate(-50%,-50%)",
              background: a.isMonth ? "rgba(255,255,255,0.92)" : `${THEMES[theme][0]}22`,
              color: a.col,
              fontSize: a.isMonth ? 9 : 10,
              fontWeight:"bold",
              padding:"2px 5px", borderRadius:3,
              border: a.isMonth
                ? "1px solid #e2e8f0"
                : `1px solid ${THEMES[theme][0]}66`,
              whiteSpace:"nowrap", transition:"opacity 0.1s", pointerEvents:"none",
              boxShadow:"0 1px 3px rgba(0,0,0,0.08)",
            }}>
              {a.text}
            </div>
          ))}
        </div>

        {/* Color key overlay */}
        <div style={{
          position:"absolute", top:10, left:12,
          display:"flex", flexDirection:"column", gap:4, pointerEvents:"none",
        }}>
          {[["Electronics",THEMES[theme][0]],["Clothing",THEMES[theme][1]]].map(([label,col])=>(
            <div key={label} style={{
              display:"flex", alignItems:"center", gap:5,
              background:"rgba(255,255,255,0.92)", padding:"3px 7px",
              borderRadius:4, border:`1px solid ${col}55`,
              fontSize:10, fontWeight:"bold", color:col,
              boxShadow:"0 1px 3px rgba(0,0,0,0.08)",
            }}>
              <div style={{ width:8, height:8, borderRadius:2, background:col }} />
              {label}
            </div>
          ))}
        </div>

        <div style={{ padding:"7px 14px", background:"#f8fafc",
          borderTop:"1px solid #e2e8f0", fontSize:11, color:"#94a3b8" }}>
          💡 Drag to rotate · auto-spins · Bars sorted ascending by monthly total
        </div>
      </div>

      <div style={{ padding:"12px 12px 12px 0" }}>
        <LegendHTML palette={THEMES[theme]} />
      </div>
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
const RadialStackedBarSorted = () => {
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
        <div style={{ fontSize:16, fontWeight:"bold", color:"#1e293b" }}>
          Radial Stacked Bar Chart
        </div>
        <div style={{ fontSize:12, color:"#94a3b8", marginTop:2 }}>
          Monthly Electronics vs Clothing · sorted ascending by total
        </div>
      </div>

      {/* Dropdowns */}
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

      {viewMode === "2d"
        ? <Chart2D key={`2d-${theme}`} theme={theme} />
        : <Chart3D key={`3d-${theme}`} theme={theme} />
      }
    </div>
  );
};

export default RadialStackedBarSorted;