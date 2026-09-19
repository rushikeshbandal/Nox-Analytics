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

// ─── 2D Chart ─────────────────────────────────────────────────────────────────
function Chart2D({ theme }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current) return;

    d3.csv("/alphabet.csv").then(rows => {
      const data = rows
        .map(d => ({ letter: d.letter, frequency: +d.frequency }))
        .filter(d => d.letter && !isNaN(d.frequency))
        .sort((a, b) => b.frequency - a.frequency);

      const barH  = 20;
      const margin = { top:36, right:70, bottom:16, left:44 };
      const W     = 680;
      const H     = data.length * barH + margin.top + margin.bottom;

      const baseColor = THEMES[theme][0];
      const format    = d3.format(".1%");

      const x = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.frequency) * 1.06])
        .range([margin.left, W - margin.right]).nice();

      const y = d3.scaleBand()
        .domain(data.map(d => d.letter))
        .range([margin.top, H - margin.bottom])
        .padding(0.28);

      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();
      svg.attr("width", W).attr("height", H);
      svg.append("rect").attr("width",W).attr("height",H).attr("fill","#f8fafc").attr("rx",8);

      // Grid
      svg.append("g").attr("transform",`translate(0,${H-margin.bottom})`)
        .call(d3.axisBottom(x).tickFormat("").tickSize(-(H-margin.top-margin.bottom)).ticks(8))
        .call(g => { g.select(".domain").remove(); g.selectAll("line").style("stroke","#e2e8f0").style("stroke-dasharray","4,3"); });

      // Tooltip
      const tooltip = d3.select("body").append("div")
        .style("position","absolute").style("background","rgba(15,23,42,0.92)")
        .style("color","#fff").style("padding","8px 12px").style("border-radius","6px")
        .style("font-size","12px").style("pointer-events","none").style("opacity",0)
        .style("border","1px solid #334155").style("z-index","9999");

      // Bars with animation
      svg.append("g").selectAll("rect").data(data).join("rect")
        .attr("x",      x(0))
        .attr("y",      d => y(d.letter))
        .attr("height", y.bandwidth())
        .attr("fill",   baseColor)
        .attr("rx", 3).attr("opacity", 0.88)
        .attr("width", 0)
        .style("cursor","pointer")
        .on("mouseover", function(event, d) {
          d3.select(this).attr("opacity",1);
          tooltip.style("opacity",1)
            .html(`<b style="color:${baseColor}">${d.letter}</b><br/>Frequency: <b>${format(d.frequency)}</b>`)
            .style("left",(event.pageX+12)+"px").style("top",(event.pageY-10)+"px");
        })
        .on("mouseout", function() { d3.select(this).attr("opacity",0.88); tooltip.style("opacity",0); })
        .transition().duration(800).ease(d3.easeCubicOut)
        .attr("width", d => x(d.frequency) - x(0));

      // Value labels
      svg.append("g").selectAll("text").data(data).join("text")
        .attr("x",  d => x(d.frequency) + 5)
        .attr("y",  d => y(d.letter) + y.bandwidth()/2)
        .attr("dy","0.35em")
        .attr("fill","#64748b").style("font-size","10px").style("font-weight","700")
        .text(d => format(d.frequency));

      // Top axis
      svg.append("g").attr("transform",`translate(0,${margin.top})`)
        .call(d3.axisTop(x).ticks(8).tickFormat(d3.format(".0%")))
        .call(g => { g.select(".domain").style("stroke","#e2e8f0"); g.selectAll("text").style("fill","#64748b").style("font-size","10px"); });

      // Left axis
      svg.append("g").attr("transform",`translate(${margin.left},0)`)
        .call(d3.axisLeft(y).tickSize(0).tickPadding(6))
        .call(g => { g.select(".domain").remove(); g.selectAll("text").style("fill","#334155").style("font-size","11px").style("font-weight","700"); });

      // X label
      svg.append("text")
        .attr("transform",`translate(${(W-margin.right+margin.left)/2},${H-2})`)
        .attr("text-anchor","middle").style("font-size","11px").style("fill","#94a3b8")
        .text("Relative Frequency in English Language");

      return () => tooltip.remove();
    });
  }, [theme]);

  return (
    <div style={{ display:"flex", gap:12, alignItems:"flex-start", width:"100%", border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden" }}>
      <div style={{ flex:1, minWidth:0, overflowY:"auto", maxHeight:580 }}>
        <svg ref={svgRef} style={{ display:"block" }} />
      </div>
      {/* Mini legend */}
      <div style={{ padding:"12px 12px 12px 0" }}>
        <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:8, padding:"12px 14px", width:120, boxShadow:"0 1px 4px rgba(0,0,0,0.07)" }}>
          <div style={{ fontSize:10, fontWeight:"bold", color:"#94a3b8", letterSpacing:"0.08em", marginBottom:8 }}>THEME COLOR</div>
          <div style={{ display:"flex", alignItems:"center", gap:7 }}>
            <div style={{ width:14, height:14, borderRadius:3, background:THEMES[theme][0] }} />
            <span style={{ color:"#334155", fontSize:11 }}>{theme}</span>
          </div>
          <div style={{ borderTop:"1px solid #e2e8f0", margin:"10px 0 8px" }} />
          <div style={{ fontSize:10, fontWeight:"bold", color:"#94a3b8", letterSpacing:"0.08em", marginBottom:6 }}>TOP 5</div>
          {["E","T","A","O","I"].map((l,i) => (
            <div key={l} style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
              <span style={{ color:"#334155", fontSize:11, fontWeight:"700" }}>{l}</span>
              <span style={{ color:"#64748b", fontSize:10 }}>
                {["12.7%","9.1%","8.2%","7.5%","7.0%"][i]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── 3D Chart — AxesHelper removed, color dropdown fixed, vertical bars ────────
function Chart3D({ theme }) {
  const mountRef   = useRef(null);
  const overlayRef = useRef(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    // Clear previous canvas — fixes color dropdown + white screen
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

    // Lights — NO AxesHelper (bug fix)
    scene.add(new THREE.AmbientLight(0xffffff, 0.75));
    const sun = new THREE.DirectionalLight(0xffffff, 1.0);
    sun.position.set(6,14,10); sun.castShadow=true; scene.add(sun);
    const palette = THEMES[theme];
    const rimL = new THREE.PointLight(new THREE.Color(palette[0]), 0.4, 60);
    rimL.position.set(-10,6,-6); scene.add(rimL);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xe0e7ff, 0.45));

    // Floor + clean grid
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 20),
      new THREE.MeshStandardMaterial({ color:0xf1f5f9, roughness:0.9 })
    );
    floor.rotation.x = -Math.PI/2; floor.receiveShadow=true; scene.add(floor);
    scene.add(new THREE.GridHelper(60, 50, 0xcccccc, 0xe2e8f0));

    const labelAnchors = [];
    let   animId;

    d3.csv("/alphabet.csv").then(rows => {
      const data = rows
        .map(d => ({ letter: d.letter, frequency: +d.frequency }))
        .filter(d => d.letter && !isNaN(d.frequency))
        .sort((a, b) => b.frequency - a.frequency);

      const maxFreq = d3.max(data, d => d.frequency);
      const maxH    = 8;
      const barW    = 0.55;
      const barD    = 0.55;
      const gap     = 0.82;
      const totalW  = data.length * gap;
      const startX  = -totalW / 2 + gap / 2;

      const pivot = new THREE.Group();

      data.forEach((d, i) => {
        const bh  = (d.frequency / maxFreq) * maxH;
        const xp  = startX + i * gap;
        // Use theme colors cycling through palette
        const col = new THREE.Color(palette[i % palette.length]);

        // Shadow
        const sm = new THREE.Mesh(
          new THREE.BoxGeometry(barW, bh * 0.08, barD),
          new THREE.MeshBasicMaterial({ color:0xbbbbbb, transparent:true, opacity:0.08 })
        );
        sm.position.set(xp+0.04, bh*0.04, 0.04); pivot.add(sm);

        // Main bar — metallic + emissive
        const geo  = new THREE.BoxGeometry(barW, bh, barD);
        const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
          color:col, roughness:0.22, metalness:0.45,
          emissive:col, emissiveIntensity:0.22,
        }));
        mesh.position.set(xp, bh/2, 0);
        mesh.castShadow = true;
        pivot.add(mesh);

        // Edge outline
        const eln = new THREE.LineSegments(
          new THREE.EdgesGeometry(geo),
          new THREE.LineBasicMaterial({ color:0xffffff, transparent:true, opacity:0.45 })
        );
        eln.position.set(xp, bh/2, 0); pivot.add(eln);

        // Glow cap
        const capC = col.clone().lerp(new THREE.Color(0xffffff), 0.28);
        const cap  = new THREE.Mesh(
          new THREE.BoxGeometry(barW, 0.07, barD),
          new THREE.MeshStandardMaterial({
            color:capC, emissive:capC,
            emissiveIntensity:1.3, roughness:0.04, metalness:1,
          })
        );
        cap.position.set(xp, bh+0.035, 0); pivot.add(cap);

        // Label anchors
        labelAnchors.push({ x:xp, y:bh+0.55, z:0, text:d.letter,                          col:`#${col.getHexString()}`, type:"letter" });
        labelAnchors.push({ x:xp, y:bh+1.20, z:0, text:d3.format(".1%")(d.frequency),     col:`#${col.getHexString()}`, type:"value"  });
      });

      scene.add(pivot);

      // Set text on overlay divs
      if (overlayRef.current) {
        const divs = overlayRef.current.querySelectorAll(".shlbl");
        labelAnchors.forEach((a, i) => {
          if (divs[i]) divs[i].textContent = a.text;
        });
      }

      // Project 3D → 2D
      const toScreen = (x3,y3,z3) => {
        const v = new THREE.Vector3(x3,y3,z3).project(camera);
        return { sx:(v.x*0.5+0.5)*W, sy:(-v.y*0.5+0.5)*H, behind:v.z>1 };
      };

      // Drag rotation + auto-spin
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

      const animate = () => {
        animId = requestAnimationFrame(animate);
        if (autoSpin) rotY += 0.003;
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

      // Cleanup inside .then so event listeners are properly removed
      return () => {
        renderer.domElement.removeEventListener("mousedown", onDown);
        window.removeEventListener("mouseup",   onUp);
        window.removeEventListener("mousemove", onMove);
      };
    });

    renderer.domElement.style.cursor = "grab";

    return () => {
      cancelAnimationFrame(animId);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  // theme in deps = scene fully rebuilds with new colors on change
  }, [theme]);

  // 26 letters × 2 labels = 52 placeholder divs
  const jsxLabels = Array.from({ length: 52 }, (_, i) => ({
    col:  THEMES[theme][i % THEMES[theme].length],
    type: i % 2 === 0 ? "letter" : "value",
  }));

  return (
    <div style={{ display:"flex", gap:12, alignItems:"flex-start", width:"100%", border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden" }}>
      <div style={{ position:"relative", flex:1, minWidth:0, userSelect:"none" }}>
        <div ref={mountRef} style={{ width:"100%", height:480, cursor:"grab", overflow:"hidden" }} />

        {/* HTML label overlay */}
        <div ref={overlayRef} style={{ position:"absolute", inset:0, pointerEvents:"none", overflow:"hidden" }}>
          {jsxLabels.map((a, i) => (
            <div key={i} className="shlbl" style={{
              position:      "absolute",
              transform:     "translate(-50%,-100%)",
              background:    "rgba(255,255,255,0.93)",
              color:         a.col,
              fontSize:      a.type==="letter" ? 10 : 8,
              fontWeight:    "bold",
              padding:       "2px 5px",
              borderRadius:  3,
              border:        `1px solid ${a.col}55`,
              whiteSpace:    "nowrap",
              pointerEvents: "none",
              boxShadow:     "0 1px 3px rgba(0,0,0,0.08)",
              opacity:       0,
            }} />
          ))}
        </div>

        <div style={{ padding:"7px 14px", background:"#f8fafc", borderTop:"1px solid #e2e8f0", fontSize:11, color:"#94a3b8" }}>
          💡 Drag to rotate · auto-spins · Bar height = letter frequency · Sorted high → low
        </div>
      </div>

      {/* Mini legend */}
      <div style={{ padding:"12px 12px 12px 0" }}>
        <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:8, padding:"12px 14px", width:120, boxShadow:"0 1px 4px rgba(0,0,0,0.07)" }}>
          <div style={{ fontSize:10, fontWeight:"bold", color:"#94a3b8", letterSpacing:"0.08em", marginBottom:8 }}>THEME</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
            {THEMES[theme].slice(0,6).map((c,i) => (
              <div key={i} style={{ width:14, height:14, borderRadius:3, background:c }} />
            ))}
          </div>
          <div style={{ borderTop:"1px solid #e2e8f0", margin:"10px 0 8px" }} />
          <div style={{ fontSize:10, fontWeight:"bold", color:"#94a3b8", letterSpacing:"0.08em", marginBottom:6 }}>TOP 5</div>
          {["E","T","A","O","I"].map((l,i) => (
            <div key={l} style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
              <span style={{ color:"#334155", fontSize:11, fontWeight:"700" }}>{l}</span>
              <span style={{ color:"#64748b", fontSize:10 }}>{["12.7%","9.1%","8.2%","7.5%","7.0%"][i]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const HorizontalBarChart = () => {
  const [theme,    setTheme]    = useState("Modern");
  const [viewMode, setViewMode] = useState("2d");

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
        <div style={{ fontSize:16, fontWeight:"bold", color:"#1e293b" }}>Horizontal Bar Chart</div>
        <div style={{ fontSize:12, color:"#94a3b8", marginTop:2 }}>Relative Frequency of Letters in English Language</div>
      </div>

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
        {viewMode === "2d"
          ? <Chart2D key={`2d-${theme}`} theme={theme} />
          : <Chart3D key={`3d-${theme}`} theme={theme} />
        }
      </div>
    </div>
  );
};

export default HorizontalBarChart;