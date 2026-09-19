import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import * as THREE from "three";

const COLOR_THEMES = {
  Modern:  d3.schemeTableau10,
  Pastel:  ["#a5b4fc","#67e8f9","#6ee7b7","#fde68a","#fca5a5","#c4b5fd","#f9a8d4","#99f6e4","#fdba74","#d1d5db","#bae6fd","#bbf7d0","#fef08a"],
  Neon:    ["#ff0080","#00f5ff","#39ff14","#ffae00","#ff3131","#ff6bff","#00ff9d","#ff4400","#ff00aa","#00ccff","#ff6600","#00ff66","#cc00ff"],
  Sunset:  ["#ff6b6b","#feca57","#ff9ff3","#48dbfb","#1dd1a1","#f368e0","#ff9f43","#10ac84","#5f27cd","#00d2d3","#ff5252","#2bcbba","#fd9644"],
};

const UI_THEMES = {
  Light: { bg:"#ffffff", chartBg:"#f8fafc", text:"#1e293b", axis:"#64748b", grid:"#e2e8f0", card:"#ffffff", border:"#e2e8f0", subtext:"#94a3b8", threeBg:0xf8fafc },
  Dark:  { bg:"#0f172a", chartBg:"#1e293b", text:"#f1f5f9", axis:"#94a3b8", grid:"#334155", card:"#1e293b", border:"#334155", subtext:"#64748b", threeBg:0x0f172a },
};

// ─── Legend ───────────────────────────────────────────────────────────────────
function LegendHTML({ industries, colorTheme, uiTheme }) {
  const T     = UI_THEMES[uiTheme];
  const color = d3.scaleOrdinal().domain(industries).range(COLOR_THEMES[colorTheme]);
  return (
    <div style={{
      background:T.card, border:`1px solid ${T.border}`, borderRadius:8,
      padding:"12px 14px", width:185, flexShrink:0,
      boxShadow:"0 1px 4px rgba(0,0,0,0.07)", alignSelf:"flex-start",
      maxHeight:520, overflowY:"auto",
    }}>
      <div style={{ fontSize:10, fontWeight:"bold", color:T.subtext, letterSpacing:"0.08em", marginBottom:8 }}>INDUSTRIES</div>
      {industries.map(ind => (
        <div key={ind} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
          <div style={{ width:12, height:12, borderRadius:2, flexShrink:0, background:color(ind) }} />
          <span style={{ color:T.text, fontSize:10 }}>{ind}</span>
        </div>
      ))}
      <div style={{ borderTop:`1px solid ${T.border}`, margin:"10px 0 6px" }} />
      <div style={{ fontSize:10, color:T.subtext, lineHeight:1.6 }}>
        Y axis = % share<br/>All layers add to 100%
      </div>
    </div>
  );
}

