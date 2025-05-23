import { useDimensions } from '@/hooks/use-dimension';
import { DayBin } from './time-line-types';
import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
interface BarchartProps {
  data?: DayBin[];
}

const MARGIN = { top: 25, right: 10, bottom: 40, left: 50 };
const Barchart = ({ data }: BarchartProps) => {
  const boxRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;
  const svgRef = useRef<SVGSVGElement>(null);
  const { width, height } = useDimensions(boxRef);

  useEffect(() => {
    if (!data || !svgRef.current) return;

    const boundsWidth = width - MARGIN.left - MARGIN.right;
    const boundsHeight = height - MARGIN.top - MARGIN.bottom;
    const svg = d3.select(svgRef.current).attr('width', width).attr('height', height);

    // clear all the elements
    svg.selectAll('*').remove();

    const g = svg.append('g').attr('transform', `translate(${MARGIN.left}, ${MARGIN.top})`);

    // Add title
    g.append('text')
      .attr('x', boundsWidth / 2)
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .attr('fill', 'currentColor')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .text('Daily Activity Count');

    // scale the x axis
    const scaleOrdinal = d3
      .scaleBand()
      .domain(data.map((d) => d.day.toISOString()))
      .range([0, boundsWidth])
      .padding(0.2);

    // scale the y axis
    const scaleLinear = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.count) as number])
      .range([boundsHeight, 0])
      .nice();

    // create the bars
    const bars = g
      .selectAll('rect')
      .data(data)
      .enter()
      .append('rect')
      .attr('x', (d) => scaleOrdinal(d.day.toISOString()) || 0)
      .attr('y', (d) => scaleLinear(d.count))
      .attr('width', scaleOrdinal.bandwidth())
      .attr('height', (d) => boundsHeight - scaleLinear(d.count))
      .attr('fill', 'steelblue');

    // add the axes
    const xAxis = d3
      .axisBottom(scaleOrdinal)
      .tickFormat((d) => d3.timeFormat('%Y-%m-%d')(new Date(d)));

    const yAxis = d3.axisLeft(scaleLinear).ticks(10);

    g.append('g')
      .attr('transform', `translate(0, ${boundsHeight})`)
      .call(xAxis)
      .append('text')
      .attr('x', boundsWidth / 2)
      .attr('y', 35)
      .attr('text-anchor', 'middle')
      .attr('fill', 'currentColor')
      .text('Date');

    g.append('g')
      .call(yAxis)
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -boundsHeight / 2)
      .attr('y', -35)
      .attr('text-anchor', 'middle')
      .attr('fill', 'currentColor')
      .text('Count');
  }, [data, width, height]);

  return (
    <div ref={boxRef} className="w-full h-full">
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default Barchart;
