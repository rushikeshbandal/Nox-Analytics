import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import * as THREE from "three";

const UI_THEMES = {
  Light: { bg:"#ffffff", chartBg:"#f8fafc", text:"#1e293b", axis:"#64748b", grid:"#e2e8f0", card:"#ffffff", border:"#e2e8f0", subtext:"#94a3b8", threeBg:0xf8fafc },
  Dark:  { bg:"#0f172a", chartBg:"#1e293b", text:"#f1f5f9", axis:"#94a3b8", grid:"#334155", card:"#1e293b", border:"#334155", subtext:"#64748b", threeBg:0x0f172a },
};

// ── Color palettes — warm/cold pairs per theme ──────────────────────────────
const COLOR_THEMES = {
  Classic:  { warm:"#fc8d59", cold:"#91bfdb", sf:"#1e293b",  ny:"#94a3b8"  },
  Vivid:    { warm:"#ef4444", cold:"#3b82f6", sf:"#7c3aed",  ny:"#64748b"  },
  Sunset:   { warm:"#f97316", cold:"#06b6d4", sf:"#0f172a",  ny:"#94a3b8"  },
  Forest:   { warm:"#22c55e", cold:"#a855f7", sf:"#14532d",  ny:"#6b7280"  },
  Ocean:    { warm:"#fbbf24", cold:"#0ea5e9", sf:"#0c4a6e",  ny:"#94a3b8"  },
  Candy:    { warm:"#ec4899", cold:"#8b5cf6", sf:"#1e293b",  ny:"#94a3b8"  },
};

// ─── Stats Panel ──────────────────────────────────────────────────────────────
function StatsPanel({ data, theme, colorTheme }) {
  const T   = UI_THEMES[theme];
  const COL = COLOR_THEMES[colorTheme];
  if (!data || !data.length) return null;

  const warmDays = data.filter(d => d.value0 > d.value1).length;
  const coldDays = data.filter(d => d.value0 < d.value1).length;
  const maxDiff  = d3.greatest(data, d => d.value0 - d.value1);
  const minDiff  = d3.least(data,    d => d.value0 - d.value1);
  const avgSF    = d3.mean(data, d => d.value0).toFixed(1);
  const avgNY    = d3.mean(data, d => d.value1).toFixed(1);

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
    <div style={{ width:175, flexShrink:0 }}>
      <div style={{ fontSize:10, fontWeight:"bold", color:T.subtext, letterSpacing:"0.08em", marginBottom:8 }}>STATS</div>
      {card("☀️ SF Warmer Days",  `${warmDays} days`,  "SF > NY temperature", COL.warm)}
      {card("❄️ SF Colder Days",  `${coldDays} days`,  "SF < NY temperature", COL.cold)}
      {card("🌡 Avg SF Temp",     `${avgSF}°F`,         "San Francisco",        "#6366f1")}
      {card("🌡 Avg NY Temp",     `${avgNY}°F`,         "New York",             "#8b5cf6")}
      {maxDiff && card("🔥 Max SF Lead", `+${(maxDiff.value0-maxDiff.value1).toFixed(1)}°F`, d3.timeFormat("%b %d, %Y")(maxDiff.date), COL.warm)}
      {minDiff && card("🧊 Max NY Lead", `+${(minDiff.value1-minDiff.value0).toFixed(1)}°F`, d3.timeFormat("%b %d, %Y")(minDiff.date), COL.cold)}

      {/* Color scheme preview */}
      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:"10px 12px" }}>
        <div style={{ fontSize:10, color:T.subtext, fontWeight:600, marginBottom:8 }}>COLOR SCHEMES</div>
        {Object.entries(COLOR_THEMES).map(([k, v]) => (
          <div key={k} style={{ marginBottom:7 }}>
            <div style={{ fontSize:10, color:T.text, marginBottom:3, fontWeight: k===colorTheme?"700":"400" }}>{k}</div>
            <div style={{ display:"flex", gap:3 }}>
              <div style={{ flex:1, height:6, borderRadius:3, background:v.warm, opacity:k===colorTheme?1:0.4 }} />
              <div style={{ flex:1, height:6, borderRadius:3, background:v.cold, opacity:k===colorTheme?1:0.4 }} />
            </div>
          </div>
        ))}
        <div style={{ borderTop:`1px solid ${T.border}`, marginTop:8, paddingTop:8 }}>
          <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:5 }}>
            <div style={{ width:20, height:3, background:COL.warm, borderRadius:2 }} />
            <span style={{ fontSize:10, color:T.text }}>Expenses higher than Revenue</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:5 }}>
            <div style={{ width:20, height:3, background:COL.cold, borderRadius:2 }} />
            <span style={{ fontSize:10, color:T.text }}>Expenses lower than Revenue</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:5 }}>
            <div style={{ width:20, height:3, background:COL.sf, borderRadius:2 }} />
            <span style={{ fontSize:10, color:T.text }}>Monthly Clinic Expenses</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:7 }}>
            <div style={{ width:20, height:3, background:COL.ny, borderRadius:2 }} />
            <span style={{ fontSize:10, color:T.text }}>Monthly Clinic Revenue</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 2D Chart ─────────────────────────────────────────────────────────────────
