import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import * as THREE from "three";

const COLOR_THEMES = {
  Modern:  d3.schemeTableau10,
  Pastel:  ["#a5b4fc","#67e8f9","#6ee7b7","#fde68a","#fca5a5","#c4b5fd","#f9a8d4","#99f6e4","#fdba74","#d1d5db"],
  Neon:    ["#ff0080","#00f5ff","#39ff14","#ffae00","#ff3131","#ff6bff","#00ff9d","#ff4400","#ff00aa","#00ccff"],
  Sunset:  ["#ff6b6b","#feca57","#ff9ff3","#48dbfb","#1dd1a1","#f368e0","#ff9f43","#10ac84","#5f27cd","#00d2d3"],
};

const UI_THEMES = {
  Light: { bg:"#ffffff", chartBg:"#f8fafc", text:"#1e293b", axis:"#64748b", grid:"#e2e8f0", card:"#ffffff", border:"#e2e8f0", subtext:"#94a3b8", threeBg:0xf8fafc },
  Dark:  { bg:"#0f172a", chartBg:"#1e293b", text:"#f1f5f9", axis:"#94a3b8", grid:"#334155", card:"#1e293b", border:"#334155", subtext:"#64748b", threeBg:0x0f172a },
};

// ── Parse TSV helper ──────────────────────────────────────────────────────────
function parseTSV(raw) {
  const years = d3.range(1790, 2000, 10);
  const states = raw
    .filter(d => d[""] && d[""] !== "UNITED STATES")
    .map(d => ({
      name:   d[""],
      values: years.map(y => {
        const v = d[y];
        if (!v || v.trim() === "---" || v.trim() === "") return 0;
        return +String(v).replace(/,/g, "") || 0;
      }),
    }));

  const data = years.map((y, i) => {
    const row = { date: new Date(Date.UTC(y, 0, 1)) };
    states.forEach(s => (row[s.name] = s.values[i]));
    return row;
  });

  return { states, data, years };
}

// ─── Legend ───────────────────────────────────────────────────────────────────
function LegendHTML({ keys, colorTheme, uiTheme }) {
  const T     = UI_THEMES[uiTheme];
  const color = d3.scaleOrdinal().domain(keys).range(
    [...COLOR_THEMES[colorTheme], ...COLOR_THEMES[colorTheme]]
  );
  return (
    <div style={{
      background:T.card, border:`1px solid ${T.border}`, borderRadius:8,
      padding:"12px 14px", width:185, flexShrink:0,
      boxShadow:"0 1px 4px rgba(0,0,0,0.07)", alignSelf:"flex-start",
      maxHeight:500, overflowY:"auto",
    }}>
      <div style={{ fontSize:10, fontWeight:"bold", color:T.subtext, letterSpacing:"0.08em", marginBottom:8 }}>STATES</div>
      {keys.map(k => (
        <div key={k} style={{ display:"flex", alignItems:"center", gap:7, marginBottom:5 }}>
          <div style={{ width:10, height:10, borderRadius:2, flexShrink:0, background:color(k) }} />
          <span style={{ color:T.text, fontSize:10 }}>{k}</span>
        </div>
      ))}
      <div style={{ borderTop:`1px solid ${T.border}`, margin:"8px 0 6px" }} />
      <div style={{ fontSize:10, color:T.subtext, lineHeight:1.6 }}>
        Y = % share of US pop.<br/>All states = 100%
      </div>
    </div>
  );
}

