from typing import List, Optional
from pydantic import BaseModel


class FilterRequestBody(BaseModel):
    minDegree: Optional[int] = 0
    maxDegree: Optional[int] = 1000
    nodeTypes: Optional[List[str]] = None
    edgeTypes: Optional[List[str]] = None
    startDate: Optional[str] = None
    endDate: Optional[str] = None
