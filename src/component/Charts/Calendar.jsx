import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

const THEMES = {
  Modern:  { low:"#e0e7ff", mid:"#818cf8", high:"#4338ca", label:"#6366f1" },
  Neon:    { low:"#0d0221", mid:"#00f5ff", high:"#ff0080", label:"#00f5ff" },
  Pastel:  { low:"#f0fdf4", mid:"#86efac", high:"#16a34a", label:"#22c55e" },
  Sunset:  { low:"#fff7ed", mid:"#fb923c", high:"#b91c1c", label:"#ef4444" },
  Ocean:   { low:"#e0f2fe", mid:"#38bdf8", high:"#0c4a6e", label:"#0284c7" },
  Galaxy:  { low:"#1a0533", mid:"#9d4edd", high:"#e0aaff", label:"#c77dff" },
  Forest:  { low:"#f0fdf4", mid:"#4ade80", high:"#14532d", label:"#16a34a" },
  Autumn:  { low:"#fff7ed", mid:"#fb923c", high:"#7c2d12", label:"#ea580c" },
  Candy:   { low:"#fdf4ff", mid:"#e879f9", high:"#7e22ce", label:"#a21caf" },
  Earth:   { low:"#fefce8", mid:"#a16207", high:"#3a7d44", label:"#15803d" },
};

// Deterministic pseudo-random (no re-render flicker)
const seededRand = (seed) => {
  let s = seed;
  return () => { s = (s*1664525 + 1013904223) & 0xffffffff; return (s >>> 0)/0xffffffff; };
};

const genData = (year) => {
  const start = new Date(year,0,1), end = new Date(year,11,31);
  const rng   = seededRand(year * 73856093);
  return d3.timeDays(start, end).map(date => {
    const day  = date.getDay(), mo = date.getMonth();
    const wknd = day===0||day===6;
    let v = wknd ? Math.floor(rng()*15)+5 : Math.floor(rng()*12)+3;
    if (mo===5||mo===6) v+=4;
    if (mo===11) v+=5;
    if (mo===0)  v+=3;
    return { date, value:Math.min(v,25), dayOfWeek:day, isWeekend:wknd, month:mo };
  });
};

// ─── Shared Legend ────────────────────────────────────────────────────────────
function LegendHTML({ theme, data, year }) {
  const t     = THEMES[theme];
  const total = data.reduce((s,d)=>s+d.value,0);
  const avg   = data.length ? (total/data.length).toFixed(1) : "–";
  const peak  = data.reduce((best,d)=>d.value>best.value?d:best, data[0]);

  const colScale = d3.scaleLinear().domain([0,12,25]).range([t.low,t.mid,t.high]);

  return (
    <div style={{
      background:"#fff", border:"1px solid #e2e8f0", borderRadius:8,
      padding:"12px 14px", width:155, flexShrink:0,
      boxShadow:"0 1px 4px rgba(0,0,0,0.07)", alignSelf:"flex-start",
    }}>
      <div style={{ fontSize:10, fontWeight:"bold", color:"#94a3b8", letterSpacing:"0.08em", marginBottom:8 }}>
        {year} SUMMARY
      </div>
      {[
        ["Total events",  total.toLocaleString()],
        ["Avg / day",     avg],
        ["Active days",   data.filter(d=>d.value>0).length],
        ["Peak value",    peak ? peak.value : "–"],
      ].map(([k,v]) => (
        <div key={k} style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
          <span style={{ fontSize:10, color:"#94a3b8" }}>{k}</span>
          <span style={{ fontSize:10, fontWeight:"bold", color:"#334155" }}>{v}</span>
        </div>
      ))}

      <div style={{ borderTop:"1px solid #e2e8f0", margin:"8px 0" }} />
      <div style={{ fontSize:10, fontWeight:"bold", color:"#94a3b8", letterSpacing:"0.08em", marginBottom:6 }}>
        ACTIVITY SCALE
      </div>
      <div style={{ display:"flex", gap:2, alignItems:"center", marginBottom:4 }}>
        {[0,4,8,12,18,25].map(v => (
          <div key={v} style={{ width:14, height:14, borderRadius:2, background:colScale(v), border:"1px solid #e2e8f0" }} />
        ))}
      </div>
      <div style={{ display:"flex", justifyContent:"space-between" }}>
        <span style={{ fontSize:9, color:"#94a3b8" }}>Less</span>
        <span style={{ fontSize:9, color:"#94a3b8" }}>More</span>
      </div>
    </div>
  );
}

