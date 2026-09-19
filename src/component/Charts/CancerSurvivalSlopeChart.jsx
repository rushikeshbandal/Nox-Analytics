import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import * as THREE from "three";

function dodge(positions, separation = 13, maxiter = 10, maxerror = 0.1) {
  positions = [...positions];
  const n = positions.length;
  if (n <= 1) return positions;
  const index = d3.range(n);
  for (let iter = 0; iter < maxiter; ++iter) {
    index.sort((i, j) => positions[i] - positions[j]);
    let error = 0;
    for (let i = 1; i < n; ++i) {
      const delta = positions[index[i]] - positions[index[i - 1]];
      if (delta < separation) {
        const adjust = (separation - delta) / 2;
        positions[index[i - 1]] -= adjust;
        positions[index[i]]     += adjust;
        error = Math.max(error, adjust);
      }
    }
    if (error < maxerror) break;
  }
  return positions;
}

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

const STEPS = ["5 Year","10 Year","15 Year","20 Year"];

function LegendHTML({ names, theme }) {
  const palette = THEMES[theme];
  const color   = d3.scaleOrdinal().domain(names).range(palette);
  return (
    <div style={{
      background:"#fff", border:"1px solid #e2e8f0", borderRadius:8,
      padding:"12px 14px", width:180, flexShrink:0,
      boxShadow:"0 1px 4px rgba(0,0,0,0.07)", alignSelf:"flex-start",
      maxHeight:520, overflowY:"auto",
    }}>
      <div style={{ fontSize:10, fontWeight:"bold", color:"#94a3b8", letterSpacing:"0.08em", marginBottom:8 }}>
        CANCER TYPES
      </div>
      {names.map((n) => (
        <div key={n} style={{ display:"flex", alignItems:"center", gap:7, marginBottom:5 }}>
          <div style={{ width:10, height:10, borderRadius:2, flexShrink:0, background:color(n) }} />
          <span style={{ color:"#334155", fontSize:10, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", maxWidth:150 }}>{n}</span>
        </div>
      ))}
    </div>
  );
}

// ─── 2D Chart ─────────────────────────────────────────────────────────────────
function Chart2D({ theme }) {
  const svgRef  = useRef(null);
  const [names, setNames] = useState([]);

  useEffect(() => {
    if (!svgRef.current) return;

    d3.csv("/cancer.csv", d3.autoType).then(data => {
      const cancerNames = [...new Set(data.map(d => d.name))];
      setNames(cancerNames);

      const palette = THEMES[theme];
      const color   = d3.scaleOrdinal().domain(cancerNames).range(palette);

      const W      = 680;
      const H      = 600;
      const margin = { top:52, right:180, bottom:24, left:180 };
      const PAD    = 6;

      const x = d3.scalePoint()
        .domain(STEPS)
        .range([margin.left, W - margin.right])
        .padding(0.5);

      const y = d3.scaleLinear()
        .domain(d3.extent(data, d => d.survival)).nice()
        .range([H - margin.bottom, margin.top]);

      const groups = d3.group(data, d => d.name);

      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();
      svg.attr("width", W).attr("height", H);
      svg.append("rect").attr("width",W).attr("height",H).attr("fill","#f8fafc").attr("rx",8);

      // Column lines + step labels
      STEPS.forEach(step => {
        svg.append("line")
          .attr("x1",x(step)).attr("x2",x(step))
          .attr("y1",margin.top - 16).attr("y2",H - margin.bottom)
          .attr("stroke","#e2e8f0").attr("stroke-width",1).attr("stroke-dasharray","4,3");
        svg.append("text")
          .attr("x",x(step)).attr("y",margin.top - 22)
          .attr("text-anchor","middle")
          .attr("font-weight","700").attr("font-size","12px")
          .attr("fill","#1e293b").text(step);
      });

      // Tooltip
      const tooltip = d3.select("body").append("div")
        .style("position","absolute").style("background","rgba(15,23,42,0.92)")
        .style("color","#fff").style("padding","8px 12px").style("border-radius","6px")
        .style("font-size","12px").style("pointer-events","none").style("opacity",0)
        .style("border","1px solid #334155").style("z-index","9999");

      // Lines
      const lineGen = d3.line().x(d => x(d.year)).y(d => y(d.survival));
      svg.append("g").attr("fill","none")
        .selectAll("path").data(groups).join("path")
        .attr("d", ([,vals]) => lineGen([...vals].sort((a,b) => STEPS.indexOf(a.year)-STEPS.indexOf(b.year))))
        .attr("stroke",  ([name]) => color(name))
        .attr("stroke-width", 1.6).attr("opacity", 0.75)
        .style("cursor","pointer")
        .on("mouseover", function(event, [name, vals]) {
          d3.select(this).attr("stroke-width",3).attr("opacity",1);
          const s5  = vals.find(d => d.year==="5 Year")?.survival;
          const s20 = vals.find(d => d.year==="20 Year")?.survival;
          tooltip.style("opacity",1)
            .html(`<b style="color:${color(name)}">${name}</b><br/>5yr: <b>${s5}%</b> → 20yr: <b>${s20}%</b>`)
            .style("left",(event.pageX+12)+"px").style("top",(event.pageY-10)+"px");
        })
        .on("mousemove", event => tooltip.style("left",(event.pageX+12)+"px").style("top",(event.pageY-10)+"px"))
        .on("mouseout", function() { d3.select(this).attr("stroke-width",1.6).attr("opacity",0.75); tooltip.style("opacity",0); });

      // Dots at all steps
      STEPS.forEach(step => {
        svg.append("g").selectAll("circle")
          .data(data.filter(d => d.year === step)).join("circle")
          .attr("cx", x(step)).attr("cy", d => y(d.survival))
          .attr("r", 3).attr("fill", d => color(d.name))
          .attr("stroke","#fff").attr("stroke-width",1.2);
      });

      // ── LEFT labels (5 Year): name + value, dodged + connector ─────────────
      const left5   = data.filter(d => d.year==="5 Year").sort((a,b) => b.survival-a.survival);
      const lRaw    = left5.map(d => y(d.survival));
      const lDodged = dodge(lRaw, 13);
      svg.append("g").selectAll("line.ltick").data(d3.zip(left5,lRaw,lDodged)).join("line")
        .attr("x1",x("5 Year")-PAD).attr("y1",([,r])=>r)
        .attr("x2",x("5 Year")-PAD-12).attr("y2",([,,dg])=>dg)
        .attr("stroke","#cbd5e1").attr("stroke-width",0.7);
      svg.append("g").selectAll("text.llbl").data(d3.zip(left5,lDodged)).join("text")
        .attr("x",x("5 Year")-PAD-14).attr("y",([,pos])=>pos)
        .attr("dy","0.35em").attr("text-anchor","end")
        .attr("font-size","9px").attr("font-weight","600")
        .attr("fill",([d])=>color(d.name))
        .attr("stroke","#f8fafc").attr("stroke-width",3).attr("paint-order","stroke")
        .text(([d])=>`${d.name} ${d.survival}`);

      // ── MIDDLE labels (10 Year): value only, centered, dodged ──────────────
      ["10 Year","15 Year"].forEach(step => {
        const mid      = data.filter(d => d.year===step).sort((a,b) => b.survival-a.survival);
        const mRaw     = mid.map(d => y(d.survival));
        const mDodged  = dodge(mRaw, 11);
        svg.append("g").selectAll(`text.mid${step.replace(" ","")}`).data(d3.zip(mid,mRaw,mDodged)).join("text")
          .attr("x", x(step))
          .attr("y", ([,,dg])=>dg)
          .attr("dy","0.35em").attr("text-anchor","middle")
          .attr("font-size","9px").attr("font-weight","600")
          .attr("fill",([d])=>color(d.name))
          .attr("stroke","#f8fafc").attr("stroke-width",3).attr("paint-order","stroke")
          .text(([d])=>`${d.survival}`);
      });

      // ── RIGHT labels (20 Year): value + name, dodged + connector ───────────
      const right20 = data.filter(d => d.year==="20 Year").sort((a,b) => b.survival-a.survival);
      const rRaw    = right20.map(d => y(d.survival));
      const rDodged = dodge(rRaw, 13);
      svg.append("g").selectAll("line.rtick").data(d3.zip(right20,rRaw,rDodged)).join("line")
        .attr("x1",x("20 Year")+PAD).attr("y1",([,r])=>r)
        .attr("x2",x("20 Year")+PAD+12).attr("y2",([,,dg])=>dg)
        .attr("stroke","#cbd5e1").attr("stroke-width",0.7);
      svg.append("g").selectAll("text.rlbl").data(d3.zip(right20,rDodged)).join("text")
        .attr("x",x("20 Year")+PAD+14).attr("y",([,pos])=>pos)
        .attr("dy","0.35em").attr("text-anchor","start")
        .attr("font-size","9px").attr("font-weight","600")
        .attr("fill",([d])=>color(d.name))
        .attr("stroke","#f8fafc").attr("stroke-width",3).attr("paint-order","stroke")
        .text(([d])=>`${d.survival} ${d.name}`);

      return () => tooltip.remove();
    });
  }, [theme]);

  return (
    <div style={{ display:"flex", gap:12, alignItems:"flex-start", width:"100%", border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden" }}>
      <div style={{ flex:1, minWidth:0, overflowY:"auto", maxHeight:620, background:"#f8fafc", padding:8 }}>
        <svg ref={svgRef} style={{ display:"block" }} />
        <div style={{ padding:"6px 8px 0", fontSize:11, color:"#94a3b8" }}>
          💡 Hover a line for details · Numbers at 10yr &amp; 15yr show dodged survival %
        </div>
      </div>
      <div style={{ padding:"12px 12px 12px 0" }}>
        <LegendHTML names={names} theme={theme} />
      </div>
    </div>
  );
}

// ─── 3D Chart ─────────────────────────────────────────────────────────────────
function Chart3D({ theme }) {
  const mountRef   = useRef(null);
  const overlayRef = useRef(null);
  const [names, setNames] = useState([]);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    while (el.firstChild) el.removeChild(el.firstChild);

    const W = el.clientWidth || 680;
    const H = 500;

    const scene  = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);
    const camera = new THREE.PerspectiveCamera(42, W/H, 0.1, 200);
    camera.position.set(0, 0, 24);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias:true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.domElement.style.display    = "block";
    renderer.domElement.style.outline    = "none";
    renderer.domElement.style.userSelect = "none";
    el.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.78));
    const sun = new THREE.DirectionalLight(0xffffff, 1.0);
    sun.position.set(6,14,10); sun.castShadow=true; scene.add(sun);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xe0e7ff, 0.45));

    const labelAnchors = [];
    let   animId;

    d3.csv("/cancer.csv", d3.autoType).then(data => {
      const cancerNames = [...new Set(data.map(d => d.name))];
      setNames(cancerNames);

      const palette = THEMES[theme];
      const color   = d3.scaleOrdinal().domain(cancerNames).range(palette);

      const allVals = data.map(d => d.survival);
      const yScale  = d3.scaleLinear()
        .domain([d3.min(allVals)-2, d3.max(allVals)+2])
        .range([-7, 7]);

      const xPositions = { "5 Year":-6, "10 Year":-2, "15 Year":2, "20 Year":6 };

      const N      = cancerNames.length;
      const zGap   = 0.38;
      const startZ = -(N-1)/2 * zGap;

      const pivot = new THREE.Group();

      // Step reference panels
      Object.values(xPositions).forEach(xp => {
        const panel = new THREE.Mesh(
          new THREE.PlaneGeometry(0.04, 16),
          new THREE.MeshBasicMaterial({ color:0xe2e8f0, transparent:true, opacity:0.5, side:THREE.DoubleSide })
        );
        panel.position.set(xp, 0, 0); pivot.add(panel);
      });

      cancerNames.forEach((name, ni) => {
        const z    = startZ + ni * zGap;
        const vals = data.filter(d => d.name===name)
          .sort((a,b) => STEPS.indexOf(a.year)-STEPS.indexOf(b.year));
        const col  = new THREE.Color(color(name));

        // Tubes between steps
        for (let si = 0; si < vals.length-1; si++) {
          const v1 = vals[si], v2 = vals[si+1];
          const p1 = new THREE.Vector3(xPositions[v1.year], yScale(v1.survival), z);
          const p2 = new THREE.Vector3(xPositions[v2.year], yScale(v2.survival), z);
          const tube = new THREE.Mesh(
            new THREE.TubeGeometry(new THREE.LineCurve3(p1,p2), 6, 0.045, 6, false),
            new THREE.MeshStandardMaterial({
              color:col, roughness:0.25, metalness:0.45,
              emissive:col, emissiveIntensity:0.18,
              transparent:true, opacity:0.85,
            })
          );
          tube.castShadow=true; pivot.add(tube);
        }

        // Glow dots at each step
        vals.forEach(v => {
          const dot = new THREE.Mesh(
            new THREE.SphereGeometry(0.10, 12, 12),
            new THREE.MeshStandardMaterial({
              color:col, roughness:0.2, metalness:0.5,
              emissive:col, emissiveIntensity:0.5,
            })
          );
          dot.position.set(xPositions[v.year], yScale(v.survival), z);
          pivot.add(dot);
        });

        // ── LEFT (5 Year): name + value ────────────────────────────────────
        const v5 = vals.find(v => v.year==="5 Year");
        if (v5) labelAnchors.push({
          pos:  new THREE.Vector3(-7, yScale(v5.survival), z),
          text: `${name} ${v5.survival}`,
          col:  color(name), type:"left",
        });

        // ── MIDDLE (10 Year, 15 Year): value only ──────────────────────────
        ["10 Year","15 Year"].forEach(step => {
          const vm = vals.find(v => v.year===step);
          if (vm) labelAnchors.push({
            pos:  new THREE.Vector3(xPositions[step], yScale(vm.survival)+0.35, z),
            text: `${vm.survival}`,
            col:  color(name), type:"mid",
          });
        });

        // ── RIGHT (20 Year): value + name ──────────────────────────────────
        const v20 = vals.find(v => v.year==="20 Year");
        if (v20) labelAnchors.push({
          pos:  new THREE.Vector3(7, yScale(v20.survival), z),
          text: `${v20.survival} ${name}`,
          col:  color(name), type:"right",
        });
      });

      // Step labels at front
      Object.entries(xPositions).forEach(([step, xp]) => {
        labelAnchors.push({ pos:new THREE.Vector3(xp, 7.8, startZ-0.4), text:step, col:"#1e293b", type:"year" });
      });

      scene.add(pivot);

      if (overlayRef.current) {
        const divs = overlayRef.current.querySelectorAll(".shlbl");
        labelAnchors.forEach((a,i) => { if (divs[i]) divs[i].textContent = a.text; });
      }

      const toScreen = v3 => {
        const v = v3.clone().project(camera);
        return { sx:(v.x*0.5+0.5)*W, sy:(-v.y*0.5+0.5)*H, behind:v.z>1 };
      };

      let isDragging=false, prevX=0, prevY=0,
          rotX=0.12, rotY=0, autoSpin=true;
      pivot.rotation.x=rotX; pivot.rotation.y=rotY;

      const onDown = e => {
        e.preventDefault(); isDragging=true; prevX=e.clientX; prevY=e.clientY;
        autoSpin=false; renderer.domElement.style.cursor="grabbing";
      };
      const onUp   = () => { isDragging=false; renderer.domElement.style.cursor="grab"; };
      const onMove = e => {
        if (!isDragging) return;
        rotY += (e.clientX-prevX)*0.007;
        rotX  = Math.max(-0.55, Math.min(0.55, rotX+(e.clientY-prevY)*0.004));
        prevX=e.clientX; prevY=e.clientY;
      };

      renderer.domElement.addEventListener("mousedown", onDown);
      window.addEventListener("mouseup",   onUp);
      window.addEventListener("mousemove", onMove);
      renderer.domElement.style.cursor = "grab";

      const animate = () => {
        animId = requestAnimationFrame(animate);
        if (autoSpin) rotY += 0.004;
        pivot.rotation.y=rotY; pivot.rotation.x=rotX;
        camera.updateMatrixWorld();

        if (overlayRef.current) {
          overlayRef.current.querySelectorAll(".shlbl").forEach((div,i) => {
            const a = labelAnchors[i];
            if (!a) return;
            const rotVec = new THREE.Vector3(a.pos.x,a.pos.y,a.pos.z).applyEuler(pivot.rotation);
            const { sx, sy, behind } = toScreen(rotVec);
            div.style.left    = `${sx}px`;
            div.style.top     = `${sy}px`;
            div.style.opacity = behind ? "0" : "1";
          });
        }
        renderer.render(scene, camera);
      };
      animate();

      return () => {
        renderer.domElement.removeEventListener("mousedown", onDown);
        window.removeEventListener("mouseup",   onUp);
        window.removeEventListener("mousemove", onMove);
      };
    });

    return () => { cancelAnimationFrame(animId); renderer.dispose(); if(el.contains(renderer.domElement)) el.removeChild(renderer.domElement); };
  }, [theme]);

  // 24 types × (1 left + 2 mid + 1 right) + 4 year labels = 100
  const jsxLabels = Array.from({ length: 100 }, (_, i) => {
    if (i >= 96) return { col:"#1e293b", type:"year" };
    const types = ["left","mid","mid","right"];
    const type  = types[i % 4];
    const col   = THEMES[theme][Math.floor(i/4) % THEMES[theme].length];
    return { col, type };
  });

  return (
    <div style={{ display:"flex", gap:12, alignItems:"flex-start", width:"100%", border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden" }}>
      <div style={{ position:"relative", flex:1, minWidth:0, userSelect:"none" }}>
        <div ref={mountRef} style={{ width:"100%", height:500, cursor:"grab", overflow:"hidden" }} />

        <div ref={overlayRef} style={{ position:"absolute", inset:0, pointerEvents:"none", overflow:"hidden" }}>
          {jsxLabels.map((a, i) => (
            <div key={i} className="shlbl" style={{
              position:      "absolute",
              transform:     a.type==="left"  ? "translate(-100%,-50%)"
                           : a.type==="right" ? "translate(0,-50%)"
                           : a.type==="mid"   ? "translate(-50%,-100%)"
                           :                    "translate(-50%,-100%)",
              background:    "rgba(255,255,255,0.94)",
              color:         a.col,
              fontSize:      a.type==="year" ? 11 : a.type==="mid" ? 8 : 9,
              fontWeight:    "bold",
              padding:       a.type==="year" ? "3px 8px" : "2px 4px",
              borderRadius:  3,
              border:        a.type==="year" ? "1px solid #334155" : `1px solid ${a.col}55`,
              whiteSpace:    "nowrap",
              pointerEvents: "none",
              boxShadow:     "0 1px 3px rgba(0,0,0,0.08)",
              opacity:       0,
            }} />
          ))}
        </div>

        <div style={{ padding:"7px 14px", background:"#f8fafc", borderTop:"1px solid #e2e8f0", fontSize:11, color:"#94a3b8" }}>
          💡 Drag to rotate · auto-spins · Numbers at 10yr &amp; 15yr = survival %
        </div>
      </div>
      <div style={{ padding:"12px 12px 12px 0" }}>
        <LegendHTML names={names} theme={theme} />
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const CancerSurvivalSlopeChart = () => {
  const [viewMode, setViewMode] = useState("2d");
  const [theme,    setTheme]    = useState("Modern");

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
        <div style={{ fontSize:16, fontWeight:"bold", color:"#1e293b" }}>Cancer Survival Rate – Slope Chart</div>
        <div style={{ fontSize:12, color:"#94a3b8", marginTop:2 }}>Survival rates at 5, 10, 15 &amp; 20 years · % surviving</div>
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

      <div style={{ minHeight:500 }}>
        {viewMode === "2d"
          ? <Chart2D key={`2d-${theme}`} theme={theme} />
          : <Chart3D key={`3d-${theme}`} theme={theme} />
        }
      </div>
    </div>
  );
};

export default CancerSurvivalSlopeChart;