from pydantic import BaseModel


class FilterRequestBody(BaseModel):
    filterEntity: int
    showEvents: bool
    showRelations: bool
    