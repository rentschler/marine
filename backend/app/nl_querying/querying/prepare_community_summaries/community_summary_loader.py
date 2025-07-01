import os, json, random
from typing import List

from nl_querying.querying.models.chunk import Chunk
from nl_querying.indexing.summarize_communities.models.summary import Finding, Summary


class CommunitySummaryLoader:
    def __init__(self, token_limit: int = 2048, summaries_path: str = "summaries"):
        self.token_limit = token_limit
        self.summaries_path = summaries_path

    def load_all_summaries(self) -> List[List[Chunk]]:
        all_summaries: List[List[Summary]] = []

        for level_name in os.listdir(self.summaries_path):
            level_path = os.path.join(self.summaries_path, level_name)
            if os.path.isdir(level_path):
                all_summaries.append(self._load_summaries_from_level(level_path)) 

        return self._chunk_summaries(all_summaries)

    def _load_summaries_from_level(self, path: str) -> List[Summary]:
        summaries: List[Summary] = []
        if not os.path.isdir(path):
            return summaries

        for file_name in os.listdir(path):
            if file_name.endswith(".json"):
                with open(os.path.join(path, file_name), "r", encoding="utf-8") as f:
                    try:
                        data = json.load(f)
                        summary_obj = Summary(
                            title=data.get("title"),
                            summary=data.get("summary"),
                            rating=data.get("rating"),
                            rating_explanation=data.get("rating explanation"),
                            findings=[
                                Finding(
                                    summary=finding.get("summary"),
                                    explanation=finding.get("explanation")
                                )
                                for finding in data.get("findings", [])
                            ],
                            nodes=data.get("nodes")
                        )
                        summaries.append(summary_obj)
                    except json.JSONDecodeError as e:
                        print(f"Error loading Summary: {file_name}")
                        raise e
        return summaries
    
    def _chunk_summaries(self, summaries: List[List[Summary]]) -> List[List[Chunk]]:
        chunks: List[List[Chunk]] = []
        

        for level in summaries:
            level_chunks: List[Chunk] = []
            for summary in level:
                summary_str = summary.to_string()
                chunk = Chunk(
                    text=summary_str,
                    nodes=[summary.nodes]
                )
                level_chunks.append(chunk)
            chunks.append(level_chunks)

        return chunks
