from typing import List, Optional
from models.Graph import GraphData
from pydantic import BaseModel


class Section(BaseModel):
    heading: str
    content: str
    data_nodes: List[str]
    sub_graph: Optional[GraphData] = None


class FinalReport(BaseModel):
    title: str
    summary: str
    sections: List[Section]
    graph: Optional[GraphData] = None
