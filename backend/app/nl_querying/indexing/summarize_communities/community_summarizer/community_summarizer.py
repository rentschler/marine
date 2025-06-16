from typing import Dict, List, Tuple, Union
import networkx as nx
import os, json

from nl_querying.utils.llm import LLM
from nl_querying.indexing.find_communities.community_descriptor.community_descriptor import CommunityDescriptor
from nl_querying.indexing.summarize_communities.models.summary import Summary
from nl_querying.indexing.find_communities.models.community import Community
from nl_querying.indexing.prompts.community_summary_prompt import community_summary_prompt



class CommunitySummarizer:
    def __init__(self, llm: LLM, token_limit = 2048 * 1.5, summary_path: str = "summaries"):
        self.token_limit = token_limit
        self.summary_path = summary_path
        self.llm = llm
        self.community_descriptor = CommunityDescriptor()

    async def summarize_community(self, graph: nx.DiGraph, community: Community, sub_community_summaries: List[Summary] = None) -> Summary:
        if sub_community_summaries is None:
            sub_community_summaries = {}

        level = community.level
        print(f"Level: {level}")

        if not any(isinstance(n, Community) for n in community.nodes):
            llm_summary = await self._get_leaf_community_context(graph=graph, community=community)
        else:
            llm_summary = await self._get_parent_community_context(graph=graph, community=community, sub_community_summaries=sub_community_summaries)
        
        community_id = self._community_id(community.nodes)
        folder_path = f"{self.summary_path}/level_{level}"
        os.makedirs(folder_path, exist_ok=True)
        summary= await self._parse_and_save_summary(llm_summary, community=community, community_id=community_id, folder_path=folder_path)
        return summary

    async def _get_leaf_community_context(self, graph: nx.DiGraph, community: Community) -> str:
        print("leaf")
        full_text_lines = self.community_descriptor.describe_community(graph, community)
        full_text =  "\n".join(full_text_lines)

        return await self._call_llm(context=full_text)
        

    async def _get_parent_community_context(self, graph: nx.DiGraph, community: Community, sub_community_summaries: List[Summary]) -> str:
        print("parent")
        full_text_lines, sub_group_descriptions = self.community_descriptor.describe_community_with_groups(graph, community)
        full_text = "\n".join(full_text_lines)
        token_total = self._estimate_tokens(full_text)

        substitution_candidates = []

        for sub in community.nodes:
            if isinstance(sub, Community):
                community_id = self._community_id(sub.nodes)
                sub_summary = await self.summarize_community(graph, sub, sub_community_summaries)
                sub_community_summaries[community_id] = sub_summary

                long_lines = sub_group_descriptions.get(community_id, [])
                if not long_lines:
                    continue

                long_text = "\n".join(long_lines)
                long_tokens = self._estimate_tokens(long_text)

                short_summary = sub_summary.summary
                short_tokens = self._estimate_tokens(short_summary)

                saving = long_tokens - short_tokens
                substitution_candidates.append((saving, long_text, short_summary))

        print("Substitution Candidates: ",substitution_candidates)
        if token_total < self.token_limit:
            print("Tokens Parent: ", token_total)
            return await self._call_llm(context=full_text)

        substitution_candidates.sort(key=lambda x: x[0], reverse=True)

        for saving, long_text, short_summary in substitution_candidates:
            if long_text in full_text:
                full_text = full_text.replace(long_text, short_summary)
                token_total -= saving
                if token_total <= self.token_limit:
                    break
        
        print("Tokens Parent: ", token_total)
        if token_total > self.token_limit:
            return await self._summarize_in_chunks(full_text)
        return await self._call_llm(context=full_text) 
    
    async def _summarize_in_chunks(self, text: str) -> str:
        words = text.split()
        chunks = []
        current_chunk = []

        current_tokens = 0
        for word in words:
            word_tokens = self._estimate_tokens(word)
            if current_tokens + word_tokens > (self.token_limit * 0.8):
                chunks.append(" ".join(current_chunk))
                current_chunk = [word]
                current_tokens = word_tokens
            else:
                current_chunk.append(word)
                current_tokens += word_tokens

        if current_chunk:
            chunks.append(" ".join(current_chunk))
        
        partial_summaries = []
        for i, chunk in enumerate(chunks):
            summary = await self._call_llm(chunk)
            partial_summaries.append(summary)
        
        combined = "\n\n".join(partial_summaries)
        if self._estimate_tokens(combined) > self.token_limit:
            combined = await self._summarize_in_chunks(combined)

        return await self._call_llm(combined)

    async def _call_llm(self, context: str) -> str:
        return await self.llm.invoke_prompt(
                system_prompt=community_summary_prompt.get("system_prompt"),
                user_prompt=f"{community_summary_prompt.get('user_prompt')}\n\n{context}"
            )

    async def _parse_and_save_summary(self, summary: str, community: Community, community_id:str, folder_path: str) -> Summary:
        try:
            summary_cleaned = self.llm.extract_json_block(summary)
            summary_json = json.loads(summary_cleaned)
            summary_obj = Summary(
                title=summary_json.get("title"),
                summary=summary_json.get("summary"),
                rating=summary_json.get("rating"),
                rating_explanation=summary_json.get("rating explanation"),
                findings=summary_json.get("findings"),
                nodes=self.community_descriptor.extract_nodes_from_community(community=community)
            )
            self._save_community_summary(community_id=community_id, summary=summary_obj, folder_path=folder_path)
            return summary_obj
        except json.JSONDecodeError as e:
            print("Error while summarizing: ",summary) 
            summary = await self._call_llm(summary)
            return await self._parse_and_save_summary(summary=summary, community=community, community_id=community_id, folder_path=folder_path)  


    def _estimate_tokens(self, text: str) -> int:
        return len(text) // 4
    
    def _community_id(self, community_nodes: List[Union[str, Community]]) -> str:
        def flatten(nodes: List[Union[str, Community]]) -> List[str]:
            flat = []
            for n in nodes:
                if isinstance(n, str):
                    flat.append(n)
                elif isinstance(n, Community):
                    flat.extend(flatten(n.nodes))
            return flat

        flat_nodes = flatten(community_nodes)
        
        if not flat_nodes:
            return "empty_community"
        
        base_name = "_".join(sorted(flat_nodes)[:3]).lower()
        unique_hash = hash(frozenset(flat_nodes)) % (10**8)
        return f"{base_name}_{unique_hash}"
    
    def _save_community_summary(self, community_id: str, summary: Community, folder_path: str):
        title = (summary.title or "community").lower()
        title = "".join(c if c.isalnum() else "_" for c in title)

        filename = f"{title}_{community_id[:50]}.json"
        filepath = os.path.join(folder_path, filename)

        summary_dict = {
            "title": summary.title,
            "summary": summary.summary,
            "rating": summary.rating,
            "rating explanation": summary.rating_explanation,
            "findings": summary.findings,
            "nodes": summary.nodes
        }

        with open(filepath, "w") as f:
            json.dump(summary_dict, f, indent=2)
