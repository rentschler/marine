'use client';

import { Select, SelectItem, Button } from '@heroui/react';
import { useFilterContext } from '@/context/filter-context';
import { memo, useCallback, useMemo } from 'react';

interface CommunitySelectorProps {
  selectedCommunities: string[];
  setSelectedCommunities: (communities: string[]) => void;
  showCount?: boolean;
  showButtons?: boolean;
  showLabel?: boolean;
}

export const CommunitySelector = memo(({ selectedCommunities, setSelectedCommunities, showCount = true, showButtons = true, showLabel = true }: CommunitySelectorProps) => {
  const { communities } = useFilterContext();

  const handleSelectionChange = useCallback((keys: any) => {
    const selectedKeys = Array.from(keys) as string[];
    setSelectedCommunities(selectedKeys);
  }, [setSelectedCommunities]);

  const handleSelectAll = useCallback(() => {
    if (communities) {
      setSelectedCommunities([...communities]);
    }
  }, [communities, setSelectedCommunities]);

  const handleDeselectAll = useCallback(() => {
    setSelectedCommunities([]);
  }, [setSelectedCommunities]);

  const isAllSelected = useMemo(() => {
    return communities && communities.length > 0 && selectedCommunities.length === communities.length;
  }, [communities, selectedCommunities]);

  const isSomeSelected = useMemo(() => {
    return selectedCommunities.length > 0 && !isAllSelected;
  }, [selectedCommunities, isAllSelected]);

  if (!communities || communities.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex">
 
        <Select
          size="sm"
          selectedKeys={new Set(selectedCommunities)}
          onSelectionChange={handleSelectionChange}
          className="w-60"
          aria-label="Select communities"
          selectionMode="multiple"
          placeholder="Select communities..."
          label={showLabel ? 'Communities' : undefined}
        >
          {communities.map((community) => (
            <SelectItem key={community}>
              {community}
            </SelectItem>
          ))}
        </Select>
        {showButtons && (
          <Button
            size="sm"
            variant="flat"
            onClick={handleSelectAll}
            className="text-xs px-2 py-1"
          >
            Select All
          </Button>
        )}
        {isSomeSelected && showCount && (
          <span className="text-xs text-gray-500">
            {selectedCommunities.length} of {communities.length} selected
          </span>
        )}
        {isAllSelected && showCount && (
          <span className="text-xs text-gray-500">
            All communities selected
          </span>
        )}
      </div>
    </div>
  );
});

CommunitySelector.displayName = 'CommunitySelector'; 