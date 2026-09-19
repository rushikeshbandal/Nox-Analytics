import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import * as THREE from "three";

const D3_COLORS = {
  RedBlue:        d3.schemeRdBu[3],
  PurpleGreen:    d3.schemePRGn[3],
  BrownBlueGreen: d3.schemeBrBG[3],
};

const COLORS_3D = {
  RedBlue:        { neg:"#ef4444", pos:"#3b82f6" },
  PurpleGreen:    { neg:"#8b5cf6", pos:"#10b981" },
  BrownBlueGreen: { neg:"#92400e", pos:"#0d9488" },
};

const buildData = (raw, metric) =>
  [...raw]
    .map(d => ({
      State: d.State,
      value: metric === "absolute"
        ? d[2019] - d[2010]
        : (d[2019] - d[2010]) / d[2010],
    }))
    .sort((a, b) => a.value - b.value);

// ─── Legend ───────────────────────────────────────────────────────────────────
function LegendHTML({ scheme }) {
  const { neg, pos } = COLORS_3D[scheme];
  return (
    <div style={{
      background:"#fff", border:"1px solid #e2e8f0", borderRadius:8,
      padding:"12px 14px", width:150, flexShrink:0,
      boxShadow:"0 1px 4px rgba(0,0,0,0.07)", alignSelf:"flex-start",
    }}>
      <div style={{ fontSize:10, fontWeight:"bold", color:"#94a3b8", letterSpacing:"0.08em", marginBottom:10 }}>
        POPULATION CHANGE
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
        <div style={{ width:12, height:12, borderRadius:2, background:pos }} />
        <span style={{ color:"#334155", fontSize:11 }}>Growth (+)</span>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <div style={{ width:12, height:12, borderRadius:2, background:neg }} />
        <span style={{ color:"#334155", fontSize:11 }}>Decline (−)</span>
      </div>
      <div style={{ borderTop:"1px solid #e2e8f0", margin:"12px 0 8px" }} />
      <div style={{ fontSize:10, fontWeight:"bold", color:"#94a3b8", letterSpacing:"0.08em", marginBottom:8 }}>
        PERIOD
      </div>
      <div style={{ fontSize:11, color:"#334155" }}>2010 → 2019</div>
    </div>
  );
}

