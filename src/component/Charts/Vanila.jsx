import React, { useEffect, useRef } from 'react';
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

const Vanila = () => {
    const chartRef = useRef(null);

    useEffect(() => {
        // Sample bar data (date and value)
        const data = [
            { date: new Date('2023-02-01'), value: 30 },
            { date: new Date('2023-04-01'), value: 80 },
            { date: new Date('2023-06-01'), value: 45 },
            { date: new Date('2023-08-01'), value: 60 },
            { date: new Date('2023-10-01'), value: 20 },
            { date: new Date('2023-12-01'), value: 90 }
        ];

        // Chart dimensions and margins
        const width = 640;
        const height = 400;
        const marginTop = 20;
        const marginRight = 20;
        const marginBottom = 30;
        const marginLeft = 40;

        // Clear previous chart if component re-renders
        d3.select(chartRef.current).selectAll('*').remove();

        // Create SVG container
        const svg = d3.select(chartRef.current)
            .append('svg')
            .attr('width', width)
            .attr('height', height);

        // X-axis scale
        const x = d3.scaleUtc()
            .domain([new Date('2023-01-01'), new Date('2024-01-01')])
            .range([marginLeft, width - marginRight]);

        // Y-axis scale
        const y = d3.scaleLinear()
            .domain([0, 100])
            .range([height - marginBottom, marginTop]);

        // Add X-axis
        svg.append('g')
            .attr('transform', `translate(0,${height - marginBottom})`)
            .call(d3.axisBottom(x));

        // Add Y-axis
        svg.append('g')
            .attr('transform', `translate(${marginLeft},0)`)
            .call(d3.axisLeft(y));

        // Add bars
        svg.append('g')
            .selectAll('rect')
            .data(data)
            .enter()
            .append('rect')
            .attr('x', d => x(d.date) - 15)
            .attr('y', d => y(d.value))
            .attr('width', 30)
            .attr('height', d => height - marginBottom - y(d.value))
            .attr('fill', 'steelblue');

    }, []);

    return (
        <div className='flex flex-col items-center justify-center min-h-screen'>
        <h2 className='text-2xl font-bold mb-4'>Bar Chart Example</h2>
        <div ref={chartRef}></div>
    </div>
    );
}

export default Vanila;
