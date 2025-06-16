from typing import Dict, List
from pydantic import BaseModel


class Summary(BaseModel):
    title: str
    summary: str
    rating: float
    rating_explanation: str
    findings: List[Dict[str, str]]
    nodes: List[str]

    def to_string(self) -> str:
        return (
            f"Title: {self.title}\n"
            f"Summary: {self.summary}\n"
            f"Rating: {self.rating}\n"
            f"Rating Explanation: {self.rating_explanation}\n"
            f"Findings:\n" +
            "\n".join(f"  - {item['label']}: {item['value']}" for item in self.findings)
        )

