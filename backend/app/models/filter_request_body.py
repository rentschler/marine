from typing import List, Optional
from pydantic import BaseModel


class FilterRequestBody(BaseModel):
    filterEntitys: int = -1
    
    showEvents: bool = True
    showRelations: bool = True
    showEvidenceFor: bool = True
    showReceived: bool = True
    showSent: bool = True
    showNull: bool = True
    
    minDegree: Optional[int] = 0
    maxDegree: Optional[int] = 1000
    type: Optional[List[str]] = None
    monitoring_type: Optional[List[str]] = None
    findings: Optional[List[str]] = None
    content: Optional[List[str]] = None
    assessment_type: Optional[List[str]] = None
    results: Optional[List[str]] = None
    movement_type: Optional[List[str]] = None
    destination: Optional[List[str]] = None
    enforcement_type: Optional[List[str]] = None
    outcome: Optional[List[str]] = None
    activity_type: Optional[List[str]] = None
    participants: Optional[List[int]] = None
    thing_collected: Optional[List[str]] = None
    reference: Optional[List[str]] = None
    date: Optional[List[str]] = None
    time: Optional[List[str]] = None
    friendship_type: Optional[List[str]] = None
    permission_type: Optional[List[str]] = None
    start_date: Optional[List[str]] = None
    end_date: Optional[List[str]] = None
    report_type: Optional[List[str]] = None
    submission_date: Optional[List[str]] = None
    jurisdiction_type: Optional[List[str]] = None
    authority_level: Optional[List[str]] = None
    coordination_type: Optional[List[str]] = None
    operational_role: Optional[List[str]] = None

