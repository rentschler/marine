import { GraphData } from '@/types/graph-types';

export async function recalculateLayout(
  graphData: GraphData,
  setGraphData: (data: GraphData) => void
) {
  if (!graphData) return;

  try {
    const response = await fetch('/api/recalculate-layout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(graphData), // <--- hier
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.statusText}`);
    }

    const updatedGraph = await response.json();

    console.log('Updated graph:', updatedGraph);
    setGraphData(updatedGraph);
  } catch (error) {
    console.error('Error in recalculateLayout:', error);
    throw error;
  }
}
