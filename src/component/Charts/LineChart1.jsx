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

const FALLBACK = [
  { label:"2008", value:1.421 },
  { label:"2009", value:1.389 },
  { label:"2010", value:1.359 },
  { label:"2011", value:1.281 },
  { label:"2012", value:1.247 },
  { label:"2013", value:1.215 },
  { label:"2014", value:1.184 },
  { label:"2015", value:1.154 },
  { label:"2016", value:1.094 },
  { label:"2017", value:1.064 },
  { label:"2018", value:1.034 },
  { label:"2019", value:1.005 },
  { label:"2020", value:0.976 },
  { label:"2021", value:0.950 },
  { label:"2022", value:0.924 },
];

// ─── Shared Legend ────────────────────────────────────────────────────────────
function LegendHTML({ data, palette }) {
  if (!data.length) return null;
  const min  = d3.min(data, d=>d.value);
  const max  = d3.max(data, d=>d.value);
  const last = data[data.length-1];
  const first= data[0];
  const trend = last.value < first.value ? "↓ Declining" : "↑ Rising";
  const trendCol = last.value < first.value ? "#ef4444" : "#10b981";

  return (
    <div style={{
      background:"#fff", border:"1px solid #e2e8f0", borderRadius:8,
      padding:"12px 14px", width:150, flexShrink:0,
      boxShadow:"0 1px 4px rgba(0,0,0,0.07)", alignSelf:"flex-start",
    }}>
      <div style={{ fontSize:10, fontWeight:"bold", color:"#94a3b8", letterSpacing:"0.08em", marginBottom:8 }}>
        STATS
      </div>
      {[
        ["Country",  "India"],
        ["Metric",   "Pop. Growth"],
        ["Years",    `${data[0].label}–${last.label}`],
        ["Points",   data.length],
        ["Peak",     `${max.toFixed(2)}%`],
        ["Latest",   `${last.value.toFixed(2)}%`],
      ].map(([k,v]) => (
        <div key={k} style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
          <span style={{ color:"#94a3b8", fontSize:10 }}>{k}</span>
          <span style={{ color:"#334155", fontSize:10, fontWeight:"bold" }}>{v}</span>
        </div>
      ))}
      <div style={{ borderTop:"1px solid #e2e8f0", marginTop:8, paddingTop:8 }}>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <div style={{ width:8, height:8, borderRadius:"50%", background:trendCol }} />
          <span style={{ fontSize:11, fontWeight:"700", color:trendCol }}>{trend}</span>
        </div>
        <div style={{ fontSize:9, color:"#94a3b8", marginTop:4 }}>
          World Bank API<br/>SP.POP.GROW
        </div>
      </div>
    </div>
  );
}

