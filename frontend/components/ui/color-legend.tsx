import * as d3 from "d3";

interface ColorLegendProps {
  title: string;
  scale: d3.ScaleOrdinal<string, string>;
  domain: string[];
}
    


export const ColorLegend: React.FC<ColorLegendProps> = ({ title, scale, domain }) => {
  return (
    <div className=" bg-white p-4 rounded-lg shadow-lg">
      <h3 className="font-semibold mb-2">{title}</h3>
      <div className="space-y-2">
        {domain.map((item) => (
          <div key={item} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: scale(item) }}
            />
            <span className="text-sm">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}; 