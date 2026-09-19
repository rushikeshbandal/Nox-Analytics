import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import * as THREE from "three";

const THEMES = {
  Light: { bg: "#f8fafc", text: "#1e293b", grid: "#e2e8f0", threeBg: 0xf1f5f9 },
  Dark:  { bg: "#020617", text: "#e2e8f0", grid: "#1e293b", threeBg: 0x0f172a },
};

const COLORS = {
  SteelBlue: { band: "#4e79a7", high: "#22c55e", low: "#ef4444" },
  Teal:      { band: "#14b8a6", high: "#06b6d4", low: "#f97316" },
  Purple:    { band: "#7c3aed", high: "#a855f7", low: "#ec4899" },
  Orange:    { band: "#f97316", high: "#fbbf24", low: "#ef4444" },
};

const COLORS_3D = {
  SteelBlue: { high: 0x22c55e, low: 0xef4444, band: 0x4e79a7 },
  Teal:      { high: 0x06b6d4, low: 0xf97316, band: 0x14b8a6 },
  Purple:    { high: 0xa855f7, low: 0xec4899, band: 0x7c3aed },
  Orange:    { high: 0xfbbf24, low: 0xef4444, band: 0xf97316 },
};

export default function BandChart() {
  const svgRef   = useRef();
  const threeRef = useRef();

  const [view,  setView]  = useState("2D");
  const [theme, setTheme] = useState("Light");
  const [color, setColor] = useState("SteelBlue");
  const [stats, setStats] = useState(null);

  /* ══════════════════════════ 2D ══════════════════════════ */
  useEffect(() => {
    if (view !== "2D") return;
    const T   = THEMES[theme];
    const COL = COLORS[color];

    d3.csv("/temp.csv", d => ({
      date: new Date(d.date),
      low:  +d.low,
      high: +d.high,
    })).then(raw => {
      const data = raw.filter(d =>
        d.date instanceof Date && !isNaN(d.low) && !isNaN(d.high)
      );

      // Compute stats
      const maxHigh  = d3.max(data, d => d.high);
      const minLow   = d3.min(data, d => d.low);
      const avgHigh  = d3.mean(data, d => d.high);
      const avgLow   = d3.mean(data, d => d.low);
      const avgRange = d3.mean(data, d => d.high - d.low);
      const maxRange = d3.max(data, d => d.high - d.low);
      const last     = data[data.length - 1];
      const hotDays  = data.filter(d => d.high >= 60).length;
      const coldDays = data.filter(d => d.low  <= 45).length;
      setStats({ maxHigh, minLow, avgHigh, avgLow, avgRange, maxRange, last, hotDays, coldDays, total: data.length });

      const width  = 750;
      const height = 500;
      const margin = { top: 50, right: 20, bottom: 50, left: 60 };

      const svgEl = d3.select(svgRef.current);
      svgEl.selectAll("*").remove();

      const x = d3.scaleUtc()
        .domain(d3.extent(data, d => d.date))
        .range([margin.left, width - margin.right]);

      const y = d3.scaleLinear()
        .domain([minLow - 2, maxHigh + 2]).nice()
        .range([height - margin.bottom, margin.top]);

      const svg = svgEl.append("svg")
        .attr("width", width).attr("height", height)
        .style("background", T.bg).style("border-radius", "10px");

      // Grid
      svg.append("g").selectAll("line").data(y.ticks(6)).enter()
        .append("line")
        .attr("x1", margin.left).attr("x2", width - margin.right)
        .attr("y1", d => y(d)).attr("y2", d => y(d))
        .attr("stroke", T.grid).attr("stroke-dasharray", "4,3");

      // Gradient
      const defs = svg.append("defs");
      const grad = defs.append("linearGradient").attr("id","bandGrad")
        .attr("x1","0%").attr("x2","0%").attr("y1","0%").attr("y2","100%");
      grad.append("stop").attr("offset","0%")
        .attr("stop-color", COL.band).attr("stop-opacity", 0.85);
      grad.append("stop").attr("offset","100%")
        .attr("stop-color", COL.band).attr("stop-opacity", 0.3);

      // Band area
      svg.append("path").datum(data)
        .attr("fill","url(#bandGrad)")
        .attr("d", d3.area().curve(d3.curveMonotoneX)
          .x(d=>x(d.date)).y0(d=>y(d.low)).y1(d=>y(d.high)));

      // High line
      svg.append("path").datum(data)
        .attr("fill","none").attr("stroke",COL.high).attr("stroke-width",1.8)
        .attr("d", d3.line().curve(d3.curveMonotoneX)
          .x(d=>x(d.date)).y(d=>y(d.high)));

      // Low line
      svg.append("path").datum(data)
        .attr("fill","none").attr("stroke",COL.low).attr("stroke-width",1.8)
        .attr("d", d3.line().curve(d3.curveMonotoneX)
          .x(d=>x(d.date)).y(d=>y(d.low)));

      // X Axis
      svg.append("g").attr("transform",`translate(0,${height-margin.bottom})`)
        .call(d3.axisBottom(x).ticks(8))
        .call(g => {
          g.select(".domain").remove();
          g.selectAll("text").attr("fill",T.text).style("font-size","10px");
          g.selectAll("line").attr("stroke",T.grid);
        });

      // Y Axis
      svg.append("g").attr("transform",`translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(6).tickFormat(d=>`${d}°`))
        .call(g => {
          g.select(".domain").remove();
          g.selectAll("text").attr("fill",T.text).style("font-size","10px");
          g.selectAll("line").attr("stroke",T.grid);
        })
        .call(g => g.append("text")
          .attr("x",-margin.left+4).attr("y",margin.top-18)
          .attr("fill",T.text).attr("font-weight",600).attr("font-size",11)
          .text("↑ Temperature (°F)"));

      // Tooltip
      const tip = d3.select("body").append("div")
        .style("position","absolute").style("background","rgba(15,23,42,0.93)")
        .style("color","#fff").style("padding","9px 13px").style("border-radius","7px")
        .style("font-size","12px").style("font-family","Inter,system-ui,sans-serif")
        .style("pointer-events","none").style("opacity",0)
        .style("border",`1px solid ${COL.band}60`).style("z-index","9999");

      const hLine = svg.append("line")
        .attr("stroke",COL.band).attr("stroke-width",1)
        .attr("stroke-dasharray","4,3")
        .attr("y1",margin.top).attr("y2",height-margin.bottom).attr("opacity",0);

      svg.append("rect")
        .attr("x",margin.left).attr("y",margin.top)
        .attr("width",width-margin.left-margin.right)
        .attr("height",height-margin.top-margin.bottom)
        .attr("fill","transparent")
        .on("mousemove", function(event) {
          const [mx] = d3.pointer(event,this);
          const xDate  = x.invert(mx+margin.left);
          const bisect = d3.bisector(d=>d.date).left;
          const idx    = bisect(data,xDate,1);
          const d0     = data[idx-1], d1=data[idx]||d0;
          const cl     = xDate-d0.date < d1.date-xDate ? d0 : d1;
          hLine.attr("x1",x(cl.date)).attr("x2",x(cl.date)).attr("opacity",0.7);
          tip.style("opacity",1)
            .html(
              `<b>${d3.timeFormat("%b %d, %Y")(cl.date)}</b><br/>` +
              `High: <b style="color:${COL.high}">${cl.high}°F</b><br/>` +
              `Low:  <b style="color:${COL.low}">${cl.low}°F</b><br/>` +
              `Range: <b style="color:${COL.band}">${(cl.high-cl.low).toFixed(1)}°F</b>`
            )
            .style("left",(event.pageX+16)+"px")
            .style("top",(event.pageY-12)+"px");
        })
        .on("mouseout",()=>{tip.style("opacity",0);hLine.attr("opacity",0);});

      // Legend
      const leg = svg.append("g").attr("transform",`translate(${margin.left+10},${margin.top-22})`);
      [[COL.high,"High"],[COL.band,"Band"],[COL.low,"Low"]].forEach(([col,lbl],i)=>{
        leg.append("rect").attr("x",i*80).attr("y",0).attr("width",12).attr("height",12).attr("rx",3).attr("fill",col);
        leg.append("text").attr("x",i*80+16).attr("y",10).style("font-size","10px").attr("fill",T.text).text(lbl);
      });

      // Title
      svg.append("text").attr("x",width/2).attr("y",22).attr("text-anchor","middle")
        .attr("font-weight",700).attr("font-size",15).attr("fill",T.text)
        .text("Temperature Range – Band Chart");

      return () => tip.remove();
    });
  }, [view, theme, color]);

  /* ══════════════════════════ 3D ══════════════════════════ */
  useEffect(() => {
    if (view !== "3D") return;
    threeRef.current.innerHTML = "";

    const W   = threeRef.current.clientWidth || 750;
    const H   = 520;
    const T   = THEMES[theme];
    const C3D = COLORS_3D[color];
    const C2D = COLORS[color];

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(T.threeBg);
    const camera = new THREE.PerspectiveCamera(42, W/H, 0.1, 2000);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    threeRef.current.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 1.0));
    const sun = new THREE.DirectionalLight(0xffffff, 0.9);
    sun.position.set(15,30,20); sun.castShadow=true;
    sun.shadow.mapSize.set(2048,2048); scene.add(sun);
    scene.add(new THREE.HemisphereLight(0xffffff, theme==="Dark"?0x0f172a:0xdde4f0, 0.5));

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(60,16),
      new THREE.MeshStandardMaterial({ color:theme==="Dark"?0x0f172a:0xe2e8f0, roughness:1 })
    );
    floor.rotation.x=-Math.PI/2; floor.position.y=0;
    floor.receiveShadow=true; scene.add(floor);

    const grid = new THREE.GridHelper(60,30,
      theme==="Dark"?0x334155:0xb0bec5,
      theme==="Dark"?0x1e293b:0xcfd8dc
    );
    grid.position.y=0.01; scene.add(grid);

    d3.csv("/temp.csv", d => ({
      date: new Date(d.date), low:+d.low, high:+d.high,
    })).then(raw => {
      const data = raw
        .filter(d => d.date instanceof Date && !isNaN(d.low) && !isNaN(d.high))
        .filter((_,i) => i%3===0);

      const minV  = d3.min(data, d=>d.low);
      const maxV  = d3.max(data, d=>d.high);
      const normY = v => ((v-minV)/(maxV-minV))*10+0.1;

      const totalW  = 50;
      const spacing = totalW/(data.length-1);
      const barW    = spacing*0.75;
      const pivot   = new THREE.Group();
      scene.add(pivot);

      data.forEach((d,i)=>{
        const xp      = i*spacing-totalW/2;
        const yLow    = normY(d.low);
        const yHigh   = normY(d.high);
        const bandH   = Math.max(yHigh-yLow,0.1);
        const bandMid = (yLow+yHigh)/2;

        // Band bar
        const bandBar = new THREE.Mesh(
          new THREE.BoxGeometry(barW,bandH,barW),
          new THREE.MeshStandardMaterial({
            color:new THREE.Color(C3D.band), roughness:0.3, metalness:0.3,
            emissive:new THREE.Color(C3D.band), emissiveIntensity:0.08,
            transparent:true, opacity:0.85,
          })
        );
        bandBar.position.set(xp,bandMid,0);
        bandBar.castShadow=true; pivot.add(bandBar);

        // High cap
        const hCap = new THREE.Mesh(
          new THREE.BoxGeometry(barW,0.1,barW),
          new THREE.MeshStandardMaterial({
            color:new THREE.Color(C3D.high), emissive:new THREE.Color(C3D.high),
            emissiveIntensity:1.2, roughness:0.02, metalness:1,
          })
        );
        hCap.position.set(xp,yHigh+0.05,0); pivot.add(hCap);

        // Low cap
        const lCap = new THREE.Mesh(
          new THREE.BoxGeometry(barW,0.1,barW),
          new THREE.MeshStandardMaterial({
            color:new THREE.Color(C3D.low), emissive:new THREE.Color(C3D.low),
            emissiveIntensity:1.2, roughness:0.02, metalness:1,
          })
        );
        lCap.position.set(xp,yLow-0.05,0); pivot.add(lCap);

        // Connect lines
        if(i<data.length-1){
          const next=data[i+1];
          const nxp=( i+1)*spacing-totalW/2;
          [[yHigh,normY(next.high),C3D.high],[yLow,normY(next.low),C3D.low]].forEach(([y1,y2,col])=>{
            const geo=new THREE.BufferGeometry().setFromPoints([
              new THREE.Vector3(xp,y1,0), new THREE.Vector3(nxp,y2,0),
            ]);
            pivot.add(new THREE.Line(geo,new THREE.LineBasicMaterial({color:col,linewidth:2})));
          });
        }
      });

      // Left Y labels
      d3.range(Math.ceil(minV/5)*5, maxV+1, 5)
        .filter(t=>t>=minV&&t<=maxV).forEach(tick=>{
          const yp=normY(tick);
          const c=document.createElement("canvas");
          c.width=130; c.height=46;
          const cx=c.getContext("2d");
          cx.fillStyle="rgba(255,255,255,0.95)";
          cx.roundRect(2,2,126,42,7); cx.fill();
          cx.strokeStyle=C2D.band; cx.lineWidth=1.5;
          cx.roundRect(2,2,126,42,7); cx.stroke();
          cx.font="bold 19px Arial"; cx.fillStyle=C2D.band;
          cx.textAlign="center"; cx.textBaseline="middle";
          cx.fillText(`${tick}°F`,65,23);
          const s=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),transparent:true}));
          s.scale.set(2.2,0.78,1);
          s.position.set(-totalW/2-3.5,yp,0);
          scene.add(s);
        });

      // Date labels bottom
      const dStep=Math.max(1,Math.floor(data.length/8));
      data.filter((_,i)=>i%dStep===0).forEach((d,idx)=>{
        const xp=idx*dStep*spacing-totalW/2;
        const c=document.createElement("canvas");
        c.width=160; c.height=50;
        const cx=c.getContext("2d");
        cx.fillStyle="rgba(255,255,255,0.93)"; cx.roundRect(2,2,156,46,7); cx.fill();
        cx.font="bold 17px Arial"; cx.fillStyle="#334155";
        cx.textAlign="center"; cx.textBaseline="middle";
        cx.fillText(d3.timeFormat("%b %Y")(d.date),80,25);
        const s=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),transparent:true}));
        s.scale.set(2.2,0.68,1); s.position.set(xp,-0.9,0); scene.add(s);
      });

      // High/Low badges top
      const pStep=Math.max(1,Math.floor(data.length/10));
      data.filter((_,i)=>i%pStep===0).forEach((d,idx)=>{
        const i=idx*pStep, xp=i*spacing-totalW/2;
        [[C2D.high,`${d.high}°`,normY(d.high)+0.85],[C2D.low,`${d.low}°`,normY(d.low)-1.2]].forEach(([col,txt,ypos])=>{
          const c=document.createElement("canvas"); c.width=110; c.height=44;
          const cx=c.getContext("2d");
          cx.fillStyle="rgba(255,255,255,0.95)"; cx.roundRect(2,2,106,40,6); cx.fill();
          cx.strokeStyle=col; cx.lineWidth=2; cx.roundRect(2,2,106,40,6); cx.stroke();
          cx.font="bold 18px Arial"; cx.fillStyle=col;
          cx.textAlign="center"; cx.textBaseline="middle"; cx.fillText(txt,55,22);
          const s=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),transparent:true}));
          s.scale.set(1.6,0.62,1); s.position.set(xp,ypos,0); scene.add(s);
        });
      });
    });

    // Auto-rotate + drag
    let isDragging=false, prevX=0, prevY=0, rotY=0, rotX=0.38, autoSpin=true;
    const R=32;
    const positionCamera=()=>{
      camera.position.set(R*Math.sin(rotY)*Math.cos(rotX),R*Math.sin(rotX)+5,R*Math.cos(rotY)*Math.cos(rotX));
      camera.lookAt(0,5,0);
    };
    positionCamera();

    const onDown=e=>{isDragging=true;autoSpin=false;prevX=e.clientX??e.touches?.[0]?.clientX;prevY=e.clientY??e.touches?.[0]?.clientY;renderer.domElement.style.cursor="grabbing";};
    const onUp=()=>{isDragging=false;renderer.domElement.style.cursor="grab";};
    const onMove=e=>{
      if(!isDragging)return;
      const cx=e.clientX??e.touches?.[0]?.clientX, cy=e.clientY??e.touches?.[0]?.clientY;
      rotY-=(cx-prevX)*0.007; rotX=Math.max(0.05,Math.min(1.1,rotX+(cy-prevY)*0.005));
      prevX=cx;prevY=cy;positionCamera();
    };
    renderer.domElement.addEventListener("mousedown",onDown);
    window.addEventListener("mouseup",onUp); window.addEventListener("mousemove",onMove);
    renderer.domElement.addEventListener("touchstart",onDown,{passive:true});
    renderer.domElement.addEventListener("touchend",onUp);
    renderer.domElement.addEventListener("touchmove",onMove,{passive:true});
    renderer.domElement.style.cursor="grab";

    let animId;
    const animate=()=>{animId=requestAnimationFrame(animate);if(autoSpin){rotY+=0.003;positionCamera();}renderer.render(scene,camera);};
    animate();

    return()=>{
      cancelAnimationFrame(animId);
      renderer.domElement.removeEventListener("mousedown",onDown);
      window.removeEventListener("mouseup",onUp); window.removeEventListener("mousemove",onMove);
      renderer.dispose();
      if(threeRef.current?.contains(renderer.domElement)) threeRef.current.removeChild(renderer.domElement);
    };
  }, [view, theme, color]);

  /* ══════════════════════════ Stats Panel ══════════════════════════ */
  const StatsPanel = () => {
    if (!stats) return null;
    const COL = COLORS[color];
    const row = (label, value, col) => (
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"7px 0", borderBottom:"1px solid #f1f5f9" }}>
        <span style={{ fontSize:11, color:"#64748b", fontWeight:500 }}>{label}</span>
        <span style={{ fontSize:12, fontWeight:700, color: col||"#1e293b" }}>{value}</span>
      </div>
    );
    return (
      <div style={{
        width:190, flexShrink:0, background:"#fff",
        border:"1px solid #e2e8f0", borderRadius:10,
        padding:"14px 16px", boxShadow:"0 1px 4px rgba(0,0,0,0.06)",
        fontFamily:"Inter,system-ui,sans-serif", alignSelf:"flex-start",
      }}>
        <div style={{ fontSize:11, fontWeight:700, color:"#94a3b8", letterSpacing:"0.08em", marginBottom:10 }}>
          TEMPERATURE STATS
        </div>
        {row("Record High",  `${stats.maxHigh}°F`,  COL.high)}
        {row("Record Low",   `${stats.minLow}°F`,   COL.low)}
        {row("Avg High",     `${stats.avgHigh.toFixed(1)}°F`,  COL.high)}
        {row("Avg Low",      `${stats.avgLow.toFixed(1)}°F`,   COL.low)}
        {row("Avg Range",    `${stats.avgRange.toFixed(1)}°F`, COL.band)}
        {row("Max Range",    `${stats.maxRange.toFixed(1)}°F`, COL.band)}
        {row("Last High",    `${stats.last.high}°F`, COL.high)}
        {row("Last Low",     `${stats.last.low}°F`,  COL.low)}

        <div style={{ borderTop:"1px solid #e2e8f0", margin:"10px 0 8px" }} />
        <div style={{ fontSize:11, fontWeight:700, color:"#94a3b8", letterSpacing:"0.08em", marginBottom:10 }}>
          DAYS COUNT
        </div>
        {row("Total Days", stats.total)}

        <div style={{ display:"flex", gap:8, marginTop:6 }}>
          <div style={{ flex:1, background:COL.high+"18", border:`1px solid ${COL.high}40`, borderRadius:7, padding:"8px 6px", textAlign:"center" }}>
            <div style={{ fontSize:18, fontWeight:800, color:COL.high }}>{stats.hotDays}</div>
            <div style={{ fontSize:9, fontWeight:600, color:"#64748b", marginTop:2 }}>🌡️ HOT</div>
            <div style={{ fontSize:8, color:"#94a3b8" }}>High ≥ 60°F</div>
          </div>
          <div style={{ flex:1, background:COL.low+"18", border:`1px solid ${COL.low}40`, borderRadius:7, padding:"8px 6px", textAlign:"center" }}>
            <div style={{ fontSize:18, fontWeight:800, color:COL.low }}>{stats.coldDays}</div>
            <div style={{ fontSize:9, fontWeight:600, color:"#64748b", marginTop:2 }}>❄️ COLD</div>
            <div style={{ fontSize:8, color:"#94a3b8" }}>Low ≤ 45°F</div>
          </div>
        </div>

        <div style={{ borderTop:"1px solid #e2e8f0", margin:"12px 0 8px" }} />
        <div style={{ fontSize:11, fontWeight:700, color:"#94a3b8", letterSpacing:"0.08em", marginBottom:8 }}>
          LEGEND
        </div>
        {[[COL.high,"High temp"],[COL.band,"Band (range)"],[COL.low,"Low temp"]].map(([col,lbl])=>(
          <div key={lbl} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:7 }}>
            <div style={{ width:12, height:12, borderRadius:3, background:col, flexShrink:0 }} />
            <span style={{ fontSize:11, color:"#475569" }}>{lbl}</span>
          </div>
        ))}
      </div>
    );
  };

  const ddStyle = {
    padding:"5px 10px", borderRadius:6, border:"1px solid #e2e8f0",
    background:"#fff", color:"#334155", fontWeight:"500",
    cursor:"pointer", fontSize:12, outline:"none",
  };

  return (
    <div style={{
      background:"#ffffff", borderRadius:12, padding:"20px 24px 32px",
      width:"100%", boxSizing:"border-box", fontFamily:"Inter,system-ui,sans-serif",
    }}>
      <div style={{ marginBottom:4 }}>
        <div style={{ fontSize:16, fontWeight:"bold", color:"#1e293b" }}>Temperature Range – Band Chart</div>
        <div style={{ fontSize:12, color:"#94a3b8", marginTop:2 }}>Daily high/low temperature · temp.csv</div>
      </div>

      <div style={{ display:"flex", gap:16, alignItems:"flex-end", marginTop:14, marginBottom:20 }}>
        {[["View",[["2D","2D"],["3D","3D"]],view,setView],
          ["Theme",Object.keys(THEMES).map(t=>[t,t]),theme,setTheme],
          ["Color",Object.keys(COLORS).map(c=>[c,c]),color,setColor]
        ].map(([lbl,opts,val,set])=>(
          <div key={lbl} style={{ display:"flex", flexDirection:"column", gap:3 }}>
            <label style={{ fontSize:11, color:"#94a3b8", fontWeight:"600" }}>{lbl}</label>
            <select value={val} onChange={e=>set(e.target.value)} style={ddStyle}>
              {opts.map(([v,l])=><option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        ))}
      </div>

      {view==="3D" && (
        <p style={{ fontSize:11, color:"#94a3b8", marginBottom:8 }}>
          🔄 Auto-rotating · 🖱️ Drag to stop and rotate manually
        </p>
      )}

      <div style={{ display:"flex", gap:14, alignItems:"flex-start" }}>
        <div style={{ flex:1, minWidth:0, border:"1px solid #e2e8f0", borderRadius:10, overflow:"hidden" }}>
          {view==="2D" && <div ref={svgRef} />}
          {view==="3D" && <div ref={threeRef} style={{ width:"100%", cursor:"grab" }} />}
        </div>
        <StatsPanel />
      </div>
    </div>
  );
}