import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import * as THREE from "three";

const DATA = [
  { year:1790,"New York":340,Pennsylvania:434,Virginia:748,"North Carolina":394,Massachusetts:379},
  { year:1800,"New York":589,Pennsylvania:602,Virginia:886,"North Carolina":478,Massachusetts:423},
  { year:1810,"New York":959,Pennsylvania:810,Virginia:983,"North Carolina":556,Massachusetts:472},
  { year:1820,"New York":1373,Pennsylvania:1053,Virginia:1061,"North Carolina":639,Massachusetts:523},
  { year:1830,"New York":1919,Pennsylvania:1348,Virginia:1212,"North Carolina":738,Massachusetts:610},
  { year:1840,"New York":2429,Pennsylvania:1724,Virginia:1231,"North Carolina":753,Massachusetts:738},
  { year:1850,"New York":3096,Pennsylvania:2312,Virginia:1420,"North Carolina":869,Massachusetts:995},
  { year:1860,"New York":3881,Pennsylvania:2906,Virginia:1602,"North Carolina":993,Massachusetts:1231},
  { year:1870,"New York":4383,Pennsylvania:3523,Virginia:1226,"North Carolina":1071,Massachusetts:1457},
  { year:1880,"New York":5083,Pennsylvania:4283,Virginia:1513,"North Carolina":1399,Massachusetts:1783},
  { year:1890,"New York":6003,Pennsylvania:5260,Virginia:1656,"North Carolina":1663,Massachusetts:2239},
  { year:1900,"New York":7269,Pennsylvania:6302,Virginia:1854,"North Carolina":1894,Massachusetts:2805},
  { year:1910,"New York":9114,Pennsylvania:7669,Virginia:2062,"North Carolina":2207,Massachusetts:3366},
  { year:1920,"New York":10385,Pennsylvania:8720,Virginia:2310,"North Carolina":2559,Massachusetts:3849},
  { year:1930,"New York":12588,Pennsylvania:9631,Virginia:2425,"North Carolina":3170,Massachusetts:4249},
  { year:1940,"New York":13480,Pennsylvania:9900,Virginia:2678,"North Carolina":3572,Massachusetts:4317},
  { year:1950,"New York":14830,Pennsylvania:10498,Virginia:3317,"North Carolina":4062,Massachusetts:4691},
  { year:1960,"New York":16782,Pennsylvania:11319,Virginia:3967,"North Carolina":4556,Massachusetts:5149},
  { year:1970,"New York":18241,Pennsylvania:11800,Virginia:4645,"North Carolina":5082,Massachusetts:5689},
  { year:1980,"New York":17558,Pennsylvania:11864,Virginia:5347,"North Carolina":5882,Massachusetts:5737},
  { year:1990,"New York":17990,Pennsylvania:11888,Virginia:6187,"North Carolina":6629,Massachusetts:6016},
];

const STATES = ["New York","Pennsylvania","Virginia","North Carolina","Massachusetts"];

const THEMES = {
  Modern:  ["#6366f1","#06b6d4","#10b981","#f59e0b","#ef4444"],
  Neon:    ["#ff0080","#00f5ff","#39ff14","#ffae00","#ff3131"],
  Pastel:  ["#a5b4fc","#67e8f9","#6ee7b7","#fde68a","#fca5a5"],
  Sunset:  ["#ff6b6b","#feca57","#ff9ff3","#48dbfb","#1dd1a1"],
  Ocean:   ["#03045e","#0077b6","#00b4d8","#90e0ef","#caf0f8"],
  Galaxy:  ["#4a306d","#7b2cbf","#9d4edd","#c77dff","#e0aaff"],
  Forest:  ["#1b4332","#40916c","#52b788","#74c69d","#95d5b2"],
  Autumn:  ["#7f4f24","#936639","#e63946","#c1121f","#b5838d"],
  Candy:   ["#ff006e","#fb5607","#ffbe0b","#8338ec","#3a86ff"],
  Earth:   ["#6b4f3c","#8b6914","#a07850","#3a7d44","#52796f"],
};

// ─── Shared Legend ────────────────────────────────────────────────────────────
function LegendHTML({ palette, disp }) {
  return (
    <div style={{
      background:"#fff", border:"1px solid #e2e8f0", borderRadius:8,
      padding:"12px 14px", width:155, flexShrink:0,
      boxShadow:"0 1px 4px rgba(0,0,0,0.07)", alignSelf:"flex-start",
    }}>
      <div style={{ fontSize:10, fontWeight:"bold", color:"#94a3b8", letterSpacing:"0.08em", marginBottom:8 }}>
        STATES
      </div>
      {disp.map((state, i) => (
        <div key={state} style={{ display:"flex", alignItems:"center", gap:7, marginBottom:6 }}>
          <div style={{ width:10, height:10, borderRadius:2, flexShrink:0, background:palette[i%palette.length] }} />
          <span style={{ color:"#334155", fontSize:11, fontWeight:"600" }}>{state}</span>
        </div>
      ))}
      <div style={{ borderTop:"1px solid #e2e8f0", marginTop:8, paddingTop:8 }}>
        <div style={{ fontSize:9, color:"#94a3b8" }}>
          Population in thousands<br/>U.S. Census 1790–1990
        </div>
      </div>
    </div>
  );
}

