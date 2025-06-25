from typing import Dict, List, Optional
from pydantic import BaseModel

class Finding(BaseModel):
    summary: str
    explanation: Optional[str] = None


class Summary(BaseModel):
    title: str
    summary: str
    rating: float
    rating_explanation: str
    findings: List[Finding]
    nodes: List[str]

    def to_string(self) -> str:
        return (
            f"Title: {self.title}\n"
            f"Summary: {self.summary}\n"
            f"Rating: {self.rating}\n"
            f"Rating Explanation: {self.rating_explanation}\n"
            f"Findings:\n" +
            "\n".join(f"  - {finding.summary}: {finding.explanation}" for finding in self.findings)
        )

