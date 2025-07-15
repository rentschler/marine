import * as d3 from 'd3';

import { ColorPalette } from '@/types/filter-context-type';
import { NodeType, LinkType, SubsetType, Link, Node, EventType } from '@/types/graph-types';

// D3 color schemes for different palettes
const NODE_TYPE_COLORS = d3.schemeTableau10;
const EVENT_TYPE_COLORS = d3.schemeObservable10;
const EDGE_TYPE_COLORS = d3.schemeCategory10;
const COMMUNITY_COLORS = d3.schemeSet3;
// const COMPARISON_COLORS = ['#c4dfff', '#ffccf2', '#dbb9f2', '#eeeeee']; // A, B, A and B, Unselected
// const COMPARISON_COLORS = ['#004699', '#B71C1C', '8aee8a', '#eeeeee']; // A, B, A and B, Unselected
const COMPARISON_COLORS = ['#DD0000', '#0000DD', '#00DD00', '#cccccc']; // A, B, A and B, Unselected

const DEFAULT_COLOR = '#aaaaaa';

export function getColorScale(colorPalette: ColorPalette, communities?: string[]) {
  switch (colorPalette) {
    case ColorPalette.NODE_TYPE:
      return d3.scaleOrdinal(NODE_TYPE_COLORS).domain(Object.values(NodeType));

    case ColorPalette.EVENT_TYPE:
      return d3.scaleOrdinal(EVENT_TYPE_COLORS).domain(Object.values(EventType));

    case ColorPalette.EDGE_TYPE:
      return d3.scaleOrdinal(EDGE_TYPE_COLORS).domain(Object.values(LinkType));

    case ColorPalette.COMMUNITY:
      if (communities && communities.length > 0) {
        return d3.scaleOrdinal(COMMUNITY_COLORS).domain(communities);
      }

      return d3.scaleOrdinal(COMMUNITY_COLORS);

    case ColorPalette.COMPARISON:
      return d3
        .scaleOrdinal(COMPARISON_COLORS)
        .domain([SubsetType.A, SubsetType.B, SubsetType.A_INTERSECT_B, SubsetType.A_UNION_B]);

    default:
      return d3.scaleOrdinal(NODE_TYPE_COLORS).domain(Object.values(NodeType));
  }
}

export function getColor(
  colorPalette: ColorPalette,
  colorScale: d3.ScaleOrdinal<string, string>,
  node?: Node,
  link?: Link
) {
  switch (colorPalette) {
    case ColorPalette.NODE_TYPE:
      if (node && 'type' in node && node.type) {
        return colorScale(node.type) || DEFAULT_COLOR;
      }

      return DEFAULT_COLOR;
    case ColorPalette.EVENT_TYPE:
      if (node && 'type' in node && node.type && 'sub_type' in node && node.sub_type) {
        // use sub_type as color for the case type = "event"
        if (node.type === NodeType.Event) {
          return colorScale(node.sub_type) || DEFAULT_COLOR;
        }
      }

      return DEFAULT_COLOR;

    case ColorPalette.EDGE_TYPE:
      if (link) {
        if ('type' in link && link.type) return colorScale(link.type) || DEFAULT_COLOR;

        return DEFAULT_COLOR;
      }

      return DEFAULT_COLOR;

    case ColorPalette.COMMUNITY:
      if (node && 'community' in node && node.community) {
        return node.community ? colorScale(node.community) || DEFAULT_COLOR : DEFAULT_COLOR;
      }

      return DEFAULT_COLOR;

    case ColorPalette.COMPARISON:
      if (node) {
        if ('subset' in node && node.subset)
          return node.subset ? colorScale(node.subset) || DEFAULT_COLOR : DEFAULT_COLOR;

        return colorScale(SubsetType.A_UNION_B) || DEFAULT_COLOR;
      }

      return DEFAULT_COLOR;

    default:
      if (node && 'sub_type' in node && node.sub_type) {
        return colorScale(node.sub_type) || DEFAULT_COLOR;
      }

      return DEFAULT_COLOR;
  }
}

export function getLegendData(colorPalette: ColorPalette, communities?: string[]) {
  const colorScale = getColorScale(colorPalette, communities);

  return Object.values(colorScale.domain()).map((value) => ({
    label: value,
    color: colorScale(value),
  }));
}
