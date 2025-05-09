from pydantic import BaseModel


class FilterRequestBody(BaseModel):
    filterEntity: int
    showEvents: bool
    showRelations: bool
    showEvidenceFor: bool
    showReceived: bool
    showSent: bool
    showNull: bool
    minDegree: int
    maxDegree: int
