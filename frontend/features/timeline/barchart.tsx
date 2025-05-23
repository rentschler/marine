import { useDimensions } from '@/hooks/use-dimension';
import { DayBin } from './time-line-types';
import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { useFilterContext } from '@/context/filter-context';
interface BarchartProps {
  data?: DayBin[];
}

const MARGIN = { top: 25, right: 10, bottom: 40, left: 50 };
const Barchart = ({ data }: BarchartProps) => {
  const boxRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;
  const svgRef = useRef<SVGSVGElement>(null);
  const { width, height } = useDimensions(boxRef);
  const { selectedDateRange, setSelectedDateRange } = useFilterContext();

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
      .selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .classed('bar', true)
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

    const brush = d3
      .brushX()
      .extent([
        [0, 0],
        [boundsWidth, boundsHeight],
      ])
      .on('start brush', (event) => {
        console.log('event', event);

        const selection = event.selection;
        if (!selection) return;

        const [x0, x1] = selection;
        const bars = g.selectAll('.bar');

        let highlightBars: any[] = [];

        bars.each(function (d) {
          const bar = d3.select(this);
          const xMin = +bar.attr('x');
          const xMax = xMin + scaleOrdinal.bandwidth();

          // check if the bar is intersect with the selection
          const isBrushed = x0 <= xMax && x1 >= xMin;
          bar.attr('fill', isBrushed ? 'red' : 'steelblue');

          if (isBrushed) {
            highlightBars.push(bar.data());
          }
        });

        console.log('highlightBars', highlightBars);
      })
      .on('end', (event) => {
        const selection = event.selection;
        if (!selection) {
          setSelectedDateRange([]);
          return;
        }

        const [x0, x1] = selection;
        const bars = g.selectAll('.bar');

        let highlightBars: any[] = [];

        bars.each(function (d) {
          const bar = d3.select(this);
          const xMin = +bar.attr('x');
          const xMax = xMin + scaleOrdinal.bandwidth();

          // check if the bar is intersect with the selection
          const isBrushed = x0 <= xMax && x1 >= xMin;

          if (isBrushed) {
            highlightBars.push(bar.data()[0]);
          }
        });

        console.log('highlightBars', highlightBars);
        const startDate = d3.min(highlightBars, (d) => d.day);
        const endDate = d3.max(highlightBars, (d) => d.day);

        console.log('Selected date range:', {
          start: startDate,
          end: endDate,
        });

        setSelectedDateRange([startDate, endDate]);
      });

    g.call(brush);
  }, [data, width, height]);

  return (
    <div ref={boxRef} className="w-full h-full">
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default Barchart;
