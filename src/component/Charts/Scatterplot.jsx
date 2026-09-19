import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import * as THREE from "three";

const UI_THEMES = {
  Light: { bg:"#ffffff", chartBg:"#f8fafc", text:"#1e293b", axis:"#64748b", grid:"#e2e8f0", card:"#ffffff", border:"#e2e8f0", subtext:"#94a3b8", threeBg:0xf8fafc },
  Dark:  { bg:"#0f172a", chartBg:"#1e293b", text:"#f1f5f9", axis:"#94a3b8", grid:"#334155", card:"#1e293b", border:"#334155", subtext:"#64748b", threeBg:0x0f172a },
};

// Color by cylinders
const CYL_COLORS = {
  Modern:  { 4:"#4e79a7", 6:"#f28e2b", 8:"#e15759" },
  Neon:    { 4:"#00f5ff", 6:"#ffae00", 8:"#ff0080" },
  Pastel:  { 4:"#a5b4fc", 6:"#fde68a", 8:"#fca5a5" },
  Forest:  { 4:"#22c55e", 6:"#a3e635", 8:"#86efac" },
  Candy:   { 4:"#8b5cf6", 6:"#ec4899", 8:"#f97316" },
};

// ─── Stats Panel ──────────────────────────────────────────────────────────────
function StatsPanel({ cars, theme, colorTheme }) {
  const T      = UI_THEMES[theme];
  const colors = CYL_COLORS[colorTheme];
  if (!cars || !cars.length) return null;

  const bestMpg  = d3.greatest(cars, d => d.mpg);
  const mostHp   = d3.greatest(cars, d => d.hp);
  const avgMpg   = d3.mean(cars, d => d.mpg).toFixed(1);
  const avgHp    = d3.mean(cars, d => d.hp).toFixed(0);
  const cylCount = d3.rollup(cars, v => v.length, d => d.cyl);

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
    <div style={{ width:175, flexShrink:0 }}>
      <div style={{ fontSize:10, fontWeight:"bold", color:T.subtext, letterSpacing:"0.08em", marginBottom:8 }}>STATS</div>
      {card("⛽ Best MPG",    bestMpg?.name,  `${bestMpg?.mpg} mpg`,      colors[4])}
      {card("🏎️ Most Power",  mostHp?.name,   `${mostHp?.hp} hp`,         colors[8])}
      {card("📊 Avg MPG",     `${avgMpg}`,    "fleet average",            "#6366f1")}
      {card("⚡ Avg HP",      `${avgHp} hp`,  "fleet average",            "#8b5cf6")}
      {card("🚗 Total Cars",  `${cars.length}`,"in dataset",              "#14b8a6")}

      {/* Cylinders breakdown */}
      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:"10px 12px", marginBottom:8 }}>
        <div style={{ fontSize:10, color:T.subtext, fontWeight:600, marginBottom:8 }}>BY CYLINDERS</div>
        {[4,6,8].map(cyl => (
          <div key={cyl} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:7 }}>
            <div style={{ width:12, height:12, borderRadius:"50%", flexShrink:0, background:colors[cyl] }} />
            <span style={{ fontSize:10, color:T.text, flex:1 }}>{cyl} cyl</span>
            <span style={{ fontSize:10, color:T.subtext }}>{cylCount.get(cyl)||0} cars</span>
          </div>
        ))}
      </div>

      {/* Color scheme preview */}
      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:"10px 12px" }}>
        <div style={{ fontSize:10, color:T.subtext, fontWeight:600, marginBottom:8 }}>COLOR SCHEMES</div>
        {Object.entries(CYL_COLORS).map(([k,v]) => (
          <div key={k} style={{ marginBottom:7 }}>
            <div style={{ fontSize:10, color:T.text, marginBottom:3, fontWeight:k===colorTheme?"700":"400" }}>{k}</div>
            <div style={{ display:"flex", gap:3 }}>
              {[4,6,8].map(c => (
                <div key={c} style={{ flex:1, height:6, borderRadius:3, background:v[c], opacity:k===colorTheme?1:0.4 }} />
              ))}
            </div>
          </div>
        ))}
        <div style={{ borderTop:`1px solid ${T.border}`, marginTop:8, paddingTop:8 }}>
          {[4,6,8].map(c => (
            <div key={c} style={{ display:"flex", alignItems:"center", gap:7, marginBottom:5 }}>
              <div style={{ width:10, height:10, borderRadius:"50%", flexShrink:0, background:colors[c] }} />
              <span style={{ fontSize:10, color:T.text }}>{c} cylinders</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── 2D Chart — labels on hover only ──────────────────────────────────────────
function Chart2D({ theme, colorTheme, onData }) {
  const wrapRef = useRef(null);
  const T       = UI_THEMES[theme];
  const colors  = CYL_COLORS[colorTheme];

  useEffect(() => {
    if (!wrapRef.current) return;

    d3.csv("/mtcars.csv", d => ({
      name: d.name,
      mpg:  +d.mpg,
      hp:   +d.hp,
      wt:   +d.wt,
      cyl:  +d.cyl,
    })).then(raw => {
      const cars = raw.filter(d => d.name && !isNaN(d.mpg) && !isNaN(d.hp) && d.mpg>0 && d.hp>0);
      if (!cars.length) return;
      onData(cars);

      const W = wrapRef.current.clientWidth || 680;
      const H = 480;
      const margin = { top:28, right:24, bottom:48, left:60 };

      d3.select(wrapRef.current).selectAll("*").remove();

      const x = d3.scaleLinear()
        .domain(d3.extent(cars, d => d.mpg)).nice()
        .range([margin.left, W - margin.right]);

      const y = d3.scaleLinear()
        .domain(d3.extent(cars, d => d.hp)).nice()
        .range([H - margin.bottom, margin.top]);

      // Size by weight
      const r = d3.scaleSqrt()
        .domain(d3.extent(cars, d => d.wt))
        .range([4, 10]);

      const svg = d3.select(wrapRef.current).append("svg")
        .attr("width",W).attr("height",H)
        .style("background",T.chartBg).style("border-radius","8px")
        .style("font","10px sans-serif");

      // Y grid
      svg.append("g").attr("transform",`translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(8).tickFormat("").tickSize(-(W-margin.left-margin.right)))
        .call(g => { g.select(".domain").remove(); g.selectAll("line").style("stroke",T.grid).style("stroke-dasharray","3,3"); });

      // X grid
      svg.append("g").attr("transform",`translate(0,${H-margin.bottom})`)
        .call(d3.axisBottom(x).ticks(8).tickFormat("").tickSize(-(H-margin.top-margin.bottom)))
        .call(g => { g.select(".domain").remove(); g.selectAll("line").style("stroke",T.grid).style("stroke-dasharray","3,3"); });

      // Tooltip
      const tooltip = d3.select("body").append("div")
        .style("position","absolute").style("background","rgba(15,23,42,0.92)")
        .style("color","#fff").style("padding","8px 12px").style("border-radius","8px")
        .style("font-size","12px").style("pointer-events","none").style("opacity",0)
        .style("z-index","9999").style("line-height","1.7");

      // ── FIX: Dots — colored by cylinders, sized by weight ─────────────────
      svg.append("g")
        .selectAll("circle").data(cars).join("circle")
        .attr("cx", d => x(d.mpg))
        .attr("cy", d => y(d.hp))
        .attr("r",  d => r(d.wt))
        .attr("fill", d => colors[d.cyl] || "#6366f1")
        .attr("fill-opacity", 0.80)
        .attr("stroke","#fff").attr("stroke-width",1.2)
        .style("cursor","pointer")
        .on("mouseover", function(event, d) {
          d3.select(this).attr("fill-opacity",1).attr("r", r(d.wt)+2);
          tooltip.style("opacity",1)
            .style("border",`1.5px solid ${colors[d.cyl]||"#6366f1"}`)
            .html(
              `<div style="font-weight:700;color:${colors[d.cyl]||"#6366f1"};margin-bottom:4px">${d.name}</div>` +
              `⛽ MPG: <b>${d.mpg}</b><br/>` +
              `⚡ HP: <b>${d.hp}</b><br/>` +
              `⚖️ Weight: <b>${d.wt} (1000 lbs)</b><br/>` +
              `🔧 Cylinders: <b>${d.cyl}</b>`
            )
            .style("left",(event.pageX+14)+"px").style("top",(event.pageY-14)+"px");
        })
        .on("mouseout", function(e,d) {
          d3.select(this).attr("fill-opacity",0.80).attr("r",r(d.wt));
          tooltip.style("opacity",0);
        });

      // ── FIX: Labels only on hover — no permanent overlap ──────────────────
      // Show label near dot on mouseover (handled above via tooltip)

      // X axis
      svg.append("g").attr("transform",`translate(0,${H-margin.bottom})`)
        .call(d3.axisBottom(x).ticks(8))
        .call(g => {
          g.select(".domain").style("stroke",T.grid);
          g.selectAll("line").style("stroke",T.grid);
          g.selectAll("text").style("fill",T.axis).style("font-size","10px");
        });

      // X label
      svg.append("text")
        .attr("x",(W+margin.left)/2).attr("y",H-8)
        .attr("text-anchor","middle").style("font-size","11px").style("fill",T.axis).style("font-weight","600")
        .text("Miles per Gallon (MPG) →");

      // Y axis
      svg.append("g").attr("transform",`translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(8))
        .call(g => {
          g.select(".domain").remove(); g.selectAll("line").remove();
          g.selectAll("text").style("fill",T.axis).style("font-size","10px");
        });

      // Y label
      svg.append("text")
        .attr("transform","rotate(-90)").attr("x",-H/2).attr("y",16)
        .attr("text-anchor","middle").style("font-size","11px").style("fill",T.axis).style("font-weight","600")
        .text("↑ Horsepower (HP)");

      // Size legend (bottom right)
      const legG = svg.append("g").attr("transform",`translate(${W-margin.right-90},${margin.top+10})`);
      legG.append("rect").attr("width",90).attr("height",55).attr("rx",5)
        .attr("fill",T.card).attr("stroke",T.grid).attr("opacity",0.9);
      legG.append("text").attr("x",6).attr("y",14).attr("font-size","9px").attr("fill",T.subtext).attr("font-weight","600").text("SIZE = WEIGHT");
      [1.5,3,5].forEach((wt,i)=>{
        legG.append("circle").attr("cx",16).attr("cy",28+i*12).attr("r",r(wt))
          .attr("fill",colors[4]).attr("fill-opacity",0.7).attr("stroke","#fff");
        legG.append("text").attr("x",28).attr("y",32+i*12).attr("font-size","8px").attr("fill",T.text).text(`${wt}k lbs`);
      });

      return () => tooltip.remove();
    });
  }, [theme, colorTheme]);

  return <div ref={wrapRef} style={{ border:`1px solid ${T.border}`, borderRadius:8, overflow:"hidden", width:"100%" }} />;
}

// ─── 3D Scatter — AxesHelper removed ──────────────────────────────────────────
function Chart3D({ theme, colorTheme }) {
  const mountRef   = useRef(null);
  const overlayRef = useRef(null);
  const T          = UI_THEMES[theme];
  const colors     = CYL_COLORS[colorTheme];

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
      camera.position.set(0,0,22); camera.lookAt(0,0,0);

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
      const floorC=theme==="Dark"?0x1e293b:0xf1f5f9;
      const gridC =theme==="Dark"?0x334155:0xe2e8f0;
      const floor=new THREE.Mesh(new THREE.PlaneGeometry(30,22),
        new THREE.MeshStandardMaterial({color:floorC,roughness:0.9}));
      floor.rotation.x=-Math.PI/2; floor.position.y=-8;
      floor.receiveShadow=true; scene.add(floor);
      const grid=new THREE.GridHelper(30,24,gridC,gridC);
      grid.position.y=-7.95; scene.add(grid);

      const pivot=new THREE.Group();
      const labelAnchors=[];

      d3.csv("/mtcars.csv", d => ({
        name: d.name, mpg:+d.mpg, hp:+d.hp, wt:+d.wt, cyl:+d.cyl,
      })).then(raw => {
        const cars=raw.filter(d=>d.name&&!isNaN(d.mpg)&&!isNaN(d.hp)&&d.mpg>0&&d.hp>0);
        if(!cars.length) return;

        // 3D axes: X=mpg, Y=hp, Z=wt (weight as depth)
        const xScale=d3.scaleLinear().domain(d3.extent(cars,d=>d.mpg)).nice().range([-8,8]);
        const yScale=d3.scaleLinear().domain(d3.extent(cars,d=>d.hp)).nice().range([-6,6]);
        const zScale=d3.scaleLinear().domain(d3.extent(cars,d=>d.wt)).nice().range([-6,6]);
        const rScale=d3.scaleSqrt().domain(d3.extent(cars,d=>d.wt)).range([0.12,0.32]);

        cars.forEach(d=>{
          const col=new THREE.Color(colors[d.cyl]||"#6366f1");
          const dot=new THREE.Mesh(
            new THREE.SphereGeometry(rScale(d.wt),16,16),
            new THREE.MeshStandardMaterial({
              color:col, roughness:0.25, metalness:0.40,
              emissive:col, emissiveIntensity:0.25,
            })
          );
          dot.position.set(xScale(d.mpg),yScale(d.hp),zScale(d.wt));
          dot.castShadow=true; pivot.add(dot);

          // Label for notable cars (top/bottom MPG and HP)
          labelAnchors.push({
            pos: new THREE.Vector3(xScale(d.mpg),yScale(d.hp)+0.5,zScale(d.wt)),
            text: d.name,
            col:  colors[d.cyl]||"#6366f1",
            hp:   d.hp, mpg: d.mpg,
            type: "car",
          });
        });

        // Only label extreme cars
        const topMpg=d3.greatest(cars,d=>d.mpg);
        const botMpg=d3.least(cars,d=>d.mpg);
        const topHp =d3.greatest(cars,d=>d.hp);
        const notables=new Set([topMpg?.name,botMpg?.name,topHp?.name]);

        // Axis labels
        labelAnchors.push({pos:new THREE.Vector3(0,-8.5,0), text:"← MPG →",   type:"axis"});
        labelAnchors.push({pos:new THREE.Vector3(-9.5,0,0), text:"↑ HP",       type:"axis"});
        labelAnchors.push({pos:new THREE.Vector3(0,0,7),    text:"Weight (lbs)→",type:"axis"});

        // Filter only notable + axis labels for overlay
        const overlayAnchors=[
          ...labelAnchors.filter(a=>a.type==="axis"),
          ...labelAnchors.filter(a=>notables.has(a.text)),
        ];

        scene.add(pivot);

        if(overlayRef.current){
          const divs=overlayRef.current.querySelectorAll(".shlbl");
          overlayAnchors.forEach((a,i)=>{if(divs[i]) divs[i].textContent=a.text;});
        }

        const toScreen=v3=>{
          const v=v3.clone().project(camera);
          return {sx:(v.x*0.5+0.5)*W,sy:(-v.y*0.5+0.5)*H,behind:v.z>1};
        };

        let isDragging=false,prevX=0,prevY=0,rotX=0.25,rotY=0.4,autoSpin=true;
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
          if(autoSpin) rotY+=0.004;
          pivot.rotation.y=rotY; pivot.rotation.x=rotX;
          camera.updateMatrixWorld();
          if(overlayRef.current){
            overlayRef.current.querySelectorAll(".shlbl").forEach((div,i)=>{
              const a=overlayAnchors[i]; if(!a) return;
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
  },[theme,colorTheme]);

  // 3 axis + 3 notable = 6
  const jsxLabels=Array.from({length:8},(_,i)=>({
    type:i<3?"axis":"car",
  }));

  return (
    <div style={{position:"relative",userSelect:"none",
      border:`1px solid ${T.border}`,borderRadius:8,overflow:"hidden",width:"100%"}}>
      <div ref={mountRef} style={{width:"100%",height:480,cursor:"grab",overflow:"hidden"}}/>
      <div ref={overlayRef} style={{position:"absolute",inset:0,pointerEvents:"none",overflow:"hidden"}}>
        {jsxLabels.map((a,i)=>(
          <div key={i} className="shlbl" style={{
            position:"absolute",
            transform:"translate(-50%,-100%)",
            background:theme==="Dark"?"rgba(15,23,42,0.92)":"rgba(255,255,255,0.95)",
            color:T.text, fontSize:a.type==="axis"?10:9, fontWeight:"600",
            padding:a.type==="axis"?"3px 8px":"2px 6px",
            borderRadius:4, border:`1px solid ${T.border}`,
            whiteSpace:"nowrap",pointerEvents:"none",
            boxShadow:"0 1px 3px rgba(0,0,0,0.10)",opacity:0,
          }}/>
        ))}
      </div>
      <div style={{padding:"7px 14px",background:T.chartBg,
        borderTop:`1px solid ${T.border}`,fontSize:11,color:T.subtext}}>
        💡 Drag to rotate · auto-spins · X=MPG · Y=HP · Z=Weight ·
        {[4,6,8].map(c=>(
          <span key={c} style={{color:colors[c],fontWeight:700,marginLeft:6}}>■ {c}cyl</span>
        ))}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Scatterplot() {
  const [viewMode,   setViewMode]   = useState("2d");
  const [theme,      setTheme]      = useState("Light");
  const [colorTheme, setColorTheme] = useState("Modern");
  const [cars,       setCars]       = useState([]);

  const T=UI_THEMES[theme];
  const ddStyle={
    padding:"5px 10px",borderRadius:6,border:`1px solid ${T.border}`,
    background:theme==="Dark"?"#1e293b":"#fff",
    color:T.text,fontWeight:"500",cursor:"pointer",fontSize:12,outline:"none",
  };

  return (
    <div style={{
      background:T.bg,borderRadius:12,padding:"20px 24px 32px 24px",
      width:"100%",boxShadow:"0 1px 3px rgba(0,0,0,0.08)",boxSizing:"border-box",
    }}>
      <div style={{marginBottom:4}}>
        <div style={{fontSize:16,fontWeight:"bold",color:T.text}}>
          Scatterplot – Car Performance
        </div>
        <div style={{fontSize:12,color:T.subtext,marginTop:2}}>
          MPG vs Horsepower · Color = cylinders · Size = weight · 3D adds weight as Z axis
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
          <select value={theme} onChange={e=>setTheme(e.target.value)} style={ddStyle}>
            <option value="Light">Light</option>
            <option value="Dark">Dark</option>
          </select>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:3}}>
          <label style={{fontSize:11,color:T.subtext,fontWeight:"600"}}>Color Theme</label>
          <select value={colorTheme} onChange={e=>setColorTheme(e.target.value)} style={ddStyle}>
            {Object.keys(CYL_COLORS).map(k=><option key={k} value={k}>{k}</option>)}
          </select>
        </div>
      </div>

      <div style={{display:"flex",gap:12,alignItems:"flex-start",width:"100%"}}>
        <div style={{flex:1,minWidth:0}}>
          {viewMode==="2d"
            ?<Chart2D key={`2d-${theme}-${colorTheme}`} theme={theme} colorTheme={colorTheme} onData={setCars}/>
            :<Chart3D key={`3d-${theme}-${colorTheme}`} theme={theme} colorTheme={colorTheme}/>
          }
        </div>
        <StatsPanel cars={cars} theme={theme} colorTheme={colorTheme}/>
      </div>
    </div>
  );
}