// ─── 2D Chart ─────────────────────────────────────────────────────────────────
function Chart2D({ metric, scheme }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const colors = D3_COLORS[scheme];

    d3.tsv("/state-population-2010-2019.tsv", d3.autoType).then(raw => {
      const data   = buildData(raw, metric);
      const W      = 720;
      const barH   = 22;
      const margin = { top:44, right:90, bottom:16, left:160 };
      const H      = data.length * barH + margin.top + margin.bottom;

      const format  = d3.format(metric === "absolute" ? "+,d"  : "+.1%");
      const tickFmt = metric === "absolute"
        ? d3.formatPrefix("+.1", 1e6)
        : d3.format("+.0%");

      const x = d3.scaleLinear()
        .domain(d3.extent(data, d => d.value)).nice()
        .range([margin.left, W - margin.right]);

      const y = d3.scaleBand()
        .domain(data.map(d => d.State))
        .range([margin.top, H - margin.bottom])
        .padding(0.18);

      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();
      svg.attr("width", W).attr("height", H);
      svg.append("rect").attr("width",W).attr("height",H).attr("fill","#f8fafc").attr("rx",8);

      // Zero line
      svg.append("line")
        .attr("x1",x(0)).attr("x2",x(0))
        .attr("y1",margin.top-8).attr("y2",H-margin.bottom+8)
        .attr("stroke","#94a3b8").attr("stroke-width",1.2)
        .attr("stroke-dasharray","4,3");

      // Tooltip
      const tooltip = d3.select("body").append("div")
        .style("position","absolute").style("background","rgba(15,23,42,0.92)")
        .style("color","#fff").style("padding","8px 12px").style("border-radius","6px")
        .style("font-size","12px").style("pointer-events","none").style("opacity",0)
        .style("border","1px solid #334155").style("z-index","9999");

      // Bars
      svg.append("g").selectAll("rect").data(data).enter().append("rect")
        .attr("fill",   d => colors[d.value > 0 ? 2 : 0])
        .attr("x",      d => x(Math.min(d.value, 0)))
        .attr("y",      d => y(d.State))
        .attr("width",  d => Math.abs(x(d.value) - x(0)))
        .attr("height", y.bandwidth())
        .attr("rx", 3).attr("opacity", 0.88)
        .style("cursor","pointer")
        .on("mouseover", function(event, d) {
          d3.select(this).attr("opacity",1);
          tooltip.style("opacity",1)
            .html(`<b>${d.State}</b><br/>Change: <b>${format(d.value)}</b>`)
            .style("left",(event.pageX+12)+"px").style("top",(event.pageY-10)+"px");
        })
        .on("mouseout", function() {
          d3.select(this).attr("opacity",0.88);
          tooltip.style("opacity",0);
        });

      // Value labels
      svg.append("g").selectAll("text").data(data).enter().append("text")
        .attr("x",  d => d.value < 0 ? x(d.value)-6 : x(d.value)+6)
        .attr("y",  d => y(d.State)+y.bandwidth()/2)
        .attr("dy","0.35em")
        .attr("text-anchor", d => d.value < 0 ? "end" : "start")
        .attr("fill","#334155").style("font-size","10px").style("font-weight","600")
        .text(d => format(d.value));

      // Top axis
      svg.append("g")
        .attr("transform",`translate(0,${margin.top})`)
        .call(d3.axisTop(x).ticks(8).tickFormat(tickFmt))
        .call(g => {
          g.select(".domain").remove();
          g.selectAll("line").style("stroke","#e2e8f0");
          g.selectAll("text").style("fill","#64748b").style("font-size","10px");
        });

      // Y axis
      svg.append("g")
        .attr("transform",`translate(${margin.left},0)`)
        .call(d3.axisLeft(y).tickSize(0).tickPadding(8))
        .call(g => {
          g.select(".domain").remove();
          g.selectAll("text")
            .style("fill","#334155")
            .style("font-size","10px")
            .style("font-weight","600");
        });

      // cleanup
      return () => tooltip.remove();
    });
  }, [metric, scheme]);

  return (
    <div style={{ display:"flex", gap:12, alignItems:"flex-start", width:"100%", border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden" }}>
      <div style={{ flex:1, minWidth:0, overflowY:"auto", maxHeight:580 }}>
        <svg ref={svgRef} style={{ display:"block" }} />
      </div>
      <div style={{ padding:"12px 12px 12px 0" }}>
        <LegendHTML scheme={scheme} />
      </div>
    </div>
  );
}

// ─── 3D Chart ─────────────────────────────────────────────────────────────────
function Chart3D({ metric, scheme }) {
  const mountRef   = useRef(null);
  const overlayRef = useRef(null);
  const { neg: negHex, pos: posHex } = COLORS_3D[scheme];

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    while (el.firstChild) el.removeChild(el.firstChild);

    const W = el.clientWidth || 680;
    const H = 480;

    const scene  = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);

    const camera = new THREE.PerspectiveCamera(42, W/H, 0.1, 200);
    camera.position.set(0, 10, 22);
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
    const rimL = new THREE.PointLight(new THREE.Color(posHex), 0.4, 60);
    rimL.position.set(-10,6,-6); scene.add(rimL);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xe0e7ff, 0.45));

    // Floor + clean grid
    const floorMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(50, 24),
      new THREE.MeshStandardMaterial({ color:0xf1f5f9, roughness:0.9 })
    );
    floorMesh.rotation.x = -Math.PI/2;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);
    scene.add(new THREE.GridHelper(50, 40, 0xcccccc, 0xe2e8f0));

    const pivot        = new THREE.Group();
    const labelAnchors = [];

    let sceneReady = false;
    let animId;

    d3.tsv("/state-population-2010-2019.tsv", d3.autoType).then(raw => {
      const allData = buildData(raw, metric);
      const negData = allData.filter(d => d.value < 0).slice(0, 9);
      const posData = [...allData].filter(d => d.value > 0).reverse().slice(0, 9);
      const top18   = [...negData, ...posData];

      const maxAbs   = d3.max(top18, d => Math.abs(d.value));
      const maxH     = 8;
      const groupGap = 2.8;
      const barD     = 0.5;
      const barW     = 0.7;

      top18.forEach((d, i) => {
        const z   = (i - (top18.length-1)/2) * groupGap;
        const bh  = (Math.abs(d.value) / maxAbs) * maxH;
        const hex = d.value < 0 ? negHex : posHex;
        const col = new THREE.Color(hex);
        const xp  = 0;

        // Shadow
        const shadowMesh = new THREE.Mesh(
          new THREE.BoxGeometry(barW, bh*0.08, barD),
          new THREE.MeshBasicMaterial({ color:0xbbbbbb, transparent:true, opacity:0.08 })
        );
        shadowMesh.position.set(xp+0.05, bh*0.04, z+0.05);
        pivot.add(shadowMesh);

        // Main bar
        const geo  = new THREE.BoxGeometry(barW, bh, barD);
        const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
          color:col, roughness:0.22, metalness:0.40,
          emissive:col, emissiveIntensity:0.20,
        }));
        mesh.position.set(xp, bh/2, z);
        mesh.castShadow = true;
        pivot.add(mesh);

        // Edge outline
        const eln = new THREE.LineSegments(
          new THREE.EdgesGeometry(geo),
          new THREE.LineBasicMaterial({ color:0xffffff, transparent:true, opacity:0.45 })
        );
        eln.position.set(xp, bh/2, z);
        pivot.add(eln);

        // Glow cap
        const capC = col.clone().lerp(new THREE.Color(0xffffff), 0.30);
        const cap  = new THREE.Mesh(
          new THREE.BoxGeometry(barW, 0.07, barD),
          new THREE.MeshStandardMaterial({
            color:capC, emissive:capC,
            emissiveIntensity:1.3, roughness:0.04, metalness:1,
          })
        );
        cap.position.set(xp, bh+0.035, z);
        pivot.add(cap);

        const fmt = metric === "absolute"
          ? d3.format("+,.0f")(d.value)
          : d3.format("+.1%")(d.value);

        labelAnchors.push({ x:xp, y:bh+0.60, z, text:fmt,     col:`#${col.getHexString()}`, type:"value"  });
        labelAnchors.push({ x:xp, y:bh+1.30, z, text:d.State, col:"#334155",                type:"region" });
      });

      scene.add(pivot);
      sceneReady = true;

      // Update overlay divs with text
      if (overlayRef.current) {
        const divs = overlayRef.current.querySelectorAll(".shlbl");
        labelAnchors.forEach((a, i) => {
          if (divs[i]) divs[i].textContent = a.text;
        });
      }
    });

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

    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (autoSpin) rotY += 0.004;
      pivot.rotation.y = rotY;
      pivot.rotation.x = rotX;
      camera.updateMatrixWorld();

      if (sceneReady && overlayRef.current) {
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
  }, [metric, scheme]);

  // 18 labels (9 neg + 9 pos) × 2 (value + state)
  const jsxLabels = Array.from({ length: 36 }, (_, i) => {
    const isValue  = i % 2 === 0;
    const groupIdx = Math.floor(i / 2);
    const isNeg    = groupIdx < 9;
    return {
      col:  isNeg ? negHex : posHex,
      type: isValue ? "value" : "region",
    };
  });

  return (
    <div style={{ display:"flex", gap:12, alignItems:"flex-start", width:"100%", border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden" }}>
      <div style={{ position:"relative", flex:1, minWidth:0, userSelect:"none" }}>
        <div ref={mountRef} style={{ width:"100%", height:480, cursor:"grab", overflow:"hidden" }} />

        <div ref={overlayRef} style={{ position:"absolute", inset:0, pointerEvents:"none", overflow:"hidden" }}>
          {jsxLabels.map((a, i) => (
            <div key={i} className="shlbl" style={{
              position:      "absolute",
              transform:     "translate(-50%,-100%)",
              background:    "rgba(255,255,255,0.93)",
              color:         a.col,
              fontSize:      a.type==="value" ? 9 : 8,
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
          💡 Drag to rotate · auto-spins &nbsp;
          <span style={{color:posHex,fontWeight:700}}>■ Growth</span> &nbsp;
          <span style={{color:negHex,fontWeight:700}}>■ Decline</span> · Top 9 each shown
        </div>
      </div>

      <div style={{ padding:"12px 12px 12px 0" }}>
        <LegendHTML scheme={scheme} />
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const DivergingBarChart = () => {
  const [metric,   setMetric]   = useState("relative");
  const [scheme,   setScheme]   = useState("RedBlue");
  const [viewMode, setViewMode] = useState("2d");

  const ddStyle = {
    padding:"5px 10px", borderRadius:6, border:"1px solid #e2e8f0",
    background:"#fff", color:"#334155", fontWeight:"500",
    cursor:"pointer", fontSize:12, outline:"none",
  };
  const btnBase     = { padding:"5px 12px", borderRadius:6, border:"1px solid #e2e8f0", fontWeight:"600", cursor:"pointer", fontSize:12 };
  const btnActive   = { ...btnBase, background:"#1e293b", color:"#fff", border:"1px solid #1e293b" };
  const btnInactive = { ...btnBase, background:"#fff",    color:"#64748b" };

  return (
    <div style={{
      background:"#ffffff", borderRadius:12, padding:"20px 24px 32px 24px",
      width:"100%", boxShadow:"0 1px 3px rgba(0,0,0,0.08)", boxSizing:"border-box",
    }}>
      <div style={{ marginBottom:4 }}>
        <div style={{ fontSize:16, fontWeight:"bold", color:"#1e293b" }}>
          Diverging Bar Chart – Population Change
        </div>
        <div style={{ fontSize:12, color:"#94a3b8", marginTop:2 }}>
          US State Population Change · 2010 → 2019
        </div>
      </div>

      <div style={{ display:"flex", gap:16, alignItems:"flex-end", marginTop:12, marginBottom:20, flexWrap:"wrap" }}>
        <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
          <label style={{ fontSize:11, color:"#94a3b8", fontWeight:"600" }}>Metric</label>
          <div style={{ display:"flex", gap:4 }}>
            <button style={metric==="relative" ? btnActive : btnInactive} onClick={() => setMetric("relative")}>Relative</button>
            <button style={metric==="absolute" ? btnActive : btnInactive} onClick={() => setMetric("absolute")}>Absolute</button>
          </div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
          <label style={{ fontSize:11, color:"#94a3b8", fontWeight:"600" }}>Color</label>
          <select value={scheme} onChange={e => setScheme(e.target.value)} style={ddStyle}>
            <option value="RedBlue">Red / Blue</option>
            <option value="PurpleGreen">Purple / Green</option>
            <option value="BrownBlueGreen">Brown / Teal</option>
          </select>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
          <label style={{ fontSize:11, color:"#94a3b8", fontWeight:"600" }}>View</label>
          <select value={viewMode} onChange={e => setViewMode(e.target.value)} style={ddStyle}>
            <option value="2d">2D</option>
            <option value="3d">3D</option>
          </select>
        </div>
      </div>

      <div style={{ minHeight:480 }}>
        {viewMode === "2d"
          ? <Chart2D key={`2d-${metric}-${scheme}`} metric={metric} scheme={scheme} />
          : <Chart3D key={`3d-${metric}-${scheme}`} metric={metric} scheme={scheme} />
        }
      </div>
    </div>
  );
};

export default DivergingBarChart;