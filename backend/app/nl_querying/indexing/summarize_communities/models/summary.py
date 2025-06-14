from typing import Dict, List
from pydantic import BaseModel


class Summary(BaseModel):
    title: str
    summary: str
    rating: float
    rating_explanation: str
    findings: List[Dict[str, str]]
    nodes: List[str]
