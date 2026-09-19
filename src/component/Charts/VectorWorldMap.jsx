import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { feature } from "topojson-client";

const THEMES = {
  Modern:  ["#6366f1","#06b6d4","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899","#14b8a6","#f97316","#a855f7","#22c55e","#f43f5e","#0ea5e9","#84cc16","#fb923c","#e879f9"],
  Neon:    ["#ff0080","#00f5ff","#39ff14","#ffae00","#ff3131","#ff6bff","#00ff9d","#ff4400","#ff00aa","#00ccff","#ffff00","#ff6600","#00ff88","#cc00ff","#ff3399","#00ffcc"],
  Pastel:  ["#a5b4fc","#67e8f9","#6ee7b7","#fde68a","#fca5a5","#c4b5fd","#f9a8d4","#99f6e4","#fdba74","#d1d5db","#86efac","#fbbf24","#93c5fd","#f0abfc","#fb7185","#a3e635"],
  Sunset:  ["#ff6b6b","#feca57","#ff9ff3","#48dbfb","#1dd1a1","#f368e0","#ff9f43","#10ac84","#5f27cd","#00d2d3","#ee5a24","#009432","#0652dd","#9980fa","#833471","#ea2027"],
  Ocean:   ["#00b4d8","#48cae4","#0096c7","#ade8f4","#90e0ef","#023e8a","#0077b6","#caf0f8","#03045e","#7ec8e3","#00d4ff","#0066cc","#33aaff","#99ddff","#006699","#3399cc"],
  Galaxy:  ["#c77dff","#9d4edd","#7b2cbf","#e0aaff","#4a306d","#c45eed","#a24edd","#803ead","#5e2e7d","#3c1e4d","#d0a0ff","#b070ee","#9050dd","#7030cc","#5010bb","#ff80ff"],
  Forest:  ["#52b788","#74c69d","#40916c","#95d5b2","#2d6a4f","#b7e4c7","#1b4332","#a7c957","#6a994e","#386641","#78c17d","#4e9a55","#2e7a3c","#1a5e2d","#8dc88e","#3a7a43"],
  Autumn:  ["#7f4f24","#936639","#a68a64","#c2c5aa","#e63946","#c1121f","#9d0208","#6a040f","#b5838d","#e07a5f","#f2cc8f","#81b29a","#3d405b","#f4f1de","#e07a5f","#3d405b"],
  Candy:   ["#ff006e","#fb5607","#ffbe0b","#8338ec","#3a86ff","#06d6a0","#ef476f","#ffd166","#26547c","#05c7f2","#ff85a1","#ffa69e","#b5ead7","#c7ceea","#ffdac1","#e2f0cb"],
  Earth:   ["#6b4f3c","#8b6914","#a07850","#b8975a","#c9a96e","#3a7d44","#2d6a4f","#1b4332","#52796f","#84a98c","#b7c4b1","#6b705c","#a5a58d","#cb997e","#ddbea9","#ffe8d6"],
};

const COUNTRIES = [
  { name:"USA",          population:331,  gdp:22996, area:9834,  lat:40,   lon:-100 },
  { name:"China",        population:1440, gdp:17734, area:9707,  lat:35,   lon:105  },
  { name:"India",        population:1380, gdp:3173,  area:3287,  lat:20,   lon:78   },
  { name:"Brazil",       population:213,  gdp:1839,  area:8516,  lat:-15,  lon:-55  },
  { name:"Germany",      population:84,   gdp:4231,  area:357,   lat:51,   lon:10   },
  { name:"UK",           population:68,   gdp:3186,  area:243,   lat:54,   lon:-2   },
  { name:"Japan",        population:126,  gdp:5390,  area:378,   lat:36,   lon:138  },
  { name:"Russia",       population:146,  gdp:1699,  area:17098, lat:61,   lon:100  },
  { name:"France",       population:65,   gdp:2937,  area:552,   lat:46,   lon:2    },
  { name:"Canada",       population:38,   gdp:1837,  area:9985,  lat:56,   lon:-106 },
  { name:"Australia",    population:25,   gdp:1618,  area:7692,  lat:-25,  lon:133  },
  { name:"Mexico",       population:129,  gdp:1274,  area:1964,  lat:23,   lon:-102 },
  { name:"Italy",        population:60,   gdp:2086,  area:301,   lat:42,   lon:12   },
  { name:"Spain",        population:47,   gdp:1394,  area:506,   lat:40,   lon:-4   },
  { name:"South Korea",  population:51,   gdp:1798,  area:100,   lat:36,   lon:128  },
  { name:"Saudi Arabia", population:35,   gdp:793,   area:2149,  lat:24,   lon:45   },
];

