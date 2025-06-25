from typing import List, Optional
from pydantic import BaseModel


class ParallelLLMCall(BaseModel):
    id: int
    system_prompt: str
    user_prompt: str
    answer: Optional[dict] = None
    nodes: Optional[List[List[str]]] = None
