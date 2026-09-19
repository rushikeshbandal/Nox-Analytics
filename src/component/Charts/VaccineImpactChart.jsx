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

const DISEASES = [
  { disease: "Measles",    pre: 318.1, post: 0.03,  year: 1963, reduction: 99.99 },
  { disease: "Pertussis",  pre: 157.2, post: 2.80,  year: 1949, reduction: 98.22 },
  { disease: "Mumps",      pre:  46.4, post: 0.04,  year: 1967, reduction: 99.91 },
  { disease: "Rubella",    pre:  27.8, post: 0.01,  year: 1969, reduction: 99.96 },
  { disease: "Polio",      pre:  18.3, post: 0.00,  year: 1955, reduction: 100.0 },
  { disease: "Hib",        pre:  20.9, post: 0.06,  year: 1985, reduction: 99.71 },
  { disease: "Diphtheria", pre:  15.1, post: 0.001, year: 1926, reduction: 99.99 },
  { disease: "Tetanus",    pre:   0.16,post: 0.01,  year: 1938, reduction: 93.75 },
];

// ─── Shared Legend ────────────────────────────────────────────────────────────
function LegendHTML({ palette }) {
  const color = d3.scaleOrdinal().domain(DISEASES.map(d=>d.disease)).range(palette);
  return (
    <div style={{
      background:"#fff", border:"1px solid #e2e8f0", borderRadius:8,
      padding:"12px 14px", width:155, flexShrink:0,
      boxShadow:"0 1px 4px rgba(0,0,0,0.07)", alignSelf:"flex-start",
    }}>
      <div style={{ fontSize:10, fontWeight:"bold", color:"#94a3b8", letterSpacing:"0.08em", marginBottom:8 }}>
        DISEASES
      </div>
      {DISEASES.map(d => (
        <div key={d.disease} style={{ marginBottom:6 }}>
          <div style={{ display:"flex", alignItems:"center", gap:7 }}>
            <div style={{ width:10, height:10, borderRadius:2, flexShrink:0, background:color(d.disease) }} />
            <span style={{ color:"#334155", fontSize:11, fontWeight:"600" }}>{d.disease}</span>
          </div>
          <div style={{ paddingLeft:17, fontSize:9, color:"#94a3b8", lineHeight:1.5 }}>
            {d.pre} → {d.post} per 100k<br/>
            <span style={{ color:"#10b981", fontWeight:"bold" }}>↓ {d.reduction}%</span>
          </div>
        </div>
      ))}
      <div style={{ borderTop:"1px solid #e2e8f0", marginTop:8, paddingTop:8 }}>
        <div style={{ fontSize:9, color:"#94a3b8" }}>Cases per 100,000 population</div>
      </div>
    </div>
  );
}

