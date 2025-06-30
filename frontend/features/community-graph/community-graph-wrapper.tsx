'use client';

import { useState } from 'react';
import {
  ControlsContainer,
  FullScreenControl,
  SigmaContainer,
  ZoomControl,
} from '@react-sigma/core';
import '@react-sigma/core/lib/style.css';
import { GraphData } from '@/types/graph-types';
import '@react-sigma/core/lib/style.css';
import '@react-sigma/graph-search/lib/style.css';

import { useEffect } from 'react';
import { LayoutForceAtlas2Control } from '@react-sigma/layout-forceatlas2';
import { TabNode } from 'flexlayout-react';
import { GraphWrapperFetched } from '../graph/graph-wrapper_fetched';
// import { NodeImageProgram } from '@sigma/node-image';
import * as d3 from 'd3';

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
  const [currentCommunityData, setCurrentCommunityData] = useState<CommunityData | null>(null);
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

        const response = await fetch('/api/get-community-summaries', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch filtered graph data');
        }

        const communities: CommunityData = await response.json();
        console.log('complete graph data:', communities);

        setCurrentCommunityData(communities);
      } catch (error) {
        console.error('Error fetching filtered graph data:', error);
        setError('Failed to fetch filtered graph data');
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (currentCommunityData && currentSelectedLevel) {
      const communties = currentCommunityData[currentSelectedLevel];
      const graphData: GraphData = {
        nodes: communties.map((community) => ({
          id: community.id,
          label: community.title,
          type: 'community',
          summary: community.summary,
          x: Math.random() * 100,
          y: Math.random() * 100,
          number_of_nodes: community.number_of_nodes,
          size: d3_sizeScale(community.number_of_nodes),
          color: CommunityColorScaleD3(community.id),
        })),
        links: [],
      };
      setCurrentData(graphData);
    }
  }, [currentCommunityData, currentSelectedLevel]);

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (!currentData) {
    return <div>No data available</div>;
  }
  const sigmaSettings = {
    // defaultNodeType: 'image',
    // nodeProgramClasses: { image: NodeImageProgram },
  };
  return (
    <div className="flex flex-col items-center gap-6 p-6 w-full h-full">
      <div className="relative flex flex-row items-center justify-center">
        {/* Container for the graph */}
        <GraphWrapperFetched
          layout={'force'}
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