// ─── Stats Panel ──────────────────────────────────────────────────────────────
function StatsPanel({ data, industries, colorTheme, uiTheme }) {
  const T     = UI_THEMES[uiTheme];
  const color = d3.scaleOrdinal().domain(industries).range(COLOR_THEMES[colorTheme]);
  if (!data || !data.length || !industries.length) return null;

  // % share per industry (average across all dates)
  const byInd    = d3.rollup(data, v => d3.sum(v, d => d.unemployed), d => d.industry);
  const total    = d3.sum([...byInd.values()]);
  const topInd   = d3.greatest([...byInd.entries()], d => d[1]);
  const bottomInd= d3.least([...byInd.entries()],    d => d[1]);

  const card = (label, value, sub, col) => (
    <div style={{
      background:T.card, border:`1px solid ${T.border}`,
      borderRadius:8, padding:"10px 12px", marginBottom:8,
      borderLeft:`3px solid ${col}`,
    }}>
      <div style={{ fontSize:10, color:T.subtext, fontWeight:600, marginBottom:3 }}>{label}</div>
      <div style={{ fontSize:14, fontWeight:700, color:col, whiteSpace:"nowrap" }}>{value}</div>
      {sub && <div style={{ fontSize:10, color:T.subtext, marginTop:2 }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ width:185, flexShrink:0 }}>
      <div style={{ fontSize:10, fontWeight:"bold", color:T.subtext, letterSpacing:"0.08em", marginBottom:8 }}>STATS</div>

      {topInd    && card("🏆 Highest Share", topInd[0],    `${((topInd[1]/total)*100).toFixed(1)}% of total`,    color(topInd[0]))}
      {bottomInd && card("📉 Lowest Share",  bottomInd[0], `${((bottomInd[1]/total)*100).toFixed(1)}% of total`, color(bottomInd[0]))}
      {card("🏭 Industries", industries.length, "tracked sectors", "#6366f1")}

      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:"10px 12px" }}>
        <div style={{ fontSize:10, color:T.subtext, fontWeight:600, marginBottom:8 }}>% SHARE BREAKDOWN</div>
        {[...byInd.entries()]
          .sort((a,b) => b[1]-a[1])
          .map(([ind, val]) => {
            const pct = ((val/total)*100).toFixed(1);
            return (
              <div key={ind} style={{ marginBottom:7 }}>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:9, color:T.text, marginBottom:2 }}>
                  <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:115 }}>{ind}</span>
                  <span style={{ color:T.subtext, flexShrink:0, marginLeft:4 }}>{pct}%</span>
                </div>
                <div style={{ background:T.grid, borderRadius:4, height:4, overflow:"hidden" }}>
                  <div style={{ width:`${pct}%`, height:"100%", background:color(ind), borderRadius:4, opacity:0.85 }} />
                </div>
              </div>
            );
          })
        }
      </div>
    </div>
  );
}

// ─── 2D Chart ─────────────────────────────────────────────────────────────────
function Chart2D({ colorTheme, uiTheme, onData, onIndustries }) {
  const wrapRef = useRef(null);
  const T = UI_THEMES[uiTheme];

  useEffect(() => {
    if (!wrapRef.current) return;

    d3.csv("/unemployment.csv", d => ({
      date:       new Date(d.date),
      industry:   d.industry,
      unemployed: +d.unemployed,
    })).then(raw => {
      const data = raw.filter(d => d.date instanceof Date && !isNaN(d.unemployed));
      if (!data.length) return;
      onData(data);

      const industries = Array.from(d3.union(data.map(d => d.industry)));
      onIndustries(industries);

      const color = d3.scaleOrdinal().domain(industries).range(COLOR_THEMES[colorTheme]);

      // ── KEY DIFFERENCE: stackOffsetExpand = normalized 0-1 ─────────────────
      const series = d3.stack()
        .offset(d3.stackOffsetExpand)
        .keys(industries)
        .value(([, D], key) => D.get(key)?.unemployed || 0)(
          d3.index(data, d => d.date, d => d.industry)
        );

      const W = wrapRef.current.clientWidth || 640;
      const H = 440;
      const margin = { top:32, right:16, bottom:40, left:64 };

      d3.select(wrapRef.current).selectAll("*").remove();

      const x = d3.scaleUtc().domain(d3.extent(data,d=>d.date)).range([margin.left,W-margin.right]);
      const y = d3.scaleLinear().domain([0,1]).range([H-margin.bottom,margin.top]);

      const area = d3.area()
        .x(d => x(d.data[0])).y0(d => y(d[0])).y1(d => y(d[1]))
        .curve(d3.curveBasis);

      const svg = d3.select(wrapRef.current).append("svg")
        .attr("width",W).attr("height",H)
        .style("background",T.chartBg).style("border-radius","8px");

      // Y grid
      svg.append("g").attr("transform",`translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(5).tickFormat("").tickSize(-(W-margin.left-margin.right)))
        .call(g => { g.select(".domain").remove(); g.selectAll("line").style("stroke",T.grid).style("stroke-dasharray","3,3"); });

      // Tooltip
      const tooltip = d3.select("body").append("div")
        .style("position","absolute").style("background","rgba(15,23,42,0.92)")
        .style("color","#fff").style("padding","8px 12px").style("border-radius","6px")
        .style("font-size","12px").style("pointer-events","none").style("opacity",0)
        .style("z-index","9999").style("line-height","1.7");

      // Areas
      svg.append("g").selectAll("path").data(series).join("path")
        .attr("fill", d => color(d.key)).attr("opacity",0.82).attr("d",area)
        .style("cursor","pointer")
        .on("mouseover", function(event, d) {
          d3.select(this).attr("opacity",1).attr("stroke",color(d.key)).attr("stroke-width",1.5);
          tooltip.style("opacity",1).style("border",`1.5px solid ${color(d.key)}`)
            .html(`<b style="color:${color(d.key)}">${d.key}</b>`);
        })
        .on("mousemove", e => tooltip.style("left",(e.pageX+12)+"px").style("top",(e.pageY-10)+"px"))
        .on("mouseout", function(e,d) { d3.select(this).attr("opacity",0.82).attr("stroke","none"); tooltip.style("opacity",0); });

      // X axis
      svg.append("g").attr("transform",`translate(0,${H-margin.bottom})`)
        .call(d3.axisBottom(x).ticks(W/80).tickSizeOuter(0))
        .call(g => { g.select(".domain").style("stroke",T.grid); g.selectAll("text").style("fill",T.axis).style("font-size","10px"); g.selectAll("line").style("stroke",T.grid); });

      // Y axis — % format
      svg.append("g").attr("transform",`translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(5,"%"))
        .call(g => { g.select(".domain").remove(); g.selectAll("line").remove(); g.selectAll("text").style("fill",T.axis).style("font-size","10px"); });

      // Y label
      svg.append("text").attr("x",margin.left).attr("y",margin.top-10)
        .attr("fill",T.text).attr("font-size","11px").attr("font-weight","600")
        .text("↑ Share of total unemployment (%)");

      return () => tooltip.remove();
    });
  }, [colorTheme, uiTheme]);

  return <div ref={wrapRef} style={{ border:`1px solid ${T.border}`, borderRadius:8, overflow:"hidden", width:"100%" }} />;
}

