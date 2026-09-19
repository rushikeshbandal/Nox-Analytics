import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const BarchartDrop = () => {
  const svgRef = useRef();
  const [order, setOrder] = useState('alphabetical');
  const [showOptions, setShowOptions] = useState(false);

  const data = [
    { letter: 'A', frequency: 0.08167 },
    { letter: 'B', frequency: 0.01492 },
    { letter: 'C', frequency: 0.02782 },
    { letter: 'D', frequency: 0.04253 },
    { letter: 'E', frequency: 0.12702 },
    { letter: 'F', frequency: 0.02288 },
    { letter: 'G', frequency: 0.02015 },
    { letter: 'H', frequency: 0.06094 },
    { letter: 'I', frequency: 0.06966 },
    { letter: 'J', frequency: 0.00153 },
    { letter: 'K', frequency: 0.00772 },
    { letter: 'L', frequency: 0.04025 },
    { letter: 'M', frequency: 0.02406 },
    { letter: 'N', frequency: 0.06749 },
    { letter: 'O', frequency: 0.07507 },
    { letter: 'P', frequency: 0.01929 },
    { letter: 'Q', frequency: 0.00095 },
    { letter: 'R', frequency: 0.05987 },
    { letter: 'S', frequency: 0.06327 },
    { letter: 'T', frequency: 0.09056 },
    { letter: 'U', frequency: 0.02758 },
    { letter: 'V', frequency: 0.00978 },
    { letter: 'W', frequency: 0.02360 },
    { letter: 'X', frequency: 0.00150 },
    { letter: 'Y', frequency: 0.01974 },
    { letter: 'Z', frequency: 0.00074 }
  ];

  useEffect(() => {
    const width = 800;
    const height = 400;
    const marginTop = 20;
    const marginRight = 0;
    const marginBottom = 30;
    const marginLeft = 40;

    const svg = d3.select(svgRef.current)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    svg.selectAll('*').remove();

    const x = d3.scaleBand()
      .range([marginLeft, width - marginRight])
      .padding(0.1);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.frequency)]).nice()
      .range([height - marginBottom, marginTop]);

    const yAxis = g => g
      .attr('transform', `translate(${marginLeft},0)`)
      .call(d3.axisLeft(y).tickFormat(y => (y * 100).toFixed()))
      .call(g => g.select('.domain').remove());

    svg.append('g').call(yAxis);

    const xAxisGroup = svg.append('g')
      .attr('transform', `translate(0,${height - marginBottom})`);

    const updateChart = (orderType) => {
      let sortedData = [...data];

      if (orderType === 'ascending') {
        sortedData.sort((a, b) => a.frequency - b.frequency);
      } else if (orderType === 'descending') {
        sortedData.sort((a, b) => b.frequency - a.frequency);
      } else {
        sortedData.sort((a, b) => d3.ascending(a.letter, b.letter));
      }

      x.domain(sortedData.map(d => d.letter));

      const bars = svg.selectAll('rect')
        .data(sortedData, d => d.letter);

      bars.enter()
        .append('rect')
        .attr('fill', 'steelblue')
        .attr('x', d => x(d.letter))
        .attr('y', y(0))
        .attr('height', 0)
        .attr('width', x.bandwidth())
        .merge(bars)
        .transition()
        .duration(2000)
        .ease(d3.easeCubicInOut)
        .delay((d, i) => i * 50)
        .attr('x', d => x(d.letter))
        .attr('y', d => y(d.frequency))
        .attr('height', d => y(0) - y(d.frequency))
        .attr('width', x.bandwidth());

      bars.exit().remove();

      xAxisGroup.transition()
        .duration(2000)
        .ease(d3.easeCubicInOut)
        .call(d3.axisBottom(x).tickSizeOuter(0));
    };

    updateChart(order);

  }, [order]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100 overflow-hidden">
      <h2 className="text-2xl font-semibold mb-4 text-center">Barchart Transition</h2>

      {/* Custom Dropdown Button */}
      <div className="relative mb-6">
        <button
          onClick={() => setShowOptions(!showOptions)}
          className="p-2 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded shadow-lg hover:from-blue-600 hover:to-blue-800 transition-all duration-300"
        >
          {order === 'alphabetical' && 'Alphabetical'}
          {order === 'ascending' && 'Ascending Frequency'}
          {order === 'descending' && 'Descending  Frequency '}
        </button>

        {showOptions && (
          <div className="absolute mt-2 bg-white border rounded shadow-lg z-10 w-48">
            <div
              onClick={() => { setOrder('alphabetical'); setShowOptions(false); }}
              className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
            >
              Alphabetical
            </div>
            <div
              onClick={() => { setOrder('ascending'); setShowOptions(false); }}
              className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
            >
              Ascending
            </div>
            <div
              onClick={() => { setOrder('descending'); setShowOptions(false); }}
              className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
            >
              Descending
            </div>
          </div>
        )}
      </div>

      {/* Chart Container */}
      <div className="border-4 border-gray-400 rounded-lg p-4 bg-white shadow-xl w-full max-w-[800px] mx-auto overflow-hidden">
        <svg ref={svgRef} className="w-full h-auto"></svg>
      </div>
    </div>
  );
};

export default BarchartDrop;
