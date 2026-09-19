import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import * as THREE from "three";

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

const CHART_TYPES = ["Line","Bar","Radar"];

// ── Stable sample data ────────────────────────────────────────────────────────
const RASTER_DATA = [
  { time:"Oct",  value:65, volume:450 },
  { time:"Nov",  value:72, volume:520 },
  { time:"Dec",  value:80, volume:480 },
  { time:"Jan",  value:75, volume:610 },
  { time:"Feb",  value:88, volume:490 },
  { time:"Mar",  value:82, volume:570 },
  { time:"Apr",  value:91, volume:530 },
  { time:"May",  value:78, volume:600 },
];

const VECTOR_DATA = [
  { name:"Performance", value:78 },
  { name:"Accuracy",    value:65 },
  { name:"Speed",       value:82 },
  { name:"Reliability", value:71 },
  { name:"Quality",     value:88 },
];

// ─── Shared Legend ────────────────────────────────────────────────────────────
function LegendHTML({ theme, chartType }) {
  const [c1,c2,c3] = THEMES[theme];
  const items = chartType === "Radar"
    ? VECTOR_DATA.map((d,i) => ({ col:THEMES[theme][i%5], label:d.name, val:`${d.value}` }))
    : [
        { col:c1, label:"Primary Value",  val:null },
        { col:c2, label:"Volume / Projected", val:null },
        { col:c3, label:"Average",        val:null },
      ];

  return (
    <div style={{
      background:"#fff", border:"1px solid #e2e8f0", borderRadius:8,
      padding:"12px 14px", width:160, flexShrink:0,
      boxShadow:"0 1px 4px rgba(0,0,0,0.07)", alignSelf:"flex-start",
    }}>
      <div style={{ fontSize:10, fontWeight:"bold", color:"#94a3b8", letterSpacing:"0.08em", marginBottom:10 }}>
        {chartType === "Radar" ? "METRICS" : "SERIES"}
      </div>
      {items.map(({ col,label,val }) => (
        <div key={label} style={{ display:"flex", alignItems:"center", gap:7, marginBottom:7 }}>
          <div style={{ width:10, height:10, borderRadius:2, flexShrink:0, background:col }} />
          <span style={{ color:"#334155", fontSize:11, flex:1 }}>{label}</span>
          {val && <span style={{ color:col, fontSize:10, fontWeight:"bold" }}>{val}</span>}
        </div>
      ))}
      <div style={{ borderTop:"1px solid #e2e8f0", marginTop:8, paddingTop:8 }}>
        <div style={{ fontSize:10, fontWeight:"bold", color:"#94a3b8", letterSpacing:"0.08em", marginBottom:6 }}>
          SUMMARY
        </div>
        <div style={{ fontSize:10, color:"#64748b" }}>
          Points: <b style={{ color:"#334155" }}>{RASTER_DATA.length}</b>
        </div>
        <div style={{ fontSize:10, color:"#64748b" }}>
          Metrics: <b style={{ color:"#334155" }}>{VECTOR_DATA.length}</b>
        </div>
        <div style={{ fontSize:10, color:"#64748b" }}>
          Avg value: <b style={{ color:"#334155" }}>
            {Math.round(RASTER_DATA.reduce((s,d)=>s+d.value,0)/RASTER_DATA.length)}
          </b>
        </div>
      </div>
    </div>
  );
}

