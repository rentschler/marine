from typing import List
from pydantic import BaseModel


class QueryParams(BaseModel):
    Persons: List[str]
    Vessels: List[str]
    Locations: List[str]
    Groups: List[str]
    Organizations: List[str]
    RelationshipTypes: List[str]
    EventTypes: List[str]