// ─── 2D Chart ─────────────────────────────────────────────────────────────────
function Chart2D({ data, theme }) {
  const svgRef  = useRef(null);
  const palette = THEMES[theme];

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    const W = 620, H = 380;
    const margin = { top:20, right:20, bottom:52, left:56 };
    const cW = W - margin.left - margin.right;
    const cH = H - margin.top  - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox",`0 0 ${W} ${H}`).attr("preserveAspectRatio","xMidYMid meet");
    svg.append("rect").attr("width",W).attr("height",H).attr("fill","#f8fafc").attr("rx",8);

    const x  = d3.scalePoint().domain(data.map(d=>d.label)).range([0,cW]).padding(0.5);
    const y  = d3.scaleLinear().domain([0, d3.max(data,d=>d.value)*1.15]).range([cH,0]).nice();
    const chart = svg.append("g").attr("transform",`translate(${margin.left},${margin.top})`);

    // Grid
    y.ticks(5).forEach(v => {
      chart.append("line").attr("x1",0).attr("x2",cW).attr("y1",y(v)).attr("y2",y(v))
        .attr("stroke","#e2e8f0").attr("stroke-dasharray","4,3").attr("stroke-width",1);
    });

    // Gradient area defs
    const defs = svg.append("defs");
    const gr   = defs.append("linearGradient").attr("id",`lcg-${theme}`)
      .attr("x1","0%").attr("x2","0%").attr("y1","0%").attr("y2","100%");
    gr.append("stop").attr("offset","0%").attr("stop-color",palette[0]).attr("stop-opacity",0.55);
    gr.append("stop").attr("offset","100%").attr("stop-color",palette[0]).attr("stop-opacity",0.05);

    // Area fill
    chart.append("path").datum(data)
      .attr("fill",`url(#lcg-${theme})`)
      .attr("d", d3.area().x(d=>x(d.label)).y0(cH).y1(d=>y(d.value)).curve(d3.curveMonotoneX));

    // Line shadow
    chart.append("path").datum(data)
      .attr("fill","none").attr("stroke","#cbd5e1").attr("stroke-width",4).attr("opacity",0.35)
      .attr("d", d3.line().x(d=>x(d.label)+2).y(d=>y(d.value)+2).curve(d3.curveMonotoneX));

    // Main line
    const path = chart.append("path").datum(data)
      .attr("fill","none").attr("stroke",palette[0]).attr("stroke-width",2.5)
      .attr("stroke-linejoin","round").attr("stroke-linecap","round")
      .attr("d", d3.line().x(d=>x(d.label)).y(d=>y(d.value)).curve(d3.curveMonotoneX));

    // Animate draw
    const node = path.node();
    if (node) {
      const len = node.getTotalLength();
      path.attr("stroke-dasharray",len).attr("stroke-dashoffset",len)
        .transition().duration(1400).ease(d3.easeCubicOut).attr("stroke-dashoffset",0);
    }

    // Tooltip
    const tooltip = d3.select("body").append("div")
      .style("position","absolute").style("background","rgba(15,23,42,0.92)")
      .style("color","#fff").style("padding","8px 12px").style("border-radius","6px")
      .style("font-size","12px").style("pointer-events","none").style("opacity",0)
      .style("border","1px solid #334155").style("z-index","9999");

    // Dots + value labels
    data.forEach(d => {
      chart.append("circle")
        .attr("cx",x(d.label)).attr("cy",y(d.value)).attr("r",4.5)
        .attr("fill",palette[1]||palette[0]).attr("stroke","#fff").attr("stroke-width",1.5)
        .style("cursor","pointer")
        .on("mouseover", function(event) {
          d3.select(this).attr("r",7);
          tooltip.style("opacity",1)
            .html(`<b style="color:${palette[0]}">${d.label}</b><br/>Growth: <b>${d.value.toFixed(3)}%</b>`)
            .style("left",(event.pageX+12)+"px").style("top",(event.pageY-10)+"px");
        })
        .on("mouseout", function() { d3.select(this).attr("r",4.5); tooltip.style("opacity",0); });

      chart.append("text")
        .attr("x",x(d.label)).attr("y",y(d.value)-9)
        .attr("text-anchor","middle").style("font-size","8px").style("font-weight","700")
        .style("fill",palette[0]).style("pointer-events","none")
        .text(`${d.value.toFixed(2)}%`);
    });

    // X axis
    chart.append("g").attr("transform",`translate(0,${cH})`)
      .call(d3.axisBottom(x).tickSize(0))
      .call(g => {
        g.select(".domain").style("stroke","#e2e8f0");
        g.selectAll("text").style("fill","#64748b").style("font-size","9px")
          .attr("transform","rotate(-40)").style("text-anchor","end");
      });

    // Y axis
    chart.append("g")
      .call(d3.axisLeft(y).ticks(5).tickFormat(d=>`${d.toFixed(1)}%`))
      .call(g => { g.select(".domain").remove(); g.selectAll("line").remove(); g.selectAll("text").style("fill","#94a3b8").style("font-size","10px"); });

    // Axis labels
    svg.append("text").attr("transform",`translate(${margin.left+cW/2},${H-4})`).attr("text-anchor","middle")
      .style("font-size","11px").style("fill","#94a3b8").text("Year");
    svg.append("text").attr("transform","rotate(-90)").attr("x",-(margin.top+cH/2)).attr("y",14)
      .attr("text-anchor","middle").style("font-size","11px").style("fill","#94a3b8").text("Population Growth Rate (%)");

    return () => tooltip.remove();
  }, [data, theme]);

  return (
    <div style={{ display:"flex", gap:12, alignItems:"flex-start", width:"100%", border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden" }}>
      <svg ref={svgRef} style={{ display:"block", flex:1, minWidth:0, height:380 }} />
      <div style={{ padding:"12px 12px 12px 0" }}>
        <LegendHTML data={data} palette={THEMES[theme]} />
      </div>
    </div>
  );
}

// ─── 3D Chart ─────────────────────────────────────────────────────────────────
function Chart3D({ data, theme }) {
  const mountRef   = useRef(null);
  const overlayRef = useRef(null);
  const palette    = THEMES[theme];

  useEffect(() => {
    if (!mountRef.current || !data.length) return;
    const el  = mountRef.current;
    const W   = el.offsetWidth || 620, H = 380;

    const maxV   = d3.max(data, d=>d.value);
    const maxH3D = 9;
    const spacing = 14 / (data.length-1||1);
    const xOf    = i => (i/(data.length-1||1))*14 - 7;
    const yOf    = v => (v/maxV)*maxH3D;

    const scene  = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);
    const camera = new THREE.PerspectiveCamera(38, W/H, 0.1, 200);
    camera.position.set(0, 8, 16);
    camera.lookAt(0, 3, 0);

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
    rimL.position.set(-10,5,-6); scene.add(rimL);
    scene.add(new THREE.HemisphereLight(0xffffff,0xe0e7ff,0.4));

    // Floor
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(26,16),
      new THREE.MeshStandardMaterial({ color:0xf1f5f9, roughness:0.9 })
    );
    floor.rotation.x=-Math.PI/2; floor.receiveShadow=true; scene.add(floor);
    scene.add(new THREE.GridHelper(26,24,0xcccccc,0xe2e8f0));

    const pivot       = new THREE.Group();
    const labelAnchors = [];

    // Smooth ribbon / bars
    data.forEach((d, i) => {
      const bh   = Math.max(0.08, yOf(d.value));
      const xp   = xOf(i);
      const t    = i/(data.length-1);
      const col  = new THREE.Color(palette[Math.floor(t*(palette.length-1))%palette.length]);
      const bw   = Math.max(0.3, 12/data.length - 0.15);

      // Shadow
      const sm = new THREE.Mesh(
        new THREE.BoxGeometry(bw,bh*0.15,bw),
        new THREE.MeshBasicMaterial({ color:0xbbbbbb, transparent:true, opacity:0.15 })
      );
      sm.position.set(xp+0.06,bh*0.075,0.06); pivot.add(sm);

      // Bar
      const geo  = new THREE.BoxGeometry(bw,bh,bw);
      const mat  = new THREE.MeshStandardMaterial({
        color:col, roughness:0.22, metalness:0.4,
        emissive:col, emissiveIntensity:0.1,
      });
      const mesh = new THREE.Mesh(geo,mat);
      mesh.position.set(xp,bh/2,0); mesh.castShadow=true; pivot.add(mesh);

      // Edges
      const eg  = new THREE.EdgesGeometry(geo);
      const el2 = new THREE.LineSegments(eg, new THREE.LineBasicMaterial({ color:0xffffff }));
      el2.position.set(xp,bh/2,0); pivot.add(el2);

      // Glow cap
      const capC = col.clone().lerp(new THREE.Color(0xffffff),0.25);
      const cap  = new THREE.Mesh(
        new THREE.BoxGeometry(bw,0.07,bw),
        new THREE.MeshStandardMaterial({ color:capC, emissive:capC, emissiveIntensity:1.2, roughness:0.04, metalness:1 })
      );
      cap.position.set(xp,bh+0.035,0); pivot.add(cap);

      // Connecting line sphere at top
      if (i < data.length-1) {
        const nextBh = Math.max(0.08, yOf(data[i+1].value));
        const nextXp = xOf(i+1);
        const pts    = [new THREE.Vector3(xp,bh,0), new THREE.Vector3(nextXp,nextBh,0)];
        const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
        pivot.add(new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color:new THREE.Color(palette[0]), linewidth:2 })));
      }

      labelAnchors.push({ x:xp, y:bh+0.55, z:0, text:`${d.value.toFixed(2)}%`, col:`#${col.getHexString()}`, isVal:true });
      if (i===0 || i===data.length-1 || i%3===0) {
        labelAnchors.push({ x:xp, y:-0.65, z:0, text:d.label, col:"#64748b", isVal:false });
      }
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
        overlayRef.current.querySelectorAll(".lc3lbl").forEach((div,i) => {
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
  }, [data, theme]);

  // Mirror label list for JSX
  const jsxLabels = [];
  data.forEach((d, i) => {
    const t   = i/(data.length-1);
    const col = THEMES[theme][Math.floor(t*(THEMES[theme].length-1))%THEMES[theme].length];
    jsxLabels.push({ text:`${d.value.toFixed(2)}%`, col, isVal:true });
    if (i===0 || i===data.length-1 || i%3===0) {
      jsxLabels.push({ text:d.label, col:"#64748b", isVal:false });
    }
  });

  return (
    <div style={{ display:"flex", gap:12, alignItems:"flex-start", width:"100%", border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden" }}>
      <div style={{ position:"relative", flex:1, minWidth:0 }}>
        <div ref={mountRef} style={{ width:"100%", height:380, cursor:"grab" }} />

        <div ref={overlayRef} style={{ position:"absolute", inset:0, pointerEvents:"none" }}>
          {jsxLabels.map((a,i) => (
            <div key={i} className="lc3lbl" style={{
              position:"absolute",
              transform: a.isVal ? "translate(-50%,-100%)" : "translate(-50%,0%)",
              background: a.isVal ? "rgba(255,255,255,0.93)" : "rgba(255,255,255,0.90)",
              color: a.col,
              fontSize: a.isVal ? 9 : 9,
              fontWeight:"bold",
              padding:"2px 4px", borderRadius:3,
              border: a.isVal ? `1px solid ${a.col}55` : "1px solid #e2e8f0",
              whiteSpace:"nowrap", transition:"opacity 0.1s", pointerEvents:"none",
              boxShadow:"0 1px 3px rgba(0,0,0,0.08)",
            }}>
              {a.text}
            </div>
          ))}
        </div>

        <div style={{ padding:"7px 14px", background:"#f8fafc", borderTop:"1px solid #e2e8f0", fontSize:11, color:"#94a3b8" }}>
          💡 Drag to rotate · auto-spins until you interact · India population growth rate
        </div>
      </div>

      <div style={{ padding:"12px 12px 12px 0" }}>
        <LegendHTML data={data} palette={THEMES[theme]} />
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const LineChart1 = () => {
  const [viewMode, setViewMode] = useState("2d");
  const [theme,    setTheme]    = useState("Modern");
  const [data,     setData]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [dataInfo, setDataInfo] = useState("");

  useEffect(() => {
    fetch("https://api.worldbank.org/v2/country/IND/indicator/SP.POP.GROW?format=json")
      .then(r => r.json())
      .then(json => {
        const rows = json[1]
          .filter(d => d.value !== null)
          .slice(0,15).reverse()
          .map(d => ({ label:d.date, value:parseFloat(d.value.toFixed(4)) }));
        setData(rows);
        setDataInfo(`India · World Bank API · ${rows[0].label}–${rows[rows.length-1].label}`);
        setLoading(false);
      })
      .catch(() => {
        setData(FALLBACK);
        setDataInfo("India · Sample data (API unavailable)");
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
        <div style={{ fontSize:16, fontWeight:"bold", color:"#1e293b" }}>India — Population Growth Line Chart</div>
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
      <div style={{ minHeight:380 }}>
        {loading ? (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:380, color:"#94a3b8", fontSize:15 }}>
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

export default LineChart1;