// ─── 2D Chart ─────────────────────────────────────────────────────────────────
function Chart2D({ theme, chartType }) {
  const svgRef  = useRef(null);
  const palette = THEMES[theme];

  useEffect(() => {
    if (!svgRef.current) return;
    const W = 620, H = 380;
    const margin = { top:20, right:20, bottom:46, left:48 };
    const cW = W - margin.left - margin.right;
    const cH = H - margin.top  - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox",`0 0 ${W} ${H}`).attr("preserveAspectRatio","xMidYMid meet");
    svg.append("rect").attr("width",W).attr("height",H).attr("fill","#f8fafc").attr("rx",8);

    const tooltip = d3.select("body").append("div")
      .style("position","absolute").style("background","rgba(15,23,42,0.92)")
      .style("color","#fff").style("padding","8px 12px").style("border-radius","6px")
      .style("font-size","12px").style("pointer-events","none").style("opacity",0)
      .style("border","1px solid #334155").style("z-index","9999");

    if (chartType === "Radar") {
      // ── Radar ──────────────────────────────────────────────────────────────
      const cx = W/2, cy = H/2+8;
      const R  = Math.min(cW, cH) / 2 - 20;
      const n  = VECTOR_DATA.length;
      const maxV = d3.max(VECTOR_DATA, d=>d.value);
      const chart = svg.append("g");

      // Grid rings
      [0.25,0.5,0.75,1].forEach(frac => {
        const pts = VECTOR_DATA.map((_,i) => {
          const a = (i/n)*2*Math.PI - Math.PI/2;
          return [cx + Math.cos(a)*R*frac, cy + Math.sin(a)*R*frac];
        });
        chart.append("polygon")
          .attr("points", pts.map(p=>p.join(",")).join(" "))
          .attr("fill","none").attr("stroke","#e2e8f0").attr("stroke-width",1);
        chart.append("text")
          .attr("x",cx+4).attr("y",cy-R*frac-3)
          .style("font-size","8px").style("fill","#94a3b8")
          .text(Math.round(maxV*frac));
      });

      // Axes + labels
      VECTOR_DATA.forEach((d,i) => {
        const a  = (i/n)*2*Math.PI - Math.PI/2;
        const x1 = cx + Math.cos(a)*R, y1 = cy + Math.sin(a)*R;
        chart.append("line").attr("x1",cx).attr("y1",cy).attr("x2",x1).attr("y2",y1)
          .attr("stroke","#e2e8f0").attr("stroke-width",1);
        const lx = cx + Math.cos(a)*(R+22), ly = cy + Math.sin(a)*(R+22);
        chart.append("text").attr("x",lx).attr("y",ly)
          .attr("text-anchor","middle").attr("dominant-baseline","middle")
          .style("font-size","10px").style("font-weight","700").style("fill","#334155")
          .text(d.name);
      });

      // Gradient defs
      const defs = svg.append("defs");
      const gr   = defs.append("radialGradient").attr("id","rgrd");
      gr.append("stop").attr("offset","0%").attr("stop-color",palette[0]).attr("stop-opacity",0.5);
      gr.append("stop").attr("offset","100%").attr("stop-color",palette[0]).attr("stop-opacity",0.1);

      // Data polygon
      const pts = VECTOR_DATA.map((d,i) => {
        const a = (i/n)*2*Math.PI - Math.PI/2;
        const r = (d.value/maxV)*R;
        return [cx+Math.cos(a)*r, cy+Math.sin(a)*r];
      });
      chart.append("polygon")
        .attr("points",pts.map(p=>p.join(",")).join(" "))
        .attr("fill","url(#rgrd)").attr("stroke",palette[0]).attr("stroke-width",2).attr("opacity",0.85);

      // Points + value labels
      VECTOR_DATA.forEach((d,i) => {
        const a  = (i/n)*2*Math.PI - Math.PI/2;
        const r  = (d.value/maxV)*R;
        const px = cx+Math.cos(a)*r, py = cy+Math.sin(a)*r;
        chart.append("circle").attr("cx",px).attr("cy",py).attr("r",5)
          .attr("fill",palette[i%5]).attr("stroke","#fff").attr("stroke-width",1.5)
          .style("cursor","pointer")
          .on("mouseover", function(event) {
            d3.select(this).attr("r",8);
            tooltip.style("opacity",1)
              .html(`<b style="color:${palette[i%5]}">${d.name}</b><br/>Value: <b>${d.value}</b>`)
              .style("left",(event.pageX+12)+"px").style("top",(event.pageY-10)+"px");
          })
          .on("mouseout", function() { d3.select(this).attr("r",5); tooltip.style("opacity",0); });
        chart.append("text").attr("x",px).attr("y",py-9)
          .attr("text-anchor","middle").style("font-size","9px").style("font-weight","700")
          .style("fill",palette[i%5]).style("pointer-events","none").text(d.value);
      });

    } else if (chartType === "Bar") {
      // ── Bar ────────────────────────────────────────────────────────────────
      const chart = svg.append("g").attr("transform",`translate(${margin.left},${margin.top})`);
      const x     = d3.scaleBand().domain(RASTER_DATA.map(d=>d.time)).range([0,cW]).padding(0.28);
      const y     = d3.scaleLinear().domain([0,110]).range([cH,0]);

      y.ticks(5).forEach(v => {
        chart.append("line").attr("x1",0).attr("x2",cW).attr("y1",y(v)).attr("y2",y(v))
          .attr("stroke","#e2e8f0").attr("stroke-dasharray","4,3").attr("stroke-width",1);
      });

      const defs = svg.append("defs");
      RASTER_DATA.forEach((_,i) => {
        const gr = defs.append("linearGradient").attr("id",`bg${i}-${theme}`)
          .attr("x1","0%").attr("x2","0%").attr("y1","0%").attr("y2","100%");
        gr.append("stop").attr("offset","0%").attr("stop-color",palette[0]).attr("stop-opacity",0.95);
        gr.append("stop").attr("offset","100%").attr("stop-color",d3.color(palette[0]).darker(0.5).formatHex()).attr("stop-opacity",0.9);
      });

      RASTER_DATA.forEach((d,i) => {
        const bx = x(d.time), bw = x.bandwidth(), by = y(d.value), bh = cH-y(d.value);
        // Shadow
        chart.append("rect").attr("x",bx+3).attr("y",by+3).attr("width",bw).attr("height",bh)
          .attr("fill","#cbd5e1").attr("rx",4).attr("opacity",0.3);
        // Bar
        chart.append("rect").attr("x",bx).attr("y",cH).attr("width",bw).attr("height",0)
          .attr("fill",`url(#bg${i}-${theme})`).attr("rx",4).attr("opacity",0.92)
          .style("cursor","pointer")
          .on("mouseover", function(event) {
            d3.select(this).attr("opacity",1).attr("stroke","#fff").attr("stroke-width",1.5);
            tooltip.style("opacity",1)
              .html(`<b style="color:${palette[0]}">${d.time}</b><br/>Value: <b>${d.value}</b><br/>Volume: ${d.volume}`)
              .style("left",(event.pageX+12)+"px").style("top",(event.pageY-10)+"px");
          })
          .on("mouseout", function() { d3.select(this).attr("opacity",0.92).attr("stroke","none"); tooltip.style("opacity",0); })
          .transition().duration(600).delay(i*50).attr("y",by).attr("height",bh);
        // Label
        chart.append("text").attr("x",bx+bw/2).attr("y",by-5)
          .attr("text-anchor","middle").style("font-size","9px").style("font-weight","700")
          .style("fill",palette[0]).style("pointer-events","none").text(d.value);
      });

      chart.append("g").attr("transform",`translate(0,${cH})`)
        .call(d3.axisBottom(x).tickSize(0))
        .call(g => { g.select(".domain").style("stroke","#e2e8f0"); g.selectAll("text").style("fill","#334155").style("font-size","10px"); });

      chart.append("g")
        .call(d3.axisLeft(y).ticks(5))
        .call(g => { g.select(".domain").remove(); g.selectAll("line").remove(); g.selectAll("text").style("fill","#94a3b8").style("font-size","10px"); });

      svg.append("text").attr("transform",`translate(${margin.left+cW/2},${H-4})`).attr("text-anchor","middle")
        .style("font-size","11px").style("fill","#94a3b8").text("Month");
      svg.append("text").attr("transform","rotate(-90)").attr("x",-(margin.top+cH/2)).attr("y",14)
        .attr("text-anchor","middle").style("font-size","11px").style("fill","#94a3b8").text("Value");

    } else {
      // ── Line ───────────────────────────────────────────────────────────────
      const chart = svg.append("g").attr("transform",`translate(${margin.left},${margin.top})`);
      const x     = d3.scaleBand().domain(RASTER_DATA.map(d=>d.time)).range([0,cW]).padding(0);
      const cx2   = d => x(d.time)+x.bandwidth()/2;
      const maxV  = 110, maxVol = d3.max(RASTER_DATA,d=>d.volume)*1.1;
      const y     = d3.scaleLinear().domain([0,maxV]).range([cH,0]);
      const yVol  = d3.scaleLinear().domain([0,maxVol]).range([cH,0]);

      y.ticks(5).forEach(v => {
        chart.append("line").attr("x1",0).attr("x2",cW).attr("y1",y(v)).attr("y2",y(v))
          .attr("stroke","#e2e8f0").attr("stroke-dasharray","4,3").attr("stroke-width",1);
      });

      // Area under value line
      chart.append("path").datum(RASTER_DATA)
        .attr("fill",palette[0]).attr("opacity",0.08)
        .attr("d",d3.area().x(d=>cx2(d)).y0(cH).y1(d=>y(d.value)).curve(d3.curveMonotoneX));

      // Value line
      chart.append("path").datum(RASTER_DATA)
        .attr("fill","none").attr("stroke",palette[0]).attr("stroke-width",2.5)
        .attr("d",d3.line().x(d=>cx2(d)).y(d=>y(d.value)).curve(d3.curveMonotoneX));

      // Volume dashed line
      chart.append("path").datum(RASTER_DATA)
        .attr("fill","none").attr("stroke",palette[1]).attr("stroke-width",2)
        .attr("stroke-dasharray","6,3")
        .attr("d",d3.line().x(d=>cx2(d)).y(d=>yVol(d.volume)).curve(d3.curveMonotoneX));

      // Average line
      const avg = d3.mean(RASTER_DATA,d=>d.value);
      chart.append("line").attr("x1",0).attr("x2",cW).attr("y1",y(avg)).attr("y2",y(avg))
        .attr("stroke",palette[2]).attr("stroke-width",1.5).attr("stroke-dasharray","4,3").attr("opacity",0.7);
      chart.append("text").attr("x",cW+4).attr("y",y(avg)).attr("dominant-baseline","middle")
        .style("font-size","9px").style("fill",palette[2]).text(`avg ${Math.round(avg)}`);

      // Dots
      RASTER_DATA.forEach(d => {
        const px = cx2(d), py = y(d.value);
        chart.append("circle").attr("cx",px).attr("cy",py).attr("r",4.5)
          .attr("fill",palette[0]).attr("stroke","#fff").attr("stroke-width",1.2)
          .style("cursor","pointer")
          .on("mouseover", function(event) {
            d3.select(this).attr("r",7);
            tooltip.style("opacity",1)
              .html(`<b style="color:${palette[0]}">${d.time}</b><br/>Value: <b>${d.value}</b><br/>Volume: ${d.volume}`)
              .style("left",(event.pageX+12)+"px").style("top",(event.pageY-10)+"px");
          })
          .on("mouseout", function() { d3.select(this).attr("r",4.5); tooltip.style("opacity",0); });
        chart.append("text").attr("x",px).attr("y",py-8)
          .attr("text-anchor","middle").style("font-size","9px").style("font-weight","700")
          .style("fill",palette[0]).style("pointer-events","none").text(d.value);
      });

      chart.append("g").attr("transform",`translate(0,${cH})`)
        .call(d3.axisBottom(x).tickSize(0))
        .call(g => { g.select(".domain").style("stroke","#e2e8f0"); g.selectAll("text").style("fill","#334155").style("font-size","10px"); });
      chart.append("g")
        .call(d3.axisLeft(y).ticks(5))
        .call(g => { g.select(".domain").remove(); g.selectAll("line").remove(); g.selectAll("text").style("fill","#94a3b8").style("font-size","10px"); });
      svg.append("text").attr("transform",`translate(${margin.left+cW/2},${H-4})`).attr("text-anchor","middle")
        .style("font-size","11px").style("fill","#94a3b8").text("Month");
      svg.append("text").attr("transform","rotate(-90)").attr("x",-(margin.top+cH/2)).attr("y",14)
        .attr("text-anchor","middle").style("font-size","11px").style("fill","#94a3b8").text("Value");
    }

    return () => tooltip.remove();
  }, [theme, chartType]);

  return (
    <div style={{ display:"flex", gap:12, alignItems:"flex-start", width:"100%", border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden" }}>
      <svg ref={svgRef} style={{ display:"block", flex:1, minWidth:0, height:380 }} />
      <div style={{ padding:"12px 12px 12px 0" }}>
        <LegendHTML theme={theme} chartType={chartType} />
      </div>
    </div>
  );
}

// ─── 3D Chart ─────────────────────────────────────────────────────────────────
function Chart3D({ theme, chartType }) {
  const mountRef   = useRef(null);
  const overlayRef = useRef(null);
  const palette    = THEMES[theme];

  useEffect(() => {
    if (!mountRef.current) return;
    const el = mountRef.current;
    const W  = el.offsetWidth || 620, H = 380;

    const scene  = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);
    const camera = new THREE.PerspectiveCamera(42, W/H, 0.1, 200);
    camera.position.set(0, 8, 18);
    camera.lookAt(0, 2, 0);

    const renderer = new THREE.WebGLRenderer({ antialias:true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    renderer.shadowMap.enabled=true;
    el.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff,0.7));
    const sun = new THREE.DirectionalLight(0xffffff,1.0);
    sun.position.set(6,14,10); sun.castShadow=true; scene.add(sun);
    scene.add(new THREE.PointLight(new THREE.Color(palette[0]),0.45,60));
    scene.add(new THREE.HemisphereLight(0xffffff,0xe0e7ff,0.4));

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(30,18),
      new THREE.MeshStandardMaterial({ color:0xf1f5f9, roughness:0.9 })
    );
    floor.rotation.x=-Math.PI/2; floor.receiveShadow=true; scene.add(floor);
    scene.add(new THREE.GridHelper(30,26,0xcccccc,0xe2e8f0));

    const pivot       = new THREE.Group();
    const labelAnchors = [];

    if (chartType === "Radar") {
      // Radar as vertical spokes on a circular base
      const n = VECTOR_DATA.length;
      const R = 4;
      const maxV = d3.max(VECTOR_DATA, d=>d.value);

      VECTOR_DATA.forEach((d,i) => {
        const a   = (i/n)*2*Math.PI - Math.PI/2;
        const xp  = Math.cos(a)*R, zp = Math.sin(a)*R;
        const bh  = (d.value/maxV)*7;
        const col = new THREE.Color(palette[i%5]);

        const geo  = new THREE.CylinderGeometry(0.25,0.25,bh,8);
        const mat  = new THREE.MeshStandardMaterial({ color:col, roughness:0.25, metalness:0.4, emissive:col, emissiveIntensity:0.1 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(xp, bh/2, zp);
        mesh.castShadow=true; pivot.add(mesh);

        const eg = new THREE.EdgesGeometry(geo);
        const el2 = new THREE.LineSegments(eg, new THREE.LineBasicMaterial({ color:0xffffff }));
        el2.position.set(xp, bh/2, zp); pivot.add(el2);

        const capC = col.clone().lerp(new THREE.Color(0xffffff),0.25);
        const cap  = new THREE.Mesh(
          new THREE.CylinderGeometry(0.25,0.25,0.07,8),
          new THREE.MeshStandardMaterial({ color:capC, emissive:capC, emissiveIntensity:1.2, roughness:0.04, metalness:1 })
        );
        cap.position.set(xp, bh+0.035, zp); pivot.add(cap);

        labelAnchors.push({ x:xp, y:bh+0.6, z:zp, text:`${d.value}`, col:palette[i%5], isBase:false });
        labelAnchors.push({ x:xp*1.35, y:-0.7, z:zp*1.35, text:d.name, col:"#64748b", isBase:true });
      });

    } else {
      // Bar / Line — all use vertical bars
      const data    = RASTER_DATA;
      const maxV    = 110;
      const spacing = 1.6;

      data.forEach((d,i) => {
        const bh   = (d.value/maxV)*9;
        const xPos = (i-(data.length-1)/2)*spacing;
        const col  = new THREE.Color(palette[0]);

        const geo  = new THREE.BoxGeometry(0.7, bh, 0.7);
        const mat  = new THREE.MeshStandardMaterial({ color:col, roughness:0.25, metalness:0.4, emissive:col, emissiveIntensity:0.1 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(xPos, bh/2, 0);
        mesh.castShadow=true; pivot.add(mesh);

        const eg = new THREE.EdgesGeometry(geo);
        const el2 = new THREE.LineSegments(eg, new THREE.LineBasicMaterial({ color:0xffffff }));
        el2.position.set(xPos, bh/2, 0); pivot.add(el2);

        const capC = col.clone().lerp(new THREE.Color(0xffffff),0.25);
        const cap  = new THREE.Mesh(
          new THREE.BoxGeometry(0.7,0.07,0.7),
          new THREE.MeshStandardMaterial({ color:capC, emissive:capC, emissiveIntensity:1.2, roughness:0.04, metalness:1 })
        );
        cap.position.set(xPos, bh+0.035, 0); pivot.add(cap);

        // Volume secondary bar (behind)
        const bh2  = (d.volume/800)*5;
        const col2 = new THREE.Color(palette[1]);
        const geo2 = new THREE.BoxGeometry(0.5, bh2, 0.5);
        const mat2 = new THREE.MeshStandardMaterial({ color:col2, roughness:0.25, metalness:0.35, emissive:col2, emissiveIntensity:0.08, transparent:true, opacity:0.75 });
        const mesh2= new THREE.Mesh(geo2,mat2);
        mesh2.position.set(xPos, bh2/2, 1.1); mesh2.castShadow=true; pivot.add(mesh2);

        labelAnchors.push({ x:xPos, y:bh+0.6,  z:0,   text:`${d.value}`, col:palette[0], isBase:false });
        labelAnchors.push({ x:xPos, y:-0.6,     z:0,   text:d.time,       col:"#64748b",  isBase:true  });
      });
    }

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
      animId = requestAnimationFrame(animate);
      if (autoSpin) rotY+=0.003;
      pivot.rotation.y=rotY; pivot.rotation.x=rotX;
      camera.updateMatrixWorld();

      if (overlayRef.current) {
        overlayRef.current.querySelectorAll(".rvlbl").forEach((div,i) => {
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
  }, [theme, chartType]);

  // Mirror labelAnchors for JSX
  const jsxLabels = [];
  if (chartType === "Radar") {
    VECTOR_DATA.forEach((d,i) => {
      jsxLabels.push({ text:`${d.value}`, col:palette[i%5], isBase:false });
      jsxLabels.push({ text:d.name,       col:"#64748b",    isBase:true  });
    });
  } else {
    RASTER_DATA.forEach(d => {
      jsxLabels.push({ text:`${d.value}`, col:palette[0], isBase:false });
      jsxLabels.push({ text:d.time,       col:"#64748b",  isBase:true  });
    });
  }

  return (
    <div style={{ display:"flex", gap:12, alignItems:"flex-start", width:"100%", border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden" }}>
      <div style={{ position:"relative", flex:1, minWidth:0 }}>
        <div ref={mountRef} style={{ width:"100%", height:380, cursor:"grab" }} />

        <div ref={overlayRef} style={{ position:"absolute", inset:0, pointerEvents:"none" }}>
          {jsxLabels.map((a,i) => (
            <div key={i} className="rvlbl" style={{
              position:"absolute",
              transform: a.isBase ? "translate(-50%,0%)" : "translate(-50%,-100%)",
              background: a.isBase ? "rgba(255,255,255,0.90)" : "rgba(255,255,255,0.93)",
              color: a.col,
              fontSize: a.isBase ? 9 : 10,
              fontWeight:"bold",
              padding:"2px 5px", borderRadius:3,
              border: a.isBase ? "1px solid #e2e8f0" : `1px solid ${a.col}55`,
              whiteSpace:"nowrap", transition:"opacity 0.1s", pointerEvents:"none",
              boxShadow:"0 1px 3px rgba(0,0,0,0.08)",
            }}>
              {a.text}
            </div>
          ))}
        </div>

        <div style={{ padding:"7px 14px", background:"#f8fafc", borderTop:"1px solid #e2e8f0", fontSize:11, color:"#94a3b8" }}>
          💡 Drag to rotate · auto-spins until you interact
          {chartType !== "Radar" && " · Front = Value · Back = Volume"}
        </div>
      </div>

      <div style={{ padding:"12px 12px 12px 0" }}>
        <LegendHTML theme={theme} chartType={chartType} />
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const RasterVectorChart = () => {
  const [viewMode,   setViewMode]   = useState("2d");
  const [theme,      setTheme]      = useState("Modern");
  const [chartType,  setChartType]  = useState("Line");

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
        <div style={{ fontSize:16, fontWeight:"bold", color:"#1e293b" }}>Raster & Vector Analytics</div>
        <div style={{ fontSize:12, color:"#94a3b8", marginTop:2 }}>
          {RASTER_DATA.length} monthly data points · {VECTOR_DATA.length} performance metrics
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
          <label style={{ fontSize:11, color:"#94a3b8", fontWeight:"600" }}>Chart Type</label>
          <select value={chartType} onChange={e => setChartType(e.target.value)} style={ddStyle}>
            {CHART_TYPES.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
      </div>

      {/* Chart */}
      {viewMode === "2d"
        ? <Chart2D key={`2d-${theme}-${chartType}`} theme={theme} chartType={chartType} />
        : <Chart3D key={`3d-${theme}-${chartType}`} theme={theme} chartType={chartType} />
      }
    </div>
  );
};

export default RasterVectorChart;