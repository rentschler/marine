'use client';

import { Select, SelectItem } from '@heroui/react';
import { ColorPalette } from '@/types/filter-context-type';
import { useFilterContext } from '@/context/filter-context';
import { memo, useCallback } from 'react';

interface ColorPaletteSelectorProps {
  colorPalette: ColorPalette;
  setColorPalette: (colorPalette: ColorPalette) => void;
}

export const ColorPaletteSelector = ({ colorPalette, setColorPalette }: ColorPaletteSelectorProps) => {

  const colorPaletteOptions = [
    { key: ColorPalette.EVENT_TYPE, label: 'Event Type' },
    { key: ColorPalette.COMMUNITY, label: 'Community' },
    { key: ColorPalette.COMPARISON, label: 'Comparison' },
  ];

  const handleSelectionChange = useCallback((keys: any) => {
    const selectedKey = Array.from(keys)[0] as ColorPalette;
    if (selectedKey) {
      setColorPalette(selectedKey);
    }
  }, [setColorPalette]);

  return (
    <div className="flex items-center gap-2">
      <Select
        size="sm"
        label="Color By"
        selectedKeys={[colorPalette]}
        onSelectionChange={handleSelectionChange}
        className="w-40"
        aria-label="Select color palette"
      >
        {colorPaletteOptions.map((option) => (
          <SelectItem key={option.key}>
            {option.label}
          </SelectItem>
        ))}
      </Select>
    </div>
  );
}; 