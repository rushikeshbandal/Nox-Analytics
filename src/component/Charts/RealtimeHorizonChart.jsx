import { useEffect, useRef } from "react";
import * as d3 from "d3";

const ROWS = 15;
const WIDTH = 900;
const STEP = 28;
const BANDS = 7;
const PERIOD = 300;

export default function RealtimeHorizon() {
  const ref = useRef(null);

  useEffect(() => {
    const marginTop = 30;
    const height = ROWS * (STEP + 1) + marginTop;

    const walk = v =>
      Math.max(0, Math.min(1, v + (Math.random() - 0.5) * 0.05));

    // INIT DATA
    const data = Array.from({ length: ROWS }, () => {
      const arr = new Float64Array(WIDTH);
      let v = Math.random();
      for (let i = 0; i < WIDTH; i++) {
        v = walk(v);
        arr[i] = v;
      }
      return arr;
    });

    const color = i =>
      d3.schemeBlues[Math.max(3, BANDS)][
        i + Math.max(0, 3 - BANDS)
      ];

    d3.select(ref.current).selectAll("*").remove();

    const container = d3
      .select(ref.current)
      .style("position", "relative");

    // CANVAS
    const canvas = container
      .selectAll("canvas")
      .data(data)
      .enter()
      .append("canvas")
      .attr("width", WIDTH)
      .attr("height", STEP)
      .style("position", "absolute")
      .style("top", (_, i) => `${i * (STEP + 1) + marginTop}px`)
      .each(function () {
        this.ctx = this.getContext("2d");
      });

    // ---- PHASE 1: FULL INITIAL DRAW (FAST) ----
    function drawFull(d) {
      const ctx = this.ctx;
      ctx.clearRect(0, 0, WIDTH, STEP);

      for (let x = 0; x < WIDTH; x++) {
        for (let i = 0; i < BANDS; i++) {
          ctx.fillStyle = color(i);
          ctx.fillRect(
            x,
            STEP,
            1,
            -d[x] * STEP
          );
        }
      }
    }

    canvas.each(drawFull);

    // ---- AXIS ----
    const xScale = d3.scaleTime().range([0, WIDTH]);
    const svg = container
      .append("svg")
      .attr("width", WIDTH)
      .attr("height", height)
      .style("position", "relative")
      .style("font", "10px sans-serif");

    const gX = svg
      .append("g")
      .attr("transform", `translate(0,${marginTop})`);

    // ---- PHASE 2: SMOOTH MOVE ----
    function drawMove(d) {
      const ctx = this.ctx;

      // shift left
      ctx.drawImage(this, 1, 0, WIDTH - 1, STEP, 0, 0, WIDTH - 1, STEP);
      ctx.clearRect(WIDTH - 1, 0, 1, STEP);

      for (let i = 0; i < BANDS; i++) {
        ctx.fillStyle = color(i);
        ctx.fillRect(
          WIDTH - 1,
          STEP,
          1,
          -d[d.length - 1] * STEP
        );
      }
    }

    const timer = d3.interval(() => {
      const now = new Date();

      data.forEach(d => {
        d.copyWithin(0, 1);
        d[d.length - 1] = walk(d[d.length - 1]);
      });

      canvas.each(drawMove);

      xScale.domain([now - PERIOD * WIDTH, now]);
      gX
        .call(d3.axisTop(xScale).ticks(WIDTH / 80))
        .call(g => g.select(".domain").remove());
    }, PERIOD);

    return () => {
      timer.stop();
      d3.select(ref.current).selectAll("*").remove();
    };
  }, []);

  return <div ref={ref} />;
}