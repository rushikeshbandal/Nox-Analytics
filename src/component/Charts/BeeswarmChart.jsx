import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

export default function BeeswarmChart() {
  const ref = useRef();

  useEffect(() => {
    // 🔥 clear previous render (double chart fix)
    d3.select(ref.current).selectAll("*").remove();

    const width = 928;
    const height = 180;
    const margin = { top: 20, right: 20, bottom: 30, left: 20 };
    const radius = 4;
    const padding = 2;

    // 🔴 LIVE API
    fetch("https://dummyjson.com/products?limit=100")
      .then(res => res.json())
      .then(json => {
        const data = json.products.map(d => ({
          name: d.title,
          value: d.price // x-axis value
        }));

        // X scale
        const x = d3.scaleLinear()
          .domain(d3.extent(data, d => d.value))
          .nice()
          .range([margin.left, width - margin.right]);

        // SVG
        const svg = d3.select(ref.current)
          .append("svg")
          .attr("width", width)
          .attr("height", height)
          .style("background", "#fff");

        // X axis (bottom)
        svg.append("g")
          .attr("transform", `translate(0,${height - margin.bottom})`)
          .call(d3.axisBottom(x).ticks(10))
          .call(g => g.select(".domain").remove());

        // ---- DODGE (beeswarm logic) ----
        const nodes = dodge(
          data.map(d => ({ ...d, x: x(d.value) })),
          radius * 2 + padding
        );

        // Circles
        svg.append("g")
          .selectAll("circle")
          .data(nodes)
          .join("circle")
          .attr("cx", d => d.x)
          .attr("cy", d =>
            height - margin.bottom - radius - d.y
          )
          .attr("r", radius)
          .attr("fill", "#222")
          .append("title")
          .text(d => `${d.name} : ${d.value}`);
      });
  }, []);

  return <div ref={ref} />;
}

/* ---------------- DODGE FUNCTION ---------------- */
function dodge(data, spacing) {
  const radius2 = spacing ** 2;
  const circles = data
    .map(d => ({ ...d, y: 0 }))
    .sort((a, b) => a.x - b.x);

  let head = null;
  let tail = null;

  function intersects(x, y) {
    let p = head;
    while (p) {
      const dx = p.x - x;
      const dy = p.y - y;
      if (dx * dx + dy * dy < radius2) return true;
      p = p.next;
    }
    return false;
  }

  for (const c of circles) {
    if (intersects(c.x, 0)) {
      let y = 0;
      let p = head;
      while (p) {
        const dy = Math.sqrt(radius2 - (p.x - c.x) ** 2);
        const y1 = p.y + dy;
        if (!intersects(c.x, y1)) {
          y = y1;
          break;
        }
        p = p.next;
      }
      c.y = y;
    }

    c.next = null;
    if (!head) head = tail = c;
    else tail = tail.next = c;
  }

  return circles;
}