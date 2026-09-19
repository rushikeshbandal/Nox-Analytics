import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import * as THREE from "three";

const UI_THEMES = {
  Light: { bg:"#f8fafc", text:"#1e293b", axis:"#64748b", grid:"#e2e8f0", card:"#ffffff", border:"#e2e8f0", subtext:"#94a3b8", threeBg:0xf8fafc },
  Dark:  { bg:"#0f172a", text:"#f1f5f9", axis:"#94a3b8", grid:"#334155", card:"#1e293b", border:"#334155", subtext:"#64748b", threeBg:0x0f172a },
};

const COLOR_THEMES = {
  VioletBrown: { type:"gradient", colors:["#9568cf","#3b2108"] },
  TealOrange:  { type:"gradient", colors:["#14b8a6","#f97316"] },
  Viridis:     { type:"scale",    scale:d3.interpolateViridis },
  SlateMono:   { type:"solid",    color:"#475569" },
};

// ─── Stats Panel ──────────────────────────────────────────────────────────────
function StatsPanel({ data, theme, colorTheme }) {
  const T = UI_THEMES[theme];
  if (!data || !data.length) return null;

  const keys      = data.columns?.slice(1) || [];
  const tc        = COLOR_THEMES[colorTheme];
  const getCol    = i => tc.type==="gradient" ? tc.colors[i%2] : tc.type==="scale" ? d3.scaleSequential([0,10],tc.scale)(i) : tc.color;
  const totalCars = data.length;
  const cylMap    = d3.rollup(data, v=>v.length, d=>d["cylinders"]);
  const bestMpg   = d3.greatest(data, d=>d["economy (mpg)"]);
  const mostPow   = d3.greatest(data, d=>d["power (hp)"]);
  const avgMpg    = d3.mean(data, d=>d["economy (mpg)"]).toFixed(1);
  const avgHp     = d3.mean(data, d=>d["power (hp)"]).toFixed(0);
  const yr        = d3.extent(data, d=>d["year"]);

  const card = (lbl,val,sub,col) => (
    <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:"8px 10px",marginBottom:7,borderLeft:`3px solid ${col}`}}>
      <div style={{fontSize:10,color:T.subtext,fontWeight:600,marginBottom:2}}>{lbl}</div>
      <div style={{fontSize:13,fontWeight:700,color:col,whiteSpace:"nowrap"}}>{val}</div>
      {sub&&<div style={{fontSize:10,color:T.subtext,marginTop:2}}>{sub}</div>}
    </div>
  );

  return (
    <div style={{width:170,flexShrink:0,maxHeight:"calc(100vh - 160px)",overflowY:"auto"}}>
      <div style={{fontSize:10,fontWeight:"bold",color:T.subtext,letterSpacing:"0.08em",marginBottom:8}}>STATS</div>
      {card("🚗 Total Cars",  totalCars,                      "in dataset",  getCol(0))}
      {card("⛽ Best MPG",    bestMpg?.["economy (mpg)"],      bestMpg?.name, "#22c55e")}
      {card("⚡ Most Power",  `${mostPow?.["power (hp)"]} hp`, mostPow?.name, "#ef4444")}
      {card("📊 Avg MPG",     `${avgMpg} mpg`,                "fleet avg",   "#6366f1")}
      {card("🔧 Avg HP",      `${avgHp} hp`,                  "fleet avg",   "#8b5cf6")}
      {card("📅 Years",       `${yr[0]}–${yr[1]}`,            "model years", "#14b8a6")}

      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:"10px 12px",marginBottom:7}}>
        <div style={{fontSize:10,color:T.subtext,fontWeight:600,marginBottom:8}}>BY CYLINDERS</div>
        {[...cylMap.entries()].sort((a,b)=>a[0]-b[0]).map(([cyl,cnt],i)=>(
          <div key={cyl} style={{marginBottom:6}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:T.text,marginBottom:2}}>
              <span>{cyl} cyl</span><span style={{color:T.subtext}}>{cnt}</span>
            </div>
            <div style={{background:T.grid,borderRadius:4,height:4,overflow:"hidden"}}>
              <div style={{width:`${(cnt/totalCars)*100}%`,height:"100%",background:getCol(i*2),borderRadius:4}}/>
            </div>
          </div>
        ))}
      </div>

      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:"10px 12px",marginBottom:7}}>
        <div style={{fontSize:10,color:T.subtext,fontWeight:600,marginBottom:8}}>AXIS RANGES</div>
        {keys.map(k=>{
          const ext=d3.extent(data,d=>d[k]);
          return <div key={k} style={{marginBottom:5}}>
            <div style={{fontSize:9,color:T.text,fontWeight:600}}>{k}</div>
            <div style={{fontSize:9,color:T.subtext}}>{ext[0]} – {ext[1]}</div>
          </div>;
        })}
      </div>

      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:"10px 12px"}}>
        <div style={{fontSize:10,color:T.subtext,fontWeight:600,marginBottom:8}}>COLORS</div>
        {Object.entries(COLOR_THEMES).map(([k,v])=>{
          const stops=d3.range(0,1.01,0.25).map(t=>v.type==="gradient"?(t<0.5?v.colors[0]:v.colors[1]):v.type==="scale"?v.scale(t):v.color);
          return <div key={k} style={{marginBottom:7}}>
            <div style={{fontSize:10,color:T.text,marginBottom:3,fontWeight:k===colorTheme?"700":"400"}}>{k}</div>
            <div style={{height:6,borderRadius:3,background:`linear-gradient(to right,${stops.join(",")})`,opacity:k===colorTheme?1:0.4}}/>
          </div>;
        })}
      </div>
    </div>
  );
}

