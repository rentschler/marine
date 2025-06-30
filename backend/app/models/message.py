from retriver.final_answer import FinalAnswer
from pydantic import BaseModel, ConfigDict
from enum import Enum

class MessageType(str, Enum):
    System = "system"
    User = "user"

class Message(BaseModel):
    type: MessageType
    content: str|FinalAnswer