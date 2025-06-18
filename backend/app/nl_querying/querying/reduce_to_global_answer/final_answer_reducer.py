from typing import List
from nl_querying.querying.models.intermidate_answer import IntermidateAnswer
from nl_querying.querying.models.community_answer import CommunityAnswer
from nl_querying.utils.llm.llm import LLM
from nl_querying.utils.llm.parallel_llm_call import ParallelLLMCall
from nl_querying.querying.prompts.reduce_final_answer_prompt import reduce_final_answer_prompt

class FinalAnswerReducer:
    def __init__(self, llm: LLM, token_limit: int = 2048):
        self.llm = llm
        self.token_limit = token_limit

    def _estimate_tokens(self, text: str) -> int:
        return len(text) // 4

    def _group_answers_by_token_limit(self, answers: List[CommunityAnswer]) -> List[List[CommunityAnswer]]:
        groups = []
        current_group = []
        current_tokens = 0

        for answer in answers:
            tokens = self._estimate_tokens(answer.answer)
            if current_tokens + tokens > self.token_limit and current_group:
                groups.append(current_group)
                current_group = []
                current_tokens = 0
            current_group.append(answer)
            current_tokens += tokens

        if current_group:
            groups.append(current_group)

        return groups

    def _make_prompt(self, question: str, group: List[CommunityAnswer]) -> str:
        context = "\n\n".join(a.answer for a in group)
        return f"""
        Question:
        ---------
        {question}

        Final Context:
        --------------
        {context}
        """

    async def reduce_answers(self, question: str, intermediate_answers: List[IntermidateAnswer]) -> str:
        if len(intermediate_answers) >= 2:
            current_answers = intermediate_answers[-2:]
        else:
            current_answers = intermediate_answers
        
        all_answers = [answer for layer in current_answers for answer in layer.subtree]
        print(all_answers)

        while len(all_answers) > 1:
            groups = self._group_answers_by_token_limit(all_answers)

            calls = [
                ParallelLLMCall(
                    id=i,
                    system_prompt=reduce_final_answer_prompt.get("system_prompt"),
                    user_prompt=self._make_prompt(question, group),
                    nodes=[] 
                )
                for i, group in enumerate(groups)
            ]

            completed_calls = await self.llm.invoke_llm_parallel(calls)

            new_answers: List[CommunityAnswer] = []
            for call in completed_calls:
                if call.answer is None:
                    print(call)
                try:
                    answer_text = call.answer
                    new_answers.append(
                        CommunityAnswer(
                            score=1000,
                            answer=answer_text,
                            nodes=[]
                        )
                    )
                except Exception as e:
                    print(f"Error parsing LLM output: {e}")
                    continue

            all_answers = new_answers

        if all_answers:
            return all_answers
        else:
            return "Failed the generate Answer"