// ─── 3D Chart — AxesHelper removed ────────────────────────────────────────────
function Chart3D({ colorTheme, uiTheme, onIndustries }) {
  const mountRef   = useRef(null);
  const overlayRef = useRef(null);
  const T = UI_THEMES[uiTheme];

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    while (el.firstChild) el.removeChild(el.firstChild);

    let animId, renderer, cleanupFn;

    const init = (W) => {
      if (renderer) return;
      const H = 480;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(T.threeBg);

      const camera = new THREE.PerspectiveCamera(42, W/H, 0.1, 200);
      camera.position.set(0,0,24); camera.lookAt(0,0,0);

      renderer = new THREE.WebGLRenderer({ antialias:true });
      renderer.setSize(W, H);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.domElement.style.display    = "block";
      renderer.domElement.style.outline    = "none";
      renderer.domElement.style.userSelect = "none";
      el.appendChild(renderer.domElement);

      // Lights — NO AxesHelper
      scene.add(new THREE.AmbientLight(0xffffff, 0.80));
      const sun = new THREE.DirectionalLight(0xffffff, 1.0);
      sun.position.set(6,14,10); sun.castShadow=true; scene.add(sun);
      scene.add(new THREE.HemisphereLight(0xffffff, 0xe0e7ff, 0.45));

      // Floor + clean grid
      const floorC = uiTheme==="Dark" ? 0x1e293b : 0xf1f5f9;
      const gridC  = uiTheme==="Dark" ? 0x334155 : 0xe2e8f0;
      const floor  = new THREE.Mesh(new THREE.PlaneGeometry(32,24),
        new THREE.MeshStandardMaterial({ color:floorC, roughness:0.9 }));
      floor.rotation.x=-Math.PI/2; floor.position.y=-7.5;
      floor.receiveShadow=true; scene.add(floor);
      const grid = new THREE.GridHelper(32,26,gridC,gridC);
      grid.position.y=-7.45; scene.add(grid);

      const pivot = new THREE.Group();
      const labelAnchors = [];

      d3.csv("/unemployment.csv", d => ({
        date:       new Date(d.date),
        industry:   d.industry,
        unemployed: +d.unemployed,
      })).then(raw => {
        const data = raw.filter(d => d.date instanceof Date && !isNaN(d.unemployed));
        if (!data.length) return;

        const industries = Array.from(d3.union(data.map(d => d.industry)));
        onIndustries(industries);

        const color = d3.scaleOrdinal().domain(industries).range(COLOR_THEMES[colorTheme]);

        // ── KEY DIFFERENCE: stackOffsetExpand = normalized ─────────────────
        const series = d3.stack()
          .offset(d3.stackOffsetExpand)
          .keys(industries)
          .value(([, D], key) => D.get(key)?.unemployed || 0)(
            d3.index(data, d => d.date, d => d.industry)
          );

        const dateExtent = d3.extent(data, d => d.date);
        const xScale = d3.scaleUtc().domain(dateExtent).range([-9,9]);
        // Y is 0-1 (normalized)
        const yScale = d3.scaleLinear().domain([0,1]).range([-6,6]);

        const zGap   = 0.55;
        const startZ = -(industries.length-1)/2 * zGap;

        industries.forEach((ind, zi) => {
          const z         = startZ + zi * zGap;
          const indSeries = series.find(s => s.key === ind);
          if (!indSeries) return;

          const col = new THREE.Color(color(ind));
          const pts = [...indSeries].filter(d => !isNaN(d[1]));

          for (let i=0; i<pts.length-1; i++) {
            const x1=xScale(pts[i].data[0]),   y1=yScale(pts[i][1]);
            const x2=xScale(pts[i+1].data[0]), y2=yScale(pts[i+1][1]);
            const b1y=yScale(pts[i][0]),        b2y=yScale(pts[i+1][0]);

            // Top tube
            const p1=new THREE.Vector3(x1,y1,z);
            const p2=new THREE.Vector3(x2,y2,z);
            pivot.add(new THREE.Mesh(
              new THREE.TubeGeometry(new THREE.LineCurve3(p1,p2),3,0.04,5,false),
              new THREE.MeshStandardMaterial({ color:col, roughness:0.22, metalness:0.45, emissive:col, emissiveIntensity:0.20, transparent:true, opacity:0.90 })
            ));

            // Face fill
            const b1=new THREE.Vector3(x1,b1y,z);
            const b2=new THREE.Vector3(x2,b2y,z);
            const faceGeo = new THREE.BufferGeometry();
            faceGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array([
              p1.x,p1.y,p1.z, b1.x,b1.y,b1.z, p2.x,p2.y,p2.z,
              b1.x,b1.y,b1.z, b2.x,b2.y,b2.z, p2.x,p2.y,p2.z,
            ]),3));
            faceGeo.computeVertexNormals();
            pivot.add(new THREE.Mesh(faceGeo, new THREE.MeshStandardMaterial({
              color:col, roughness:0.4, metalness:0.1,
              transparent:true, opacity:0.28, side:THREE.DoubleSide,
            })));
          }

          const last=pts[pts.length-1];
          if (last) {
            labelAnchors.push({
              pos:  new THREE.Vector3(xScale(last.data[0])+0.3, yScale(last[1]), z),
              text: ind.length>14 ? ind.slice(0,14)+"…" : ind,
              type: "ind",
            });
          }
        });

        // Year labels
        d3.timeYear.range(dateExtent[0],dateExtent[1]).forEach(yr => {
          labelAnchors.push({ pos:new THREE.Vector3(xScale(yr),-7.8,0), text:d3.timeFormat("%Y")(yr), type:"date" });
        });

        // % labels Y
        [0,25,50,75,100].forEach(pct => {
          labelAnchors.push({ pos:new THREE.Vector3(-10.2,yScale(pct/100),0), text:`${pct}%`, type:"val" });
        });

        scene.add(pivot);

        if (overlayRef.current) {
          const divs=overlayRef.current.querySelectorAll(".shlbl");
          labelAnchors.forEach((a,i)=>{ if(divs[i]) divs[i].textContent=a.text; });
        }

        const toScreen = v3 => {
          const v=v3.clone().project(camera);
          return { sx:(v.x*0.5+0.5)*W, sy:(-v.y*0.5+0.5)*H, behind:v.z>1 };
        };

        let isDragging=false,prevX=0,prevY=0,rotX=0.20,rotY=0,autoSpin=true;
        pivot.rotation.x=rotX; pivot.rotation.y=rotY;

        const onDown=e=>{ e.preventDefault(); isDragging=true; prevX=e.clientX; prevY=e.clientY; autoSpin=false; renderer.domElement.style.cursor="grabbing"; };
        const onUp=()=>{ isDragging=false; renderer.domElement.style.cursor="grab"; };
        const onMove=e=>{
          if(!isDragging) return;
          rotY+=(e.clientX-prevX)*0.007;
          rotX=Math.max(-0.6,Math.min(0.6,rotX+(e.clientY-prevY)*0.004));
          prevX=e.clientX; prevY=e.clientY;
        };

        renderer.domElement.addEventListener("mousedown",onDown);
        window.addEventListener("mouseup",onUp);
        window.addEventListener("mousemove",onMove);
        renderer.domElement.style.cursor="grab";

        const animate=()=>{
          animId=requestAnimationFrame(animate);
          if(autoSpin) rotY+=0.003;
          pivot.rotation.y=rotY; pivot.rotation.x=rotX;
          camera.updateMatrixWorld();
          if(overlayRef.current){
            overlayRef.current.querySelectorAll(".shlbl").forEach((div,i)=>{
              const a=labelAnchors[i]; if(!a) return;
              const rv=new THREE.Vector3(a.pos.x,a.pos.y,a.pos.z).applyEuler(pivot.rotation);
              const {sx,sy,behind}=toScreen(rv);
              div.style.left=`${sx}px`; div.style.top=`${sy}px`;
              div.style.opacity=behind?"0":"1";
            });
          }
          renderer.render(scene,camera);
        };
        animate();

        cleanupFn=()=>{
          cancelAnimationFrame(animId);
          renderer.domElement.removeEventListener("mousedown",onDown);
          window.removeEventListener("mouseup",onUp);
          window.removeEventListener("mousemove",onMove);
          renderer.dispose();
          if(el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
        };
      });
    };

    const W0=el.clientWidth||el.parentElement?.clientWidth||0;
    if(W0>10){ init(W0); }
    else{
      const obs=new ResizeObserver(entries=>{
        const W=entries[0].contentRect.width;
        if(W>10){ init(W); obs.disconnect(); }
      });
      obs.observe(el);
      return ()=>obs.disconnect();
    }
    return ()=>{ if(cleanupFn) cleanupFn(); };
  }, [colorTheme, uiTheme]);

  const jsxLabels = Array.from({ length:35 },(_,i)=>({
    type: i<13?"ind":i<24?"date":"val",
  }));

  return (
    <div style={{ position:"relative", userSelect:"none",
      border:`1px solid ${T.border}`, borderRadius:8, overflow:"hidden", width:"100%" }}>
      <div ref={mountRef} style={{ width:"100%", height:480, cursor:"grab", overflow:"hidden" }} />
      <div ref={overlayRef} style={{ position:"absolute", inset:0, pointerEvents:"none", overflow:"hidden" }}>
        {jsxLabels.map((a,i)=>(
          <div key={i} className="shlbl" style={{
            position:"absolute",
            transform: a.type==="val"?"translate(-100%,-50%)":a.type==="date"?"translate(-50%,0%)":"translate(0,-50%)",
            background: uiTheme==="Dark"?"rgba(15,23,42,0.92)":"rgba(255,255,255,0.95)",
            color:T.text, fontSize:a.type==="ind"?9:8, fontWeight:"600",
            padding:"2px 5px", borderRadius:3, border:`1px solid ${T.border}`,
            whiteSpace:"nowrap", pointerEvents:"none",
            boxShadow:"0 1px 3px rgba(0,0,0,0.08)", opacity:0,
          }}/>
        ))}
      </div>
      <div style={{ padding:"7px 14px", background:T.chartBg,
        borderTop:`1px solid ${T.border}`, fontSize:11, color:T.subtext }}>
        💡 Drag to rotate · auto-spins · Y = % share · Z = industry layer
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function NormalizedStackedAreaChart() {
  const [viewMode,   setViewMode]   = useState("2d");
  const [colorTheme, setColorTheme] = useState("Modern");
  const [uiTheme,    setUiTheme]    = useState("Light");
  const [industries, setIndustries] = useState([]);
  const [chartData,  setChartData]  = useState([]);

  const T = UI_THEMES[uiTheme];
  const ddStyle = {
    padding:"5px 10px", borderRadius:6, border:`1px solid ${T.border}`,
    background: uiTheme==="Dark"?"#1e293b":"#fff",
    color:T.text, fontWeight:"500", cursor:"pointer", fontSize:12, outline:"none",
  };

  return (
    <div style={{
      background:T.bg, borderRadius:12, padding:"20px 24px 32px 24px",
      width:"100%", boxShadow:"0 1px 3px rgba(0,0,0,0.08)", boxSizing:"border-box",
    }}>
      <div style={{ marginBottom:4 }}>
        <div style={{ fontSize:16, fontWeight:"bold", color:T.text }}>
          Normalized Stacked Area – Unemployment by Industry
        </div>
        <div style={{ fontSize:12, color:T.subtext, marginTop:2 }}>
          Each layer = % share · All layers add to 100% · 2000–2010
        </div>
      </div>

      <div style={{ display:"flex", gap:10, alignItems:"flex-end", marginTop:12, marginBottom:20, flexWrap:"wrap" }}>
        <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
          <label style={{ fontSize:11, color:T.subtext, fontWeight:"600" }}>View</label>
          <select value={viewMode} onChange={e=>setViewMode(e.target.value)} style={ddStyle}>
            <option value="2d">2D</option>
            <option value="3d">3D</option>
          </select>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
          <label style={{ fontSize:11, color:T.subtext, fontWeight:"600" }}>Theme</label>
          <select value={uiTheme} onChange={e=>setUiTheme(e.target.value)} style={ddStyle}>
            <option value="Light">Light</option>
            <option value="Dark">Dark</option>
          </select>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
          <label style={{ fontSize:11, color:T.subtext, fontWeight:"600" }}>Color Theme</label>
          <select value={colorTheme} onChange={e=>setColorTheme(e.target.value)} style={ddStyle}>
            {Object.keys(COLOR_THEMES).map(k=><option key={k} value={k}>{k}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display:"flex", gap:12, alignItems:"flex-start", width:"100%" }}>
        <div style={{ flex:1, minWidth:0 }}>
          {viewMode==="2d"
            ? <Chart2D key={`2d-${colorTheme}-${uiTheme}`} colorTheme={colorTheme} uiTheme={uiTheme} onData={setChartData} onIndustries={setIndustries} />
            : <Chart3D key={`3d-${colorTheme}-${uiTheme}`} colorTheme={colorTheme} uiTheme={uiTheme} onIndustries={setIndustries} />
          }
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <StatsPanel data={chartData} industries={industries} colorTheme={colorTheme} uiTheme={uiTheme} />
          <LegendHTML industries={industries} colorTheme={colorTheme} uiTheme={uiTheme} />
        </div>
      </div>
    </div>
  );
}