function Chart2D({ theme, colorTheme, onData }) {
  const wrapRef = useRef(null);
  const T   = UI_THEMES[theme];
  const COL = COLOR_THEMES[colorTheme];

  useEffect(() => {
    if (!wrapRef.current) return;
    const parseDate = d3.timeParse("%Y%m%d");

    d3.tsv("/weather.tsv", d => ({
      date:   parseDate(d.date),
      value0: +d["San Francisco"],
      value1: +d["New York"],
    })).then(raw => {
      const data = raw.filter(d => d.date instanceof Date && !isNaN(d.value0) && !isNaN(d.value1));
      if (!data.length) return;
      onData(data);

      const W = wrapRef.current.clientWidth || 680;
      const H = 440;
      const margin = { top:32, right:24, bottom:40, left:54 };

      d3.select(wrapRef.current).selectAll("*").remove();

      const x = d3.scaleTime()
        .domain(d3.extent(data, d => d.date))
        .range([margin.left, W - margin.right]);

      const y = d3.scaleLinear()
        .domain([
          d3.min(data, d => Math.min(d.value0, d.value1)),
          d3.max(data, d => Math.max(d.value0, d.value1)),
        ]).nice()
        .range([H - margin.bottom, margin.top]);

      const svg = d3.select(wrapRef.current).append("svg")
        .attr("width", W).attr("height", H)
        .style("background", T.chartBg).style("border-radius","8px")
        .style("font","10px sans-serif");

      // Y grid
      svg.append("g").attr("transform",`translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(8).tickFormat("").tickSize(-(W-margin.left-margin.right)))
        .call(g => { g.select(".domain").remove(); g.selectAll("line").style("stroke",T.grid).style("stroke-dasharray","3,3"); });

      // Tooltip
      const tooltip = d3.select("body").append("div")
        .style("position","absolute").style("background","rgba(15,23,42,0.92)")
        .style("color","#fff").style("padding","8px 12px").style("border-radius","6px")
        .style("font-size","12px").style("pointer-events","none").style("opacity",0)
        .style("z-index","9999").style("line-height","1.7");

      // Clip paths
      const defs = svg.append("defs");
      defs.append("clipPath").attr("id","clip-above")
        .append("path").attr("d",
          d3.area().curve(d3.curveStep).x(d=>x(d.date)).y0(0).y1(d=>y(d.value1))(data));
      defs.append("clipPath").attr("id","clip-below")
        .append("path").attr("d",
          d3.area().curve(d3.curveStep).x(d=>x(d.date)).y0(H).y1(d=>y(d.value1))(data));

      // Warm area (SF above NY)
      svg.append("path").datum(data)
        .attr("clip-path","url(#clip-above)").attr("fill",COL.warm).attr("opacity",0.75)
        .attr("d", d3.area().curve(d3.curveStep).x(d=>x(d.date)).y0(H).y1(d=>y(d.value0)));

      // Cold area (SF below NY)
      svg.append("path").datum(data)
        .attr("clip-path","url(#clip-below)").attr("fill",COL.cold).attr("opacity",0.75)
        .attr("d", d3.area().curve(d3.curveStep).x(d=>x(d.date)).y0(0).y1(d=>y(d.value0)));

      // NY line
      svg.append("path").datum(data)
        .attr("fill","none").attr("stroke",COL.ny).attr("stroke-width",1.2)
        .attr("d", d3.line().curve(d3.curveStep).x(d=>x(d.date)).y(d=>y(d.value1)));

      // SF line
      svg.append("path").datum(data)
        .attr("fill","none").attr("stroke",COL.sf).attr("stroke-width",1.8)
        .attr("stroke-linejoin","round").attr("stroke-linecap","round")
        .attr("d", d3.line().curve(d3.curveStep).x(d=>x(d.date)).y(d=>y(d.value0)));

      // Hover
      const focus = svg.append("g").style("display","none");
      focus.append("line").attr("y1",margin.top).attr("y2",H-margin.bottom)
        .attr("stroke","#94a3b8").attr("stroke-width",1).attr("stroke-dasharray","4,3").attr("opacity",0.6);
      focus.append("circle").attr("id","dot-sf").attr("r",4).attr("fill",COL.sf).attr("stroke","#fff").attr("stroke-width",1.5);
      focus.append("circle").attr("id","dot-ny").attr("r",4).attr("fill",COL.ny).attr("stroke","#fff").attr("stroke-width",1.5);

      const bisect = d3.bisector(d=>d.date).left;
      svg.append("rect")
        .attr("x",margin.left).attr("y",margin.top)
        .attr("width",W-margin.left-margin.right).attr("height",H-margin.top-margin.bottom)
        .attr("fill","transparent").style("cursor","crosshair")
        .on("mousemove", function(event) {
          const mx=d3.pointer(event,this)[0];
          const dt=x.invert(mx+margin.left);
          const idx=Math.min(bisect(data,dt,1),data.length-1);
          const d0=data[idx-1]||data[0], d1=data[idx]||d0;
          const d=dt-d0.date<d1.date-dt?d0:d1;
          const cx=x(d.date);
          const diff=d.value0-d.value1;
          focus.style("display","block");
          focus.select("line").attr("x1",cx).attr("x2",cx);
          focus.select("#dot-sf").attr("cx",cx).attr("cy",y(d.value0));
          focus.select("#dot-ny").attr("cx",cx).attr("cy",y(d.value1));
          tooltip.style("opacity",1)
            .style("border",`1.5px solid ${diff>0?COL.warm:COL.cold}`)
            .html(
              `<div style="font-weight:700;margin-bottom:4px">${d3.timeFormat("%b %d, %Y")(d.date)}</div>` +
              `🏥 Expenses: <b>₹${d.value0.toFixed(0)}K</b><br/>📈 Revenue: <b>₹${d.value1.toFixed(0)}K</b><br/>` +
              `Diff: <b style="color:${diff>0?COL.warm:COL.cold}">${diff>0?"+":""}${diff.toFixed(1)}K</b>`
            )
            .style("left",(event.pageX+14)+"px").style("top",(event.pageY-14)+"px");
        })
        .on("mouseleave",()=>{ focus.style("display","none"); tooltip.style("opacity",0); });

      // X axis
      svg.append("g").attr("transform",`translate(0,${H-margin.bottom})`)
        .call(d3.axisBottom(x).ticks(W/80).tickSizeOuter(0))
        .call(g => { g.select(".domain").style("stroke",T.grid); g.selectAll("text").style("fill",T.axis).style("font-size","10px"); g.selectAll("line").style("stroke",T.grid); });

      // Y axis
      svg.append("g").attr("transform",`translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(8).tickFormat(d=>`₹${d}K`))
        .call(g => { g.select(".domain").remove(); g.selectAll("line").remove(); g.selectAll("text").style("fill",T.axis).style("font-size","10px"); });

      svg.append("text").attr("x",margin.left).attr("y",margin.top-10)
        .attr("fill",T.text).attr("font-size","11px").attr("font-weight","600")
        .text("↑ Amount (INR in Thousands)");

      // Clinic labels at right edge
      const last=data[data.length-1];
      [["Expenses",last.value0,COL.sf],["Revenue",last.value1,COL.ny]].forEach(([city,val,col])=>{
        svg.append("text").attr("x",x(last.date)+5).attr("y",y(val))
          .attr("dy","0.35em").attr("font-size","10px").attr("font-weight","700").attr("fill",col)
          .text(city);
      });

      return () => tooltip.remove();
    });
  }, [theme, colorTheme]);

  return <div ref={wrapRef} style={{ border:`1px solid ${T.border}`, borderRadius:8, overflow:"hidden", width:"100%" }} />;
}

