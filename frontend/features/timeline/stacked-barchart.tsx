import { StackedBarChartProps } from './time-line-types';
import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const MARGIN = { top: 25, right: 10, bottom: 80, left: 50 };
const StackedBarChart = ({
  data,
  bars,
  segments,
  numberOfBins,
  dimensions,
  onSelection,
  selectionA,
  selectionB,
}: StackedBarChartProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const { width, height } = dimensions;

  useEffect(() => {
    console.log('stacked barchart data', data);
    if (!data || !svgRef.current || !bars || !segments) return;
    console.log('stacked barchart data', data);

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
      .attr('id', (d) => `bar-layer-${d.key}`)
      .attr('fill', (d) => colorScale(d.key))
      .selectAll('.bar')
      .data((D) =>
        D.map((d, i) => {
          const barId = d.data.start?.toString() || "null"
          const segmentKey = D.key;
          const segmentId = `rect_${barId}_${segmentKey}`;
          const start = new Date(d.data.start);
          const end = new Date(d.data.end);
          return { ...d, barId, segmentId, index: i, start, end };
        })
      )
      .join('rect')
      .attr('class', 'bar')
      .attr('id', (d) => d.segmentId)
      .attr('x', (d) => scaleOrdinal(d.barId)!)
      .attr('y', (d) => scaleLinear(d[1]))
      .attr('height', (d) => Math.abs(scaleLinear(d[0]) - scaleLinear(d[1])))
      .attr('width', scaleOrdinal.bandwidth())
      // .attr('fill', (d) => colorScale(d.segmentId))
      .attr('stroke', (d) => {
        if (selectionA && d.start >= selectionA[0] && d.end <= selectionA[1]) return 'red';
        if (selectionB && d.start >= selectionB[0] && d.end <= selectionB[1]) return 'green';
        return 'none';
      });

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

    const brush = d3
      .brushX()
      .extent([
        [0, 0],
        [boundsWidth, boundsHeight],
      ])
      .on('start brush', (event) => {
        const selection = event.selection;
        if (!selection) return;

        const [x0, x1] = selection;
        const bars = g.selectAll('.bar');

        let highlightBars: number[] = [];

        bars.each(function (d) {
          const bar = d3.select(this);
          const xMin = +bar.attr('x');
          const xMax = xMin + scaleOrdinal.bandwidth();

          // check if the bar is intersect with the selection
          const isBrushed = x0 <= xMax && x1 >= xMin;
          bar.attr('stroke', isBrushed ? 'red' : 'none');
        });
      });

    g.call(brush);
  }, [data, width, height, onSelection, selectionA, selectionB]);

  return (
    <div className="w-full h-full">
      <svg width={width} height={height} ref={svgRef}></svg>
    </div>
  );
};

export default StackedBarChart;
