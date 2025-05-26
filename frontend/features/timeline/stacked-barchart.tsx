import { useDimensions } from '@/hooks/use-dimension';
import { StackedSeries } from './time-line-types';
import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
interface BarchartProps {
  data?: StackedSeries;
  bars?: string[];
  segments?: string[];
}

const MARGIN = { top: 25, right: 10, bottom: 80, left: 50 };
const StackedBarChart = ({ data, bars, segments }: BarchartProps) => {
  const boxRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;
  const svgRef = useRef<SVGSVGElement>(null);
  const { width, height } = useDimensions(boxRef);

  useEffect(() => {
    if (!data || !svgRef.current || !bars || !segments) return;

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
    const scaleOrdinal = d3.scaleBand().domain(bars).range([0, boundsWidth]).padding(0.2);

    // scale the y axis
    const minY = d3.min(data.flat(), (d) => d[0]) ?? 0;
    const maxY = d3.max(data.flat(), (d) => d[1]) ?? 0;
    const scaleLinear = d3.scaleLinear().domain([minY, maxY]).range([boundsHeight, 0]).nice();

    // color scale
    const colorScale = d3.scaleOrdinal(d3.schemeTableau10);

    // create the bars
    g.selectAll('g.layer')
      .data(data)
      .join('g')
      .attr('class', 'layer')
      .attr('fill', (d) => colorScale(d.key))
      .selectAll('.bar')
      .data((D) =>
        D.map((d) => {
          const barId = d.data.day.toString();
          const segmentKey = D.key;
          const segmentId = `rect_${barId}_${segmentKey}`;
          return { ...d, barId, segmentId };
        })
      )
      .join('rect')
      .attr('class', 'bar')
      .attr('id', (d) => d.segmentId)
      .attr('x', (d) => scaleOrdinal(d.barId)!)
      .attr('y', (d) => scaleLinear(d[1]))
      .attr('height', (d) => Math.abs(scaleLinear(d[0]) - scaleLinear(d[1])))
      .attr('width', scaleOrdinal.bandwidth());

    // add the axes
    const xAxis = d3.axisBottom(scaleOrdinal).tickFormat((d) => {
      const date = new Date(d);
      return d3.timeFormat('%Y-%m-%d %H:%M')(date);
    });

    const yAxis = d3.axisLeft(scaleLinear).ticks(10);

    g.append('g')
      .attr('transform', `translate(0, ${boundsHeight})`)
      .call(xAxis)
      .classed('x-axis', true)
      .selectAll('text')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .attr('transform', 'rotate(-45)');

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
      <svg width={width} height={height} ref={svgRef}></svg>
    </div>
  );
};

export default StackedBarChart;
