import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import * as THREE from "three";

const UI_THEMES = {
  Light: { bg:"#ffffff", chartBg:"#f8fafc", text:"#1e293b", axis:"#64748b", grid:"#e2e8f0", card:"#ffffff", border:"#e2e8f0", subtext:"#94a3b8", threeBg:0xf8fafc },
  Dark:  { bg:"#0f172a", chartBg:"#1e293b", text:"#f1f5f9", axis:"#94a3b8", grid:"#334155", card:"#1e293b", border:"#334155", subtext:"#64748b", threeBg:0x0f172a },
};

const COLOR_THEMES = {
  Classic: { setosa:"#4e79a7", versicolor:"#f28e2b", virginica:"#e15759" },
  Neon:    { setosa:"#00f5ff", versicolor:"#ffae00", virginica:"#ff0080" },
  Pastel:  { setosa:"#a5b4fc", versicolor:"#fde68a", virginica:"#fca5a5" },
  Forest:  { setosa:"#22c55e", versicolor:"#84cc16", virginica:"#15803d" },
  Candy:   { setosa:"#8b5cf6", versicolor:"#ec4899", virginica:"#f97316" },
};

// ─── Stats Panel ──────────────────────────────────────────────────────────────
function StatsPanel({ data, theme, colorTheme }) {
  const T      = UI_THEMES[theme];
  const colors = COLOR_THEMES[colorTheme];
  if (!data || !data.length) return null;

  const species    = [...new Set(data.map(d => d.species))];
  const bySpecies  = d3.group(data, d => d.species);

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

      {card("🌸 Total Samples", data.length, "iris measurements", "#6366f1")}
      {card("🔬 Species",       species.length, "distinct species", "#8b5cf6")}

      {/* Per species */}
      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:"10px 12px", marginBottom:8 }}>
        <div style={{ fontSize:10, color:T.subtext, fontWeight:600, marginBottom:8 }}>PER SPECIES</div>
        {species.map(sp => {
          const arr     = bySpecies.get(sp) || [];
          const avgSL   = d3.mean(arr, d => d.sepalLength).toFixed(1);
          const avgSW   = d3.mean(arr, d => d.sepalWidth).toFixed(1);
          return (
            <div key={sp} style={{ marginBottom:10, paddingBottom:8, borderBottom:`1px solid ${T.border}` }}>
              <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:4 }}>
                <div style={{ width:10, height:10, borderRadius:"50%", flexShrink:0, background:colors[sp]||"#6366f1" }} />
                <span style={{ fontSize:10, color:T.text, fontWeight:700, textTransform:"capitalize" }}>{sp}</span>
                <span style={{ fontSize:10, color:T.subtext, marginLeft:"auto" }}>{arr.length} pts</span>
              </div>
              <div style={{ fontSize:9, color:T.subtext }}>
                Avg L: {avgSL} cm · Avg W: {avgSW} cm
              </div>
            </div>
          );
        })}
      </div>

      {/* Color scheme preview */}
      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:"10px 12px" }}>
        <div style={{ fontSize:10, color:T.subtext, fontWeight:600, marginBottom:8 }}>COLOR SCHEMES</div>
        {Object.entries(COLOR_THEMES).map(([k, v]) => (
          <div key={k} style={{ marginBottom:7 }}>
            <div style={{ fontSize:10, color:T.text, marginBottom:3, fontWeight:k===colorTheme?"700":"400" }}>{k}</div>
            <div style={{ display:"flex", gap:3 }}>
              {Object.values(v).map((c,i) => (
                <div key={i} style={{ flex:1, height:6, borderRadius:3, background:c, opacity:k===colorTheme?1:0.4 }} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 2D Chart ─────────────────────────────────────────────────────────────────
function Chart2D({ theme, colorTheme, onData }) {
  const wrapRef = useRef(null);
  const T       = UI_THEMES[theme];
  const colors  = COLOR_THEMES[colorTheme];

  useEffect(() => {
    if (!wrapRef.current) return;

    d3.csv("/iris.csv", d => ({
      sepalLength: +d.sepalLength,
      sepalWidth:  +d.sepalWidth,
      petalLength: +d.petalLength,
      petalWidth:  +d.petalWidth,
      species:      d.species,
    })).then(raw => {
      const data = raw.filter(d =>
        !isNaN(d.sepalLength) && !isNaN(d.sepalWidth) &&
        !isNaN(d.petalLength) && !isNaN(d.petalWidth) &&
        typeof d.species === "string"
      );
      if (!data.length) return;
      onData(data);

      const W = wrapRef.current.clientWidth || 680;
      const H = 460;
      const margin = { top:28, right:20, bottom:48, left:56 };

      d3.select(wrapRef.current).selectAll("*").remove();

      const x = d3.scaleLinear()
        .domain(d3.extent(data, d => d.sepalLength)).nice()
        .range([margin.left, W - margin.right]);

      const y = d3.scaleLinear()
        .domain(d3.extent(data, d => d.sepalWidth)).nice()
        .range([H - margin.bottom, margin.top]);

      const species  = [...new Set(data.map(d => d.species))];

      const shapeFns = d3.symbols.slice(0, species.length)
        .map(s => d3.symbol().type(s).size(72)());
      const shapeMap = new Map(species.map((s,i) => [s, shapeFns[i]]));

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

      // Symbols
      svg.append("g")
        .selectAll("path").data(data).join("path")
        .attr("transform", d => `translate(${x(d.sepalLength)},${y(d.sepalWidth)})`)
        .attr("fill",   d => colors[d.species] || "#6366f1")
        .attr("stroke", d => d3.color(colors[d.species]||"#6366f1").darker(0.6))
        .attr("stroke-width", 0.8)
        .attr("fill-opacity", 0.80)
        .attr("d", d => shapeMap.get(d.species))
        .style("cursor","pointer")
        .on("mouseover", function(event, d) {
          d3.select(this).attr("fill-opacity",1).attr("transform",
            `translate(${x(d.sepalLength)},${y(d.sepalWidth)}) scale(1.4)`);
          tooltip.style("opacity",1)
            .style("border",`1.5px solid ${colors[d.species]||"#6366f1"}`)
            .html(
              `<div style="font-weight:700;color:${colors[d.species]||"#6366f1"};margin-bottom:4px;text-transform:capitalize">${d.species}</div>` +
              `🌿 Sepal L: <b>${d.sepalLength} cm</b><br/>` +
              `🌿 Sepal W: <b>${d.sepalWidth} cm</b><br/>` +
              `🌸 Petal L: <b>${d.petalLength} cm</b><br/>` +
              `🌸 Petal W: <b>${d.petalWidth} cm</b>`
            )
            .style("left",(event.pageX+14)+"px").style("top",(event.pageY-14)+"px");
        })
        .on("mouseout", function(e,d) {
          d3.select(this).attr("fill-opacity",0.80)
            .attr("transform",`translate(${x(d.sepalLength)},${y(d.sepalWidth)})`);
          tooltip.style("opacity",0);
        });

      // X axis
      svg.append("g").attr("transform",`translate(0,${H-margin.bottom})`)
        .call(d3.axisBottom(x).ticks(8))
        .call(g => {
          g.select(".domain").style("stroke",T.grid);
          g.selectAll("line").style("stroke",T.grid);
          g.selectAll("text").style("fill",T.axis).style("font-size","10px");
        });

      svg.append("text")
        .attr("x",(W+margin.left)/2).attr("y",H-8)
        .attr("text-anchor","middle").style("font-size","11px").style("fill",T.axis).style("font-weight","600")
        .text("Sepal Length (cm) →");

      // Y axis
      svg.append("g").attr("transform",`translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(8))
        .call(g => {
          g.select(".domain").remove(); g.selectAll("line").remove();
          g.selectAll("text").style("fill",T.axis).style("font-size","10px");
        });

      svg.append("text")
        .attr("transform","rotate(-90)").attr("x",-H/2).attr("y",16)
        .attr("text-anchor","middle").style("font-size","11px").style("fill",T.axis).style("font-weight","600")
        .text("↑ Sepal Width (cm)");

      // Legend (top-left)
      const legG = svg.append("g").attr("transform",`translate(${margin.left+8},${margin.top+8})`);
      legG.append("rect").attr("width",115).attr("height",species.length*22+14)
        .attr("rx",5).attr("fill",T.card).attr("stroke",T.grid).attr("opacity",0.95);
      species.forEach((sp,i) => {
        legG.append("path")
          .attr("transform",`translate(16,${20+i*22})`)
          .attr("d", shapeMap.get(sp))
          .attr("fill", colors[sp]||"#6366f1")
          .attr("stroke", d3.color(colors[sp]||"#6366f1").darker(0.6))
          .attr("stroke-width",0.8);
        legG.append("text")
          .attr("x",28).attr("y",24+i*22)
          .attr("font-size","10px").attr("fill",T.text)
          .style("text-transform","capitalize")
          .text(sp);
      });

      return () => tooltip.remove();
    });
  }, [theme, colorTheme]);

  return <div ref={wrapRef} style={{ border:`1px solid ${T.border}`, borderRadius:8, overflow:"hidden", width:"100%" }} />;
}

// ─── 3D Chart — AxesHelper removed ────────────────────────────────────────────
function Chart3D({ theme, colorTheme }) {
  const mountRef   = useRef(null);
  const overlayRef = useRef(null);
  const T       = UI_THEMES[theme];
  const colors  = COLOR_THEMES[colorTheme];

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

      d3.csv("/iris.csv", d => ({
        sepalLength: +d.sepalLength,
        sepalWidth:  +d.sepalWidth,
        petalLength: +d.petalLength,
        petalWidth:  +d.petalWidth,
        species:      d.species,
      })).then(raw => {
        const data=raw.filter(d=>
          !isNaN(d.sepalLength)&&!isNaN(d.sepalWidth)&&
          !isNaN(d.petalLength)&&!isNaN(d.petalWidth)&&
          typeof d.species==="string"
        );
        if(!data.length) return;

        // 3D: X=sepalLength, Y=sepalWidth, Z=petalLength
        const xScale=d3.scaleLinear().domain(d3.extent(data,d=>d.sepalLength)).nice().range([-8,8]);
        const yScale=d3.scaleLinear().domain(d3.extent(data,d=>d.sepalWidth)).nice().range([-6,6]);
        const zScale=d3.scaleLinear().domain(d3.extent(data,d=>d.petalLength)).nice().range([-7,7]);

        data.forEach(d=>{
          const col=new THREE.Color(colors[d.species]||"#6366f1");
          const dot=new THREE.Mesh(
            new THREE.SphereGeometry(0.18,14,14),
            new THREE.MeshStandardMaterial({
              color:col, roughness:0.22, metalness:0.40,
              emissive:col, emissiveIntensity:0.22,
              transparent:true, opacity:0.88,
            })
          );
          dot.position.set(xScale(d.sepalLength),yScale(d.sepalWidth),zScale(d.petalLength));
          dot.castShadow=true; pivot.add(dot);
        });

        // Species centroid labels
        const bySpecies=d3.group(data,d=>d.species);
        bySpecies.forEach((arr,sp)=>{
          const cx=d3.mean(arr,d=>xScale(d.sepalLength));
          const cy=d3.mean(arr,d=>yScale(d.sepalWidth));
          const cz=d3.mean(arr,d=>zScale(d.petalLength));
          labelAnchors.push({
            pos:  new THREE.Vector3(cx,cy+0.8,cz),
            text: sp.charAt(0).toUpperCase()+sp.slice(1),
            col:  colors[sp]||"#6366f1",
            type: "species",
          });
        });

        // Axis labels
        labelAnchors.push({pos:new THREE.Vector3(0,-8.6,0), text:"← Sepal Length →", type:"axis"});
        labelAnchors.push({pos:new THREE.Vector3(-9.5,0,0),  text:"↑ Sepal Width",    type:"axis"});
        labelAnchors.push({pos:new THREE.Vector3(0,0,8),     text:"Petal Length →",   type:"axis"});

        scene.add(pivot);

        if(overlayRef.current){
          const divs=overlayRef.current.querySelectorAll(".shlbl");
          labelAnchors.forEach((a,i)=>{if(divs[i]) divs[i].textContent=a.text;});
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
  },[theme,colorTheme]);

  // 3 species + 3 axis = 6
  const jsxLabels=Array.from({length:8},(_,i)=>({
    type:i<3?"species":"axis",
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
            color:T.text,
            fontSize:a.type==="species"?11:9,
            fontWeight:a.type==="species"?"700":"600",
            padding:a.type==="species"?"3px 9px":"2px 6px",
            borderRadius:4, border:`1px solid ${T.border}`,
            whiteSpace:"nowrap",pointerEvents:"none",
            boxShadow:"0 1px 3px rgba(0,0,0,0.10)",opacity:0,
          }}/>
        ))}
      </div>
      <div style={{padding:"7px 14px",background:T.chartBg,
        borderTop:`1px solid ${T.border}`,fontSize:11,color:T.subtext}}>
        💡 Drag to rotate · auto-spins · X=Sepal L · Y=Sepal W · Z=Petal L ·
        {Object.entries(colors).map(([sp,c])=>(
          <span key={sp} style={{color:c,fontWeight:700,marginLeft:6,textTransform:"capitalize"}}>■ {sp}</span>
        ))}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ScatterplotShapes() {
  const [viewMode,   setViewMode]   = useState("2d");
  const [theme,      setTheme]      = useState("Light");
  const [colorTheme, setColorTheme] = useState("Classic");
  const [data,       setData]       = useState([]);

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
          Iris Scatterplot — Sepal & Petal Dimensions
        </div>
        <div style={{fontSize:12,color:T.subtext,marginTop:2}}>
          Shape = species · 2D: Sepal L vs W · 3D adds Petal Length as Z axis
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
            {Object.keys(COLOR_THEMES).map(k=><option key={k} value={k}>{k}</option>)}
          </select>
        </div>
      </div>

      <div style={{display:"flex",gap:12,alignItems:"flex-start",width:"100%"}}>
        <div style={{flex:1,minWidth:0}}>
          {viewMode==="2d"
            ?<Chart2D key={`2d-${theme}-${colorTheme}`} theme={theme} colorTheme={colorTheme} onData={setData}/>
            :<Chart3D key={`3d-${theme}-${colorTheme}`} theme={theme} colorTheme={colorTheme}/>
          }
        </div>
        <StatsPanel data={data} theme={theme} colorTheme={colorTheme}/>
      </div>
    </div>
  );
}