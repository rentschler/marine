from typing import List, Optional
from pydantic import BaseModel, Field


class DiffRequestBody(BaseModel):
    minDegree: Optional[int] = 0
    maxDegree: Optional[int] = 1000
    nodeTypes: Optional[List[str]] = None
    edgeTypes: Optional[List[str]] = None
    # Old
    # Old deprecated fields
    startDate: Optional[str] = Field(None, deprecated="Use startDateA and startDateB instead")
    endDate: Optional[str] = Field(None, deprecated="Use endDateA and endDateB instead")

    # New: dual date range support for diff-graph
    startDateA: Optional[str] = None
    endDateA: Optional[str] = None
    startDateB: Optional[str] = None
    endDateB: Optional[str] = None
    # Optional: filter for subset (A, B, A_INTERSECT_B, etc.)
    subsetFilter: Optional[str] = None
    neighboorNodes: Optional[bool] = False

