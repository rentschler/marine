import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer';

import { GraphData } from '@/types/graph-types';

export interface CreateEntityLabelMeshProps {
  graph: GraphData;
  height: number;
  width: number;
}
export function createEntityLabelMesh(props: CreateEntityLabelMeshProps): CSS2DObject[] {
  const { graph, height, width } = props;

  const maxDimension = Math.max(height, width);
  const scaleFactor = maxDimension;

  const labels: CSS2DObject[] = [];

  for (const node of graph.nodes) {
    if (node.type !== 'Entity') continue;

    const div = document.createElement('div');

    div.className = 'node-label';
    div.textContent = node.id;
    div.style.fontSize = '10px';
    div.style.color = 'black';
    div.style.padding = '2px 4px';
    div.style.borderRadius = '4px';

    const labelObject = new CSS2DObject(div);

    labelObject.position.set(node.x * scaleFactor, node.y * scaleFactor, 0);
    labels.push(labelObject);
  }

  return labels;
}
