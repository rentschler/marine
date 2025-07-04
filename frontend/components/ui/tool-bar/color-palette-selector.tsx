'use client';

import { Select, SelectItem } from '@heroui/react';
import { ColorPalette } from '@/types/filter-context-type';
import { useFilterContext } from '@/context/filter-context';
import { memo, useCallback } from 'react';

export const ColorPaletteSelector = memo(function ColorPaletteSelector() {
  const { colorPalette, setColorPalette } = useFilterContext();

  const colorPaletteOptions = [
    { key: ColorPalette.NODE_TYPE, label: 'Node Type' },
    { key: ColorPalette.EDGE_TYPE, label: 'Edge Type' },
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
      <label className="text-sm font-medium text-gray-700">Color By:</label>
      <Select
        size="sm"
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
}); 