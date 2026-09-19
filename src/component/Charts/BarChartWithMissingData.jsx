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

const RAW_DATA = [
  { date:"Jan", value:30  },
  { date:"Feb", value:45  },
  { date:"Mar", value:null},
  { date:"Apr", value:60  },
  { date:"May", value:75  },
  { date:"Jun", value:85  },
  { date:"Jul", value:null},
  { date:"Aug", value:null},
  { date:"Sep", value:65  },
  { date:"Oct", value:80  },
  { date:"Nov", value:90  },
  { date:"Dec", value:95  },
];

// ─── Shared Legend ────────────────────────────────────────────────────────────
function LegendHTML({ palette }) {
  const valid   = RAW_DATA.filter(d => d.value !== null);
  const missing = RAW_DATA.filter(d => d.value === null);
  return (
    <div style={{
      background:"#fff", border:"1px solid #e2e8f0", borderRadius:8,
      padding:"12px 14px", width:155, flexShrink:0,
      boxShadow:"0 1px 4px rgba(0,0,0,0.07)", alignSelf:"flex-start",
    }}>
      <div style={{ fontSize:10, fontWeight:"bold", color:"#94a3b8", letterSpacing:"0.08em", marginBottom:8 }}>
        DATA POINTS
      </div>
      {valid.map((d, i) => (
        <div key={d.date} style={{ display:"flex", alignItems:"center", gap:7, marginBottom:4 }}>
          <div style={{ width:9, height:9, borderRadius:2, flexShrink:0, background:palette[i%palette.length] }} />
          <span style={{ color:"#334155", fontSize:10, flex:1 }}>{d.date}</span>
          <span style={{ color:palette[i%palette.length], fontSize:10, fontWeight:"bold" }}>{d.value}</span>
        </div>
      ))}
      <div style={{ borderTop:"1px solid #e2e8f0", marginTop:8, paddingTop:8 }}>
        <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:4 }}>
          <div style={{ width:9, height:9, borderRadius:"50%", flexShrink:0, border:"2px dashed #ef4444" }} />
          <span style={{ color:"#ef4444", fontSize:10, fontWeight:"600" }}>Missing data</span>
        </div>
        <div style={{ fontSize:9, color:"#94a3b8" }}>
          {missing.map(d=>d.date).join(", ")} — null values
        </div>
      </div>
    </div>
  );
}