export default function ParallelCoordinates() {
  const outerRef = useRef(null);   // 2D container
  const canvasRef = useRef(null);  // 3D canvas element directly

  const [view,       setView]       = useState("2D");
  const [uiTheme,    setUiTheme]    = useState("Light");
  const [colorTheme, setColorTheme] = useState("VioletBrown");
  // FIX: rawData is fetched exactly once and cached. Nothing else re-fetches it.
  const [rawData,    setRawData]    = useState(null);

  /* ══════════════════════ Fetch CSV once, ever ══════════════════════ */
  useEffect(() => {
    let cancelled = false;
    d3.csv("/cars.csv", d3.autoType).then(data => {
      if (!cancelled) setRawData(data);
    });
    return () => { cancelled = true; };
  }, []);

  /* ══════════════════════════ 2D ══════════════════════════ */
  useEffect(() => {
    if (view !== "2D" || !rawData) return;
    const outer = outerRef.current;
    if (!outer) return;
    let tipEl = null;
    // FIX: track last drawn width so redundant/near-identical ResizeObserver
    // callbacks (often self-triggered by our own DOM rebuild) don't cause
    // an endless render → resize → render loop, which was the flicker.
    let lastW = 0;
    let rafId = null;

    const data = rawData;

    const draw = (W) => {
      lastW = W;
      outer.innerHTML = "";
      if (tipEl) { tipEl.remove(); tipEl = null; }

      const keys   = data.columns.slice(1);
      const H      = 560;
      const margin = { top:60, right:30, bottom:20, left:165 };
      const T      = UI_THEMES[uiTheme];

      const xScales = {};
      keys.forEach(k => {
        xScales[k] = d3.scaleLinear()
          .domain(d3.extent(data, d=>d[k])).nice()
          .range([margin.left, W-margin.right]);
      });

      const yScale = d3.scalePoint()
        .domain(keys).range([margin.top, H-margin.bottom]).padding(0.15);

      const lineGen = d3.line()
        .defined(d => !isNaN(d[1]))
        .x(d => xScales[d[0]](d[1]))
        .y(d => yScale(d[0]));

      const tc = COLOR_THEMES[colorTheme];
      let strokeFn;

      const svg = d3.select(outer).append("svg")
        .attr("width",W).attr("height",H)
        .style("display","block")
        .style("background",T.bg)
        .style("border-radius","8px");

      if (tc.type === "gradient") {
        const defs = svg.append("defs");
        const gr = defs.append("linearGradient")
          .attr("id","pcGr").attr("gradientUnits","userSpaceOnUse")
          .attr("x1",margin.left).attr("x2",W-margin.right);
        gr.append("stop").attr("offset","0%").attr("stop-color",tc.colors[0]);
        gr.append("stop").attr("offset","100%").attr("stop-color",tc.colors[1]);
        strokeFn = () => "url(#pcGr)";
      } else if (tc.type === "scale") {
        const cs = d3.scaleSequential([0,data.length], tc.scale);
        strokeFn = (_,i) => cs(i);
      } else {
        strokeFn = () => tc.color;
      }

      svg.append("text")
        .attr("x",W/2).attr("y",28)
        .attr("text-anchor","middle")
        .attr("font-weight","700").attr("font-size","14px")
        .attr("fill",T.text)
        .text("Parallel Coordinates – Cars Dataset");

      tipEl = document.createElement("div");
      Object.assign(tipEl.style, {
        position:"fixed", background:"rgba(15,23,42,0.95)", color:"#fff",
        padding:"10px 14px", borderRadius:"8px", fontSize:"11px",
        pointerEvents:"none", opacity:"0", zIndex:"9999",
        lineHeight:"1.8", maxWidth:"240px",
      });
      document.body.appendChild(tipEl);

      svg.append("g").selectAll("line").data(keys).join("line")
        .attr("x1",margin.left).attr("x2",W-margin.right)
        .attr("y1",d=>yScale(d)).attr("y2",d=>yScale(d))
        .attr("stroke",T.grid).attr("stroke-opacity",0.6).attr("stroke-width",0.8);

      svg.append("g").selectAll("path").data(data).join("path")
        .attr("d", d => lineGen(keys.map(k=>[k,d[k]])))
        .attr("fill","none").attr("stroke",strokeFn)
        .attr("stroke-opacity",0.30).attr("stroke-width",1.4)
        .style("cursor","pointer")
        .on("mouseover", function(event,d) {
          d3.select(this).attr("stroke-opacity",1).attr("stroke-width",2.8).raise();
          tipEl.style.opacity="1";
          tipEl.innerHTML =
            `<div style="font-weight:700;margin-bottom:6px;color:#93c5fd">${d.name||"Car"}</div>`+
            keys.map(k=>`<span style="color:#94a3b8">${k}:</span> <b>${d[k]}</b>`).join("<br/>");
          tipEl.style.left=(event.clientX+16)+"px";
          tipEl.style.top=(event.clientY-12)+"px";
        })
        .on("mousemove", e=>{ tipEl.style.left=(e.clientX+16)+"px"; tipEl.style.top=(e.clientY-12)+"px"; })
        .on("mouseout", function(){ d3.select(this).attr("stroke-opacity",0.30).attr("stroke-width",1.4); tipEl.style.opacity="0"; });

      keys.forEach(k => {
        const axG = svg.append("g")
          .attr("transform",`translate(0,${yScale(k)})`);

        axG.call(d3.axisBottom(xScales[k]).ticks(6).tickSize(4));
        axG.selectAll("text").attr("fill",T.axis).style("font-size","9px");
        axG.selectAll("line,.domain").attr("stroke",T.axis);

        axG.append("text")
          .attr("x", margin.left-8).attr("y", 0)
          .attr("text-anchor","end").attr("dominant-baseline","middle")
          .attr("fill",T.text).attr("font-weight","600").attr("font-size","11px")
          .text(k);
      });
    };

    // FIX: only redraw when width has actually moved by a meaningful amount.
    // This breaks the "our own render causes another resize tick" loop.
    const maybeDraw = () => {
      const W = outer.offsetWidth;
      if (!W || W < 10) return;
      if (Math.abs(W - lastW) < 2) return;
      draw(W);
    };

    // FIX: coalesce bursts of ResizeObserver callbacks into a single frame.
    const obs = new ResizeObserver(() => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(maybeDraw);
    });
    obs.observe(outer);
    maybeDraw();

    return ()=>{
      obs.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
      if (tipEl) tipEl.remove();
    };
  },[view, uiTheme, colorTheme, rawData]);

  /* ══════════════════════════ 3D ══════════════════════════ */
  useEffect(() => {
    if (view !== "3D" || !rawData) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const data = rawData;
    const H = 520;
    const W = Math.max(600, window.innerWidth - 250);

    let animId, disposed = false;

    const scene  = new THREE.Scene();
    scene.background = new THREE.Color(UI_THEMES[uiTheme].threeBg);
    const camera = new THREE.PerspectiveCamera(45, W/H, 0.1, 2000);
    camera.position.set(0, 20, 60);
    camera.lookAt(0, 5, 0);

    const renderer = new THREE.WebGLRenderer({ antialias:true, canvas });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    renderer.shadowMap.enabled = true;

    scene.add(new THREE.AmbientLight(0xffffff,0.85));
    const sun = new THREE.DirectionalLight(0xffffff,0.9);
    sun.position.set(10,20,15); sun.castShadow=true; scene.add(sun);
    scene.add(new THREE.HemisphereLight(0xffffff, uiTheme==="Dark"?0x0f172a:0xdde4f0, 0.4));

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(80,60),
      new THREE.MeshStandardMaterial({color:uiTheme==="Dark"?0x0f172a:0xe8ecf0,roughness:1})
    );
    floor.rotation.x=-Math.PI/2; floor.position.y=-18;
    floor.receiveShadow=true; scene.add(floor);
    const gridH = new THREE.GridHelper(80,40,
      uiTheme==="Dark"?0x334155:0xb0bec5,
      uiTheme==="Dark"?0x1e293b:0xcfd8dc
    );
    gridH.position.y=-17.9; scene.add(gridH);

    const keys    = data.columns.slice(1);
    const yScale  = d3.scalePoint().domain(keys).range([-15,15]);
    const xScales = {};
    keys.forEach(k => {
      xScales[k] = d3.scaleLinear().domain(d3.extent(data,d=>d[k])).range([-20,20]);
    });

    const tc      = COLOR_THEMES[colorTheme];
    const colScale = tc.type==="scale" ? d3.scaleSequential([0,data.length],tc.scale) : null;

    data.forEach((d,i) => {
      const pts = keys
        .map((k,idx) => ({ v:d[k], idx }))
        .filter(p => !isNaN(p.v))
        .map(p => new THREE.Vector3(xScales[keys[p.idx]](p.v), yScale(keys[p.idx]), p.idx*4-keys.length*2));

      let col3;
      if (tc.type==="gradient") {
        col3 = new THREE.Color(tc.colors[0]).lerp(new THREE.Color(tc.colors[1]),i/data.length);
      } else if (tc.type==="scale") {
        col3 = new THREE.Color(colScale(i));
      } else { col3 = new THREE.Color(tc.color); }

      for (let j=0; j<pts.length-1; j++) {
        const tube = new THREE.Mesh(
          new THREE.TubeGeometry(new THREE.LineCurve3(pts[j],pts[j+1]),2,0.035,4,false),
          new THREE.MeshStandardMaterial({color:col3.clone(),roughness:0.3,metalness:0.1,transparent:true,opacity:0.55})
        );
        scene.add(tube);
      }
    });

    keys.forEach((k,idx) => {
      const z = idx*4 - keys.length*2;

      const hBar = new THREE.Mesh(
        new THREE.BoxGeometry(40,0.06,0.06),
        new THREE.MeshStandardMaterial({color:uiTheme==="Dark"?0x64748b:0x94a3b8,roughness:1})
      );
      hBar.position.set(0,0,z); scene.add(hBar);

      const vBar = new THREE.Mesh(
        new THREE.BoxGeometry(0.06,30,0.06),
        new THREE.MeshStandardMaterial({color:uiTheme==="Dark"?0x475569:0x94a3b8,roughness:1,transparent:true,opacity:0.5})
      );
      vBar.position.set(0,0,z); scene.add(vBar);

      const lc=document.createElement("canvas"); lc.width=220; lc.height=58;
      const lx=lc.getContext("2d");
      lx.fillStyle=uiTheme==="Dark"?"rgba(15,23,42,0.95)":"rgba(255,255,255,0.96)";
      lx.roundRect(2,2,216,54,8); lx.fill();
      lx.strokeStyle="#6366f1"; lx.lineWidth=1.5; lx.roundRect(2,2,216,54,8); lx.stroke();
      lx.font="bold 22px Arial";
      lx.fillStyle=uiTheme==="Dark"?"#e2e8f0":"#334155";
      lx.textAlign="center"; lx.textBaseline="middle"; lx.fillText(k,110,29);
      const ls=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(lc),transparent:true}));
      ls.scale.set(5.5,1.4,1);
      ls.position.set(0,17,z); scene.add(ls);

      const domain = xScales[k].domain();
      [[-20,domain[0]],[20,domain[1]]].forEach(([xp,val]) => {
        const vc=document.createElement("canvas"); vc.width=100; vc.height=40;
        const vx=vc.getContext("2d");
        vx.fillStyle=uiTheme==="Dark"?"rgba(15,23,42,0.95)":"rgba(255,255,255,0.93)";
        vx.roundRect(2,2,96,36,5); vx.fill();
        vx.font="bold 16px Arial";
        vx.fillStyle=uiTheme==="Dark"?"#94a3b8":"#64748b";
        vx.textAlign="center"; vx.textBaseline="middle"; vx.fillText(val.toFixed(0),50,20);
        const vs=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(vc),transparent:true}));
        vs.scale.set(2.2,0.9,1);
        vs.position.set(xp,-17,z); scene.add(vs);
      });
    });

    // Drag rotation + FIX: real auto-rotate
    let isDragging=false, prevX=0, prevY=0, rotY=0, rotX=0.32;
    let autoRotate = true;
    let resumeTimeout = null;
    const R=65;
    const posCamera=()=>{
      camera.position.set(R*Math.sin(rotY)*Math.cos(rotX),R*Math.sin(rotX)+5,R*Math.cos(rotY)*Math.cos(rotX));
      camera.lookAt(0,5,0);
    };
    posCamera();

    const onDown=e=>{
      isDragging=true;
      autoRotate=false;
      if (resumeTimeout) clearTimeout(resumeTimeout);
      prevX=e.clientX??e.touches?.[0]?.clientX; prevY=e.clientY??e.touches?.[0]?.clientY;
      canvas.style.cursor="grabbing";
    };
    const onUp=()=>{
      isDragging=false;
      canvas.style.cursor="grab";
      // FIX: resume auto-rotation a moment after the user lets go
      if (resumeTimeout) clearTimeout(resumeTimeout);
      resumeTimeout = setTimeout(()=>{ autoRotate=true; }, 1200);
    };
    const onMove=e=>{
      if(!isDragging)return;
      const cx=e.clientX??e.touches?.[0]?.clientX, cy=e.clientY??e.touches?.[0]?.clientY;
      rotY-=(cx-prevX)*0.007;
      rotX=Math.max(0.05,Math.min(1.1,rotX+(cy-prevY)*0.005));
      prevX=cx; prevY=cy; posCamera();
    };

    canvas.addEventListener("mousedown",onDown);
    window.addEventListener("mouseup",onUp);
    window.addEventListener("mousemove",onMove);
    canvas.addEventListener("touchstart",onDown,{passive:true});
    canvas.addEventListener("touchend",onUp);
    canvas.addEventListener("touchmove",onMove,{passive:true});
    canvas.style.cursor="grab";

    const rsObs=new ResizeObserver(entries=>{
      const nW=entries[0].contentRect.width;
      if(nW>10&&!disposed){renderer.setSize(nW,H);camera.aspect=nW/H;camera.updateProjectionMatrix();}
    });
    rsObs.observe(canvas.parentElement||canvas);
    canvas._rsObs=rsObs;

    const animate=()=>{
      if(disposed)return;
      animId=requestAnimationFrame(animate);
      // FIX: gentle continuous spin whenever the user isn't dragging
      if (autoRotate) {
        rotY += 0.0035;
        posCamera();
      }
      renderer.render(scene,camera);
    };
    animate();

    return ()=>{
      disposed=true;
      cancelAnimationFrame(animId);
      if (resumeTimeout) clearTimeout(resumeTimeout);
      if(canvas._rsObs) canvas._rsObs.disconnect();
      canvas.removeEventListener("mousedown",onDown);
      window.removeEventListener("mouseup",onUp);
      window.removeEventListener("mousemove",onMove);
      canvas.removeEventListener("touchstart",onDown);
      canvas.removeEventListener("touchend",onUp);
      canvas.removeEventListener("touchmove",onMove);
      renderer.dispose();
    };
  },[view, uiTheme, colorTheme, rawData]);

  const T = UI_THEMES[uiTheme];
  const ddStyle = {
    padding:"5px 10px", borderRadius:6, border:`1px solid ${T.border}`,
    background:uiTheme==="Dark"?"#1e293b":"#fff",
    color:T.text, fontWeight:"500", cursor:"pointer", fontSize:12, outline:"none",
  };

  return (
    <div style={{background:T.bg,borderRadius:12,padding:"20px 24px 32px",width:"100%",boxSizing:"border-box",fontFamily:"Inter,system-ui,sans-serif"}}>
      <div style={{marginBottom:4}}>
        <div style={{fontSize:16,fontWeight:"bold",color:T.text}}>Parallel Coordinates – Cars Dataset</div>
        <div style={{fontSize:12,color:T.subtext,marginTop:2}}>cars.csv · Multi-dimensional visualization · Hover a line for details</div>
      </div>

      <div style={{display:"flex",gap:16,alignItems:"flex-end",marginTop:14,marginBottom:20,flexWrap:"wrap"}}>
        {[
          ["View",        [["2D","2D"],["3D","3D"]],              view,       setView],
          ["UI Theme",    Object.keys(UI_THEMES).map(t=>[t,t]),   uiTheme,    setUiTheme],
          ["Color Theme", Object.keys(COLOR_THEMES).map(t=>[t,t]),colorTheme, setColorTheme],
        ].map(([lbl,opts,val,set])=>(
          <div key={lbl} style={{display:"flex",flexDirection:"column",gap:3}}>
            <label style={{fontSize:11,color:T.subtext,fontWeight:"600"}}>{lbl}</label>
            <select value={val} onChange={e=>set(e.target.value)} style={ddStyle}>
              {opts.map(([v,l])=><option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        ))}
      </div>

      {view==="3D"&&<p style={{fontSize:11,color:T.subtext,marginBottom:8}}>🖱️ Drag to rotate — it auto-rotates when you let go</p>}

      <div style={{display:"flex",gap:14,alignItems:"flex-start",width:"100%"}}>
        <div style={{flex:1,minWidth:0,border:`1px solid ${T.border}`,borderRadius:10,overflow:"hidden"}}>
          {view==="2D" && <div ref={outerRef} style={{display:"block",width:"100%",background:T.bg,borderRadius:8}}/>}
          {view==="3D" && (
            <div style={{position:"relative",width:"100%",background:T.bg,borderRadius:8}}>
              <canvas
                ref={canvasRef}
                style={{display:"block",width:"100%",height:520,cursor:"grab"}}
              />
              <div style={{padding:"7px 14px",background:T.bg,borderTop:`1px solid ${T.border}`,fontSize:11,color:T.subtext}}>
                🖱️ Drag to rotate · auto-rotates otherwise
              </div>
            </div>
          )}
        </div>
        <StatsPanel data={rawData} theme={uiTheme} colorTheme={colorTheme}/>
      </div>
    </div>
  );
}