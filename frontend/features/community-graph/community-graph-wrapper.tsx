'use client';

import { useState } from 'react';
import {
  ControlsContainer,
} from '@react-sigma/core';
import '@react-sigma/core/lib/style.css';
import { GraphData, NodeType } from '@/types/graph-types';
import '@react-sigma/core/lib/style.css';
import '@react-sigma/graph-search/lib/style.css';

import { useEffect } from 'react';
import { TabNode } from 'flexlayout-react';
import { GraphWrapperFetched } from '../graph/graph-wrapper_fetched';
// import { NodeImageProgram } from '@sigma/node-image';
import * as d3 from 'd3';
import { Node } from '@react-sigma/graph-search';



export interface Main {
    nodes:    Node[];
    edges:    Edge[];
    metadata: Metadata;
}

export interface Edge {
    source:        string;
    target:        string;
    weight:        number;
    connection_id: string;
    type:          EdgeType;
}

export enum EdgeType {
    CommunityConnection = "CommunityConnection",
}

export interface Metadata {
    level:            number;
    include_findings: boolean;
    node_count:       number;
    edge_count:       number;
}

export interface Node {
    id:          string;
    title:       string;
    level:       number;
    description: string;
    created_at:  Date;
    updated_at:  Date;
    type:        NodeType2;
    findings:    Finding[];
}

export interface Finding {
    id:               string;
    content:          null;
    type:             FindingType;
    confidence:       number;
    created_at:       string;
    parent_community: string;
}

export enum FindingType {
    Finding = "Finding",
}

export enum NodeType2 {
    Community = "Community",
}


export interface DiffGraphWrapperProps {
  currentNode: TabNode;
  id: string;
}

type CommunitySummary = {
  title: string;
  summary: string;
  rating: number;
  'rating explanation': string;
  id: string;
  level: number;
  number_of_nodes: number;
};

type CommunityLevels = '1' | '2' | '3' | '4' | '5';
type CommunityData = {
  [key in CommunityLevels]: CommunitySummary[];
};

const COMMUNITY_LEVELS: CommunityLevels[] = ['1', '2', '3'];

const d3_sizeScale = d3.scaleLinear()
  .domain([1, 1000])
  .range([5, 200])
  .clamp(true);
const CommunityColorScaleD3 = d3.scaleOrdinal(d3.schemeCategory10);


// Component that display the graph
export const DiffGraphWrapper = ({ currentNode, id }: DiffGraphWrapperProps) => {
  const [currentData, setCurrentData] = useState<GraphData | null>(null);
  const [currentSelectedLevel, setCurrentSelectedLevel] = useState<CommunityLevels | null>(
    COMMUNITY_LEVELS[1]
  );
  const [error, setError] = useState<string | null>(null);

  const dimensions = {
    width: currentNode.getRect().width - 10,
    height: currentNode.getRect().height - 10,
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // query the whole graph first and apply the date filter in the frontend
        // http://localhost:8080/graph-data

        const response = await fetch('/api/get-community-graph?level=2&include_findings=false', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch filtered graph data');
        }

        const communities = await response.json() as Main;
        console.log('complete graph data:', communities);
        
        setCurrentData({
          nodes: communities.nodes.map((node) => ({
            id: node.id,
            label: node.title,
            size: d3_sizeScale(node.findings.length),
            color: CommunityColorScaleD3(node.title),
            type: NodeType.Entity,
            sub_type: 'community',
            level: node.level,
            description: node.description,
            findings: node.findings,
            x: Math.random() * dimensions.width,
            y: Math.random() * dimensions.height,
          })),
          links: [],
          metadata: {
            level: communities.metadata.level,
            include_findings: communities.metadata.include_findings,
            node_count: communities.metadata.node_count,
            edge_count: communities.metadata.edge_count,
          },
        });

        // setCurrentData(communities);
      } catch (error) {
        console.error('Error fetching filtered graph data:', error);
        setError('Failed to fetch filtered graph data');
      }
    };

    fetchData();
  }, []);


  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (!currentData) {
    return <div>No data available</div>;
  }
  const sigmaSettings = {
    // NodeType: 'image',
    // nodeProgramClasses: { image: NodeImageProgram },
  };
  return (
    <div className="flex flex-col items-center gap-6 p-6 w-full h-full">
      <div className="relative flex flex-row items-center justify-center">
        {/* Container for the graph */}
        <GraphWrapperFetched
          layout={'circlepack'}
          limit={1000}
          currentNode={currentNode}
          currentData={currentData}
        />
        <ControlsContainer position={'top-right'}>
          <div className="flex flex-row gap-2">
            {COMMUNITY_LEVELS.map((level) => (
              <button
                key={level}
                className={`px-4 py-2 rounded ${currentSelectedLevel === level ? 'font-bold' : ''}`}
                onClick={() => {
                  setCurrentSelectedLevel(level);
                }}
              >
                {level}
              </button>
            ))}
          </div>
        </ControlsContainer>
      </div>
    </div>
  );
};

export default DiffGraphWrapper;
