from typing import List
from pydantic import BaseModel


class CommunityAnswer(BaseModel):
    score: int
    answer: str
    nodes: List[List[str]]