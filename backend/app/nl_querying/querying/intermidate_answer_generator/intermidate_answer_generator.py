from typing import List

from nl_querying.querying.models.intermidate_answer import IntermidateAnswer
from nl_querying.querying.prompts.community_answer_prompt import community_answer_prompt
from nl_querying.utils.llm.parallel_llm_call import ParallelLLMCall
from nl_querying.querying.models.community_answer import CommunityAnswer
from nl_querying.querying.models.chunk import Chunk
from nl_querying.utils.llm.llm import LLM


class IntermidateAnswerGenerator:
    def __init__(self, llm: LLM):
        self.llm = llm

    async def get_intermidate_answer(self, question: str, chunks: List[List[Chunk]]) -> List[IntermidateAnswer]:
        results: List[IntermidateAnswer] = []
        starting_level = 1 # nicht 0, da das alle Node beinhaltet.

        layer_chunks = [chunks[starting_level]]
        relevant_subtrees:  List[CommunityAnswer] = await self.find_relevant_subtrees(question=question, chunks=layer_chunks)
        results.append(IntermidateAnswer(
            layer=starting_level,
            subtree=relevant_subtrees
        ))

        for index in range(starting_level + 1, len(chunks)):
            layer_chunks = chunks[index]
            children_layers = []
            for layer_chunk in layer_chunks:
                for relevant_subtree in relevant_subtrees:
                    subtree_nodes = relevant_subtree.nodes
                    chunk_nodes = layer_chunk.nodes
                    if not self._is_children_layer(parent_layer_nodes=subtree_nodes, children_layer_nodes=chunk_nodes):
                        continue
                    children_layers.append(layer_chunk)

            relevant_subtrees:  List[CommunityAnswer] = await self.find_relevant_subtrees(question=question, chunks=[children_layers])
            results.append(IntermidateAnswer(
                layer=index,
                subtree=relevant_subtrees
            ))
                    
        return results


    async def find_relevant_subtrees(self, question: str, chunks: List[List[Chunk]]) -> List[CommunityAnswer]:
        calls: List[ParallelLLMCall] = []
        index = 0
        for level in chunks:
            for chunk in level:
                system_prompt=community_answer_prompt.get("system_prompt")
                user_prompt=f"""
                Question:
                ---------
                {question}

                Chunk:
                ------
                {chunk.text}
                """
                calls.append(ParallelLLMCall(id=index,system_prompt=system_prompt, user_prompt=user_prompt, nodes=chunk.nodes))
                index += 1

        completed_calls = await self.llm.invoke_llm_parallel(calls)
        
        results: List[CommunityAnswer] = []
        for call in completed_calls:
            if call.answer is None:
                continue
            try:
                score = int(call.answer.get("score"))
                answer_text = call.answer.get("answer")
                if score > 40:
                    results.append(CommunityAnswer(
                        score=score,
                        answer=answer_text,
                        nodes=call.nodes  
                    ))
            except Exception as e:
                print(f"Failed to convert to CommunityAnswer: {e}")
                continue

        return sorted(results, key=lambda x: x.score, reverse=True)
    
    def _is_children_layer(self, parent_layer_nodes: List[List[str]], children_layer_nodes: List[List[str]]) -> bool:
        flat_parents = {node for sublist in parent_layer_nodes for node in sublist}
        flat_children = [node for sublist in children_layer_nodes for node in sublist]
        return flat_children[0] in flat_parents



    def _is_leaf_layer(self, layer_nodes: List[List[str]], chunks: List[List[Chunk]], index: int) -> bool:
        if len(chunks) >= index:
            next_layer = chunks[index]
            for chunk in next_layer:
                next_layer_nodes = chunk.nodes
                if self._is_children_layer(layer_nodes, next_layer_nodes):
                    return True
        
        return False