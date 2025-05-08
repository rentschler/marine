import OverviewGraph from '@/features/graph/overview-graph'
import React from 'react'

const Page = ({
  searchParams,
}: {
  searchParams: { layout?: string }
}) => {
  return (
    <div>
      
        <OverviewGraph layout={searchParams.layout as "force" | "circular" | "atlas2" | "circlepack" | "noverlap" | "random" | undefined} />
    </div>
  )
}

export default Page