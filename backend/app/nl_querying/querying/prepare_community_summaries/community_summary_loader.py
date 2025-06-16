import os, json, random
from typing import List

from nl_querying.querying.models.chunk import Chunk
from nl_querying.indexing.summarize_communities.models.summary import Summary


class CommunitySummaryLoader:
    def __init__(self, token_limit: int = 2048, summaries_path: str = "summaries"):
        self.token_limit = token_limit
        self.summaries_path = summaries_path

    def load_all_summaries(self) -> List[Chunk]:
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
                        findings=data.get("findings"),
                        nodes=data.get("nodes")
                    )
                        summaries.append(summary_obj)
                    except json.JSONDecodeError:
                        print(f"Error loading Summery: {file_name}")
                        raise json.JSONDecodeError
        return summaries
    
    def _chunk_summaries(self, summaries: List[List[Summary]]) -> List[List[Chunk]]:
        chunks: List[List[Chunk]] = []
        
        current_chunk = ""
        current_tokens = 0

        for level in summaries:
            level_chunks: List[Chunk] = []
            nodes: List[List[str]] = []
            for summary in level:
                summary_str = summary.to_string()
                tokens = self._estimate_tokens(summary_str)

                if current_tokens + tokens <= self.token_limit:
                    current_chunk += summary_str + "\n\n"
                    nodes.append(summary.nodes)
                    current_tokens += tokens
                else:
                    chunk = Chunk(
                        text=current_chunk.strip(),
                        nodes=nodes
                    )
                    level_chunks.append(chunk)
                    current_chunk = summary_str + "\n\n"
                    nodes = [summary.nodes]
                    current_tokens = tokens
            if current_chunk.strip():
                chunk = Chunk(
                        text=current_chunk.strip(),
                        nodes=nodes
                    )
                level_chunks.append(chunk)
            chunks.append(level_chunks)

        return chunks

    def _estimate_tokens(self, text: str) -> int:
        return len(text) // 4