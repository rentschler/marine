type LegendItemProps = {
  color: string;
  label: string;
};

export function LegendItem({ color, label }: LegendItemProps) {
  const maxLength = 40;
  const truncatedLabel = label.length > maxLength ? `${label.slice(0, maxLength)}...` : label;
  const showTooltip = label.length > maxLength;

  return (
    <div className="flex items-center space-x-2 mb-1 gap-2">
      <div
        className="w-4 h-4 rounded-sm border border-gray-300"
        style={{ backgroundColor: color }}
      />
      <span className="text-xs" title={showTooltip ? label : undefined}>
        {truncatedLabel}
      </span>
    </div>
  );
}