// ─── 2D Chart ─────────────────────────────────────────────────────────────────
function Chart2D({ theme }) {
  const svgRef  = useRef(null);
  const palette = THEMES[theme];

  useEffect(() => {
    if (!svgRef.current) return;

    const W = 620, H = 380;
    const margin = { top:20, right:20, bottom:46, left:50 };
    const cW = W - margin.left - margin.right;
    const cH = H - margin.top  - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox",`0 0 ${W} ${H}`).attr("preserveAspectRatio","xMidYMid meet");
    svg.append("rect").attr("width",W).attr("height",H).attr("fill","#f8fafc").attr("rx",8);

    const x  = d3.scaleBand().domain(RAW_DATA.map(d=>d.date)).range([0,cW]).padding(0.28);
    const y  = d3.scaleLinear().domain([0,110]).range([cH,0]);
    const cx = d => x(d.date) + x.bandwidth()/2;

    const chart = svg.append("g").attr("transform",`translate(${margin.left},${margin.top})`);

    // Grid
    y.ticks(5).forEach(v => {
      chart.append("line").attr("x1",0).attr("x2",cW).attr("y1",y(v)).attr("y2",y(v))
        .attr("stroke","#e2e8f0").attr("stroke-dasharray","4,3").attr("stroke-width",1);
    });

    // Tooltip
    const tooltip = d3.select("body").append("div")
      .style("position","absolute").style("background","rgba(15,23,42,0.92)")
      .style("color","#fff").style("padding","8px 12px").style("border-radius","6px")
      .style("font-size","12px").style("pointer-events","none").style("opacity",0)
      .style("border","1px solid #334155").style("z-index","9999");

    // Defs — gradients per bar
    const defs = svg.append("defs");
    RAW_DATA.filter(d=>d.value!==null).forEach((d,i) => {
      const c  = palette[i%palette.length];
      const gr = defs.append("linearGradient").attr("id",`amg${i}-${theme}`)
        .attr("x1","0%").attr("x2","0%").attr("y1","0%").attr("y2","100%");
      gr.append("stop").attr("offset","0%").attr("stop-color",d3.color(c).brighter(0.3).formatHex()).attr("stop-opacity",0.95);
      gr.append("stop").attr("offset","100%").attr("stop-color",d3.color(c).darker(0.3).formatHex()).attr("stop-opacity",0.85);
    });

    // Missing data zones — shaded background
    RAW_DATA.forEach(d => {
      if (d.value !== null) return;
      chart.append("rect")
        .attr("x", x(d.date)).attr("y", 0)
        .attr("width", x.bandwidth()).attr("height", cH)
        .attr("fill","#fef2f2").attr("rx",4).attr("opacity",0.8);
      chart.append("line")
        .attr("x1", cx(d)).attr("x2", cx(d)).attr("y1", 0).attr("y2", cH)
        .attr("stroke","#ef4444").attr("stroke-width",1.5).attr("stroke-dasharray","5,4").attr("opacity",0.5);
      chart.append("text")
        .attr("x", cx(d)).attr("y", cH/2)
        .attr("text-anchor","middle").attr("dominant-baseline","middle")
        .style("font-size","11px").style("font-weight","bold").style("fill","#ef4444")
        .text("?");
    });

    // Valid bars
    let validIdx = 0;
    RAW_DATA.forEach(d => {
      if (d.value === null) return;
      const i   = validIdx++;
      const col = palette[i%palette.length];
      const bx  = x(d.date), bw = x.bandwidth();
      const by  = y(d.value), bh = cH - y(d.value);

      // Shadow
      chart.append("rect").attr("x",bx+3).attr("y",by+3).attr("width",bw).attr("height",bh)
        .attr("fill","#cbd5e1").attr("rx",4).attr("opacity",0.2);

      // Bar
      chart.append("rect").attr("x",bx).attr("y",cH).attr("width",bw).attr("height",0)
        .attr("fill",`url(#amg${i}-${theme})`).attr("rx",4).attr("opacity",0.92)
        .style("cursor","pointer")
        .on("mouseover", function(event) {
          d3.select(this).attr("opacity",1).attr("stroke","#fff").attr("stroke-width",1.5);
          tooltip.style("opacity",1)
            .html(`<b style="color:${col}">${d.date}</b><br/>Value: <b>${d.value}</b>`)
            .style("left",(event.pageX+12)+"px").style("top",(event.pageY-10)+"px");
        })
        .on("mouseout", function() {
          d3.select(this).attr("opacity",0.92).attr("stroke","none");
          tooltip.style("opacity",0);
        })
        .transition().duration(600).delay(i*50).attr("y",by).attr("height",bh);

      // Value label above
      chart.append("text").attr("x",bx+bw/2).attr("y",by-5)
        .attr("text-anchor","middle").style("font-size","9px").style("font-weight","700")
        .style("fill",col).style("pointer-events","none").text(d.value);
    });

    // Missing hover tooltips
    RAW_DATA.forEach(d => {
      if (d.value !== null) return;
      chart.append("rect")
        .attr("x",x(d.date)).attr("y",0).attr("width",x.bandwidth()).attr("height",cH)
        .attr("fill","transparent").style("cursor","default")
        .on("mouseover", function(event) {
          tooltip.style("opacity",1)
            .html(`<b style="color:#ef4444">${d.date}</b><br/><span style="color:#94a3b8">No data available</span>`)
            .style("left",(event.pageX+12)+"px").style("top",(event.pageY-10)+"px");
        })
        .on("mouseout", () => tooltip.style("opacity",0));
    });

    // X axis
    chart.append("g").attr("transform",`translate(0,${cH})`)
      .call(d3.axisBottom(x).tickSize(0))
      .call(g => {
        g.select(".domain").style("stroke","#e2e8f0");
        g.selectAll("text").style("fill","#334155").style("font-size","10px").style("font-weight","600");
      });

    // Y axis
    chart.append("g")
      .call(d3.axisLeft(y).ticks(5))
      .call(g => { g.select(".domain").remove(); g.selectAll("line").remove(); g.selectAll("text").style("fill","#94a3b8").style("font-size","10px"); });

    svg.append("text").attr("transform",`translate(${margin.left+cW/2},${H-4})`).attr("text-anchor","middle")
      .style("font-size","11px").style("fill","#94a3b8").text("Month");
    svg.append("text").attr("transform","rotate(-90)").attr("x",-(margin.top+cH/2)).attr("y",14)
      .attr("text-anchor","middle").style("font-size","11px").style("fill","#94a3b8").text("Value");

    return () => tooltip.remove();
  }, [theme]);

  return (
    <div style={{ display:"flex", gap:12, alignItems:"flex-start", width:"100%", border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden" }}>
      <svg ref={svgRef} style={{ display:"block", flex:1, minWidth:0, height:380 }} />
      <div style={{ padding:"12px 12px 12px 0" }}>
        <LegendHTML palette={THEMES[theme]} />
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
    const el = mountRef.current;
    const W  = el.offsetWidth || 620, H = 380;

    const scene  = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);
    const camera = new THREE.PerspectiveCamera(42, W/H, 0.1, 200);
    camera.position.set(0, 9, 18);
    camera.lookAt(0, 2, 0);

    const renderer = new THREE.WebGLRenderer({ antialias:true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    renderer.shadowMap.enabled=true;
    el.appendChild(renderer.domElement);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff,0.7));
    const sun = new THREE.DirectionalLight(0xffffff,1.0);
    sun.position.set(6,14,10); sun.castShadow=true; scene.add(sun);
    const rimL = new THREE.PointLight(new THREE.Color(palette[0]),0.45,60);
    rimL.position.set(-10,6,-6); scene.add(rimL);
    scene.add(new THREE.HemisphereLight(0xffffff,0xe0e7ff,0.4));

    // Floor
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(34,20),
      new THREE.MeshStandardMaterial({ color:0xf1f5f9, roughness:0.9 })
    );
    floor.rotation.x=-Math.PI/2; floor.receiveShadow=true; scene.add(floor);
    scene.add(new THREE.GridHelper(34,28,0xcccccc,0xe2e8f0));

    const n       = RAW_DATA.length;
    const spacing = 1.55;
    const maxVal  = 110;
    const maxH    = 9;
    const barW    = 0.75, barD = 0.75;
    const pivot   = new THREE.Group();
    const labelAnchors = [];

    let validIdx = 0;
    RAW_DATA.forEach((d, i) => {
      const xPos = (i-(n-1)/2)*spacing;

      if (d.value !== null) {
        const bh  = (d.value/maxVal)*maxH;
        const col = new THREE.Color(palette[validIdx%palette.length]);
        validIdx++;

        // Shadow
        const sm = new THREE.Mesh(
          new THREE.BoxGeometry(barW,bh*0.15,barD),
          new THREE.MeshBasicMaterial({ color:0xbbbbbb, transparent:true, opacity:0.15 })
        );
        sm.position.set(xPos+0.07,bh*0.075,0.07); pivot.add(sm);

        // Bar
        const geo  = new THREE.BoxGeometry(barW,bh,barD);
        const mat  = new THREE.MeshStandardMaterial({
          color:col, roughness:0.22, metalness:0.45,
          emissive:col, emissiveIntensity:0.1,
        });
        const mesh = new THREE.Mesh(geo,mat);
        mesh.position.set(xPos,bh/2,0); mesh.castShadow=true; pivot.add(mesh);

        // Edge
        const eg  = new THREE.EdgesGeometry(geo);
        const el2 = new THREE.LineSegments(eg, new THREE.LineBasicMaterial({ color:0xffffff }));
        el2.position.set(xPos,bh/2,0); pivot.add(el2);

        // Glow cap
        const capC = col.clone().lerp(new THREE.Color(0xffffff),0.25);
        const cap  = new THREE.Mesh(
          new THREE.BoxGeometry(barW,0.07,barD),
          new THREE.MeshStandardMaterial({ color:capC, emissive:capC, emissiveIntensity:1.2, roughness:0.04, metalness:1 })
        );
        cap.position.set(xPos,bh+0.035,0); pivot.add(cap);

        labelAnchors.push({ x:xPos, y:bh+0.55, z:0, text:String(d.value), col:`#${col.getHexString()}`, isMissing:false });
      } else {
        // Missing data marker — torus ring
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(0.4,0.07,8,24),
          new THREE.MeshStandardMaterial({ color:0xef4444, emissive:0xef4444, emissiveIntensity:0.5, roughness:0.3, metalness:0.2 })
        );
        ring.rotation.x=Math.PI/2; ring.position.set(xPos,0.5,0); pivot.add(ring);

        // Dashed vertical indicator
        for (let step=0; step<5; step++) {
          const seg = new THREE.Mesh(
            new THREE.BoxGeometry(0.05,0.4,0.05),
            new THREE.MeshBasicMaterial({ color:0xef4444, transparent:true, opacity:0.5 })
          );
          seg.position.set(xPos, 1.1+step*0.7, 0); pivot.add(seg);
        }

        labelAnchors.push({ x:xPos, y:4.5, z:0, text:"?", col:"#ef4444", isMissing:true });
      }

      // Month label
      labelAnchors.push({ x:xPos, y:-0.65, z:0, text:d.date, col:"#64748b", isMissing:false, isMonth:true });
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
        overlayRef.current.querySelectorAll(".amlbl").forEach((div,i) => {
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
        <div ref={mountRef} style={{ width:"100%", height:380, cursor:"grab" }} />

        <div ref={overlayRef} style={{ position:"absolute", inset:0, pointerEvents:"none" }}>
          {RAW_DATA.flatMap((d, i) => {
            const labels = [];
            const col = d.value !== null
              ? THEMES[theme][RAW_DATA.filter(x=>x.value!==null).indexOf(d)%THEMES[theme].length]
              : "#ef4444";

            if (d.value !== null) {
              labels.push(
                <div key={`v${i}`} className="amlbl" style={{
                  position:"absolute", transform:"translate(-50%,-100%)",
                  background:"rgba(255,255,255,0.93)", color:col,
                  fontSize:10, fontWeight:"bold", padding:"2px 5px", borderRadius:3,
                  border:`1px solid ${col}55`, whiteSpace:"nowrap",
                  transition:"opacity 0.1s", pointerEvents:"none",
                  boxShadow:"0 1px 3px rgba(0,0,0,0.10)",
                }}>
                  {d.value}
                </div>
              );
            } else {
              labels.push(
                <div key={`m${i}`} className="amlbl" style={{
                  position:"absolute", transform:"translate(-50%,-50%)",
                  background:"#fef2f2", color:"#ef4444",
                  fontSize:12, fontWeight:"bold", padding:"2px 6px", borderRadius:"50%",
                  border:"1.5px dashed #ef4444", whiteSpace:"nowrap",
                  transition:"opacity 0.1s", pointerEvents:"none",
                  boxShadow:"0 1px 3px rgba(0,0,0,0.10)",
                }}>
                  ?
                </div>
              );
            }

            labels.push(
              <div key={`mo${i}`} className="amlbl" style={{
                position:"absolute", transform:"translate(-50%,0%)",
                background:"rgba(255,255,255,0.90)", color:"#334155",
                fontSize:9, fontWeight:"600", padding:"2px 5px", borderRadius:3,
                border:"1px solid #e2e8f0", whiteSpace:"nowrap",
                transition:"opacity 0.1s", pointerEvents:"none",
              }}>
                {d.date}
              </div>
            );
            return labels;
          })}
        </div>

        {/* Missing indicator key */}
        <div style={{ position:"absolute", top:10, right:10, background:"rgba(255,255,255,0.93)", border:"1px solid #fca5a5", borderRadius:6, padding:"5px 10px", fontSize:10, color:"#ef4444", fontWeight:"bold", pointerEvents:"none" }}>
          <span style={{ borderBottom:"2px dashed #ef4444", paddingBottom:1 }}>?</span> = Missing data (null)
        </div>

        <div style={{ padding:"7px 14px", background:"#f8fafc", borderTop:"1px solid #e2e8f0", fontSize:11, color:"#94a3b8" }}>
          💡 Drag to rotate · auto-spins until you interact · Red rings = missing months
        </div>
      </div>

      <div style={{ padding:"12px 12px 12px 0" }}>
        <LegendHTML palette={THEMES[theme]} />
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const BarChartWithMissingData = () => {
  const [viewMode, setViewMode] = useState("2d");
  const [theme,    setTheme]    = useState("Modern");

  const missing = RAW_DATA.filter(d => d.value === null).map(d => d.date).join(", ");

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
        <div style={{ fontSize:16, fontWeight:"bold", color:"#1e293b" }}>Bar Chart with Missing Data</div>
        <div style={{ fontSize:12, color:"#94a3b8", marginTop:2 }}>
          2023 monthly values · Missing: <span style={{ color:"#ef4444", fontWeight:"600" }}>{missing}</span>
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

export default BarChartWithMissingData;