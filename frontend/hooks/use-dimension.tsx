import { useEffect, useLayoutEffect, useState } from 'react';
import { TabNode } from 'flexlayout-react';
import { Dimensions } from '@/types/dimension-type';


type DimensionSource = React.RefObject<HTMLDivElement> | TabNode;

/**
 * React hook that provides the dimensions (width and height) of either a target HTMLDivElement
 * or a FlexLayout TabNode. It handles both window resize events and FlexLayout node updates.
 *
 * @param source - Either a React ref object pointing to an HTMLDivElement or a FlexLayout TabNode
 * @returns An object containing the `width` and `height` of the target element/node
 */
export const useDimensions = (source: DimensionSource): Dimensions => {
  const getDimensions = (): Dimensions => {
    if ('current' in source) {
      // Handle HTMLDivElement ref
      return {
        width: source.current ? source.current.offsetWidth : 100,
        height: source.current ? source.current.offsetHeight : 100,
      };
    } else {
      // Handle FlexLayout TabNode
      const rect = source.getRect();
      return {
        width: rect.width,
        height: rect.height,
      };
    }
  };

  const [dimensions, setDimensions] = useState<Dimensions>(getDimensions);

  const handleResize = () => {
    setDimensions(getDimensions());
  };

  useEffect(() => {
    if ('current' in source) {
      // Only add window resize listener for HTML elements
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    } else {
      // For TabNode, we'll rely on FlexLayout's internal resize handling
      // The node's rect will be updated automatically by FlexLayout
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [source]);

  useLayoutEffect(() => {
    handleResize();
  }, [source]);

  return dimensions;
};



/**
 * React hook that provides the dimensions (width and height) of a target HTMLDivElement.
 * It listens for window resize events and updates the dimensions accordingly.
 *
 * @param targetRef - A React ref object pointing to the target HTMLDivElement whose dimensions are to be measured.
 * @returns An object containing the `width` and `height` of the target element.
 */
export const useDimensionsRef = (targetRef: React.RefObject<HTMLDivElement>) => {
  const getDimensions = () => {
    return {
      width: targetRef.current ? targetRef.current.offsetWidth : 0,
      height: targetRef.current ? targetRef.current.offsetHeight : 0,
    };
  };

  const [dimensions, setDimensions] = useState(getDimensions);

  const handleResize = () => {
    setDimensions(getDimensions());
  };

  useEffect(() => {
    const element = targetRef.current;
    if (!element) return;

    // Use ResizeObserver for more accurate dimension tracking
    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });

    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, [targetRef.current]); // Re-run when ref changes

  useLayoutEffect(() => {
    handleResize();
  }, [targetRef.current]); // Re-run when ref changes

  return dimensions;
};