// ─── 2D Chart ─────────────────────────────────────────────────────────────────
function Chart2D({ selectedState, theme }) {
  const svgRef = useRef(null);
  const palette = THEMES[theme];
  const disp    = selectedState === "All" ? STATES : [selectedState];

  useEffect(() => {
    if (!svgRef.current) return;
    const W = 620, H = 400;
    const margin = { top:20, right:20, bottom:48, left:62 };
    const cW = W - margin.left - margin.right;
    const cH = H - margin.top  - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox",`0 0 ${W} ${H}`).attr("preserveAspectRatio","xMidYMid meet");
    svg.append("rect").attr("width",W).attr("height",H).attr("fill","#f8fafc").attr("rx",8);

    const defs = svg.append("defs");
    disp.forEach((_, i) => {
      const gr = defs.append("linearGradient").attr("id",`pg${i}-${theme}`)
        .attr("x1","0%").attr("x2","0%").attr("y1","0%").attr("y2","100%");
      gr.append("stop").attr("offset","0%").attr("stop-color",palette[i%palette.length]).attr("stop-opacity",0.85);
      gr.append("stop").attr("offset","100%").attr("stop-color",palette[i%palette.length]).attr("stop-opacity",0.15);
    });

    let stacked;
    if (selectedState !== "All") {
      const sd = DATA.map(d => ({ year:d.year, [selectedState]:d[selectedState]||0 }));
      stacked = d3.stack().keys([selectedState])(sd);
    } else {
      stacked = d3.stack().keys(STATES)(DATA);
    }
    const maxPop = d3.max(stacked[stacked.length-1], d => d[1]);

    const x  = d3.scaleLinear().domain([1790,1990]).range([0,cW]);
    const y  = d3.scaleLinear().domain([0, maxPop]).range([cH,0]).nice();
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

    // Areas
    const areaGen = d3.area()
      .x(d => x(d.data.year)).y0(d => y(d[0])).y1(d => y(d[1]))
      .curve(d3.curveMonotoneX);

    stacked.forEach((layer, i) => {
      const col = palette[i%palette.length];
      chart.append("path").datum(layer)
        .attr("fill",`url(#pg${i}-${theme})`)
        .attr("stroke",col).attr("stroke-width",1.8).attr("opacity",0.88)
        .attr("d",areaGen);
    });

    // Hover overlay per year
    const bisect = d3.bisector(d => d.year).left;
    const overlay = chart.append("rect")
      .attr("width",cW).attr("height",cH).attr("fill","transparent")
      .style("cursor","crosshair");

    overlay.on("mousemove", function(event) {
      const [mx] = d3.pointer(event);
      const yr   = Math.round(x.invert(mx));
      const snapped = DATA.reduce((prev,curr) => Math.abs(curr.year-yr)<Math.abs(prev.year-yr)?curr:prev);
      const rows = disp.map((s,i) => `<span style="color:${palette[i%palette.length]}">${s}: ${snapped[s]?.toLocaleString()}k</span>`);
      tooltip.style("opacity",1)
        .html(`<b>${snapped.year}</b><br/>${rows.join("<br/>")}`)
        .style("left",(event.pageX+12)+"px").style("top",(event.pageY-10)+"px");
    }).on("mouseout", () => tooltip.style("opacity",0));

    // X axis
    chart.append("g").attr("transform",`translate(0,${cH})`)
      .call(d3.axisBottom(x).tickValues([1790,1820,1850,1880,1910,1940,1970,1990]).tickFormat(d3.format("d")))
      .call(g => { g.select(".domain").style("stroke","#e2e8f0"); g.selectAll("text").style("fill","#64748b").style("font-size","10px"); });

    // Y axis
    chart.append("g")
      .call(d3.axisLeft(y).ticks(5).tickFormat(d => `${d3.format(".1s")(d)}`))
      .call(g => { g.select(".domain").remove(); g.selectAll("line").remove(); g.selectAll("text").style("fill","#94a3b8").style("font-size","10px"); });

    // Axis labels
    svg.append("text").attr("transform",`translate(${margin.left+cW/2},${H-4})`).attr("text-anchor","middle")
      .style("font-size","11px").style("fill","#94a3b8").text("Year");
    svg.append("text").attr("transform","rotate(-90)").attr("x",-(margin.top+cH/2)).attr("y",14)
      .attr("text-anchor","middle").style("font-size","11px").style("fill","#94a3b8").text("Population (thousands)");

    return () => tooltip.remove();
  }, [selectedState, theme]);

  return (
    <div style={{ display:"flex", gap:12, alignItems:"flex-start", width:"100%", border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden" }}>
      <svg ref={svgRef} style={{ display:"block", flex:1, minWidth:0, height:400 }} />
      <div style={{ padding:"12px 12px 12px 0" }}>
        <LegendHTML palette={THEMES[theme]} disp={disp} />
      </div>
    </div>
  );
}

// ─── 3D Chart ─────────────────────────────────────────────────────────────────
function Chart3D({ selectedState, theme }) {
  const mountRef   = useRef(null);
  const overlayRef = useRef(null);
  const palette    = THEMES[theme];
  const disp       = selectedState === "All" ? STATES : [selectedState];

  useEffect(() => {
    if (!mountRef.current) return;
    const el  = mountRef.current;
    const W   = el.offsetWidth || 620, H = 400;

    const scene  = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);

    const camera = new THREE.PerspectiveCamera(38, W/H, 0.1, 400);
    camera.position.set(0, 22, 40);
    camera.lookAt(0, 3, 0);

    const renderer = new THREE.WebGLRenderer({ antialias:true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    renderer.shadowMap.enabled = true;
    el.appendChild(renderer.domElement);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const sun = new THREE.DirectionalLight(0xffffff, 1.0);
    sun.position.set(20,35,25); sun.castShadow=true; scene.add(sun);
    const rimL = new THREE.PointLight(new THREE.Color(palette[0]),0.45,80);
    rimL.position.set(-15,8,-10); scene.add(rimL);
    scene.add(new THREE.HemisphereLight(0xffffff,0xe0e7ff,0.4));

    // Floor
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(80,60),
      new THREE.MeshStandardMaterial({ color:0xf1f5f9, roughness:0.9 })
    );
    floor.rotation.x=-Math.PI/2; floor.receiveShadow=true; scene.add(floor);
    scene.add(new THREE.GridHelper(80,40,0xcccccc,0xe2e8f0));

    const nY    = DATA.length;
    const nS    = disp.length;
    const spanX = 50;
    const spanZ = nS > 1 ? (nS-1)*3.0 : 0;
    const barW  = (spanX/nY)*0.58;
    const barD  = 1.8;
    const stepZ = nS > 1 ? spanZ/(nS-1) : 0;

    const maxPop = d3.max(DATA, row =>
      selectedState === "All"
        ? d3.max(STATES, st => row[st]||0)
        : (row[selectedState]||0)
    );
    const maxH   = 16;
    const pivot  = new THREE.Group();
    const labelAnchors = [];

    DATA.forEach((row, yi) => {
      const xPos = -spanX/2 + (yi/(nY-1))*spanX;
      disp.forEach((state, si) => {
        const pop  = row[state]||0;
        const bh   = Math.max((pop/maxPop)*maxH, 0.06);
        const zPos = -spanZ/2 + si*stepZ;
        const col  = new THREE.Color(palette[si%palette.length]);

        const geo  = new THREE.BoxGeometry(barW, bh, barD);
        const mat  = new THREE.MeshStandardMaterial({
          color:col, roughness:0.25, metalness:0.45,
          emissive:col, emissiveIntensity:0.1,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(xPos, bh/2, zPos);
        mesh.castShadow=true; pivot.add(mesh);

        // Edges
        const eg  = new THREE.EdgesGeometry(geo);
        const el2 = new THREE.LineSegments(eg, new THREE.LineBasicMaterial({ color:0xffffff }));
        el2.position.set(xPos, bh/2, zPos); pivot.add(el2);

        // Glow cap
        const capC = col.clone().lerp(new THREE.Color(0xffffff),0.25);
        const cap  = new THREE.Mesh(
          new THREE.BoxGeometry(barW,0.07,barD),
          new THREE.MeshStandardMaterial({ color:capC, emissive:capC, emissiveIntensity:1.2, roughness:0.04, metalness:1 })
        );
        cap.position.set(xPos, bh+0.035, zPos); pivot.add(cap);
      });
    });

    // Year label anchors (every 4th year)
    DATA.forEach((row, yi) => {
      if (yi%4===0 || yi===DATA.length-1) {
        const xPos = -spanX/2 + (yi/(nY-1))*spanX;
        labelAnchors.push({ x:xPos, y:-0.7, z:spanZ/2+1.5, text:String(row.year), isYear:true });
      }
    });

    // State label anchors
    disp.forEach((state, si) => {
      const zPos = -spanZ/2 + si*stepZ;
      labelAnchors.push({ x:spanX/2+1.5, y:1, z:zPos, text:state.split(" ")[0], col:palette[si%palette.length], isYear:false });
    });

    scene.add(pivot);

    const toScreen = (x3,y3,z3) => {
      const v = new THREE.Vector3(x3,y3,z3).project(camera);
      return { sx:(v.x*0.5+0.5)*W, sy:(-v.y*0.5+0.5)*H, behind:v.z>1 };
    };

    let isDragging=false, prevX=0, prevY=0, rotX=0.28, rotY=0.4, autoSpin=false;
    const onDown = e => { isDragging=true; prevX=e.clientX; prevY=e.clientY; renderer.domElement.style.cursor="grabbing"; };
    const onUp   = () => { isDragging=false; renderer.domElement.style.cursor="grab"; };
    const onMove = e => {
      if (!isDragging) return;
      rotY += (e.clientX-prevX)*0.007;
      rotX  = Math.max(-0.65,Math.min(0.85,rotX+(e.clientY-prevY)*0.004));
      prevX=e.clientX; prevY=e.clientY;
    };
    renderer.domElement.addEventListener("mousedown",onDown);
    window.addEventListener("mouseup",onUp);
    window.addEventListener("mousemove",onMove);
    renderer.domElement.style.cursor="grab";

    let animId;
    const animate = () => {
      animId=requestAnimationFrame(animate);
      pivot.rotation.y=rotY; pivot.rotation.x=rotX;
      camera.updateMatrixWorld();

      if (overlayRef.current) {
        overlayRef.current.querySelectorAll(".uslbl").forEach((div,i) => {
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
  }, [selectedState, theme]);

  return (
    <div style={{ display:"flex", gap:12, alignItems:"flex-start", width:"100%", border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden" }}>
      <div style={{ position:"relative", flex:1, minWidth:0 }}>
        <div ref={mountRef} style={{ width:"100%", height:400, cursor:"grab" }} />

        <div ref={overlayRef} style={{ position:"absolute", inset:0, pointerEvents:"none" }}>
          {/* Year labels */}
          {DATA.filter((_,yi)=>yi%4===0||yi===DATA.length-1).map((row,i) => (
            <div key={`yr${i}`} className="uslbl" style={{
              position:"absolute", transform:"translate(-50%,0%)",
              background:"rgba(255,255,255,0.88)", color:"#64748b",
              fontSize:8, fontWeight:"600",
              padding:"1px 4px", borderRadius:2, border:"1px solid #e2e8f0",
              whiteSpace:"nowrap", transition:"opacity 0.1s", pointerEvents:"none",
            }}>
              {row.year}
            </div>
          ))}
          {/* State labels */}
          {disp.map((state, si) => (
            <div key={`st${si}`} className="uslbl" style={{
              position:"absolute", transform:"translate(-50%,-50%)",
              background:THEMES[theme][si%5],
              color:"#fff",
              fontSize:9, fontWeight:"bold",
              padding:"2px 6px", borderRadius:3,
              whiteSpace:"nowrap", transition:"opacity 0.1s", pointerEvents:"none",
              boxShadow:"0 1px 3px rgba(0,0,0,0.15)",
            }}>
              {state.split(" ")[0]}
            </div>
          ))}
        </div>

        <div style={{ padding:"7px 14px", background:"#f8fafc", borderTop:"1px solid #e2e8f0", fontSize:11, color:"#94a3b8" }}>
          💡 Drag to rotate · X-axis = Year (1790→1990) · Z-axis = State
        </div>
      </div>

      <div style={{ padding:"12px 12px 12px 0" }}>
        <LegendHTML palette={THEMES[theme]} disp={disp} />
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function USPopulationChart() {
  const [viewMode,       setViewMode]       = useState("2d");
  const [theme,          setTheme]          = useState("Modern");
  const [selectedState,  setSelectedState]  = useState("All");

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
        <div style={{ fontSize:16, fontWeight:"bold", color:"#1e293b" }}>U.S. Population by State</div>
        <div style={{ fontSize:12, color:"#94a3b8", marginTop:2 }}>
          1790–1990 · U.S. Census Data · Population in thousands
        </div>
      </div>

      {/* Dropdowns */}
      <div style={{ display:"flex", gap:10, alignItems:"flex-end", marginTop:12, marginBottom:20, flexWrap:"wrap" }}>
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
        <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
          <label style={{ fontSize:11, color:"#94a3b8", fontWeight:"600" }}>State Filter</label>
          <select value={selectedState} onChange={e => setSelectedState(e.target.value)} style={ddStyle}>
            <option value="All">All States</option>
            {STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Chart */}
      {viewMode === "2d"
        ? <Chart2D key={`2d-${theme}-${selectedState}`} selectedState={selectedState} theme={theme} />
        : <Chart3D key={`3d-${theme}-${selectedState}`} selectedState={selectedState} theme={theme} />
      }
    </div>
  );
}