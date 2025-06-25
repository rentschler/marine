from typing import List
from nl_querying.querying.models.community_answer import CommunityAnswer
from pydantic import BaseModel


class IntermidateAnswer(BaseModel):
    layer: int
    subtree: List[CommunityAnswer]
