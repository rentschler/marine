import os, json, random
from typing import Dict, List

from nl_querying.query_utils import estimate_tokens


class QueryService2:
    def __init__(self, llm, community_summary_paths: str = "summaries", token_limit=2048, chunk_size=512):
        self.llm = llm
        self.community_summary_paths = community_summary_paths
        self.token_limit = token_limit
        self.chunk_size = chunk_size

    async def answer_query_from_all_levels(self, user_query: str) -> str:
        all_summaries = []

        for level_name in os.listdir(self.community_summary_paths):
            level_path = os.path.join(self.community_summary_paths, level_name)
            if os.path.isdir(level_path):
                all_summaries.extend(self._load_summaries_from_level(level_path))

        chunks = self._chunk_summaries(all_summaries)
        intermediate_answers = await self._map_answers(user_query, chunks)
        final_answer = await self._reduce_answers(user_query, intermediate_answers)
        return final_answer

    
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
            tokens = estimate_tokens(summary)
            if current_tokens + tokens <= self.chunk_size:
                current_chunk += summary + "\n"
                current_tokens += tokens
            else:
                chunks.append(current_chunk.strip())
                current_chunk = summary + "\n"
                current_tokens = tokens

        if current_chunk.strip():
            chunks.append(current_chunk.strip())

        return chunks
    
    async def _map_answers(self, question: str, chunks: List[str]) -> List[Dict]:
        results = []
        for chunk in chunks:
            system_prompt = """
            ---Role--
            You are a helpful assistant responding to questions about data in the tables provided.

            ---Goal--
            Generate a response of the target length and format that responds to the user’s question, summarize
            all relevant information in the input data tables appropriate for the response length and format, and
            incorporate any relevant general knowledge.
            If you don’t know the answer, just say so. Do not make anything up.
            The response shall preserve the original meaning and use of modal verbs such as "shall", "may" or "will".
            Points supported by data should list the relevant reports as references as follows:
            "This is an example sentence supported by data references [Data: Reports (report ids)]"
            Do not list more than 5 record ids in a single reference. Instead, list the top 5 most relevant record
            ids and add "+more" to indicate that there are more.
            For example:
            "Person X is the owner of Company Y and subject to many allegations of wrongdoing [Data: Reports (2,
            7, 64, 46, 34, +more)]. He is also CEO of company X [Data: Reports (1, 3)]"
            where 1, 2, 3, 7, 34, 46, and 64 represent the id (not the index) of the relevant data report in the
            provided tables.

            ---Scoring---
            Evaluate how helpful your answer is in answering the user's question and assign an integer score between 0 and 100.

            ---Output Format---
            Return the result as a JSON object with the following structure:

            {
            "score": <integer between 0 and 100>,
            "answer": "<your complete answer in markdown format>"
            }

            Make sure the output is valid JSON and nothing else.
            """
            user_prompt = f"""
            Question:
            ---------
            {question}

            Chunk:
            ------
            {chunk}
            """
            response = await self.llm.invoke_prompt(
                system_prompt=system_prompt,
                user_prompt=user_prompt
            )

            try:
                response_data = json.loads(response)
                score = int(response_data.get("score", 0))
                answer = response_data.get("answer", "")
                if score > 0:
                    results.append({"score": score, "answer": answer})
            except json.JSONDecodeError:
                print(f"Failed to parse LLM response: {response}")
                continue

        return sorted(results, key=lambda x: x["score"], reverse=True)
    
    async def _reduce_answers(self, question: str, intermediate_answers: List[Dict]) -> str:
        final_context = ""
        token_count = 0

        for item in intermediate_answers:
            answer = item["answer"]
            tokens = estimate_tokens(answer)
            if token_count + tokens <= self.token_limit:
                final_context += answer + "\n"
                token_count += tokens
            else:
                break

        system_prompt = """
        ---Role--
        You are a helpful assistant responding to questions about a dataset by synthesizing perspectives from
        multiple analysts.

        ---Goal--
        Generate a response of the target length and format that responds to the user’s question, summarize
        all the reports from multiple analysts who focused on different parts of the dataset, and incorporate any
        relevant general knowledge.
        Note that the analysts’ reports provided below are ranked in the **descending order of helpfulness**.
        If you don’t know the answer, just say so. Do not make anything up.
        The final response should remove all irrelevant information from the analysts’ reports and merge the
        cleaned information into a comprehensive answer that provides explanations of all the key points and
        implications appropriate for the response length and format.
        Add sections and commentary to the response as appropriate for the length and format. Style the response
        in markdown.
        The response shall preserve the original meaning and use of modal verbs such as "shall", "may" or "will".
        The response should also preserve all the data references previously included in the analysts’ reports,
        but do not mention the roles of multiple analysts in the analysis process.
        Do not list more than 5 record ids in a single reference. Instead, list the top 5 most relevant record
        ids and add "+more" to indicate that there are more.
        For example:
        "Person X is the owner of Company Y and subject to many allegations of wrongdoing [Data: Reports (2,
        7, 34, 46, 64, +more)]. He is also CEO of company X [Data: Reports (1, 3)]"
        where 1, 2, 3, 7, 34, 46, and 64 represent the id (not the index) of the relevant data record.
        Do not include information where the supporting evidence for it is not provided.
        Add sections and commentary to the response as appropriate for the length and format. Style the response
        in markdown.
        """
        user_prompt = f"""
        Question:
        ---------
        {question}

        Final Context:
        ------
        {final_context}
        """
        final_answer = await self.llm.invoke_prompt(
            system_prompt=system_prompt,
            user_prompt=user_prompt
        )
        return final_answer
