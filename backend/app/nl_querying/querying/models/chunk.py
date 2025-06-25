from typing import List
from pydantic import BaseModel


class Chunk(BaseModel):
    text: str
    nodes: List[List[str]]