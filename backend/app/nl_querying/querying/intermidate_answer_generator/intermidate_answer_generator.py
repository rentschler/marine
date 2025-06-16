from typing import Dict, List
import json

from nl_querying.querying.models.community_answer import CommunityAnswer
from nl_querying.querying.models.chunk import Chunk
from nl_querying.querying.prompts import community_answer_prompt
from nl_querying.utils.llm import LLM


class IntermidateAnswerGenerator:
    def __init__(self, llm: LLM):
        self.llm = llm

    async def get_intermidate_answer(self, question: str, chunks: List[List[Chunk]]):
        level_2_chunks = [chunks[2]]
        relevant_subtrees:  List[CommunityAnswer] = self.find_relevant_subtrees(question=question, chunks=level_2_chunks)


    async def find_relevant_subtrees(self, question: str, chunks: List[List[Chunk]]) -> List[CommunityAnswer]:
        results: List[CommunityAnswer] = []
        for level in chunks:
            for chunk in level:
                response = await self.llm.invoke_prompt(
                system_prompt=community_answer_prompt.get("system_prompt"),
                user_prompt=f"""
                Question:
                ---------
                {question}

                Chunk:
                ------
                {chunk.text}
                """
                )
            
            try:
                response_data = json.loads(response)
                community_answer = CommunityAnswer(
                    score = int(response_data.get("score")),
                    answer = response_data.get("answer"),
                    nodes = chunk.nodes
                )
                if community_answer.score > 0:
                    results.append(community_answer)
            except json.JSONDecodeError:
                print(f"Failed to parse LLM response: {response}")
                raise json.JSONDecodeError

        return sorted(results, key=lambda x: x.score, reverse=True)
