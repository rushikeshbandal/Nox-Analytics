import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import * as THREE from "three";

function dodge(positions, separation = 13, maxiter = 10, maxerror = 0.1) {
  positions = Array.from(positions);
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
  Modern:  { inc:"#10b981", dec:"#ef4444", line:"#6366f1" },
  Neon:    { inc:"#39ff14", dec:"#ff0080", line:"#00f5ff" },
  Sunset:  { inc:"#1dd1a1", dec:"#ff6b6b", line:"#f97316" },
  Ocean:   { inc:"#0096c7", dec:"#023e8a", line:"#0077b6" },
  Forest:  { inc:"#52b788", dec:"#c1121f", line:"#2d6a4f" },
  Galaxy:  { inc:"#c77dff", dec:"#ef4444", line:"#7b2cbf" },
};

// ─── 2D Chart ─────────────────────────────────────────────────────────────────
function Chart2D({ theme }) {
  const svgRef = useRef(null);
  const t      = THEMES[theme];

  useEffect(() => {
    if (!svgRef.current) return;

    d3.csv("/government-receipts-of-gdp.csv").then(raw => {
      const data = raw
        .map(d => ({ country:d.country, v1970:+d["1970"], v1979:+d["1979"] }))
        .filter(d => isFinite(d.v1970) && isFinite(d.v1979))
        .sort((a, b) => b.v1970 - a.v1970);

      const W      = 680;
      const H      = 560;
      const margin = { top:60, right:170, bottom:24, left:170 };
      const PAD    = 8;

      const x = d3.scalePoint()
        .domain(["1970","1979"])
        .range([margin.left, W - margin.right])
        .padding(0.5);

      const allVals = data.flatMap(d => [d.v1970, d.v1979]);
      const y = d3.scaleLinear()
        .domain([d3.min(allVals) - 2, d3.max(allVals) + 2])
        .range([H - margin.bottom, margin.top]);

      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();
      svg.attr("width", W).attr("height", H);
      svg.append("rect").attr("width",W).attr("height",H).attr("fill","#f8fafc").attr("rx",8);

      // Column dashed lines
      ["1970","1979"].forEach(yr => {
        svg.append("line")
          .attr("x1",x(yr)).attr("x2",x(yr))
          .attr("y1",margin.top - 16).attr("y2",H - margin.bottom)
          .attr("stroke","#cbd5e1").attr("stroke-width",1.2)
          .attr("stroke-dasharray","4,3");
        svg.append("text")
          .attr("x", x(yr)).attr("y", margin.top - 22)
          .attr("text-anchor","middle")
          .attr("font-weight","700").attr("font-size","14px")
          .attr("fill","#1e293b").text(yr);
      });

      // Tooltip
      const tooltip = d3.select("body").append("div")
        .style("position","absolute").style("background","rgba(15,23,42,0.92)")
        .style("color","#fff").style("padding","8px 12px").style("border-radius","6px")
        .style("font-size","12px").style("pointer-events","none").style("opacity",0)
        .style("border","1px solid #334155").style("z-index","9999");

      // Slope lines
      svg.append("g").selectAll("line.slope").data(data).join("line")
        .attr("x1", x("1970")).attr("y1", d => y(d.v1970))
        .attr("x2", x("1979")).attr("y2", d => y(d.v1979))
        .attr("stroke", d => d.v1979 > d.v1970 ? t.inc : t.dec)
        .attr("stroke-width", 2).attr("opacity", 0.72)
        .style("cursor","pointer")
        .on("mouseover", function(event, d) {
          d3.select(this).attr("stroke-width",3.5).attr("opacity",1);
          const chg = (d.v1979 - d.v1970).toFixed(1);
          const dir = d.v1979 > d.v1970 ? "▲" : "▼";
          tooltip.style("opacity",1)
            .html(`<b>${d.country}</b><br/>1970: <b>${d.v1970}%</b><br/>1979: <b>${d.v1979}%</b><br/>Change: <b>${dir} ${chg}pp</b>`)
            .style("left",(event.pageX+12)+"px").style("top",(event.pageY-10)+"px");
        })
        .on("mousemove", event => tooltip.style("left",(event.pageX+12)+"px").style("top",(event.pageY-10)+"px"))
        .on("mouseout", function() { d3.select(this).attr("stroke-width",2).attr("opacity",0.72); tooltip.style("opacity",0); });

      // Endpoint dots
      ["1970","1979"].forEach(yr => {
        svg.append("g").selectAll("circle").data(data).join("circle")
          .attr("cx", x(yr))
          .attr("cy", d => y(yr==="1970" ? d.v1970 : d.v1979))
          .attr("r", 4)
          .attr("fill", d => d.v1979 > d.v1970 ? t.inc : t.dec)
          .attr("stroke","#fff").attr("stroke-width",1.5);
      });

      // ── LEFT labels with dodge + connector ticks ───────────────────────────
      const leftRaw    = data.map(d => y(d.v1970));
      const leftDodged = dodge(leftRaw, 14);

      // connector ticks
      svg.append("g").selectAll("line.ltick")
        .data(d3.zip(data, leftRaw, leftDodged)).join("line")
        .attr("x1", x("1970") - PAD)
        .attr("y1", ([,raw]) => raw)
        .attr("x2", x("1970") - PAD - 14)
        .attr("y2", ([,,dg]) => dg)
        .attr("stroke","#cbd5e1").attr("stroke-width",0.8);

      // labels — colored by direction
      svg.append("g").selectAll("text.llbl")
        .data(d3.zip(data, leftDodged)).join("text")
        .attr("x", x("1970") - PAD - 16)
        .attr("y", ([,pos]) => pos)
        .attr("dy","0.35em")
        .attr("text-anchor","end")
        .attr("font-size","10px")
        .attr("font-weight","600")
        .attr("fill", ([d]) => d.v1979 > d.v1970 ? t.inc : t.dec)
        .text(([d]) => `${d.country} ${d.v1970}`);

      // ── RIGHT labels with dodge + connector ticks ──────────────────────────
      const rightRaw    = data.map(d => y(d.v1979));
      const rightDodged = dodge(rightRaw, 14);

      svg.append("g").selectAll("line.rtick")
        .data(d3.zip(data, rightRaw, rightDodged)).join("line")
        .attr("x1", x("1979") + PAD)
        .attr("y1", ([,raw]) => raw)
        .attr("x2", x("1979") + PAD + 14)
        .attr("y2", ([,,dg]) => dg)
        .attr("stroke","#cbd5e1").attr("stroke-width",0.8);

      svg.append("g").selectAll("text.rlbl")
        .data(d3.zip(data, rightDodged)).join("text")
        .attr("x", x("1979") + PAD + 16)
        .attr("y", ([,pos]) => pos)
        .attr("dy","0.35em")
        .attr("text-anchor","start")
        .attr("font-size","10px")
        .attr("font-weight","600")
        .attr("fill", ([d]) => d.v1979 > d.v1970 ? t.inc : t.dec)
        .text(([d]) => `${d.v1979} ${d.country}`);

      // Legend
      const leg = svg.append("g").attr("transform",`translate(${W/2 - 70},${H - 10})`);
      [{ col:t.inc, label:"Increase" },{ col:t.dec, label:"Decrease" }].forEach((l,i) => {
        leg.append("line").attr("x1",i*110).attr("x2",i*110+18).attr("y1",0).attr("y2",0)
          .attr("stroke",l.col).attr("stroke-width",2.5);
        leg.append("text").attr("x",i*110+22).attr("y",0).attr("dy","0.35em")
          .attr("font-size","10px").attr("fill","#64748b").text(l.label);
      });

      return () => tooltip.remove();
    });
  }, [theme]);

  return (
    <div style={{ border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden", background:"#f8fafc", padding:8 }}>
      <svg ref={svgRef} style={{ display:"block" }} />
      <div style={{ padding:"6px 8px 0", fontSize:11, color:"#94a3b8" }}>
        💡 Hover a line for details · Connector ticks show nudged labels
      </div>
    </div>
  );
}

// ─── 3D Chart — Z-spread per country, pivot rotation, full top-to-bottom view ─
function Chart3D({ theme }) {
  const mountRef   = useRef(null);
  const overlayRef = useRef(null);
  const t          = THEMES[theme];

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    while (el.firstChild) el.removeChild(el.firstChild);

    const W = el.clientWidth || 680;
    const H = 500;

    const scene  = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);

    const camera = new THREE.PerspectiveCamera(42, W/H, 0.1, 200);
    // ── FIX: camera positioned to see FULL height from top to bottom ──────
    camera.position.set(0, 0, 22);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias:true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.domElement.style.display    = "block";
    renderer.domElement.style.outline    = "none";
    renderer.domElement.style.userSelect = "none";
    el.appendChild(renderer.domElement);

    // Lights — NO AxesHelper
    scene.add(new THREE.AmbientLight(0xffffff, 0.78));
    const sun = new THREE.DirectionalLight(0xffffff, 1.0);
    sun.position.set(6,14,10); sun.castShadow=true; scene.add(sun);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xe0e7ff, 0.45));

    const labelAnchors = [];
    let   animId;

    d3.csv("/government-receipts-of-gdp.csv").then(raw => {
      const data = raw
        .map(d => ({ country:d.country, v1970:+d["1970"], v1979:+d["1979"] }))
        .filter(d => isFinite(d.v1970) && isFinite(d.v1979))
        .sort((a, b) => b.v1970 - a.v1970);

      const allVals = data.flatMap(d => [d.v1970, d.v1979]);
      const yScale  = d3.scaleLinear()
        .domain([d3.min(allVals) - 1, d3.max(allVals) + 1])
        .range([-7, 7]);   // full -7 to +7 range → visible top to bottom

      const N       = data.length;
      const zGap    = 0.55;                    // Z spread per country
      const startZ  = -(N-1)/2 * zGap;

      const pivot = new THREE.Group();

      // ── Column reference panels (1970 | 1979) ─────────────────────────────
      [-5, 5].forEach(xp => {
        const panel = new THREE.Mesh(
          new THREE.PlaneGeometry(0.05, 16),
          new THREE.MeshBasicMaterial({ color:0xe2e8f0, transparent:true, opacity:0.5, side:THREE.DoubleSide })
        );
        panel.position.set(xp, 0, 0); pivot.add(panel);
      });

      data.forEach((d, i) => {
        const z     = startZ + i * zGap;        // ── each country different Z depth
        const y1970 = yScale(d.v1970);
        const y1979 = yScale(d.v1979);
        const isInc = d.v1979 > d.v1970;
        const hex   = isInc ? t.inc : t.dec;
        const col   = new THREE.Color(hex);

        // Slope tube
        const p1    = new THREE.Vector3(-5, y1970, z);
        const p2    = new THREE.Vector3( 5, y1979, z);
        const curve = new THREE.LineCurve3(p1, p2);

        const tube = new THREE.Mesh(
          new THREE.TubeGeometry(curve, 8, 0.055, 6, false),
          new THREE.MeshStandardMaterial({
            color:col, roughness:0.25, metalness:0.45,
            emissive:col, emissiveIntensity:0.22,
          })
        );
        tube.castShadow = true; pivot.add(tube);

        // Glow dots at endpoints
        [p1, p2].forEach(p => {
          const dot = new THREE.Mesh(
            new THREE.SphereGeometry(0.13, 16, 16),
            new THREE.MeshStandardMaterial({
              color:col, roughness:0.2, metalness:0.5,
              emissive:col, emissiveIntensity:0.5,
            })
          );
          dot.position.copy(p); pivot.add(dot);
        });

        // Arrow cone at p2 end
        const dir  = p2.clone().sub(p1).normalize();
        const cone = new THREE.Mesh(
          new THREE.ConeGeometry(0.09, 0.22, 8),
          new THREE.MeshStandardMaterial({
            color:col, roughness:0.2, metalness:0.5,
            emissive:col, emissiveIntensity:0.3,
          })
        );
        cone.position.copy(p2.clone().add(dir.clone().multiplyScalar(0.15)));
        cone.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), dir);
        pivot.add(cone);

        // Label anchors — left and right of each slope
        labelAnchors.push({
          pos:  new THREE.Vector3(-5.4, y1970, z),
          text: `${d.country} ${d.v1970}`,
          col:  hex,
          type: "left",
        });
        labelAnchors.push({
          pos:  new THREE.Vector3( 5.4, y1979, z),
          text: `${d.v1979} ${d.country}`,
          col:  hex,
          type: "right",
        });
      });

      // Year axis labels (at front Z = startZ - 0.5)
      const frontZ = startZ - 0.5;
      labelAnchors.push({ pos: new THREE.Vector3(-5,  7.8, frontZ), text:"1970", col:"#1e293b", type:"year" });
      labelAnchors.push({ pos: new THREE.Vector3( 5,  7.8, frontZ), text:"1979", col:"#1e293b", type:"year" });

      scene.add(pivot);

      // Set overlay text
      if (overlayRef.current) {
        const divs = overlayRef.current.querySelectorAll(".shlbl");
        labelAnchors.forEach((a, i) => { if (divs[i]) divs[i].textContent = a.text; });
      }

      const toScreen = v3 => {
        const v = v3.clone().project(camera);
        return { sx:(v.x*0.5+0.5)*W, sy:(-v.y*0.5+0.5)*H, behind:v.z>1 };
      };

      // ── Pivot rotation (NOT camera orbit) → full height always visible ────
      let isDragging=false, prevX=0, prevY=0,
          rotX=0.15, rotY=0, autoSpin=true;
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
        rotY += (e.clientX-prevX)*0.007;
        rotX  = Math.max(-0.6, Math.min(0.6, rotX+(e.clientY-prevY)*0.004));
        prevX=e.clientX; prevY=e.clientY;
      };

      renderer.domElement.addEventListener("mousedown", onDown);
      window.addEventListener("mouseup",   onUp);
      window.addEventListener("mousemove", onMove);
      renderer.domElement.style.cursor = "grab";

      const animate = () => {
        animId = requestAnimationFrame(animate);
        if (autoSpin) rotY += 0.004;
        pivot.rotation.y = rotY;
        pivot.rotation.x = rotX;
        camera.updateMatrixWorld();

        if (overlayRef.current) {
          overlayRef.current.querySelectorAll(".shlbl").forEach((div, i) => {
            const a = labelAnchors[i];
            if (!a) return;
            const rotVec = new THREE.Vector3(a.pos.x, a.pos.y, a.pos.z).applyEuler(pivot.rotation);
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

    return () => {
      cancelAnimationFrame(animId);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [theme]);

  // 15 countries × 2 labels + 2 year labels = 32
  const jsxLabels = Array.from({ length: 32 }, (_, i) => {
    if (i >= 30) return { col:"#1e293b", type:"year" };
    return { col: i % 2 === 0 ? t.inc : t.dec, type: i % 2 === 0 ? "left" : "right" };
  });

  return (
    <div style={{ border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden" }}>
      <div style={{ position:"relative", userSelect:"none" }}>
        <div ref={mountRef} style={{ width:"100%", height:500, cursor:"grab", overflow:"hidden" }} />

        <div ref={overlayRef} style={{ position:"absolute", inset:0, pointerEvents:"none", overflow:"hidden" }}>
          {jsxLabels.map((a, i) => (
            <div key={i} className="shlbl" style={{
              position:      "absolute",
              transform:     a.type==="left"  ? "translate(-100%,-50%)"
                           : a.type==="right" ? "translate(0,-50%)"
                           : "translate(-50%,-100%)",
              background:    "rgba(255,255,255,0.94)",
              color:         a.col,
              fontSize:      a.type==="year" ? 12 : 9,
              fontWeight:    "bold",
              padding:       a.type==="year" ? "3px 8px" : "2px 5px",
              borderRadius:  3,
              border:        a.type==="year" ? "1px solid #334155" : `1px solid ${a.col}55`,
              whiteSpace:    "nowrap",
              pointerEvents: "none",
              boxShadow:     "0 1px 3px rgba(0,0,0,0.10)",
              opacity:       0,
            }} />
          ))}
        </div>

        <div style={{ padding:"7px 14px", background:"#f8fafc", borderTop:"1px solid #e2e8f0", fontSize:11, color:"#94a3b8" }}>
          💡 Drag to rotate · auto-spins · Each line = one country · Z depth = country order ·
          <span style={{ color:t.inc, fontWeight:700, marginLeft:6 }}>■ Increase</span>
          <span style={{ color:t.dec, fontWeight:700, marginLeft:8 }}>■ Decrease</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const SlopeChart = () => {
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
        <div style={{ fontSize:16, fontWeight:"bold", color:"#1e293b" }}>
          Government Receipts (% of GDP)
        </div>
        <div style={{ fontSize:12, color:"#94a3b8", marginTop:2 }}>
          Slope chart · 1970 vs 1979 · % of GDP per country
        </div>
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

export default SlopeChart;