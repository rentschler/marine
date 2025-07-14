from typing import Optional
from models.Graph import GraphData
from pydantic import BaseModel


class SubGraphDiscription(BaseModel):
    day: Optional[str] = None
    graph: GraphData
    description: str
    llm_summary: Optional[str] = None