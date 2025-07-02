import { BarChartProps, InteractionMode } from './time-line-types';
import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const MARGIN = { top: 25, right: 0, bottom: 40, left: 50 };
const Barchart = ({
  data,
  dimensions,
  onSelection,
  selectionA,
  selectionB,
  numberOfBins,
  interactionMode,
}: BarChartProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const { width, height } = dimensions;

  useEffect(() => {
    if (!data || !svgRef.current) return;
    // console.log('barchart data', data);

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
    const minDate = d3.min(data, (d) => d.start)!;
    const maxDate = d3.max(data, (d) => d.end)!;
    const scaleTime = d3.scaleTime().domain([minDate, maxDate]).range([0, boundsWidth]);

    // scale the y axis
    const scaleLinear = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.count) as number])
      .range([boundsHeight, 0])
      .nice();

    // create the bars
    const bars = g
      .selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .classed('bar', true)
      .attr('x', (d) => scaleTime(d.start))
      .attr('y', (d) => scaleLinear(d.count))
      .attr('width', (d) => scaleTime(d.end) - scaleTime(d.start))
      .attr('height', (d) => boundsHeight - scaleLinear(d.count))
      .attr('fill', (d, i) => {
        if (selectionA && d.start >= selectionA[0] && d.end <= selectionA[1]) return 'red';
        if (selectionB && d.start >= selectionB[0] && d.end <= selectionB[1]) return 'green';
        return 'steelblue';
      })
      .append('title')
      .text(
        (d) =>
          d3.timeFormat('%Y-%m-%d %H:%M')(d.start) + ' - ' + d3.timeFormat('%Y-%m-%d %H:%M')(d.end) + '\nCount: ' + d.count
      );

    // add the axes
    const xAxis = d3.axisBottom(scaleTime).ticks(numberOfBins < 56 ? numberOfBins : 56);
    // .tickFormat(d3.timeFormat('%Y-%m-%d %H:%M'));

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

    const brush = d3
      .brushX()
      .extent([
        [0, 0],
        [boundsWidth, boundsHeight],
      ])
      .on('end', (event) => {
        const selection = event.selection;
        if (!selection) {
          onSelection?.(null, null);
          return;
        }

        const [x0, x1] = selection;
        const bars = g.selectAll('.bar');

        let highlightBars: any[] = [];

        data.forEach((d) => {
          const barX = scaleTime(d.start);
          const barXEnd = scaleTime(d.end);
          // Check if bar is within brush selection
          if (x0 <= barXEnd && x1 >= barX) {
            highlightBars.push(d);
          }
        });
        const startDate = d3.min(highlightBars, (d) => d.start);
        const endDate = d3.max(highlightBars, (d) => d.end);
        onSelection?.(startDate, endDate);
      });

    if (interactionMode !== InteractionMode.NONE) {
      g.call(brush);
    }
  }, [data, width, height, onSelection, selectionA, selectionB]);

  return (
    <svg ref={svgRef}></svg>
  );
};

export default Barchart;
