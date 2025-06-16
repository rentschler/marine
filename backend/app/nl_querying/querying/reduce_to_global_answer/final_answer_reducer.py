from typing import List

from nl_querying.querying.models.community_answer import CommunityAnswer
from nl_querying.querying.prompts import reduce_final_answer_prompt
from nl_querying.utils.llm import LLM


class FinalAnswerReducer:
    def __init__(self, llm:LLM, token_limit: int = 2048):
        self.llm = llm
        self.token_limit = token_limit

    async def reduce_answers(self, question: str, intermediate_answers: List[CommunityAnswer]) -> str:
        final_context = ""
        token_count = 0

        for item in intermediate_answers:
            answer = item.answer
            tokens = self._estimate_tokens(answer)
            if token_count + tokens <= self.token_limit:
                final_context += answer + "\n"
                token_count += tokens
            else:
                break
        final_answer = await self.llm.invoke_prompt(
            system_prompt=reduce_final_answer_prompt.get("system_prompt"),
            user_prompt=f"""
            Question:
            ---------
            {question}

            Final Context:
            ------
            {final_context}
            """
        )
        return final_answer
    
    def _estimate_tokens(self, text: str) -> int:
        return len(text) // 4