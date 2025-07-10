from typing import List, Optional
from models.Graph import GraphData
from retriver.sub_graph_discription import SubGraphDiscription
from pydantic import BaseModel


class FinalAnswer(BaseModel):
    sub_graphs: List[SubGraphDiscription]
    hole_graph: Optional[GraphData] = None
    answer: str