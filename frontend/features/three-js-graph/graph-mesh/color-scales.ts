import * as d3 from 'd3';
import { ColorPalette } from '@/types/filter-context-type';
import { NodeType, LinkType, SubType, SubsetType, Link, Node } from '@/types/graph-types';

// D3 color schemes for different palettes
const NODE_TYPE_COLORS = d3.schemeTableau10;
const EDGE_TYPE_COLORS = d3.schemeCategory10;
const COMMUNITY_COLORS = d3.schemeSet3;
const COMPARISON_COLORS = ['#ff0000', '#008000', '#4682b4', '#aaaaaa']; // Red, Green, Blue, Grey

const DEFAULT_COLOR = '#aaaaaa';

export function getColorScale(colorPalette: ColorPalette, communities?: string[]) {
  switch (colorPalette) {
    case ColorPalette.NODE_TYPE:
      return d3.scaleOrdinal(NODE_TYPE_COLORS).domain(Object.values(SubType));
    
    case ColorPalette.EDGE_TYPE:
      return d3.scaleOrdinal(EDGE_TYPE_COLORS).domain(Object.values(LinkType)); 
    
    case ColorPalette.COMMUNITY:
      if (communities && communities.length > 0) {
        return d3.scaleOrdinal(COMMUNITY_COLORS).domain(communities);
      }
      return d3.scaleOrdinal(COMMUNITY_COLORS);
    
    case ColorPalette.COMPARISON:
      return d3.scaleOrdinal(COMPARISON_COLORS).domain([
        SubsetType.A,
        SubsetType.B, 
        SubsetType.A_INTERSECT_B,
        SubsetType.A_UNION_B
      ]);
    
    default:
      return d3.scaleOrdinal(NODE_TYPE_COLORS).domain(Object.values(NodeType));
  }
}

export function getColor(colorPalette: ColorPalette, colorScale: d3.ScaleOrdinal<string, string>, node?: Node, link?: Link, ) {
  switch (colorPalette) {
    case ColorPalette.NODE_TYPE:
      if (node && 'sub_type' in node && node.sub_type) {
      return colorScale(node.sub_type) || DEFAULT_COLOR;
      }
      return DEFAULT_COLOR;
    
    case ColorPalette.EDGE_TYPE:
      if (link ) {
        if ( 'type' in link && link.type)
            return colorScale(link.type) || colorScale(LinkType.Missing) || DEFAULT_COLOR;
        return colorScale(LinkType.Missing) || DEFAULT_COLOR;
      }
      return DEFAULT_COLOR;
    
    case ColorPalette.COMMUNITY:
      if (node && 'community' in node && node.community) {
        return node.community ? colorScale(node.community) || DEFAULT_COLOR : DEFAULT_COLOR;
      }
      return DEFAULT_COLOR;
    
    case ColorPalette.COMPARISON:
      if (node ) {
        if( 'subset' in node && node.subset)
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
    return Object.values(colorScale.domain()).map(value => ({
        label: value,
        color: colorScale(value)
    }));
} 