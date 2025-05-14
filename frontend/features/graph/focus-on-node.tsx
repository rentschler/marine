import { useCamera, useSigma } from '@react-sigma/core';
import { FC, useEffect } from 'react';

/**
 * This component is used to focus on a node.
 * Found in the @react-sigma/core documentation.
 * https://github.com/sim51/react-sigma/blob/main/packages/storybook/stories/common/FocusOnNode.tsx#L13
 * @param node - The node to focus on.
 * @param move - Whether to move the camera to the node.
 * @returns
 */
export const FocusOnNode: FC<{ node: string | null; move?: boolean }> = ({ node, move }) => {
  // Get sigma
  const sigma = useSigma();
  // Get camera hook
  const { gotoNode } = useCamera();

  /**
   * When the selected item changes, highlighted the node and center the camera on it.
   */
  useEffect(() => {
    if (!node) return;
    sigma.getGraph().setNodeAttribute(node, 'highlighted', true);
    if (move) gotoNode(node);

    return () => {
      sigma.getGraph().setNodeAttribute(node, 'highlighted', false);
    };
  }, [node, move, sigma, gotoNode]);

  return null;
};
