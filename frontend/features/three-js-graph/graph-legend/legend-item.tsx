type LegendItemProps = {
  color: string;
  label: string;
};

export function LegendItem({ color, label }: LegendItemProps) {
  return (
    <div className="flex items-center space-x-2 mb-1 gap-3">
      <div
        style={{ backgroundColor: color }}
        className="w-5 h-5 rounded-sm border border-gray-300"
      />
      <span className="text-sm select-none">{label}</span>
    </div>
  );
}
