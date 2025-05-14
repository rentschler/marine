import { useEffect, useLayoutEffect, useState } from 'react';

/**
 * React hook that provides the dimensions (width and height) of a target HTMLDivElement.
 * It listens for window resize events and updates the dimensions accordingly.
 *
 * @param targetRef - A React ref object pointing to the target HTMLDivElement whose dimensions are to be measured.
 * @returns An object containing the `width` and `height` of the target element.
 */
export const useDimensions = (targetRef: React.RefObject<HTMLDivElement>) => {
  const getDimensions = () => {
    return {
      width: targetRef.current ? targetRef.current.offsetWidth : 0,
      height: targetRef.current ? targetRef.current.offsetHeight : 0,
    };
  };

  // state to store the dimensions
  const [dimensions, setDimensions] = useState(getDimensions);

  const handleResize = () => {
    setDimensions(getDimensions());
  };

  useEffect(() => {
    // add event listener to window resize
    window.addEventListener('resize', handleResize);

    // remove event listener on component unmount
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useLayoutEffect(() => {
    handleResize();
  }, []);

  return dimensions;
};
