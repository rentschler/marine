from typing import List, Union
from pydantic import BaseModel

class Community(BaseModel):
    level: int
    nodes: List[Union[str, "Community"]]

Community.update_forward_refs()
