import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import * as THREE from "three";

const THEMES = {
  Light: { bg:"#f8fafc", text:"#1e293b", grid:"#e2e8f0", card:"#ffffff", threeBg:0xf1f5f9 },
  Dark:  { bg:"#020617", text:"#e2e8f0", grid:"#1e293b", card:"#0f172a", threeBg:0x0f172a },
};

const COLORS = {
  SteelBlue: "#4e79a7",
  Orange:    "#f97316",
  Purple:    "#7c3aed",
  Teal:      "#14b8a6",
  Green:     "#22c55e",
};

const COLORS_3D = {
  SteelBlue: 0x4e79a7,
  Orange:    0xf97316,
  Purple:    0x7c3aed,
  Teal:      0x14b8a6,
  Green:     0x22c55e,
};

// ─── Stats Panel ──────────────────────────────────────────────────────────────
function StatsPanel({ data, color, theme }) {
  const T = THEMES[theme];
  const lineCol = COLORS[color];
  if (!data || !data.length) return null;

  const dMax   = d3.greatest(data, d => d.close);
  const dMin   = d3.least(data,    d => d.close);
  const latest = data[data.length-1];
  const first  = data[0];
  const growth = (((latest.close - first.close) / first.close)*100).toFixed(1);
  const isUp   = parseFloat(growth) >= 0;
  const avg    = d3.mean(data, d => d.close).toFixed(2);

  const card = (label, value, sub, col) => (
    <div style={{
      background:T.card, border:`1px solid ${T.grid}`,
      borderRadius:8, padding:"10px 12px", marginBottom:8,
      borderLeft:`3px solid ${col}`,
    }}>
      <div style={{ fontSize:10, color:"#94a3b8", fontWeight:600, marginBottom:3 }}>{label}</div>
      <div style={{ fontSize:15, fontWeight:700, color:col, whiteSpace:"nowrap" }}>{value}</div>
      {sub && <div style={{ fontSize:10, color:"#94a3b8", marginTop:2 }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ width:170, flexShrink:0 }}>
      <div style={{ fontSize:10, fontWeight:"bold", color:"#94a3b8", letterSpacing:"0.08em", marginBottom:8 }}>STATS</div>
      {card("🔥 All-Time High",  `$${d3.format(",.2f")(dMax.close)}`,  d3.timeFormat("%b %d, %Y")(dMax.date),    "#ef4444")}
      {card("❄️ All-Time Low",   `$${d3.format(",.2f")(dMin.close)}`,  d3.timeFormat("%b %d, %Y")(dMin.date),    "#06b6d4")}
      {card("📅 Latest",          `$${d3.format(",.2f")(latest.close)}`, d3.timeFormat("%b %d, %Y")(latest.date), lineCol)}
      {card("📊 Avg Close",       `$${avg}`,                             "All-time average",                       "#8b5cf6")}
      {card("📈 Total Growth",    `${isUp?"+":""}${growth}%`,            `${d3.timeFormat("%Y")(first.date)} → ${d3.timeFormat("%Y")(latest.date)}`, isUp?"#10b981":"#ef4444")}

      <div style={{ background:T.card, border:`1px solid ${T.grid}`, borderRadius:8, padding:"10px 12px" }}>
        <div style={{ fontSize:10, color:"#94a3b8", fontWeight:600, marginBottom:8 }}>COLOR</div>
        {Object.entries(COLORS).map(([k,c]) => (
          <div key={k} style={{ display:"flex", alignItems:"center", gap:7, marginBottom:5 }}>
            <div style={{ width:20, height:3, background:c, borderRadius:2, opacity:k===color?1:0.3 }} />
            <span style={{ fontSize:10, color:T.text, fontWeight:k===color?"700":"400" }}>{k}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AreaChart() {
  const svgRef    = useRef();
  const threeRef  = useRef();
  const [view,      setView]      = useState("2D");
  const [theme,     setTheme]     = useState("Light");
  const [color,     setColor]     = useState("SteelBlue");
  const [chartData, setChartData] = useState([]);

  /* ══════════════════════════ 2D ══════════════════════════ */
  useEffect(() => {
    if (view !== "2D") return;
    const T = THEMES[theme];

    d3.csv("/aapl.csv", d => ({
      date:  new Date(d.date),
      close: +d.close,
    })).then(raw => {
      const data = raw.filter(d => !isNaN(d.date) && !isNaN(d.close));
      setChartData(data);

      const width  = svgRef.current?.parentElement?.clientWidth || 928;
      const height = 480;
      const margin = { top:40, right:20, bottom:50, left:64 };

      const svgEl = d3.select(svgRef.current);
      svgEl.selectAll("*").remove();

      const x = d3.scaleTime()
        .domain(d3.extent(data, d => d.date))
        .range([margin.left, width - margin.right]);

      const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.close)]).nice()
        .range([height - margin.bottom, margin.top]);

      const svg = svgEl.append("svg")
        .attr("width",width).attr("height",height)
        .style("background",T.bg).style("border-radius","10px");

      // Grid
      svg.append("g").attr("transform",`translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(height/50).tickFormat("").tickSize(-(width-margin.left-margin.right)))
        .call(g => { g.select(".domain").remove(); g.selectAll("line").attr("stroke",T.grid).attr("stroke-opacity",0.6); });

      // Gradient
      const defs = svg.append("defs");
      const grad = defs.append("linearGradient").attr("id","areaGrad")
        .attr("x1","0%").attr("x2","0%").attr("y1","0%").attr("y2","100%");
      const c1 = d3.color(COLORS[color]); c1.opacity = 0.75;
      const c2 = d3.color(COLORS[color]); c2.opacity = 0.04;
      grad.append("stop").attr("offset","0%").attr("stop-color",c1.formatRgb());
      grad.append("stop").attr("offset","100%").attr("stop-color",c2.formatRgb());

      // Area
      svg.append("path").datum(data)
        .attr("fill","url(#areaGrad)")
        .attr("d", d3.area().x(d=>x(d.date)).y0(y(0)).y1(d=>y(d.close)).curve(d3.curveMonotoneX));

      // Line
      svg.append("path").datum(data)
        .attr("fill","none").attr("stroke",COLORS[color]).attr("stroke-width",1.6)
        .attr("d", d3.line().x(d=>x(d.date)).y(d=>y(d.close)).curve(d3.curveMonotoneX));

      // ATH / ATL markers
      const dMax = d3.greatest(data, d=>d.close);
      const dMin = d3.least(data,    d=>d.close);
      [[dMax,"#ef4444",`🔥 $${d3.format(",.0f")(dMax.close)}`,-14],
       [dMin,"#06b6d4",`❄️ $${d3.format(",.0f")(dMin.close)}`,+16]
      ].forEach(([d,col,label,yOff]) => {
        svg.append("circle").attr("cx",x(d.date)).attr("cy",y(d.close)).attr("r",5)
          .attr("fill",col).attr("stroke","#fff").attr("stroke-width",1.5);
        svg.append("text").attr("x",x(d.date)).attr("y",y(d.close)+yOff)
          .attr("text-anchor","middle").attr("font-size","10px").attr("font-weight","700")
          .attr("fill",col).attr("stroke",T.bg).attr("stroke-width",3).attr("paint-order","stroke")
          .text(label);
      });

      // X Axis
      svg.append("g").attr("transform",`translate(0,${height-margin.bottom})`)
        .call(d3.axisBottom(x).ticks(width/90).tickFormat(d3.timeFormat("%b '%y")))
        .call(g => {
          g.select(".domain").remove();
          g.selectAll("text").attr("fill",T.text).style("font-size","10px");
          g.selectAll("line").attr("stroke",T.grid);
        });

      // Y Axis
      svg.append("g").attr("transform",`translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(height/50).tickFormat(d=>`$${d3.format("~s")(d)}`))
        .call(g => {
          g.select(".domain").remove();
          g.selectAll("line").remove();
          g.selectAll("text").attr("fill",T.text).style("font-size","10px");
        })
        .call(g => g.append("text")
          .attr("x",-margin.left+4).attr("y",margin.top-16)
          .attr("fill",T.text).attr("text-anchor","start")
          .attr("font-weight",600).attr("font-size",11)
          .text("↑ Daily Close ($)"));

      // Hover tooltip
      const tip = d3.select("body").append("div")
        .style("position","absolute").style("background","rgba(15,23,42,0.93)")
        .style("color","#fff").style("padding","9px 13px").style("border-radius","7px")
        .style("font-size","12px").style("pointer-events","none").style("opacity",0)
        .style("border",`1.5px solid ${COLORS[color]}`).style("z-index","9999").style("line-height","1.7");

      const hLine = svg.append("line")
        .attr("stroke",COLORS[color]).attr("stroke-width",1)
        .attr("stroke-dasharray","4,3")
        .attr("y1",margin.top).attr("y2",height-margin.bottom).attr("opacity",0);
      const hDot = svg.append("circle")
        .attr("r",5).attr("fill",COLORS[color]).attr("stroke","#fff").attr("stroke-width",2).attr("opacity",0);

      // Floating label near cursor
      const fLabel = svg.append("g").attr("opacity",0);
      fLabel.append("rect").attr("rx",3).attr("fill","rgba(15,23,42,0.88)").attr("stroke",COLORS[color]).attr("stroke-width",1);
      fLabel.append("text").attr("class","ft").attr("fill","#fff").attr("font-size","11px").attr("font-weight","700");

      const bisect = d3.bisector(d=>d.date).left;
      svg.append("rect")
        .attr("x",margin.left).attr("y",margin.top)
        .attr("width",width-margin.left-margin.right)
        .attr("height",height-margin.top-margin.bottom)
        .attr("fill","transparent")
        .on("mousemove", function(event) {
          const [mx] = d3.pointer(event,this);
          const xDate = x.invert(mx+margin.left);
          const idx   = Math.min(bisect(data,xDate,1), data.length-1);
          const d0    = data[idx-1]||data[0], d1 = data[idx]||d0;
          const cl    = xDate-d0.date < d1.date-xDate ? d0 : d1;
          const cx    = x(cl.date), cy = y(cl.close);

          hLine.attr("x1",cx).attr("x2",cx).attr("opacity",0.65);
          hDot.attr("cx",cx).attr("cy",cy).attr("opacity",1);

          const lx = cx + (cx > width*0.8 ? -70 : 8);
          fLabel.attr("opacity",1).attr("transform",`translate(${lx},${cy-22})`);
          fLabel.select(".ft").attr("x",6).attr("y",14).text(`$${d3.format(",.2f")(cl.close)}`);
          const bb = fLabel.select(".ft").node().getBBox();
          fLabel.select("rect").attr("width",bb.width+12).attr("height",bb.height+8);

          tip.style("opacity",1)
            .html(`<b style="color:${COLORS[color]}">${d3.timeFormat("%b %d, %Y")(cl.date)}</b><br/>📈 Close: <b>$${cl.close.toFixed(2)}</b>`)
            .style("left",(event.pageX+16)+"px").style("top",(event.pageY-12)+"px");
        })
        .on("mouseout",() => {
          tip.style("opacity",0);
          hLine.attr("opacity",0);
          hDot.attr("opacity",0);
          fLabel.attr("opacity",0);
        });

      return () => tip.remove();
    });
  }, [view, theme, color]);

  /* ══════════════════════════ 3D ══════════════════════════ */
  useEffect(() => {
    if (view !== "3D") return;
    threeRef.current.innerHTML = "";

    const W = threeRef.current.clientWidth || threeRef.current.parentElement?.clientWidth || 928;
    const H = 520;
    const T = THEMES[theme];

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(T.threeBg);
    // Subtle fog for depth
    scene.fog = new THREE.FogExp2(T.threeBg, 0.012);

    const camera = new THREE.PerspectiveCamera(42, W/H, 0.1, 2000);

    const renderer = new THREE.WebGLRenderer({ antialias:true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    threeRef.current.appendChild(renderer.domElement);

    // Lights — NO AxesHelper
    scene.add(new THREE.AmbientLight(0xffffff, 0.85));
    const sun = new THREE.DirectionalLight(0xffffff, 1.0);
    sun.position.set(15,30,20); sun.castShadow=true;
    sun.shadow.mapSize.set(2048,2048); scene.add(sun);
    // Rim light with chart color
    const rimL = new THREE.PointLight(new THREE.Color(COLORS[color]), 0.5, 60);
    rimL.position.set(0,8,8); scene.add(rimL);
    scene.add(new THREE.HemisphereLight(0xffffff, theme==="Dark"?0x0f172a:0xdde4f0, 0.45));

    // Floor
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(60,18),
      new THREE.MeshStandardMaterial({ color:theme==="Dark"?0x0f172a:0xe2e8f0, roughness:0.9 })
    );
    floor.rotation.x = -Math.PI/2; floor.position.y=0;
    floor.receiveShadow=true; scene.add(floor);

    // Grid
    const grid = new THREE.GridHelper(60,30,
      theme==="Dark"?0x334155:0xb0bec5,
      theme==="Dark"?0x1e293b:0xcfd8dc
    );
    grid.position.y=0.01; scene.add(grid);

    const col3d = COLORS_3D[color];
    const col2d = COLORS[color];

    d3.csv("/aapl.csv", d => ({
      date:  new Date(d.date),
      close: +d.close,
    })).then(raw => {
      const data = raw.filter(d => !isNaN(d.date) && !isNaN(d.close));
      setChartData(data);

      const sampled = data.filter((_,i) => i%5===0);
      const minC = d3.min(sampled, d=>d.close);
      const maxC = d3.max(sampled, d=>d.close);
      const norm = v => ((v-minC)/(maxC-minC))*10+0.2;

      const totalW  = 50;
      const spacing = totalW/(sampled.length-1);
      const barW    = spacing*0.72;

      const pivot = new THREE.Group();
      scene.add(pivot);

      sampled.forEach((d,i) => {
        const bh = norm(d.close);
        const xp = i*spacing-totalW/2;
        const col = new THREE.Color(col3d);

        // Bar
        const bar = new THREE.Mesh(
          new THREE.BoxGeometry(barW, bh, barW*1.2),
          new THREE.MeshStandardMaterial({
            color:col, roughness:0.22, metalness:0.40,
            emissive:col, emissiveIntensity:0.14,
            transparent:true, opacity:0.9,
          })
        );
        bar.position.set(xp, bh/2, 0);
        bar.castShadow=true; bar.receiveShadow=true;
        pivot.add(bar);

        // Glow cap
        const capCol = col.clone().lerp(new THREE.Color(0xffffff),0.35);
        const cap = new THREE.Mesh(
          new THREE.BoxGeometry(barW, 0.07, barW*1.2),
          new THREE.MeshStandardMaterial({
            color:capCol, emissive:capCol,
            emissiveIntensity:1.4, roughness:0.02, metalness:1,
          })
        );
        cap.position.set(xp, bh+0.035, 0);
        pivot.add(cap);

        // ── FIX: TubeGeometry instead of THREE.Line (was 1px invisible) ──────
        if (i < sampled.length-1) {
          const next = sampled[i+1];
          const nbh  = norm(next.close);
          const nxp  = (i+1)*spacing-totalW/2;
          const p1   = new THREE.Vector3(xp, bh, 0);
          const p2   = new THREE.Vector3(nxp, nbh, 0);
          const tube = new THREE.Mesh(
            new THREE.TubeGeometry(new THREE.LineCurve3(p1,p2), 4, 0.055, 5, false),
            new THREE.MeshStandardMaterial({
              color:col, roughness:0.2, metalness:0.5,
              emissive:col, emissiveIntensity:0.25,
            })
          );
          pivot.add(tube);
        }
      });

      // Y axis price labels (Canvas sprites — original style)
      const yTicks = [minC, ...d3.range(100, maxC, 100).filter(v=>v>minC&&v<maxC), maxC];
      yTicks.forEach(tick => {
        const yp = norm(tick);
        const c  = document.createElement("canvas");
        c.width=130; c.height=46;
        const cx = c.getContext("2d");
        cx.fillStyle="rgba(255,255,255,0.96)"; cx.roundRect(2,2,126,42,7); cx.fill();
        cx.strokeStyle=col2d; cx.lineWidth=1.5; cx.roundRect(2,2,126,42,7); cx.stroke();
        cx.font="bold 20px Arial"; cx.fillStyle=col2d;
        cx.textAlign="center"; cx.textBaseline="middle";
        cx.fillText(`$${tick.toFixed(0)}`,65,23);
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map:new THREE.CanvasTexture(c), transparent:true }));
        sprite.scale.set(2.2,0.78,1);
        sprite.position.set(-totalW/2-3.5, yp, 0);
        scene.add(sprite);
      });

      // Date labels (bottom)
      const dStep = Math.max(1,Math.floor(sampled.length/8));
      sampled.filter((_,i)=>i%dStep===0).forEach((d,idx)=>{
        const xp = idx*dStep*spacing-totalW/2;
        const c  = document.createElement("canvas");
        c.width=160; c.height=50;
        const cx = c.getContext("2d");
        cx.fillStyle="rgba(255,255,255,0.93)"; cx.roundRect(2,2,156,46,7); cx.fill();
        cx.font="bold 18px Arial"; cx.fillStyle="#334155";
        cx.textAlign="center"; cx.textBaseline="middle";
        cx.fillText(d3.timeFormat("%b %Y")(d.date),80,25);
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map:new THREE.CanvasTexture(c), transparent:true }));
        sprite.scale.set(2.2,0.68,1);
        sprite.position.set(xp,-0.9,0);
        scene.add(sprite);
      });

      // Price badges on top of bars
      const pStep = Math.max(1,Math.floor(sampled.length/10));
      sampled.filter((_,i)=>i%pStep===0).forEach((d,idx)=>{
        const i  = idx*pStep;
        const bh = norm(d.close);
        const xp = i*spacing-totalW/2;
        const c  = document.createElement("canvas");
        c.width=120; c.height=46;
        const cx = c.getContext("2d");
        cx.fillStyle="rgba(255,255,255,0.96)"; cx.roundRect(2,2,116,42,7); cx.fill();
        cx.strokeStyle=col2d; cx.lineWidth=2; cx.roundRect(2,2,116,42,7); cx.stroke();
        cx.font="bold 19px Arial"; cx.fillStyle=col2d;
        cx.textAlign="center"; cx.textBaseline="middle";
        cx.fillText(`$${d.close.toFixed(0)}`,60,23);
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map:new THREE.CanvasTexture(c), transparent:true }));
        sprite.scale.set(1.8,0.68,1);
        sprite.position.set(xp, bh+0.9, 0);
        scene.add(sprite);
      });
    });

    // Camera orbit + drag
    let isDragging=false, prevX=0, prevY=0;
    let rotY=0, rotX=0.38, autoSpin=true;
    const R=32;

    const positionCamera = () => {
      camera.position.set(
        R*Math.sin(rotY)*Math.cos(rotX),
        R*Math.sin(rotX)+5,
        R*Math.cos(rotY)*Math.cos(rotX)
      );
      camera.lookAt(0,5,0);
    };
    positionCamera();

    const onDown = e => { isDragging=true; autoSpin=false; prevX=e.clientX??e.touches?.[0]?.clientX; prevY=e.clientY??e.touches?.[0]?.clientY; renderer.domElement.style.cursor="grabbing"; };
    const onUp   = () => { isDragging=false; renderer.domElement.style.cursor="grab"; };
    const onMove = e => {
      if (!isDragging) return;
      const cx=e.clientX??e.touches?.[0]?.clientX;
      const cy=e.clientY??e.touches?.[0]?.clientY;
      rotY -= (cx-prevX)*0.007;
      rotX  = Math.max(0.05,Math.min(1.1,rotX+(cy-prevY)*0.005));
      prevX=cx; prevY=cy; positionCamera();
    };

    renderer.domElement.addEventListener("mousedown",  onDown);
    window.addEventListener("mouseup",    onUp);
    window.addEventListener("mousemove",  onMove);
    renderer.domElement.addEventListener("touchstart", onDown, { passive:true });
    renderer.domElement.addEventListener("touchend",   onUp);
    renderer.domElement.addEventListener("touchmove",  onMove, { passive:true });
    renderer.domElement.style.cursor="grab";

    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (autoSpin) { rotY+=0.003; positionCamera(); }
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      renderer.domElement.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup",   onUp);
      window.removeEventListener("mousemove", onMove);
      renderer.dispose();
      if (threeRef.current?.contains(renderer.domElement)) threeRef.current.removeChild(renderer.domElement);
    };
  }, [view, theme, color]);

  const T = THEMES[theme];
  const ddStyle = {
    padding:"5px 10px", borderRadius:6,
    border:`1px solid ${T.grid}`,
    background: theme==="Dark"?"#1e293b":"#fff",
    color:T.text, fontWeight:"500", cursor:"pointer", fontSize:12, outline:"none",
  };

  return (
    <div style={{
      background:T.bg, borderRadius:12, padding:"20px 24px 32px",
      width:"100%", boxSizing:"border-box", fontFamily:"Inter,system-ui,sans-serif",
    }}>
      {/* Header */}
      <div style={{ marginBottom:4 }}>
        <div style={{ fontSize:16, fontWeight:"bold", color:T.text }}>
          Apple Stock Price – Area Chart
        </div>
        <div style={{ fontSize:12, color:"#94a3b8", marginTop:2 }}>
          AAPL daily closing price · 2D area + 3D bar view
        </div>
      </div>

      {/* Controls */}
      <div style={{ display:"flex", gap:16, alignItems:"flex-end", marginTop:14, marginBottom:20, flexWrap:"wrap" }}>
        <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
          <label style={{ fontSize:11, color:"#94a3b8", fontWeight:"600" }}>View</label>
          <select value={view} onChange={e=>setView(e.target.value)} style={ddStyle}>
            <option value="2D">2D</option>
            <option value="3D">3D</option>
          </select>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
          <label style={{ fontSize:11, color:"#94a3b8", fontWeight:"600" }}>Theme</label>
          <select value={theme} onChange={e=>setTheme(e.target.value)} style={ddStyle}>
            {Object.keys(THEMES).map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
          <label style={{ fontSize:11, color:"#94a3b8", fontWeight:"600" }}>Color</label>
          <select value={color} onChange={e=>setColor(e.target.value)} style={ddStyle}>
            {Object.keys(COLORS).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Chart + Stats */}
      <div style={{ display:"flex", gap:14, alignItems:"flex-start", width:"100%" }}>
        <div style={{ flex:1, minWidth:0 }}>
          {view==="3D" && (
            <p style={{ fontSize:11, color:"#94a3b8", marginBottom:8 }}>
              🔄 Auto-rotating · 🖱️ Drag to rotate manually
            </p>
          )}
          <div style={{ border:`1px solid ${T.grid}`, borderRadius:10, overflow:"hidden" }}>
            {view==="2D" && <div ref={svgRef} />}
            {view==="3D" && <div ref={threeRef} style={{ width:"100%", cursor:"grab" }} />}
          </div>
        </div>

        {/* Stats panel — right side */}
        <StatsPanel data={chartData} color={color} theme={theme} />
      </div>
    </div>
  );
}