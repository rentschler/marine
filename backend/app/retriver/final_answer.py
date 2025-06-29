from typing import List
from models.Graph import GraphData
from retriver.sub_graph_discription import SubGraphDiscription
from pydantic import BaseModel


class FinalAnswer(BaseModel):
    sub_graphs: List[SubGraphDiscription]
    hole_graph: GraphData
    answer: str