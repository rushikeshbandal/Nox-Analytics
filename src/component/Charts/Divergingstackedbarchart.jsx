import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import * as THREE from "three";

const THEMES = {
  Modern:  { neg:"#ef4444", pos:"#6366f1" },
  Neon:    { neg:"#ff0080", pos:"#00f5ff" },
  Sunset:  { neg:"#ff6b6b", pos:"#1dd1a1" },
  Ocean:   { neg:"#0077b6", pos:"#48cae4" },
  Galaxy:  { neg:"#7b2cbf", pos:"#c77dff" },
  Forest:  { neg:"#2d6a4f", pos:"#95d5b2" },
  Autumn:  { neg:"#c1121f", pos:"#a7c957" },
  Candy:   { neg:"#ff006e", pos:"#06d6a0" },
};

const CATEGORY_MAP = {
  "pants-fire":   { label:"Pants on Fire", positive: false },
  "false":        { label:"False",         positive: false },
  "mostly-false": { label:"Mostly False",  positive: false },
  "barely-true":  { label:"Barely True",   positive: false },
  "half-true":    { label:"Half True",     positive: true  },
  "mostly-true":  { label:"Mostly True",   positive: true  },
  "true":         { label:"True",          positive: true  },
};

// ─── Legend ───────────────────────────────────────────────────────────────────
function LegendHTML({ theme }) {
  const { neg, pos } = THEMES[theme];
  return (
    <div style={{
      background:"#fff", border:"1px solid #e2e8f0", borderRadius:8,
      padding:"12px 14px", width:152, flexShrink:0,
      boxShadow:"0 1px 4px rgba(0,0,0,0.07)", alignSelf:"flex-start",
    }}>
      <div style={{ fontSize:10, fontWeight:"bold", color:"#94a3b8", letterSpacing:"0.08em", marginBottom:10 }}>
        VERDICT
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
        <div style={{ width:12, height:12, borderRadius:2, background:pos }} />
        <span style={{ color:"#334155", fontSize:11 }}>Truthful</span>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
        <div style={{ width:12, height:12, borderRadius:2, background:neg }} />
        <span style={{ color:"#334155", fontSize:11 }}>Misleading</span>
      </div>
      <div style={{ borderTop:"1px solid #e2e8f0", margin:"8px 0" }} />
      <div style={{ fontSize:10, fontWeight:"bold", color:"#94a3b8", letterSpacing:"0.08em", marginBottom:8 }}>
        CATEGORIES
      </div>
      {[
        { label:"True",         col:pos },
        { label:"Mostly True",  col:pos },
        { label:"Half True",    col:pos },
        { label:"Barely True",  col:neg },
        { label:"False",        col:neg },
        { label:"Pants on Fire",col:neg },
      ].map(c => (
        <div key={c.label} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:5 }}>
          <div style={{ width:8, height:8, borderRadius:2, flexShrink:0, background:c.col }} />
          <span style={{ color:"#334155", fontSize:10 }}>{c.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── 2D Chart — label overlap FIXED ──────────────────────────────────────────
function Chart2D({ data, theme }) {
  const svgRef = useRef(null);
  const { neg, pos } = THEMES[theme];

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    const speakers = [...new Set(data.map(d => d.speaker))];

    const W      = 680;
    const barH   = 28;
    const margin = { top:44, right:100, bottom:20, left:140 };
    const H      = speakers.length * barH + margin.top + margin.bottom;

    // ── FIX: Compute stacked positions per speaker ──────────────────────────
    // Positive bars: stack right from 0
    // Negative bars: stack left from 0
    const stackedData = [];
    speakers.forEach(speaker => {
      const spkRows = data.filter(d => d.speaker === speaker);
      const posRows = spkRows.filter(d => d.positive).sort((a,b) => b.value - a.value);
      const negRows = spkRows.filter(d => !d.positive).sort((a,b) => a.value - b.value);

      let posAcc = 0;
      posRows.forEach(d => {
        stackedData.push({ ...d, x0: posAcc, x1: posAcc + d.value });
        posAcc += d.value;
      });

      let negAcc = 0;
      negRows.forEach(d => {
        stackedData.push({ ...d, x0: negAcc - d.value, x1: negAcc });
        negAcc -= d.value;
      });
    });

    const allVals = stackedData.flatMap(d => [d.x0, d.x1]);
    const xMin = Math.min(...allVals);
    const xMax = Math.max(...allVals);

    const x = d3.scaleLinear()
      .domain([xMin * 1.05, xMax * 1.05]).nice()
      .range([margin.left, W - margin.right]);

    const y = d3.scaleBand()
      .domain(speakers)
      .range([margin.top, H - margin.bottom])
      .padding(0.22);

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("width", W).attr("height", H);
    svg.append("rect").attr("width",W).attr("height",H).attr("fill","#f8fafc").attr("rx",8);

    // Grid lines
    svg.append("g").attr("transform",`translate(0,${H-margin.bottom})`)
      .call(d3.axisBottom(x).tickFormat("").tickSize(-(H-margin.top-margin.bottom)).ticks(8))
      .call(g => { g.select(".domain").remove(); g.selectAll("line").style("stroke","#e2e8f0").style("stroke-dasharray","4,3"); });

    // Zero reference line
    svg.append("line")
      .attr("x1",x(0)).attr("x2",x(0))
      .attr("y1",margin.top-8).attr("y2",H-margin.bottom+8)
      .attr("stroke","#94a3b8").attr("stroke-width",1.5)
      .attr("stroke-dasharray","4,3");

    // Tooltip
    const tooltip = d3.select("body").append("div")
      .style("position","absolute").style("background","rgba(15,23,42,0.92)")
      .style("color","#fff").style("padding","8px 12px").style("border-radius","6px")
      .style("font-size","12px").style("pointer-events","none").style("opacity",0)
      .style("border","1px solid #334155").style("z-index","9999");

    // ── Stacked bars ──────────────────────────────────────────────────────────
    svg.append("g").selectAll("rect").data(stackedData).join("rect")
      .attr("x",      d => x(d.x0))
      .attr("y",      d => y(d.speaker))
      .attr("width",  d => Math.max(0, x(d.x1) - x(d.x0)))
      .attr("height", y.bandwidth())
      .attr("fill",   d => d.positive ? pos : neg)
      .attr("rx", 2).attr("opacity", 0.88)
      .attr("stroke","#fff").attr("stroke-width",0.6)
      .style("cursor","pointer")
      .on("mouseover", function(event, d) {
        d3.select(this).attr("opacity",1);
        tooltip.style("opacity",1)
          .html(
            `<b>${d.speaker}</b><br/>` +
            `Category: <b>${d.category}</b><br/>` +
            `Share: <b>${d3.format(".1%")(Math.abs(d.x1-d.x0))}</b>`
          )
          .style("left",(event.pageX+12)+"px").style("top",(event.pageY-10)+"px");
      })
      .on("mouseout", function() { d3.select(this).attr("opacity",0.88); tooltip.style("opacity",0); });

    // ── FIX: Labels ONLY inside bars wide enough (>40px), no overlap ─────────
    svg.append("g").selectAll("text").data(stackedData).join("text")
      .each(function(d) {
        const barPx = Math.abs(x(d.x1) - x(d.x0));
        if (barPx < 42) { d3.select(this).remove(); return; }
        const pct = d3.format(".0%")(Math.abs(d.x1-d.x0));
        d3.select(this)
          .attr("x", (x(d.x0) + x(d.x1)) / 2)
          .attr("y", y(d.speaker) + y.bandwidth()/2)
          .attr("dy","0.35em")
          .attr("text-anchor","middle")
          .attr("fill","#fff")
          .style("font-size","9px")
          .style("font-weight","700")
          .style("pointer-events","none")
          .text(pct);
      });

    // ── Total positive/negative labels at bar ends ────────────────────────────
    // Group by speaker to get total extent
    const speakerExtent = d3.rollup(
      stackedData,
      g => ({
        posMax: d3.max(g, d => d.x1),
        negMin: d3.min(g, d => d.x0),
      }),
      d => d.speaker
    );

    // Positive total label (right end)
    svg.append("g").selectAll("text.pos-total").data([...speakerExtent.entries()]).join("text")
      .filter(([,e]) => e.posMax > 0)
      .attr("x",  ([,e]) => x(e.posMax) + 5)
      .attr("y",  ([spk]) => y(spk) + y.bandwidth()/2)
      .attr("dy","0.35em")
      .attr("fill", pos).style("font-size","10px").style("font-weight","700")
      .text(([,e]) => `+${d3.format(".0%")(e.posMax)}`);

    // Negative total label (left end)
    svg.append("g").selectAll("text.neg-total").data([...speakerExtent.entries()]).join("text")
      .filter(([,e]) => e.negMin < 0)
      .attr("x",  ([,e]) => x(e.negMin) - 5)
      .attr("y",  ([spk]) => y(spk) + y.bandwidth()/2)
      .attr("dy","0.35em")
      .attr("text-anchor","end")
      .attr("fill", neg).style("font-size","10px").style("font-weight","700")
      .text(([,e]) => d3.format(".0%")(Math.abs(e.negMin)));

    // Top axis
    svg.append("g").attr("transform",`translate(0,${margin.top})`)
      .call(d3.axisTop(x).ticks(8).tickFormat(d => d3.format("+.0%")(d)))
      .call(g => {
        g.select(".domain").remove();
        g.selectAll("line").style("stroke","#e2e8f0");
        g.selectAll("text").style("fill","#64748b").style("font-size","10px");
      });

    // Y axis
    svg.append("g").attr("transform",`translate(${margin.left},0)`)
      .call(d3.axisLeft(y).tickSize(0).tickPadding(8))
      .call(g => {
        g.select(".domain").remove();
        g.selectAll("text")
          .style("fill","#334155")
          .style("font-size","11px")
          .style("font-weight","700");
      });

    return () => tooltip.remove();
  }, [data, theme]);

  return (
    <div style={{ display:"flex", gap:12, alignItems:"flex-start", width:"100%", border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden" }}>
      <div style={{ flex:1, minWidth:0, overflowY:"auto", maxHeight:560 }}>
        <svg ref={svgRef} style={{ display:"block" }} />
      </div>
      <div style={{ padding:"12px 12px 12px 0" }}>
        <LegendHTML theme={theme} />
      </div>
    </div>
  );
}

// ─── 3D Chart — AxesHelper removed, clean bars ───────────────────────────────
function Chart3D({ data, theme }) {
  const mountRef   = useRef(null);
  const overlayRef = useRef(null);
  const { neg, pos } = THEMES[theme];

  useEffect(() => {
    const el = mountRef.current;
    if (!el || !data.length) return;

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

    // Lights — NO AxesHelper
    scene.add(new THREE.AmbientLight(0xffffff, 0.75));
    const sun = new THREE.DirectionalLight(0xffffff, 1.0);
    sun.position.set(6,14,10); sun.castShadow=true; scene.add(sun);
    const rimL = new THREE.PointLight(new THREE.Color(pos), 0.4, 60);
    rimL.position.set(-10,6,-6); scene.add(rimL);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xe0e7ff, 0.45));

    // Floor + clean grid — no axis lines
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(50, 30),
      new THREE.MeshStandardMaterial({ color:0xf1f5f9, roughness:0.9 })
    );
    floor.rotation.x = -Math.PI/2; floor.receiveShadow=true; scene.add(floor);
    scene.add(new THREE.GridHelper(50, 40, 0xcccccc, 0xe2e8f0));

    const speakers = [...new Set(data.map(d => d.speaker))];
    const maxAbs   = d3.max(data, d => Math.abs(d.value)) || 1;
    const maxH     = 7;
    const groupGap = 2.8;
    const barD     = 0.5;
    const barW     = 0.58;

    const pivot        = new THREE.Group();
    const labelAnchors = [];

    speakers.forEach((speaker, si) => {
      const z       = (si - (speakers.length-1)/2) * groupGap;
      const spkData = data.filter(d => d.speaker === speaker);
      let xOffset   = -(spkData.length * (barW+0.08)) / 2;

      spkData.forEach((d, di) => {
        const bh  = (Math.abs(d.value) / maxAbs) * maxH;
        const hex = d.positive ? pos : neg;
        const col = new THREE.Color(hex);
        const xp  = xOffset + barW/2;

        // Shadow
        const sm = new THREE.Mesh(
          new THREE.BoxGeometry(barW, bh*0.08, barD),
          new THREE.MeshBasicMaterial({ color:0xbbbbbb, transparent:true, opacity:0.08 })
        );
        sm.position.set(xp+0.04, bh*0.04, z+0.04); pivot.add(sm);

        // Main bar
        const geo  = new THREE.BoxGeometry(barW, bh, barD);
        const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
          color:col, roughness:0.22, metalness:0.45,
          emissive:col, emissiveIntensity:0.22,
        }));
        mesh.position.set(xp, bh/2, z);
        mesh.castShadow = true;
        pivot.add(mesh);

        // Edge outline
        const eln = new THREE.LineSegments(
          new THREE.EdgesGeometry(geo),
          new THREE.LineBasicMaterial({ color:0xffffff, transparent:true, opacity:0.45 })
        );
        eln.position.set(xp, bh/2, z); pivot.add(eln);

        // Glow cap
        const capC = col.clone().lerp(new THREE.Color(0xffffff), 0.28);
        const cap  = new THREE.Mesh(
          new THREE.BoxGeometry(barW, 0.07, barD),
          new THREE.MeshStandardMaterial({
            color:capC, emissive:capC,
            emissiveIntensity:1.3, roughness:0.04, metalness:1,
          })
        );
        cap.position.set(xp, bh+0.035, z); pivot.add(cap);

        labelAnchors.push({ x:xp, y:bh+0.55, z, text:d3.format(".0%")(Math.abs(d.value)), col:`#${col.getHexString()}`, type:"value"    });
        labelAnchors.push({ x:xp, y:bh+1.25, z, text:d.category,                           col:`#${col.getHexString()}`, type:"category" });

        xOffset += barW+0.08;
      });

      labelAnchors.push({ x:0, y:-0.65, z, text:speaker, col:"#334155", type:"region" });
    });

    scene.add(pivot);

    if (overlayRef.current) {
      const divs = overlayRef.current.querySelectorAll(".shlbl");
      labelAnchors.forEach((a, i) => { if (divs[i]) divs[i].textContent = a.text; });
    }

    const toScreen = (x3,y3,z3) => {
      const v = new THREE.Vector3(x3,y3,z3).project(camera);
      return { sx:(v.x*0.5+0.5)*W, sy:(-v.y*0.5+0.5)*H, behind:v.z>1 };
    };

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
    renderer.domElement.style.cursor = "grab";

    let animId;
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

    return () => {
      cancelAnimationFrame(animId);
      renderer.domElement.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup",   onUp);
      window.removeEventListener("mousemove", onMove);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [data, theme]);

  const jsxLabels = Array.from({ length: 200 }, (_, i) => {
    const type = ["value","category","region"][i % 3];
    return { col: type==="region" ? "#334155" : (i%2===0 ? pos : neg), type };
  });

  return (
    <div style={{ display:"flex", gap:12, alignItems:"flex-start", width:"100%", border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden" }}>
      <div style={{ position:"relative", flex:1, minWidth:0, userSelect:"none" }}>
        <div ref={mountRef} style={{ width:"100%", height:480, cursor:"grab", overflow:"hidden" }} />

        <div ref={overlayRef} style={{ position:"absolute", inset:0, pointerEvents:"none", overflow:"hidden" }}>
          {jsxLabels.map((a, i) => (
            <div key={i} className="shlbl" style={{
              position:      "absolute",
              transform:     a.type==="region" ? "translate(-50%,0%)" : "translate(-50%,-100%)",
              background:    a.type==="region" ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.93)",
              color:         a.col,
              fontSize:      a.type==="category" ? 8 : a.type==="value" ? 9 : 10,
              fontWeight:    "bold",
              padding:       "2px 5px",
              borderRadius:  3,
              border:        a.type==="region" ? "1px solid #e2e8f0" : `1px solid ${a.col}55`,
              whiteSpace:    "nowrap",
              pointerEvents: "none",
              boxShadow:     "0 1px 3px rgba(0,0,0,0.08)",
              opacity:       0,
            }} />
          ))}
        </div>

        <div style={{ padding:"7px 14px", background:"#f8fafc", borderTop:"1px solid #e2e8f0", fontSize:11, color:"#94a3b8" }}>
          💡 Drag to rotate · auto-spins ·
          <span style={{ color:pos, fontWeight:700, marginLeft:6 }}>■ Truthful</span>
          <span style={{ color:neg, fontWeight:700, marginLeft:8 }}>■ Misleading</span>
        </div>
      </div>

      <div style={{ padding:"12px 12px 12px 0" }}>
        <LegendHTML theme={theme} />
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const DivergingStackedBarChart = ({ csvPath = "/politifact.csv" }) => {
  const [data,     setData]     = useState([]);
  const [theme,    setTheme]    = useState("Modern");
  const [viewMode, setViewMode] = useState("2d");
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    d3.csv(csvPath, ({ speaker, ruling, count }) => {
      const info = CATEGORY_MAP[ruling];
      if (!info) return null;
      return { speaker, category: info.label, positive: info.positive, value: +count };
    }).then(raw => {
      // Normalize per speaker
      d3.rollup(
        raw,
        g => {
          const sum = d3.sum(g, d => d.value);
          g.forEach(d => (d.value = d.value / sum));
        },
        d => d.speaker
      );
      setData(raw);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [csvPath]);

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
          Diverging Stacked Chart
        </div>
        <div style={{ fontSize:12, color:"#94a3b8", marginTop:2 }}>
          PolitiFact truth ratings by speaker · Normalized per speaker
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

      <div style={{ minHeight:480 }}>
        {loading ? (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:480, color:"#94a3b8", fontSize:15 }}>
            Loading data…
          </div>
        ) : viewMode === "2d" ? (
          <Chart2D key={`2d-${theme}`} data={data} theme={theme} />
        ) : (
          <Chart3D key={`3d-${theme}`} data={data} theme={theme} />
        )}
      </div>
    </div>
  );
};

export default DivergingStackedBarChart;