// ─── 3D Chart ─────────────────────────────────────────────────────────────────
function Chart3D({ theme, colorTheme }) {
  const mountRef   = useRef(null);
  const overlayRef = useRef(null);
  const T   = UI_THEMES[theme];
  const COL = COLOR_THEMES[colorTheme];

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    while (el.firstChild) el.removeChild(el.firstChild);

    let animId, renderer, cleanupFn;

    const init = (W) => {
      if (renderer) return;
      const H = 460;

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
      const floor=new THREE.Mesh(new THREE.PlaneGeometry(30,20),
        new THREE.MeshStandardMaterial({color:floorC,roughness:0.9}));
      floor.rotation.x=-Math.PI/2; floor.position.y=-7.5;
      floor.receiveShadow=true; scene.add(floor);
      const grid=new THREE.GridHelper(30,24,gridC,gridC);
      grid.position.y=-7.45; scene.add(grid);

      const pivot=new THREE.Group();
      const labelAnchors=[];
      const parseDate=d3.timeParse("%Y%m%d");

      d3.tsv("/weather.tsv", d => ({
        date:   parseDate(d.date),
        value0: +d["San Francisco"],
        value1: +d["New York"],
      })).then(raw => {
        const data=raw.filter(d=>d.date instanceof Date && !isNaN(d.value0) && !isNaN(d.value1));
        if (!data.length) return;

        const dateExtent=d3.extent(data,d=>d.date);
        const allVals=data.flatMap(d=>[d.value0,d.value1]);
        const xScale=d3.scaleTime().domain(dateExtent).range([-9,9]);
        const yScale=d3.scaleLinear().domain(d3.extent(allVals)).nice().range([-6,6]);

        const colSF   = new THREE.Color(COL.sf);
        const colNY   = new THREE.Color(COL.ny);
        const colWarm = new THREE.Color(COL.warm);
        const colCold = new THREE.Color(COL.cold);

        for (let i=0;i<data.length-1;i++) {
          // SF tube (front)
          const p1=new THREE.Vector3(xScale(data[i].date),   yScale(data[i].value0),   0.3);
          const p2=new THREE.Vector3(xScale(data[i+1].date), yScale(data[i+1].value0), 0.3);
          pivot.add(new THREE.Mesh(
            new THREE.TubeGeometry(new THREE.LineCurve3(p1,p2),3,0.055,5,false),
            new THREE.MeshStandardMaterial({color:colSF,roughness:0.22,metalness:0.45,emissive:colSF,emissiveIntensity:0.20})
          ));

          // NY tube (back)
          const n1=new THREE.Vector3(xScale(data[i].date),   yScale(data[i].value1),   -0.3);
          const n2=new THREE.Vector3(xScale(data[i+1].date), yScale(data[i+1].value1), -0.3);
          pivot.add(new THREE.Mesh(
            new THREE.TubeGeometry(new THREE.LineCurve3(n1,n2),3,0.04,5,false),
            new THREE.MeshStandardMaterial({color:colNY,roughness:0.25,metalness:0.40,transparent:true,opacity:0.85})
          ));

          // Difference fill
          const diff=data[i].value0-data[i].value1;
          const fillCol=diff>0?colWarm:colCold;
          const sfY=yScale(data[i].value0),   nyY=yScale(data[i].value1);
          const sfY2=yScale(data[i+1].value0),nyY2=yScale(data[i+1].value1);
          const x1=xScale(data[i].date),x2=xScale(data[i+1].date);
          const geo=new THREE.BufferGeometry();
          geo.setAttribute("position",new THREE.BufferAttribute(new Float32Array([
            x1,sfY,0, x1,nyY,0, x2,sfY2,0,
            x1,nyY,0, x2,nyY2,0, x2,sfY2,0,
          ]),3));
          geo.computeVertexNormals();
          pivot.add(new THREE.Mesh(geo,new THREE.MeshStandardMaterial({
            color:fillCol,roughness:0.4,metalness:0.1,
            transparent:true,opacity:0.45,side:THREE.DoubleSide,
          })));
        }

        // Max diff glow dots
        const maxDiff=d3.greatest(data,d=>d.value0-d.value1);
        const minDiff=d3.least(data,d=>d.value0-d.value1);
        [[maxDiff,colWarm,`🔥 SF +${(maxDiff.value0-maxDiff.value1).toFixed(1)}°F`],
         [minDiff,colCold,`❄️ NY +${(minDiff.value1-minDiff.value0).toFixed(1)}°F`]
        ].forEach(([d,col,label])=>{
          const dot=new THREE.Mesh(
            new THREE.SphereGeometry(0.18,16,16),
            new THREE.MeshStandardMaterial({color:col,roughness:0.1,metalness:0.6,emissive:col,emissiveIntensity:0.7})
          );
          dot.position.set(xScale(d.date),yScale(d.value0),0.3); pivot.add(dot);
          labelAnchors.push({pos:new THREE.Vector3(xScale(d.date),yScale(d.value0)+0.75,0.3),text:label,type:"val"});
        });

        // Month labels
        d3.timeMonth.every(2).range(dateExtent[0],dateExtent[1]).forEach(m=>{
          labelAnchors.push({pos:new THREE.Vector3(xScale(m),-7.8,0),text:d3.timeFormat("%b %Y")(m),type:"date"});
        });

        // Temp labels
        yScale.ticks(6).forEach(v=>{
          labelAnchors.push({pos:new THREE.Vector3(-10.2,yScale(v),0),text:`${v}°F`,type:"temp"});
        });

        // City labels
        const last=data[data.length-1];
        labelAnchors.push({pos:new THREE.Vector3(9.5,yScale(last.value0)+0.5,0.3),text:"SF",type:"city"});
        labelAnchors.push({pos:new THREE.Vector3(9.5,yScale(last.value1)-0.5,-0.3),text:"NY",type:"city"});

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
  },[theme,colorTheme]);

  const jsxLabels=Array.from({length:20},(_,i)=>({
    type:i<2?"val":i<8?"date":i<14?"temp":"city",
  }));

  return (
    <div style={{position:"relative",userSelect:"none",
      border:`1px solid ${T.border}`,borderRadius:8,overflow:"hidden",width:"100%"}}>
      <div ref={mountRef} style={{width:"100%",height:460,cursor:"grab",overflow:"hidden"}}/>
      <div ref={overlayRef} style={{position:"absolute",inset:0,pointerEvents:"none",overflow:"hidden"}}>
        {jsxLabels.map((a,i)=>(
          <div key={i} className="shlbl" style={{
            position:"absolute",
            transform:a.type==="temp"?"translate(-100%,-50%)":a.type==="date"?"translate(-50%,0%)":"translate(-50%,-100%)",
            background:theme==="Dark"?"rgba(15,23,42,0.92)":"rgba(255,255,255,0.95)",
            color:T.text,fontSize:a.type==="val"?10:8,fontWeight:"600",
            padding:a.type==="val"?"3px 7px":"2px 5px",
            borderRadius:3,border:`1px solid ${T.border}`,
            whiteSpace:"nowrap",pointerEvents:"none",
            boxShadow:"0 1px 3px rgba(0,0,0,0.08)",opacity:0,
          }}/>
        ))}
      </div>
      <div style={{padding:"7px 14px",background:T.chartBg,
        borderTop:`1px solid ${T.border}`,fontSize:11,color:T.subtext}}>
        💡 Drag to rotate · auto-spins ·
        <span style={{color:COL.warm,fontWeight:700,marginLeft:6}}>■ SF warmer</span>
        <span style={{color:COL.cold,fontWeight:700,marginLeft:8}}>■ SF colder</span>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function DifferenceChart() {
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
          Difference Chart — SF vs NY Temperature
        </div>
        <div style={{fontSize:12,color:T.subtext,marginTop:2}}>
          San Francisco vs New York · Daily temps · Oct 2011–Sep 2012
        </div>
      </div>

      {/* ── Controls — same pattern as all other charts ── */}
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