// ─── Calendar SVG ─────────────────────────────────────────────────────────────
function CalendarGrid({ year, theme, onSelect, selected }) {
  const svgRef = useRef(null);
  const t      = THEMES[theme];
  const data   = genData(year);

  useEffect(() => {
    if (!svgRef.current) return;

    const cellSize = 13, cellGap = 2, step = cellSize+cellGap;
    const margin   = { top:36, right:10, bottom:28, left:32 };

    const startDate = new Date(year,0,1);
    const weeks     = d3.timeWeek.count(startDate, new Date(year,11,31)) + 1;
    const W         = margin.left + weeks*step + margin.right;
    const H         = margin.top + 7*step + margin.bottom;

    const colScale = d3.scaleLinear().domain([0,8,16,25]).range([t.low, t.mid, t.high]);

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox",`0 0 ${W} ${H}`).attr("preserveAspectRatio","xMidYMid meet");
    svg.append("rect").attr("width",W).attr("height",H).attr("fill","#f8fafc").attr("rx",8);

    const g = svg.append("g").attr("transform",`translate(${margin.left},${margin.top})`);

    // Tooltip
    const tooltip = d3.select("body").append("div")
      .style("position","absolute").style("background","rgba(15,23,42,0.92)")
      .style("color","#fff").style("padding","8px 12px").style("border-radius","6px")
      .style("font-size","12px").style("pointer-events","none").style("opacity",0)
      .style("border","1px solid #334155").style("z-index","9999");

    // Month labels
    d3.timeMonths(startDate, new Date(year,11,31)).forEach(m => {
      const wx = d3.timeWeek.count(startDate, m)*step;
      g.append("text").attr("x",wx).attr("y",-6)
        .style("font-size","9px").style("font-weight","700").style("fill",t.label)
        .text(d3.timeFormat("%b")(m));
    });

    // Day labels (Mon, Wed, Fri only)
    ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].forEach((d,i) => {
      if (i%2===1) {
        g.append("text").attr("x",-4).attr("y",i*step+cellSize/2+1)
          .attr("text-anchor","end").attr("dominant-baseline","middle")
          .style("font-size","8px").style("fill","#94a3b8").text(d);
      }
    });

    // Cells
    g.selectAll("rect.cell").data(data).enter().append("rect")
      .attr("class","cell")
      .attr("width",cellSize).attr("height",cellSize).attr("rx",2)
      .attr("x", d => d3.timeWeek.count(startDate,d.date)*step)
      .attr("y", d => d.dayOfWeek*step)
      .attr("fill", d => {
        if (selected && selected.toDateString()===d.date.toDateString()) return t.label;
        return colScale(d.value);
      })
      .attr("stroke","#fff").attr("stroke-width",1)
      .style("cursor","pointer")
      .on("mouseover", function(event,d) {
        d3.select(this).attr("stroke","#334155").attr("stroke-width",1.5);
        tooltip.style("opacity",1)
          .html(
            `<b style="color:${colScale(d.value)}">${d3.timeFormat("%a, %b %d")(d.date)}</b><br/>` +
            `Activity: <b>${d.value}</b><br/>` +
            `<span style="color:#94a3b8">${d.isWeekend?"Weekend":"Weekday"}</span>`
          )
          .style("left",(event.pageX+12)+"px").style("top",(event.pageY-10)+"px");
      })
      .on("mouseout", function() {
        d3.select(this).attr("stroke","#fff").attr("stroke-width",1);
        tooltip.style("opacity",0);
      })
      .on("click", (_,d) => onSelect(d.date));

    // Month dividers
    d3.timeMonths(new Date(year,1,1), new Date(year,11,31)).forEach(m => {
      const wx = d3.timeWeek.count(startDate,m)*step;
      g.append("line").attr("x1",wx).attr("x2",wx).attr("y1",-2).attr("y2",7*step)
        .attr("stroke","#e2e8f0").attr("stroke-width",1);
    });

    return () => tooltip.remove();
  }, [year, theme, selected]);

  return <svg ref={svgRef} style={{ display:"block", width:"100%" }} />;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const Calendar = () => {
  const [theme,    setTheme]    = useState("Forest");
  const [year,     setYear]     = useState(2026);
  const [selected, setSelected] = useState(null);
  const data = genData(year);

  const ddStyle = {
    padding:"5px 10px", borderRadius:6, border:"1px solid #e2e8f0",
    background:"#fff", color:"#334155", fontWeight:"500",
    cursor:"pointer", fontSize:12, outline:"none",
  };
  const btnStyle = (active) => ({
    padding:"5px 12px", borderRadius:6, border:"1px solid #e2e8f0",
    background: active ? "#6366f1" : "#fff",
    color: active ? "#fff" : "#334155",
    fontWeight:"600", cursor:"pointer", fontSize:12,
  });

  return (
    <div style={{
      background:"#ffffff", borderRadius:12,
      padding:"20px 24px 32px 24px", width:"100%",
      boxShadow:"0 1px 3px rgba(0,0,0,0.08)", boxSizing:"border-box",
    }}>
      {/* Title */}
      <div style={{ marginBottom:4 }}>
        <div style={{ fontSize:16, fontWeight:"bold", color:"#1e293b" }}>Activity Calendar</div>
        <div style={{ fontSize:12, color:"#94a3b8", marginTop:2 }}>
          {year} · Daily activity heatmap · Click a cell to select a date
        </div>
      </div>

      {/* Controls */}
      <div style={{ display:"flex", gap:10, alignItems:"flex-end", marginTop:12, marginBottom:20, flexWrap:"wrap" }}>
        <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
          <label style={{ fontSize:11, color:"#94a3b8", fontWeight:"600" }}>Color Theme</label>
          <select value={theme} onChange={e => setTheme(e.target.value)} style={ddStyle}>
            {Object.keys(THEMES).map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
          <label style={{ fontSize:11, color:"#94a3b8", fontWeight:"600" }}>Year</label>
          <div style={{ display:"flex", gap:4, alignItems:"center" }}>
            <button onClick={() => setYear(y=>y-1)} style={btnStyle(false)}>←</button>
            <div style={{
              padding:"5px 14px", borderRadius:6, background:"#f0f9ff",
              color:"#0284c7", fontWeight:"700", fontSize:13, border:"1px solid #bae6fd",
            }}>
              {year}
            </div>
            <button onClick={() => setYear(y=>y+1)} style={btnStyle(false)}>→</button>
          </div>
        </div>
        {selected && (
          <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
            <label style={{ fontSize:11, color:"#94a3b8", fontWeight:"600" }}>Selected</label>
            <div style={{ display:"flex", gap:6, alignItems:"center" }}>
              <div style={{
                padding:"5px 10px", borderRadius:6, background:"#f0fdf4",
                color:"#16a34a", fontWeight:"600", fontSize:12, border:"1px solid #bbf7d0",
              }}>
                {d3.timeFormat("%b %d, %Y")(selected)}
              </div>
              <button onClick={()=>setSelected(null)} style={{ ...btnStyle(false), color:"#ef4444", borderColor:"#fca5a5" }}>✕</button>
            </div>
          </div>
        )}
      </div>

      {/* Chart */}
      <div style={{ display:"flex", gap:12, alignItems:"flex-start", width:"100%", border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden" }}>
        <div style={{ flex:1, minWidth:0, padding:"12px 12px 4px 12px" }}>
          <CalendarGrid
            key={`${year}-${theme}-${selected?.toDateString()}`}
            year={year} theme={theme}
            onSelect={setSelected} selected={selected}
          />
        </div>
        <div style={{ padding:"12px 12px 12px 0" }}>
          <LegendHTML theme={theme} data={data} year={year} />
        </div>
      </div>
    </div>
  );
};

export default Calendar;