// ─── 2D Chart ─────────────────────────────────────────────────────────────────
function Chart2D({ theme }) {
  const svgRef = useRef(null);
  const palette = THEMES[theme];
  const color   = d3.scaleOrdinal().domain(DISEASES.map(d=>d.disease)).range(palette);

  useEffect(() => {
    if (!svgRef.current) return;

    const W = 640, H = 500; // Increased height for more top space
    const margin = { top: 32, right: 16, bottom: 40, left: 90 }; // Increased top margin
    const cW = W - margin.left - margin.right;
    const cH = H - margin.top - margin.bottom;

    // Split into two panels: before (left) and after (right)
    const panelW = (cW - 24) / 2;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox",`0 0 ${W} ${H}`).attr("preserveAspectRatio","xMidYMid meet");
    svg.append("rect").attr("width",W).attr("height",H).attr("fill","#f8fafc").attr("rx",8);

    const y = d3.scaleBand()
      .domain(DISEASES.map(d=>d.disease))
      .range([0, cH]).padding(0.28);

    const xBefore = d3.scaleLinear()
      .domain([0, d3.max(DISEASES, d=>d.pre)*1.08]).range([0, panelW]).nice();

    const xAfter = d3.scaleLinear()
      .domain([0, 6]).range([0, panelW]).nice();

    // Tooltip
    const tooltip = d3.select("body").append("div")
      .style("position","absolute").style("background","rgba(15,23,42,0.92)")
      .style("color","#fff").style("padding","8px 12px").style("border-radius","6px")
      .style("font-size","12px").style("pointer-events","none").style("opacity",0)
      .style("border","1px solid #334155").style("z-index","9999");

    // ── BEFORE panel ──
    const beforeG = svg.append("g").attr("transform",`translate(${margin.left},${margin.top})`);

    beforeG.append("rect").attr("width",panelW).attr("height",cH)
      .attr("fill","rgba(239,68,68,0.04)").attr("rx",4);

    beforeG.append("text").attr("x",panelW/2).attr("y",-8)
      .attr("text-anchor","middle").style("font-size","11px").style("font-weight","700")
      .style("fill","#dc2626").text("Before Vaccine");

    DISEASES.forEach(d => {
      const col = color(d.disease);
      const g   = beforeG.append("g");

      g.append("rect")
        .attr("x",0).attr("y",y(d.disease))
        .attr("width",0).attr("height",y.bandwidth())
        .attr("fill",col).attr("rx",3).attr("opacity",0.88)
        .style("cursor","pointer")
        .on("mouseover", function(event) {
          d3.select(this).attr("opacity",1).attr("stroke","#fff").attr("stroke-width",1.5);
          tooltip.style("opacity",1)
            .html(`<b style="color:${col}">${d.disease}</b><br/>Before vaccine: <b>${d.pre}</b> per 100k<br/>Vaccine year: ${d.year}`)
            .style("left",(event.pageX+12)+"px").style("top",(event.pageY-10)+"px");
        })
        .on("mouseout", function() { d3.select(this).attr("opacity",0.88).attr("stroke","none"); tooltip.style("opacity",0); })
        .transition().duration(700).delay(DISEASES.indexOf(d)*50)
        .attr("width",xBefore(d.pre));

      g.append("text")
        .attr("x",xBefore(d.pre)+5).attr("y",y(d.disease)+y.bandwidth()/2)
        .attr("dy","0.35em").style("font-size","9px").style("font-weight","700").style("fill",col)
        .style("pointer-events","none")
        .text(d.pre);
    });

    // Y axis on before panel
    beforeG.append("g").call(d3.axisLeft(y).tickSize(0))
      .call(g => { g.select(".domain").remove(); g.selectAll("text").style("font-size","10px").style("font-weight","600").style("fill","#334155"); });

    beforeG.append("g").attr("transform",`translate(0,${cH})`)
      .call(d3.axisBottom(xBefore).ticks(4).tickFormat(d=>d>99?`${d}`:d))
      .call(g => { g.select(".domain").style("stroke","#e2e8f0"); g.selectAll("text").style("fill","#94a3b8").style("font-size","9px"); });

    // ── AFTER panel ──
    const afterG = svg.append("g").attr("transform",`translate(${margin.left+panelW+24},${margin.top})`);

    afterG.append("rect").attr("width",panelW).attr("height",cH)
      .attr("fill","rgba(16,185,129,0.04)").attr("rx",4);

    afterG.append("text").attr("x",panelW/2).attr("y",-8)
      .attr("text-anchor","middle").style("font-size","11px").style("font-weight","700")
      .style("fill","#059669").text("After Vaccine");

    DISEASES.forEach(d => {
      const col = color(d.disease);
      const g   = afterG.append("g");

      g.append("rect")
        .attr("x",0).attr("y",y(d.disease))
        .attr("width",0).attr("height",y.bandwidth())
        .attr("fill",col).attr("rx",3).attr("opacity",0.88)
        .style("cursor","pointer")
        .on("mouseover", function(event) {
          d3.select(this).attr("opacity",1).attr("stroke","#fff").attr("stroke-width",1.5);
          tooltip.style("opacity",1)
            .html(`<b style="color:${col}">${d.disease}</b><br/>After vaccine: <b>${d.post}</b> per 100k<br/><span style="color:#10b981">↓ ${d.reduction}% reduction</span>`)
            .style("left",(event.pageX+12)+"px").style("top",(event.pageY-10)+"px");
        })
        .on("mouseout", function() { d3.select(this).attr("opacity",0.88).attr("stroke","none"); tooltip.style("opacity",0); })
        .transition().duration(700).delay(DISEASES.indexOf(d)*50)
        .attr("width",xAfter(d.post));

      const barW = xAfter(d.post);
      g.append("text")
        .attr("x",barW+5).attr("y",y(d.disease)+y.bandwidth()/2)
        .attr("dy","0.35em").style("font-size","9px").style("font-weight","700").style("fill","#10b981")
        .style("pointer-events","none")
        .text(`${d.post} (↓${d.reduction}%)`);
    });

    afterG.append("g").attr("transform",`translate(0,${cH})`)
      .call(d3.axisBottom(xAfter).ticks(4))
      .call(g => { g.select(".domain").style("stroke","#e2e8f0"); g.selectAll("text").style("fill","#94a3b8").style("font-size","9px"); });

    // Axis label
    svg.append("text")
      .attr("transform",`translate(${margin.left+cW/2},${H-6})`)
      .attr("text-anchor","middle").style("font-size","10px").style("fill","#94a3b8")
      .text("Cases per 100,000 population");

    return () => tooltip.remove();
  }, [theme]);

  return (
    <div style={{ display:"flex", gap:12, alignItems:"flex-start", width:"100%", border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden" }}>
      <svg ref={svgRef} style={{ display:"block", flex:1, minWidth:0, height:500 }} />
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
  const color      = d3.scaleOrdinal().domain(DISEASES.map(d=>d.disease)).range(palette);

  useEffect(() => {
    if (!mountRef.current) return;
    const el = mountRef.current;
    const W  = el.offsetWidth || 640, H = 500; // Increased height

    const scene  = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);
    const camera = new THREE.PerspectiveCamera(42, W/H, 0.1, 200);
    camera.position.set(0, 10, 22); // Raised camera position
    camera.lookAt(0, 3, 0);

    const renderer = new THREE.WebGLRenderer({ antialias:true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    renderer.shadowMap.enabled = true;
    el.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const sun = new THREE.DirectionalLight(0xffffff, 1.0);
    sun.position.set(6,14,10); sun.castShadow=true;
    scene.add(sun);
    scene.add(new THREE.PointLight(0x6366f1, 0.45, 60));
    scene.add(new THREE.HemisphereLight(0xffffff, 0xe0e7ff, 0.4));

    // Floor
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(34, 24),
      new THREE.MeshStandardMaterial({ color:0xf1f5f9, roughness:0.9 })
    );
    floor.rotation.x = -Math.PI/2; floor.receiveShadow=true;
    scene.add(floor);
    scene.add(new THREE.GridHelper(34, 28, 0xcccccc, 0xe2e8f0));

    const maxPre  = d3.max(DISEASES, d=>d.pre);
    const maxH    = 10;
    const spacing = 1.2;
    const pivot   = new THREE.Group();
    const labelAnchors = [];

    DISEASES.forEach((d, i) => {
      const col      = new THREE.Color(color(d.disease));
      const zPos     = (i - (DISEASES.length-1)/2) * spacing;

      // BEFORE bar (left, x = -3)
      const bhPre = Math.max(0.1, (d.pre / maxPre) * maxH);
      const geoPre = new THREE.BoxGeometry(0.7, bhPre, 0.7);
      const matPre = new THREE.MeshStandardMaterial({ color:col, roughness:0.25, metalness:0.4, emissive:col, emissiveIntensity:0.1 });
      const meshPre = new THREE.Mesh(geoPre, matPre);
      meshPre.position.set(-3, bhPre/2, zPos);
      meshPre.castShadow=true;
      pivot.add(meshPre);

      const egPre = new THREE.EdgesGeometry(geoPre);
      const elPre = new THREE.LineSegments(egPre, new THREE.LineBasicMaterial({ color:0xffffff }));
      elPre.position.set(-3, bhPre/2, zPos);
      pivot.add(elPre);

      // AFTER bar (right, x = +3)
      const bhPost = Math.max(0.06, (d.post / maxPre) * maxH);
      const geoPost = new THREE.BoxGeometry(0.7, bhPost, 0.7);
      const postCol = col.clone().lerp(new THREE.Color(0x10b981), 0.4);
      const matPost = new THREE.MeshStandardMaterial({ color:postCol, roughness:0.25, metalness:0.4, emissive:postCol, emissiveIntensity:0.1 });
      const meshPost = new THREE.Mesh(geoPost, matPost);
      meshPost.position.set(3, bhPost/2, zPos);
      meshPost.castShadow=true;
      pivot.add(meshPost);

      const egPost = new THREE.EdgesGeometry(geoPost);
      const elPost = new THREE.LineSegments(egPost, new THREE.LineBasicMaterial({ color:0xffffff }));
      elPost.position.set(3, bhPost/2, zPos);
      pivot.add(elPost);

      // Glow caps
      [[-3, bhPre, col], [3, bhPost, postCol]].forEach(([x,bh,c]) => {
        const capC = c.clone().lerp(new THREE.Color(0xffffff),0.25);
        const cap  = new THREE.Mesh(
          new THREE.BoxGeometry(0.7,0.06,0.7),
          new THREE.MeshStandardMaterial({ color:capC, emissive:capC, emissiveIntensity:1.2, roughness:0.04, metalness:1 })
        );
        cap.position.set(x, bh+0.03, zPos);
        pivot.add(cap);
      });

      // Label anchors
      labelAnchors.push({ x:-3, y:bhPre+0.6,  z:zPos, text:`${d.pre}`,  col:color(d.disease), isName:false });
      labelAnchors.push({ x: 3, y:bhPost+0.6, z:zPos, text:`${d.post}`, col:"#10b981",         isName:false });
      labelAnchors.push({ x: 0, y:-0.7,        z:zPos, text:d.disease,  col:"#334155",          isName:true  });
    });

    // Divider line between before/after
    const div = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, maxH+1, DISEASES.length*spacing+0.5),
      new THREE.MeshBasicMaterial({ color:0x94a3b8, transparent:true, opacity:0.4 })
    );
    div.position.set(0, (maxH+1)/2, 0);
    pivot.add(div);

    scene.add(pivot);

    const toScreen = (x3,y3,z3) => {
      const v = new THREE.Vector3(x3,y3,z3).project(camera);
      return { sx:(v.x*0.5+0.5)*W, sy:(-v.y*0.5+0.5)*H, behind:v.z>1 };
    };

    let isDragging=false, prevX=0, prevY=0, rotX=0.18, rotY=0, autoSpin=true; // Reduced initial tilt
    const onDown = e => { isDragging=true; prevX=e.clientX; prevY=e.clientY; autoSpin=false; renderer.domElement.style.cursor="grabbing"; };
    const onUp   = () => { isDragging=false; renderer.domElement.style.cursor="grab"; };
    const onMove = e => {
      if (!isDragging) return;
      rotY += (e.clientX-prevX)*0.006;
      rotX  = Math.max(-0.5,Math.min(0.5,rotX+(e.clientY-prevY)*0.004)); // Tighter clamp
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
        overlayRef.current.querySelectorAll(".vlbl").forEach((div,i) => {
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
      renderer.domElement.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("mousemove", onMove);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [theme]);

  // Mirror label list for JSX
  const maxPre = d3.max(DISEASES,d=>d.pre);
  const maxH   = 10;
  const jsxLabels = [];
  DISEASES.forEach(d => {
    const bhPre  = Math.max(0.1,(d.pre/maxPre)*maxH);
    const bhPost = Math.max(0.06,(d.post/maxPre)*maxH);
    jsxLabels.push({ text:`${d.pre}`,  col:color(d.disease), isName:false });
    jsxLabels.push({ text:`${d.post}`, col:"#10b981",         isName:false });
    jsxLabels.push({ text:d.disease,   col:"#334155",          isName:true  });
  });

  return (
    <div style={{ display:"flex", gap:12, alignItems:"flex-start", width:"100%", border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden" }}>
      <div style={{ position:"relative", flex:1, minWidth:0 }}>
        <div ref={mountRef} style={{ width:"100%", height:500, cursor:"grab" }} />

        <div ref={overlayRef} style={{ position:"absolute", inset:0, pointerEvents:"none" }}>
          {jsxLabels.map((a,i) => (
            <div key={i} className="vlbl" style={{
              position:"absolute",
              transform: a.isName ? "translate(-50%,0%)" : "translate(-50%,-100%)",
              background: a.isName ? "rgba(255,255,255,0.90)" : "rgba(255,255,255,0.93)",
              color: a.col,
              fontSize: a.isName ? 9 : 9,
              fontWeight:"bold",
              padding:"2px 5px", borderRadius:3,
              border: a.isName ? "1px solid #e2e8f0" : `1px solid ${a.col}55`,
              whiteSpace:"nowrap", transition:"opacity 0.1s", pointerEvents:"none",
              boxShadow:"0 1px 3px rgba(0,0,0,0.08)",
            }}>
              {a.text}
            </div>
          ))}
        </div>

        {/* Before / After labels fixed in canvas corners */}
        <div style={{ position:"absolute", top:12, left:14, fontSize:11, fontWeight:"bold", color:"#dc2626", background:"rgba(255,255,255,0.85)", padding:"2px 8px", borderRadius:4, border:"1px solid #fca5a5" }}>
          ← Before Vaccine
        </div>
        <div style={{ position:"absolute", top:12, right:14, fontSize:11, fontWeight:"bold", color:"#059669", background:"rgba(255,255,255,0.85)", padding:"2px 8px", borderRadius:4, border:"1px solid #6ee7b7" }}>
          After Vaccine →
        </div>

        <div style={{ padding:"7px 14px", background:"#f8fafc", borderTop:"1px solid #e2e8f0", fontSize:11, color:"#94a3b8" }}>
          💡 Drag to rotate · auto-spins · Left bars = Before · Right bars = After vaccination
        </div>
      </div>

      <div style={{ padding:"12px 12px 12px 0" }}>
        <LegendHTML palette={THEMES[theme]} />
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const VaccineImpactChart = () => {
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
        <div style={{ fontSize:16, fontWeight:"bold", color:"#1e293b" }}>Impact of Vaccines</div>
        <div style={{ fontSize:12, color:"#94a3b8", marginTop:2 }}>
          Disease cases per 100,000 population · Before vs After vaccination
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

export default VaccineImpactChart;