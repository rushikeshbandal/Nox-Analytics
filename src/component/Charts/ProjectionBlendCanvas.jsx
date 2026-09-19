import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import {
  geoPath,
  geoGraticule10,
  geoCircle,
  geoOrthographicRaw,
  geoEquirectangularRaw,
  geoProjectionMutator
} from 'd3-geo';

const InterpolatedProjectionCanvas = () => {
  const canvasRef = useRef();

  useEffect(() => {
    const width = 960;
    const height = 500;
    const context = canvasRef.current.getContext('2d');

    // Geographical features
    const graticule = geoGraticule10();
    const sphere = { type: 'Sphere' };
    const equator = geoCircle().center([0, 0]).radius(0).precision(0.1)();

    // Interpolate between Orthographic and Equirectangular
    const projection = interpolateProjection(geoOrthographicRaw, geoEquirectangularRaw)
      .scale(scale(0))
      .translate([width / 2, height / 2])
      .rotate(rotate(0))
      .precision(0.1);

    const path = geoPath(projection, context);

    let frame = 0;
    const totalFrames = 480;

    function animate() {
      const i = frame % totalFrames;
      const t = d3.easeCubic((i < totalFrames / 2) ? (2 * i / totalFrames) : (2 - 2 * i / totalFrames));

      projection
        .alpha(t)
        .rotate(rotate(t))
        .scale(scale(t));

      context.clearRect(0, 0, width, height);

      // Draw graticule
      context.beginPath();
      path(graticule);
      context.lineWidth = 1;
      context.strokeStyle = "#aaa";
      context.stroke();

      // Draw sphere
      context.beginPath();
      path(sphere);
      context.lineWidth = 1.5;
      context.strokeStyle = "#000";
      context.stroke();

      // Draw equator
      context.beginPath();
      path(equator);
      context.lineWidth = 1.5;
      context.strokeStyle = "#f00";
      context.stroke();

      frame++;
      requestAnimationFrame(animate);
    }

    animate();
  }, []);

  // Interpolation logic for projections
  function interpolateProjection(raw0, raw1) {
    const mutate = geoProjectionMutator(t => (lambda, phi) => {
      const [x0, y0] = raw0(lambda, phi);
      const [x1, y1] = raw1(lambda, phi);
      return [
        x0 + t * (x1 - x0),
        y0 + t * (y1 - y0)
      ];
    });

    let t = 0;
    return Object.assign(mutate(t), {
      alpha(_) {
        return arguments.length ? mutate(t = +_) : t;
      }
    });
  }

  // Rotation over time
  function rotate(t) {
    return [360 * t - 180, -30 * Math.cos(t * Math.PI * 2)];
  }

  // Scale over time
  function scale(t) {
    return 250 + 50 * Math.sin(t * Math.PI);
  }

  return (
    <div>
      <h2 style={{ textAlign: 'center' }}>
        Projection Interpolation (Orthographic ↔ Equirectangular)
      </h2>
      <canvas
        ref={canvasRef}
        width={960}
        height={500}
        style={{ maxWidth: '100%', border: '1px solid #ccc' }}
      />
    </div>
  );
};

export default InterpolatedProjectionCanvas;