// ─── Stats Panel ──────────────────────────────────────────────────────────────
function StatsPanel({ keys, data, colorTheme, uiTheme }) {
  const T     = UI_THEMES[uiTheme];
  const color = d3.scaleOrdinal().domain(keys).range(
    [...COLOR_THEMES[colorTheme], ...COLOR_THEMES[colorTheme]]
  );
  if (!data || !data.length || !keys.length) return null;

  // Latest year (1990) share per state
  const latest = data[data.length - 1];
  const total  = d3.sum(keys, k => latest[k] || 0);
  const shares = keys.map(k => ({ name:k, val:latest[k]||0, pct:(((latest[k]||0)/total)*100) }));
  const top    = d3.greatest(shares, d => d.pct);
  const bottom = d3.least(shares,    d => d.pct);

  const card = (label, value, sub, col) => (
    <div style={{
      background:T.card, border:`1px solid ${T.border}`,
      borderRadius:8, padding:"10px 12px", marginBottom:8,
      borderLeft:`3px solid ${col}`,
    }}>
      <div style={{ fontSize:10, color:T.subtext, fontWeight:600, marginBottom:3 }}>{label}</div>
      <div style={{ fontSize:13, fontWeight:700, color:col, whiteSpace:"nowrap" }}>{value}</div>
      {sub && <div style={{ fontSize:10, color:T.subtext, marginTop:2 }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ width:185, flexShrink:0 }}>
      <div style={{ fontSize:10, fontWeight:"bold", color:T.subtext, letterSpacing:"0.08em", marginBottom:8 }}>STATS (1990)</div>
      {top    && card("🏆 Largest Share",  top.name,    `${top.pct.toFixed(1)}% of US pop`,    color(top.name))}
      {bottom && card("📉 Smallest Share", bottom.name, `${bottom.pct.toFixed(2)}% of US pop`, color(bottom.name))}
      {card("🗺️ States",       `${keys.length}`,  "tracked in chart",  "#6366f1")}
      {card("📅 Period",        "1790–1990",        "every 10 years",    "#8b5cf6")}

      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:"10px 12px" }}>
        <div style={{ fontSize:10, color:T.subtext, fontWeight:600, marginBottom:8 }}>TOP 10 STATES (1990)</div>
        {shares.sort((a,b)=>b.pct-a.pct).slice(0,10).map(s => (
          <div key={s.name} style={{ marginBottom:6 }}>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:9, color:T.text, marginBottom:2 }}>
              <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:115 }}>{s.name}</span>
              <span style={{ color:T.subtext, flexShrink:0, marginLeft:4 }}>{s.pct.toFixed(1)}%</span>
            </div>
            <div style={{ background:T.grid, borderRadius:4, height:4, overflow:"hidden" }}>
              <div style={{ width:`${(s.pct/top.pct)*100}%`, height:"100%", background:color(s.name), borderRadius:4, opacity:0.85 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 2D Chart — labels fixed ───────────────────────────────────────────────────
function Chart2D({ colorTheme, uiTheme, onKeys, onData }) {
  const wrapRef = useRef(null);
  const T = UI_THEMES[uiTheme];

  useEffect(() => {
    if (!wrapRef.current) return;

    d3.tsv("/population.tsv").then(raw => {
      const { states, data, years } = parseTSV(raw);
      const keys = states.map(s => s.name);
      onKeys(keys);
      onData(data);

      const palette = [...COLOR_THEMES[colorTheme], ...COLOR_THEMES[colorTheme]];
      const color   = d3.scaleOrdinal().domain(keys).range(palette);

      const series = d3.stack()
        .keys(keys)
        .offset(d3.stackOffsetExpand)(data);

      const W = wrapRef.current.clientWidth || 680;
      const H = 520;
      const margin = { top:28, right:16, bottom:40, left:60 };

      d3.select(wrapRef.current).selectAll("*").remove();

      const x = d3.scaleUtc()
        .domain(d3.extent(data, d => d.date))
        .range([margin.left, W - margin.right]);

      const y = d3.scaleLinear().domain([0,1]).range([H-margin.bottom, margin.top]);

      const area = d3.area()
        .curve(d3.curveBasis)
        .x(d => x(d.data.date))
        .y0(d => y(d[0])).y1(d => y(d[1]));

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
      svg.append("g").attr("fill-opacity",0.82)
        .selectAll("path").data(series).join("path")
        .attr("fill", d => color(d.key)).attr("d", area)
        .style("cursor","pointer")
        .on("mouseover", function(event,d) {
          d3.select(this).attr("fill-opacity",1).attr("stroke",color(d.key)).attr("stroke-width",1.5);
          tooltip.style("opacity",1).style("border",`1.5px solid ${color(d.key)}`)
            .html(`<b style="color:${color(d.key)}">${d.key}</b>`);
        })
        .on("mousemove", e => tooltip.style("left",(e.pageX+12)+"px").style("top",(e.pageY-10)+"px"))
        .on("mouseout", function(e,d) {
          d3.select(this).attr("fill-opacity",0.82).attr("stroke","none");
          tooltip.style("opacity",0);
        });

      // ── FIX: labels only for large enough bands, no overlap ────────────────
      const midX = Math.floor(series[0].length * 0.65);
      const labelData = series
        .map(s => ({
          key: s.key,
          col: color(s.key),
          x:   x(s[midX].data.date),
          y:   y((s[midX][0] + s[midX][1]) / 2),
          bandH: Math.abs(y(s[midX][0]) - y(s[midX][1])),
        }))
        .filter(d => d.bandH > 14); // only label bands wide enough

      svg.append("g").style("font","9px sans-serif").style("pointer-events","none")
        .selectAll("text").data(labelData).join("text")
        .attr("fill", d => d3.color(d.col).darker(1))
        .attr("x", d => d.x).attr("y", d => d.y)
        .attr("dy","0.35em").attr("text-anchor","middle")
        .attr("stroke",T.chartBg).attr("stroke-width",2.5).attr("paint-order","stroke")
        .text(d => d.key);

      // X axis
      svg.append("g").attr("transform",`translate(0,${H-margin.bottom})`)
        .call(d3.axisBottom(x).ticks(W/80).tickSizeOuter(0))
        .call(g => { g.select(".domain").style("stroke",T.grid); g.selectAll("text").style("fill",T.axis).style("font-size","10px"); g.selectAll("line").style("stroke",T.grid); });

      // Y axis
      svg.append("g").attr("transform",`translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(5,"%"))
        .call(g => { g.select(".domain").remove(); g.selectAll("line").remove(); g.selectAll("text").style("fill",T.axis).style("font-size","10px"); });

      svg.append("text").attr("x",margin.left).attr("y",margin.top-10)
        .attr("fill",T.text).attr("font-size","11px").attr("font-weight","600")
        .text("↑ Share of U.S. Population (%)");

      return () => tooltip.remove();
    });
  }, [colorTheme, uiTheme]);

  return <div ref={wrapRef} style={{ border:`1px solid ${T.border}`, borderRadius:8, overflow:"hidden", width:"100%" }} />;
}

// ─── 3D Chart — AxesHelper removed ────────────────────────────────────────────
function Chart3D({ colorTheme, uiTheme, onKeys }) {
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
      renderer.setSize(W,H);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
      renderer.shadowMap.enabled=true;
      renderer.domElement.style.display="block";
      renderer.domElement.style.outline="none";
      renderer.domElement.style.userSelect="none";
      el.appendChild(renderer.domElement);

      // Lights — NO AxesHelper
      scene.add(new THREE.AmbientLight(0xffffff,0.80));
      const sun=new THREE.DirectionalLight(0xffffff,1.0);
      sun.position.set(6,14,10); sun.castShadow=true; scene.add(sun);
      scene.add(new THREE.HemisphereLight(0xffffff,0xe0e7ff,0.45));

      // Floor + clean grid — NO AxesHelper
      const floorC=uiTheme==="Dark"?0x1e293b:0xf1f5f9;
      const gridC =uiTheme==="Dark"?0x334155:0xe2e8f0;
      const floor=new THREE.Mesh(new THREE.PlaneGeometry(32,24),
        new THREE.MeshStandardMaterial({color:floorC,roughness:0.9}));
      floor.rotation.x=-Math.PI/2; floor.position.y=-7.5;
      floor.receiveShadow=true; scene.add(floor);
      const grid=new THREE.GridHelper(32,26,gridC,gridC);
      grid.position.y=-7.45; scene.add(grid);

      const pivot=new THREE.Group();
      const labelAnchors=[];

      d3.tsv("/population.tsv").then(raw => {
        const { states, data } = parseTSV(raw);
        const keys = states.map(s => s.name);
        onKeys(keys);

        const palette = [...COLOR_THEMES[colorTheme],...COLOR_THEMES[colorTheme]];
        const color   = d3.scaleOrdinal().domain(keys).range(palette);

        const series = d3.stack().keys(keys).offset(d3.stackOffsetExpand)(data);

        const dateExtent = d3.extent(data,d=>d.date);
        const xScale = d3.scaleUtc().domain(dateExtent).range([-9,9]);
        const yScale = d3.scaleLinear().domain([0,1]).range([-6,6]);

        // Only show top states (by 1990 share) in 3D — reduce clutter
        const latest = data[data.length-1];
        const total  = d3.sum(keys,k=>latest[k]||0);
        const topKeys = keys
          .map(k=>({k, pct:(latest[k]||0)/total}))
          .sort((a,b)=>b.pct-a.pct)
          .slice(0,20)
          .map(d=>d.k);

        const zGap   = 0.45;
        const startZ = -(topKeys.length-1)/2*zGap;

        topKeys.forEach((key,zi)=>{
          const z=startZ+zi*zGap;
          const s=series.find(s=>s.key===key);
          if(!s) return;
          const col=new THREE.Color(color(key));
          const pts=[...s].filter(d=>!isNaN(d[1]));

          for(let i=0;i<pts.length-1;i++){
            const x1=xScale(pts[i].data.date),   y1=yScale(pts[i][1]);
            const x2=xScale(pts[i+1].data.date), y2=yScale(pts[i+1][1]);
            const b1y=yScale(pts[i][0]),          b2y=yScale(pts[i+1][0]);

            // Top tube
            const p1=new THREE.Vector3(x1,y1,z);
            const p2=new THREE.Vector3(x2,y2,z);
            pivot.add(new THREE.Mesh(
              new THREE.TubeGeometry(new THREE.LineCurve3(p1,p2),3,0.04,5,false),
              new THREE.MeshStandardMaterial({color:col,roughness:0.22,metalness:0.45,emissive:col,emissiveIntensity:0.18,transparent:true,opacity:0.90})
            ));

            // Face fill
            const b1=new THREE.Vector3(x1,b1y,z);
            const b2=new THREE.Vector3(x2,b2y,z);
            const geo=new THREE.BufferGeometry();
            geo.setAttribute("position",new THREE.BufferAttribute(new Float32Array([
              p1.x,p1.y,p1.z,b1.x,b1.y,b1.z,p2.x,p2.y,p2.z,
              b1.x,b1.y,b1.z,b2.x,b2.y,b2.z,p2.x,p2.y,p2.z,
            ]),3));
            geo.computeVertexNormals();
            pivot.add(new THREE.Mesh(geo,new THREE.MeshStandardMaterial({
              color:col,roughness:0.4,metalness:0.1,transparent:true,opacity:0.28,side:THREE.DoubleSide,
            })));
          }

          // State label at right edge
          const last=pts[pts.length-1];
          if(last) labelAnchors.push({
            pos: new THREE.Vector3(xScale(last.data.date)+0.3,yScale(last[1]),z),
            text: key.length>12?key.slice(0,12)+"…":key,
            type:"state",
          });
        });

        // Year labels
        d3.timeYear.range(dateExtent[0],dateExtent[1],10).forEach(yr=>{
          labelAnchors.push({pos:new THREE.Vector3(xScale(yr),-7.8,0),text:d3.timeFormat("%Y")(yr),type:"date"});
        });

        // % labels Y
        [0,25,50,75,100].forEach(pct=>{
          labelAnchors.push({pos:new THREE.Vector3(-10.2,yScale(pct/100),0),text:`${pct}%`,type:"val"});
        });

        scene.add(pivot);

        if(overlayRef.current){
          const divs=overlayRef.current.querySelectorAll(".shlbl");
          labelAnchors.forEach((a,i)=>{if(divs[i]) divs[i].textContent=a.text;});
        }

        const toScreen=v3=>{
          const v=v3.clone().project(camera);
          return {sx:(v.x*0.5+0.5)*W,sy:(-v.y*0.5+0.5)*H,behind:v.z>1};
        };

        let isDragging=false,prevX=0,prevY=0,rotX=0.20,rotY=0,autoSpin=true;
        pivot.rotation.x=rotX; pivot.rotation.y=rotY;

        const onDown=e=>{e.preventDefault();isDragging=true;prevX=e.clientX;prevY=e.clientY;autoSpin=false;renderer.domElement.style.cursor="grabbing";};
        const onUp=()=>{isDragging=false;renderer.domElement.style.cursor="grab";};
        const onMove=e=>{
          if(!isDragging) return;
          rotY+=(e.clientX-prevX)*0.007;
          rotX=Math.max(-0.6,Math.min(0.6,rotX+(e.clientY-prevY)*0.004));
          prevX=e.clientX;prevY=e.clientY;
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
    if(W0>10){init(W0);}
    else{
      const obs=new ResizeObserver(entries=>{
        const W=entries[0].contentRect.width;
        if(W>10){init(W);obs.disconnect();}
      });
      obs.observe(el);
      return ()=>obs.disconnect();
    }
    return ()=>{if(cleanupFn) cleanupFn();};
  },[colorTheme,uiTheme]);

  // 20 states + ~20 years + 5 % = 45
  const jsxLabels=Array.from({length:50},(_,i)=>({
    type:i<20?"state":i<40?"date":"val",
  }));

  return (
    <div style={{position:"relative",userSelect:"none",
      border:`1px solid ${T.border}`,borderRadius:8,overflow:"hidden",width:"100%"}}>
      <div ref={mountRef} style={{width:"100%",height:480,cursor:"grab",overflow:"hidden"}}/>
      <div ref={overlayRef} style={{position:"absolute",inset:0,pointerEvents:"none",overflow:"hidden"}}>
        {jsxLabels.map((a,i)=>(
          <div key={i} className="shlbl" style={{
            position:"absolute",
            transform:a.type==="val"?"translate(-100%,-50%)":a.type==="date"?"translate(-50%,0%)":"translate(0,-50%)",
            background:uiTheme==="Dark"?"rgba(15,23,42,0.92)":"rgba(255,255,255,0.95)",
            color:T.text, fontSize:a.type==="state"?9:8, fontWeight:"600",
            padding:"2px 5px", borderRadius:3, border:`1px solid ${T.border}`,
            whiteSpace:"nowrap", pointerEvents:"none",
            boxShadow:"0 1px 3px rgba(0,0,0,0.08)", opacity:0,
          }}/>
        ))}
      </div>
      <div style={{padding:"7px 14px",background:T.chartBg,
        borderTop:`1px solid ${T.border}`,fontSize:11,color:T.subtext}}>
        💡 Drag to rotate · auto-spins · Showing top 20 states by 1990 population share
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function USPopulationNormalized() {
  const [viewMode,   setViewMode]   = useState("2d");
  const [colorTheme, setColorTheme] = useState("Modern");
  const [uiTheme,    setUiTheme]    = useState("Light");
  const [keys,       setKeys]       = useState([]);
  const [chartData,  setChartData]  = useState([]);

  const T=UI_THEMES[uiTheme];
  const ddStyle={
    padding:"5px 10px",borderRadius:6,border:`1px solid ${T.border}`,
    background:uiTheme==="Dark"?"#1e293b":"#fff",
    color:T.text,fontWeight:"500",cursor:"pointer",fontSize:12,outline:"none",
  };

  return (
    <div style={{
      background:T.bg,borderRadius:12,padding:"20px 24px 32px 24px",
      width:"100%",boxShadow:"0 1px 3px rgba(0,0,0,0.08)",boxSizing:"border-box",
    }}>
      <div style={{marginBottom:4}}>
        <div style={{fontSize:16,fontWeight:"bold",color:T.text}}>
          U.S. Population by State (Normalized)
        </div>
        <div style={{fontSize:12,color:T.subtext,marginTop:2}}>
          Each layer = state's % share · 1790–1990 · Every 10 years
        </div>
      </div>

      <div style={{display:"flex",gap:10,alignItems:"flex-end",marginTop:12,marginBottom:20,flexWrap:"wrap"}}>
        <div style={{display:"flex",flexDirection:"column",gap:3}}>
          <label style={{fontSize:11,color:T.subtext,fontWeight:"600"}}>View</label>
          <select value={viewMode} onChange={e=>setViewMode(e.target.value)} style={ddStyle}>
            <option value="2d">2D</option>
            <option value="3d">3D</option>
          </select>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:3}}>
          <label style={{fontSize:11,color:T.subtext,fontWeight:"600"}}>Theme</label>
          <select value={uiTheme} onChange={e=>setUiTheme(e.target.value)} style={ddStyle}>
            <option value="Light">Light</option>
            <option value="Dark">Dark</option>
          </select>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:3}}>
          <label style={{fontSize:11,color:T.subtext,fontWeight:"600"}}>Color Theme</label>
          <select value={colorTheme} onChange={e=>setColorTheme(e.target.value)} style={ddStyle}>
            {Object.keys(COLOR_THEMES).map(k=><option key={k} value={k}>{k}</option>)}
          </select>
        </div>
      </div>

      <div style={{display:"flex",gap:12,alignItems:"flex-start",width:"100%"}}>
        <div style={{flex:1,minWidth:0}}>
          {viewMode==="2d"
            ?<Chart2D key={`2d-${colorTheme}-${uiTheme}`} colorTheme={colorTheme} uiTheme={uiTheme} onKeys={setKeys} onData={setChartData}/>
            :<Chart3D key={`3d-${colorTheme}-${uiTheme}`} colorTheme={colorTheme} uiTheme={uiTheme} onKeys={setKeys}/>
          }
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <StatsPanel keys={keys} data={chartData} colorTheme={colorTheme} uiTheme={uiTheme}/>
          <LegendHTML keys={keys} colorTheme={colorTheme} uiTheme={uiTheme}/>
        </div>
      </div>
    </div>
  );
}