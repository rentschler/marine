import { ChartType, InteractionMode, StackedBarChartProps } from './time-line-types';
import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { getColorScale } from '../three-js-graph/graph-mesh/color-scales';

const MARGIN = { top: 25, right: 0, bottom: 40, left: 50 };
const StackedBarChart = ({
  data,
  bars,
  segments,
  dimensions,
  onSelection,
  selectionA,
  selectionB,
  currentDateRange,
  numberOfBins,
  type,
  interactionMode,
  colorScale,
}: StackedBarChartProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const { width, height } = dimensions;

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
    const minDate = currentDateRange?.[0]!;
    const maxDate = currentDateRange?.[1]!;
    const scaleTime = d3.scaleTime().domain([minDate, maxDate]).range([0, boundsWidth]);

    const barWidth = (scaleTime(maxDate) - scaleTime(minDate)) / numberOfBins;

    // scale the y axis
    const minY = d3.min(data.flat(), (d) => d[0]) ?? 0;
    const maxY = d3.max(data.flat(), (d) => d[1]) ?? 0;
    const scaleLinear = d3.scaleLinear().domain([minY, maxY]).range([boundsHeight, 0]).nice();

    // color scale

    // Group data by bar (time bin) to calculate total heights
    const barGroups = new Map();
    data.forEach((layer) => {
      layer.forEach((segment) => {
        const barId = segment.data.start?.toString() || 'null';
        if (!barGroups.has(barId)) {
          barGroups.set(barId, {
            start: new Date(segment.data.start),
            end: new Date(segment.data.end),
            segments: [],
            totalHeight: 0,
          });
        }
        const barGroup = barGroups.get(barId);
        barGroup.segments.push(segment);
        barGroup.totalHeight = Math.max(barGroup.totalHeight, segment[1]);
      });
    });

    // create the bars (segments)
    g.selectAll('g.layer')
      .data(data)
      .join('g')
      .attr('class', 'layer')
      .attr('id', (d) => `bar-layer-${d.key}`)
      .attr('fill', (d) => colorScale?.(d.key) ?? 'black')
      .selectAll('.bar')
      .data((D) =>
        D.map((d, i) => {
          const barId = d.data.start?.toString() || 'null';
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
      .attr('x', (d) => scaleTime(d.start)!)
      .attr('y', (d) => scaleLinear(d[1]))
      .attr('height', (d) => Math.abs(scaleLinear(d[0]) - scaleLinear(d[1])))
      .attr('width', barWidth)
      .attr('fill', (d) => colorScale?.(d.segmentId.split('_')[2]) ?? 'black')
      .append('title')
      .text(
        (d) =>
          `${d.segmentId.split('_')[2]}\n${d3.timeFormat('%Y-%m-%d %H:%M')(d.start)} - ${d3.timeFormat('%Y-%m-%d %H:%M')(d.end)}\nCount: ${d[1] - d[0]}`
      );

    // Create complete bar rectangles for highlighting
    g.selectAll('.bar-outline')
      .data(Array.from(barGroups.values()))
      .join('rect')
      .attr('class', 'bar-outline')
      .attr('x', (d) => scaleTime(d.start)!)
      .attr('y', (d) => scaleLinear(d.totalHeight))
      .attr('height', (d) => Math.abs(scaleLinear(0) - scaleLinear(d.totalHeight)))
      .attr('width', barWidth)
      .attr('fill', 'none')
      .attr('stroke-width', 2)
      .attr('stroke', (d) => {
        if (selectionA && d.start >= selectionA[0] && d.end <= selectionA[1]) return 'red';
        if (selectionB && d.start >= selectionB[0] && d.end <= selectionB[1]) return 'green';
        return 'none';
      });

    // add the axes
    const xAxis = d3.axisBottom(scaleTime).ticks(numberOfBins < 56 ? numberOfBins : 56);

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
        const barOutlines = g.selectAll('.bar-outline');

        let highlightBars: any[] = [];

        barOutlines.each(function (d) {
          const bar = d3.select(this);
          const xMin = +bar.attr('x');
          const xMax = xMin + barWidth;

          // check if the bar is intersect with the selection
          const isBrushed = x0 <= xMax && x1 >= xMin;

          if (isBrushed) {
            highlightBars.push(bar.data()[0]);
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
    <div className="w-full h-full">
      <svg width={width} height={height} ref={svgRef}></svg>
    </div>
  );
};

export default StackedBarChart;
