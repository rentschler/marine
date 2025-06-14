import os, json, random
from typing import List


class CommunitySummaryLoader:
    def __init__(self, token_limit: int = 2048, summaries_path: str = "summaries"):
        self.token_limit = token_limit
        self.summaries_path = summaries_path

    def load_all_summaries(self) -> str:
        all_summaries = []

        for level_name in os.listdir(self.summaries_path):
            level_path = os.path.join(self.summaries_path, level_name)
            if os.path.isdir(level_path):
                all_summaries.extend(self._load_summaries_from_level(level_path)) 

        return self._chunk_summaries(all_summaries)

    def _load_summaries_from_level(self, path: str) -> List[str]:
        summaries = []
        if not os.path.isdir(path):
            return summaries

        for file_name in os.listdir(path):
            if file_name.endswith(".json"):
                with open(os.path.join(path, file_name), "r", encoding="utf-8") as f:
                    try:
                        data = json.load(f)
                        summaries.append(data.get("summary", ""))
                    except json.JSONDecodeError:
                        continue
        return summaries
    
    def _chunk_summaries(self, summaries: List[str]) -> List[str]:
        random.shuffle(summaries)
        chunks = []
        current_chunk = ""
        current_tokens = 0

        for summary in summaries:
            tokens = self._estimate_tokens(summary)
            if current_tokens + tokens <= self.token_limit:
                current_chunk += summary + "\n"
                current_tokens += tokens
            else:
                chunks.append(current_chunk.strip())
                current_chunk = summary + "\n"
                current_tokens = tokens
        if current_chunk.strip():
            chunks.append(current_chunk.strip())
        
        return chunks

    def _estimate_tokens(self, text: str) -> int:
        return len(text) // 4