const MAP_TYPES = {
  population: { label:"Population (M)",    key:"population", fmt: v=>`${v}M`      },
  gdp:        { label:"GDP (Billions USD)", key:"gdp",        fmt: v=>`$${v}B`    },
  area:       { label:"Area (1000 km²)",   key:"area",       fmt: v=>`${v}k km²`  },
};

// Each country gets its own dedicated color from the palette — index i maps 1-to-1
function getColor(palette, i) {
  return palette[i];
}

const getRadius = (country, mapType) => {
  const v = country[mapType];
  const ranges = { population:[25,1440], gdp:[793,22996], area:[100,17098] };
  const [lo, hi] = ranges[mapType];
  return 5 + ((v - lo) / (hi - lo)) * 22;
};

// ─── Shared Legend ────────────────────────────────────────────────────────────
function LegendHTML({ palette, mapType }) {
  const mt = MAP_TYPES[mapType];
  return (
    <div style={{
      background:"#fff", border:"1px solid #e2e8f0", borderRadius:8,
      padding:"12px 14px", width:160, flexShrink:0,
      boxShadow:"0 1px 4px rgba(0,0,0,0.07)", alignSelf:"flex-start",
    }}>
      <div style={{ fontSize:10, fontWeight:"bold", color:"#94a3b8", letterSpacing:"0.08em", marginBottom:4 }}>
        {mt.label.toUpperCase()}
      </div>
      <div style={{ fontSize:9, color:"#94a3b8", marginBottom:10 }}>
        Circle size = {mt.label}
      </div>
      {COUNTRIES.map((c, i) => {
        const col = getColor(palette, i);
        return (
          <div key={c.name} style={{ display:"flex", alignItems:"center", gap:7, marginBottom:5 }}>
            <div style={{ width:10, height:10, borderRadius:"50%", flexShrink:0, background:col }} />
            <span style={{ color:"#334155", fontSize:10, flex:1 }}>{c.name}</span>
            <span style={{ color:col, fontSize:10, fontWeight:"bold" }}>
              {mt.fmt(c[mapType])}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── 2D Map ───────────────────────────────────────────────────────────────────
function Map2D({ theme, mapType }) {
  const svgRef  = useRef(null);
  const palette = THEMES[theme];

  useEffect(() => {
    if (!svgRef.current) return;
    const W = 620, H = 400;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox",`0 0 ${W} ${H}`).attr("preserveAspectRatio","xMidYMid meet");
    svg.append("rect").attr("width",W).attr("height",H).attr("fill","#f0f4f8").attr("rx",8);

    const proj = d3.geoNaturalEarth1().scale(96).translate([W/2, H/2]);
    const path = d3.geoPath().projection(proj);

    // Tooltip — appended to body, removed on cleanup
    const tooltip = d3.select("body").append("div")
      .style("position","absolute").style("background","rgba(15,23,42,0.92)")
      .style("color","#fff").style("padding","8px 12px").style("border-radius","6px")
      .style("font-size","12px").style("pointer-events","none").style("opacity",0)
      .style("border","1px solid #334155").style("z-index","9999")
      .style("min-width","160px");

    d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json").then(world => {
      const countries = feature(world, world.objects.countries);

      svg.append("g").selectAll("path").data(countries.features).enter().append("path")
        .attr("d",path).attr("fill","#dde4ed").attr("stroke","#b8c4d0").attr("stroke-width",0.4);

      svg.append("path").datum(d3.geoGraticule()())
        .attr("d",path).attr("fill","none").attr("stroke","#c8d3e0")
        .attr("stroke-width",0.3).attr("opacity",0.5);

      // Pulsing outer rings
      COUNTRIES.forEach((c, i) => {
        const pos = proj([c.lon, c.lat]);
        if (!pos) return;
        const r   = getRadius(c, mapType);
        const col = getColor(palette, i);
        svg.append("circle").attr("cx",pos[0]).attr("cy",pos[1]).attr("r",r+5)
          .attr("fill","none").attr("stroke",col).attr("stroke-width",1).attr("opacity",0.25);
      });

      // Main circles
      svg.selectAll(".dot").data(COUNTRIES).enter().append("circle")
        .attr("cx", d => { const p=proj([d.lon,d.lat]); return p?p[0]:-999; })
        .attr("cy", d => { const p=proj([d.lon,d.lat]); return p?p[1]:-999; })
        .attr("r",  d => getRadius(d, mapType))
        .attr("fill", (_,i) => getColor(palette, i))
        .attr("stroke","#fff").attr("stroke-width",1.2).attr("opacity",0.85)
        .style("cursor","pointer")
        .on("mouseover", function(event, d) {
          d3.select(this).attr("opacity",1).attr("stroke-width",2.5).attr("stroke","#1e293b");
          // hover label above dot
          svg.selectAll(".hover-label").remove();
          const p   = proj([d.lon, d.lat]);
          const r   = getRadius(d, mapType);
          const col = getColor(palette, COUNTRIES.indexOf(d));
          const lbl = `${d.name}: ${MAP_TYPES[mapType].fmt(d[mapType])}`;
          const g   = svg.append("g").attr("class","hover-label");
          const txt = g.append("text")
            .attr("x",p[0]).attr("y",p[1]-r-8)
            .attr("text-anchor","middle").style("font-size","10px").style("font-weight","700")
            .style("fill","#fff").style("pointer-events","none").text(lbl);
          const bb = txt.node().getBBox();
          g.insert("rect","text")
            .attr("x",bb.x-5).attr("y",bb.y-3)
            .attr("width",bb.width+10).attr("height",bb.height+6)
            .attr("rx",4).attr("fill",col).attr("opacity",0.92);
          tooltip.style("opacity",1)
            .html(
              `<b style="color:${col}">${d.name}</b><br/>` +
              `Population: ${d.population}M<br/>` +
              `GDP: $${d.gdp}B<br/>` +
              `Area: ${d.area}k km²`
            )
            .style("left",(event.pageX+12)+"px").style("top",(event.pageY-10)+"px");
        })
        .on("mousemove", event => {
          tooltip.style("left",(event.pageX+12)+"px").style("top",(event.pageY-10)+"px");
        })
        .on("mouseout", function() {
          d3.select(this).attr("opacity",0.85).attr("stroke-width",1.2).attr("stroke","#fff");
          svg.selectAll(".hover-label").remove();
          tooltip.style("opacity",0);
        });

    }).catch(() => {
      svg.append("text").attr("x",W/2).attr("y",H/2)
        .attr("text-anchor","middle").attr("fill","#ef4444").text("Failed to load map.");
    });

    return () => tooltip.remove();
  }, [theme, mapType]);

  return (
    <div style={{ display:"flex", gap:12, alignItems:"flex-start", width:"100%", border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden" }}>
      <svg ref={svgRef} style={{ display:"block", flex:1, minWidth:0 }} />
      <div style={{ padding:"12px 12px 12px 0" }}>
        <LegendHTML palette={palette} mapType={mapType} />
      </div>
    </div>
  );
}

// ─── 3D Globe ─────────────────────────────────────────────────────────────────
function Map3D({ theme, mapType }) {
  const mountRef   = useRef(null);
  const canvasRef  = useRef(null);
  const stateRef   = useRef({
    rotX:0.3, rotY:0,
    isDragging:false, prevX:0, prevY:0,
    autoSpin:true, animId:null,
    hovered:null, screenPts:[],
    texReady:false,
  });
  const palette = THEMES[theme];

  function latLonToVec(lat, lon) {
    const phi   = (90-lat)*Math.PI/180;
    const theta = (lon+180)*Math.PI/180;
    return [
      -Math.sin(phi)*Math.cos(theta),
       Math.cos(phi),
       Math.sin(phi)*Math.sin(theta),
    ];
  }

  function rotateVec(v, rx, ry) {
    const x  =  v[0]*Math.cos(ry)+v[2]*Math.sin(ry);
    const y0 =  v[1];
    const z0 = -v[0]*Math.sin(ry)+v[2]*Math.cos(ry);
    const y1 =  y0*Math.cos(rx)-z0*Math.sin(rx);
    const z1 =  y0*Math.sin(rx)+z0*Math.cos(rx);
    return [x, y1, z1];
  }

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const s = stateRef.current;

    // Create canvas
    const canvas = document.createElement("canvas");
    const W = mount.offsetWidth || 620;
    const H = 400;
    canvas.width  = W;
    canvas.height = H;
    canvas.style.width  = "100%";
    canvas.style.height = H+"px";
    canvas.style.display = "block";
    canvas.style.cursor  = "grab";
    mount.appendChild(canvas);
    canvasRef.current = canvas;

    const ctx = canvas.getContext("2d");
    const R   = Math.min(W,H)*0.44;
    const cx  = W/2, cy = H/2;

    // Texture canvas
    const texW=2048, texH=1024;
    const texCanvas = document.createElement("canvas");
    texCanvas.width=texW; texCanvas.height=texH;
    const tctx = texCanvas.getContext("2d");
    s.texReady = false;

    // Tooltip div inside mount
    const tip = document.createElement("div");
    tip.style.cssText = "position:absolute;background:rgba(15,23,42,0.92);color:#fff;padding:8px 12px;border-radius:6px;font-size:12px;pointer-events:none;opacity:0;border:1px solid #334155;z-index:9999;min-width:160px;transition:opacity 0.1s;";
    mount.style.position = "relative";
    mount.appendChild(tip);

    function buildTexture(worldData) {
      tctx.fillStyle = "#dde4ed";
      tctx.fillRect(0,0,texW,texH);
      const tproj   = d3.geoEquirectangular().scale(texW/(2*Math.PI)).translate([texW/2,texH/2]);
      const pathGen = d3.geoPath().projection(tproj).context(tctx);
      const ctries  = feature(worldData, worldData.objects.countries);
      ctries.features.forEach(f => {
        tctx.beginPath(); pathGen(f);
        tctx.fillStyle = "#dde4ed"; tctx.fill();
        tctx.strokeStyle = "#b8c4d0"; tctx.lineWidth=0.6; tctx.stroke();
      });
      s.texReady = true;
    }

    d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json").then(data => {
      buildTexture(data);
    });

    function drawFrame() {
      ctx.clearRect(0,0,W,H);
      if (s.autoSpin) s.rotY += 0.003;

      // Background
      ctx.beginPath(); ctx.arc(cx,cy,R,0,Math.PI*2);
      ctx.fillStyle = "#f0f4f8"; ctx.fill();

      // Sphere from texture (raycast)
      if (s.texReady) {
        const rawTex  = tctx.getImageData(0,0,texW,texH);
        const imgData = ctx.createImageData(W,H);
        const ld = [0.6,0.5,0.7];
        const cosRX=Math.cos(-s.rotX), sinRX=Math.sin(-s.rotX);
        const cosRY=Math.cos(-s.rotY), sinRY=Math.sin(-s.rotY);

        for (let py=Math.floor(cy-R); py<=cy+R; py++) {
          for (let px=Math.floor(cx-R); px<=cx+R; px++) {
            const dx=(px-cx)/R, dy=(py-cy)/R;
            const d2=dx*dx+dy*dy;
            if (d2>1) continue;
            const dz=Math.sqrt(1-d2);
            let vx=dx, vy=-dy, vz=dz;
            const vy2= vy*cosRX-vz*sinRX; const vz2= vy*sinRX+vz*cosRX; vy=vy2; vz=vz2;
            const vx2= vx*cosRY+vz*sinRY; const vz3=-vx*sinRY+vz*cosRY; vx=vx2; vz=vz3;
            const lat=90-Math.acos(Math.max(-1,Math.min(1,vy)))*180/Math.PI;
            let lon=Math.atan2(vz,-vx)*180/Math.PI-180; if(lon<-180) lon+=360;
            const tx=Math.min(texW-1,Math.floor(((lon+180)/360)*texW));
            const ty=Math.min(texH-1,Math.floor(((90-lat)/180)*texH));
            const ti=(ty*texW+tx)*4;
            const ndotl=Math.max(0.25, dx*ld[0]+(-dy)*ld[1]+dz*ld[2]);
            const pi=(py*W+px)*4;
            imgData.data[pi]  =Math.min(255,rawTex.data[ti]  *ndotl);
            imgData.data[pi+1]=Math.min(255,rawTex.data[ti+1]*ndotl);
            imgData.data[pi+2]=Math.min(255,rawTex.data[ti+2]*ndotl);
            imgData.data[pi+3]=255;
          }
        }
        ctx.putImageData(imgData,0,0);
      }

      // Clip for overlays
      ctx.save();
      ctx.beginPath(); ctx.arc(cx,cy,R,0,Math.PI*2); ctx.clip();
      const spec=ctx.createRadialGradient(cx-R*0.35,cy-R*0.3,0,cx,cy,R);
      spec.addColorStop(0,"rgba(255,255,255,0.18)"); spec.addColorStop(0.5,"rgba(255,255,255,0)");
      ctx.fillStyle=spec; ctx.fillRect(0,0,W,H);
      ctx.restore();

      // Globe border
      ctx.beginPath(); ctx.arc(cx,cy,R,0,Math.PI*2);
      ctx.strokeStyle="#b8c4d0"; ctx.lineWidth=1.5; ctx.stroke();

      // ── Country dots + labels ────────────────────────────────────
      const mt = MAP_TYPES[mapType];
      s.screenPts = [];

      const pts = COUNTRIES.map((c,i) => {
        const vec3  = latLonToVec(c.lat, c.lon);
        const rot   = rotateVec(vec3, s.rotX, s.rotY);
        const sx    = cx + rot[0]*R;
        const sy    = cy - rot[1]*R;
        const depth = rot[2];
        return { c, i, sx, sy, depth };
      }).filter(d => d.depth > -0.1).sort((a,b) => a.depth-b.depth);

      // Pass 1 — dots
      pts.forEach(({ c, i, sx, sy, depth }) => {
        const col        = getColor(palette, i);
        const baseR      = getRadius(c, mapType);
        const depthScale = (depth+1)/2;
        const pr         = baseR*(0.5+depthScale*0.5);
        const alpha      = 0.5+depthScale*0.5;

        s.screenPts.push({ c, sx, sy, pr });

        // Pulse ring
        ctx.globalAlpha=alpha*0.25;
        ctx.beginPath(); ctx.arc(sx,sy,pr+5,0,Math.PI*2);
        ctx.strokeStyle=col; ctx.lineWidth=1; ctx.stroke();
        ctx.globalAlpha=1;

        // Dot
        ctx.beginPath(); ctx.arc(sx,sy,pr,0,Math.PI*2);
        ctx.fillStyle=col; ctx.globalAlpha=alpha; ctx.fill();
        ctx.strokeStyle="rgba(255,255,255,0.8)"; ctx.lineWidth=1.2; ctx.stroke();
        ctx.globalAlpha=1;
      });

      // Pass 2 — labels (drawn after all dots so they sit on top)
      pts.forEach(({ c, i, sx, sy, depth }) => {
        if (depth < 0.05) return; // hide labels on far side
        const col        = getColor(palette, i);
        const baseR      = getRadius(c, mapType);
        const depthScale = (depth+1)/2;
        const pr         = baseR*(0.5+depthScale*0.5);
        const isHovered  = s.hovered===c;
        const mt2        = MAP_TYPES[mapType];

        const nameLbl = c.name;
        const valLbl  = mt2.fmt(c[mapType]);
        const fs      = isHovered ? 11 : 9;
        const vs      = isHovered ? 10 : 8;
        const lh      = fs + vs + 8;

        ctx.font = `bold ${fs}px sans-serif`;
        const nw = ctx.measureText(nameLbl).width;
        ctx.font = `${vs}px sans-serif`;
        const vw = ctx.measureText(valLbl).width;
        const lw = Math.max(nw,vw)+10;
        const lx = sx - lw/2;
        const ly = sy - pr - lh - 4;

        ctx.globalAlpha = isHovered ? 0.97 : (0.65+depthScale*0.25);
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(lx,ly,lw,lh,3);
        else ctx.rect(lx,ly,lw,lh);
        ctx.fillStyle=col; ctx.fill();
        ctx.globalAlpha=1;

        ctx.font=`bold ${fs}px sans-serif`;
        ctx.fillStyle="#fff"; ctx.textAlign="center";
        ctx.fillText(nameLbl, sx, ly+fs+1);
        ctx.font=`${vs}px sans-serif`;
        ctx.fillStyle="rgba(255,255,255,0.9)";
        ctx.fillText(valLbl,  sx, ly+fs+vs+4);
        ctx.textAlign="left";
      });
    }

    function animate() { drawFrame(); s.animId=requestAnimationFrame(animate); }
    if (s.animId) cancelAnimationFrame(s.animId);
    animate();

    // Mouse events
    const onDown = e => { s.isDragging=true; s.prevX=e.clientX; s.prevY=e.clientY; s.autoSpin=false; };
    const onUp   = () => { s.isDragging=false; };
    const onDrag = e => {
      if (!s.isDragging) return;
      s.rotY += (e.clientX-s.prevX)*0.005;
      s.rotX += (e.clientY-s.prevY)*0.003;
      s.rotX  = Math.max(-1.3,Math.min(1.3,s.rotX));
      s.prevX=e.clientX; s.prevY=e.clientY;
    };
    const onHover = e => {
      if (s.isDragging) { s.hovered=null; tip.style.opacity="0"; return; }
      const rect = canvas.getBoundingClientRect();
      const mx   = (e.clientX-rect.left)*(W/rect.width);
      const my   = (e.clientY-rect.top)*(H/rect.height);
      let found  = null;
      for (let j=s.screenPts.length-1; j>=0; j--) {
        const {c,sx,sy,pr} = s.screenPts[j];
        const dx=mx-sx, dy=my-sy;
        if (Math.sqrt(dx*dx+dy*dy)<pr+6) { found=c; break; }
      }
      s.hovered = found;
      if (found) {
        const col = getColor(palette, COUNTRIES.indexOf(found));
        tip.style.opacity="1";
        tip.innerHTML =
          `<b style="color:${col}">${found.name}</b><br/>` +
          `Population: ${found.population}M<br/>` +
          `GDP: $${found.gdp}B<br/>` +
          `Area: ${found.area}k km²`;
        tip.style.left = (e.clientX - rect.left + 12)+"px";
        tip.style.top  = (e.clientY - rect.top  - 10)+"px";
      } else {
        tip.style.opacity="0";
      }
    };
    const onLeave = () => { s.hovered=null; tip.style.opacity="0"; };

    canvas.addEventListener("mousedown", onDown);
    canvas.addEventListener("mousemove", onHover);
    canvas.addEventListener("mouseleave", onLeave);
    window.addEventListener("mouseup",   onUp);
    window.addEventListener("mousemove", onDrag);

    return () => {
      cancelAnimationFrame(s.animId);
      canvas.removeEventListener("mousedown", onDown);
      canvas.removeEventListener("mousemove", onHover);
      canvas.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("mouseup",   onUp);
      window.removeEventListener("mousemove", onDrag);
      if (mount.contains(canvas)) mount.removeChild(canvas);
      if (mount.contains(tip))    mount.removeChild(tip);
    };
  }, [theme, mapType]);

  return (
    <div style={{ display:"flex", gap:12, alignItems:"flex-start", width:"100%", border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden" }}>
      <div ref={mountRef} style={{ flex:1, minWidth:0 }} />
      <div style={{ padding:"12px 12px 12px 0" }}>
        <LegendHTML palette={palette} mapType={mapType} />
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const VectorWorldMap = () => {
  const [viewMode, setViewMode] = useState("2d");
  const [theme,    setTheme]    = useState("Modern");
  const [mapType,  setMapType]  = useState("population");

  const total = {
    pop:  COUNTRIES.reduce((s,c)=>s+c.population,0),
    gdp:  COUNTRIES.reduce((s,c)=>s+c.gdp,0),
    area: COUNTRIES.reduce((s,c)=>s+c.area,0),
  };

  // Exactly matching original ddStyle
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
        <div style={{ fontSize:16, fontWeight:"bold", color:"#1e293b" }}>World Vector Map</div>
        <div style={{ fontSize:12, color:"#94a3b8", marginTop:2 }}>
          {COUNTRIES.length} countries · Total pop {total.pop}M · GDP ${total.gdp}B · Area {total.area}k km²
        </div>
      </div>

      {/* Dropdowns — identical structure to original */}
      <div style={{ display:"flex", gap:10, alignItems:"flex-end", marginTop:12, marginBottom:20, flexWrap:"wrap" }}>
        <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
          <label style={{ fontSize:11, color:"#94a3b8", fontWeight:"600" }}>View</label>
          <select value={viewMode} onChange={e=>setViewMode(e.target.value)} style={ddStyle}>
            <option value="2d">2D</option>
            <option value="3d">3D</option>
          </select>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
          <label style={{ fontSize:11, color:"#94a3b8", fontWeight:"600" }}>Color Theme</label>
          <select value={theme} onChange={e=>setTheme(e.target.value)} style={ddStyle}>
            {Object.keys(THEMES).map(k=><option key={k} value={k}>{k}</option>)}
          </select>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
          <label style={{ fontSize:11, color:"#94a3b8", fontWeight:"600" }}>Metric</label>
          <select value={mapType} onChange={e=>setMapType(e.target.value)} style={ddStyle}>
            {Object.entries(MAP_TYPES).map(([k,v])=>(
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Chart */}
      {viewMode==="2d"
        ? <Map2D key={`2d-${theme}-${mapType}`} theme={theme} mapType={mapType} />
        : <Map3D key={`3d-${theme}-${mapType}`} theme={theme} mapType={mapType} />
      }
    </div>
  );
};

export default VectorWorldMap;