import { FilterDashboard } from "@/features/filter_dashboard/filter-dashboard";
import OverviewGraph from "@/features/graph/overview-graph";

export default function Home() {
  return (
    <div className="h-screen w-full grid grid-cols-[70%_30%] grid-rows-[80%_20%]">
      <div className=" w-full h-full">
        <OverviewGraph layout="circlepack"/>
      </div>
      <div className=" w-full h-full">
        <FilterDashboard/>
      </div>
      <div className="col-span-2 bg-red-500 w-full h-full">Timeline</div>
    </div>
  );
}

