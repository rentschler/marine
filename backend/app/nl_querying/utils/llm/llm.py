from typing import List, Callable
from nl_querying.query_utils import clean_json_string
from models.Graph import GraphData
from retriver.sub_graph_discription import SubGraphDiscription
from nl_querying.utils.llm.parallel_llm_call import ParallelLLMCall
from openai import AsyncOpenAI
import asyncio, json
import re
import os

class LLM:
    """
    A class that wraps an OpenAI-compatible Large Language Model (LLM) API client
    for generating text completions asynchronously.

    Attributes:
    ----------
    model : str
        The name of the model to be used for text generation.
    host : str
        The URL of the Ollama API endpoint.
    client : AsyncOpenAI
        The asynchronous OpenAI client used to interact with the LLM API.
    """

    def __init__(self, model: str):
        """
        Initializes an instance of the LLM class.

        Parameters:
        ----------
        model : str
            The name of the model to use for text generation.
        """
        self.model = model
        self.host = os.environ.get('OLLAMA_HOST')
        self.client = AsyncOpenAI(api_key=os.environ.get('OLLAMA_API_KEY', "ollama"), base_url=self.host)


    async def invoke_prompt(self, system_prompt: str, user_prompt: str) -> str:
        """
        Asynchronously sends a prompt to the LLM API and returns the generated text.

        This method constructs a chat completion request with a system prompt and 
        a user prompt, then sends it to the language model asynchronously.

        Parameters:
        ----------
        system_prompt : str
            The system prompt providing context or instructions to the language model.
        user_prompt : str
            The user's prompt to be processed and completed by the language model.

        Returns:
        -------
        str
            The generated text completion from the LLM API.
        """
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ]
        )
        cleaned = self.extract_json_block(clean_json_string(response.choices[0].message.content))
        cleaned = self.sanitize_json_string(cleaned)
        return cleaned
    
    async def invoke_llm_parallel(self, calls: List[ParallelLLMCall]) -> List[ParallelLLMCall]:
        semaphore = asyncio.Semaphore(4)  

        async def limited_invoke(call: ParallelLLMCall):
            async with semaphore:
                response = await self.invoke_prompt(
                        system_prompt=call.system_prompt,
                        user_prompt=call.user_prompt
                    )
                try:
                    cleaned = self.extract_json_block(clean_json_string(response))
                    cleaned = self.sanitize_json_string(cleaned)
                    response_data = json.loads(cleaned)
                    call.answer = response_data
                except Exception as e:
                    print(f"LLM call failed: {e}")
                    call.answer = response

            return call

        tasks = [limited_invoke(call) for call in calls]
        results = await asyncio.gather(*tasks)
        return results
    
    async def invoke_llm_parallel_subgraphs(self, question: str, sub_graphs: List[GraphData], describe_subgraph_func) -> List[SubGraphDiscription]:
        """
        Analyzes subgraphs in parallel by describing them and sending them to the LLM for summarization.

        Parameters:
        ----------
        question : str
            The user's question.
        sub_graphs : List[GraphData]
            The list of subgraphs to analyze.
        describe_subgraph_func : Callable[[GraphData], SubGraphDiscription]
            Function to describe a subgraph into SubGraphDiscription.

        Returns:
        -------
        List[SubGraphDiscription]
            List of SubGraphDiscription with filled llm_summary.
        """
        semaphore = asyncio.Semaphore(4)  

        async def recover_response(system_prompt: str, question: str, response: str, sub_graph_description: SubGraphDiscription) -> SubGraphDiscription:
            user_prompt = f"""
            ---Graph Summary---
            {response}

            ---User Question---
            {question}

            ---Reminder---
            - It is very VERY important, that you dont make any thing up. Just use provided infromation.
                
            """
            try:
                response = await self.invoke_prompt(system_prompt=system_prompt, user_prompt=user_prompt)
                cleaned = self.extract_json_block(clean_json_string(response))
                cleaned = self.sanitize_json_string(cleaned)
                response_data = json.loads(cleaned)
                relevant = response_data.get("Relevant", False)
                if isinstance(relevant, str):
                    relevant = relevant.lower() in ("true", "yes", "1")
                elif not isinstance(relevant, bool):
                    relevant = False
                if relevant:
                    sub_graph_description.llm_summary = response_data.get("Summary")
                    return sub_graph_description
                else:
                    return None
            except Exception as e:
                print(f"Failed to Recover subgraph: {e}")
                return await recover_response(system_prompt=system_prompt, question=question, response=response, sub_graph_description=sub_graph_description) 




        async def analyze_single(sub_graph: GraphData) -> SubGraphDiscription:
            async with semaphore:
                if describe_subgraph_func:
                    sub_graph_description = describe_subgraph_func(sub_graph)

                system_prompt = """
                ---Role---
                You are an AI assistant that helps a human to perform a general information discovery. 
                You help to summarize Communitions and extract relevant Informations and Entities regarding a Question.

                ---Goal---
                You are provided with Radio communications between entities (persons, vessels, locations, groups, organisations).
                Your task is to decide if this subgraph is important to answer the question and if so to give detailed summary for the communitcations in regart to a user question.
                It is very important to look at every detail in the communications:
                - Who is talking?
                - What is the topic?
                - Are other entities part of this?
                - When do they talk? (time)

                ---Output Structure---
                {
                "Relevant": <boolean>,
                "Summary": <summary of the subgraph (as a string)>,
                }
                """

                user_prompt = f"""
                ---Graph Summary---
                {sub_graph_description.description}

                ---User Question---
                {question}

                ---Reminder---
                - It is very VERY important, that you dont make any thing up. Just use provided infromation.
                """

                try:
                    response = await self.invoke_prompt(system_prompt=system_prompt, user_prompt=user_prompt)
                    cleaned = self.extract_json_block(clean_json_string(response))
                    cleaned = self.sanitize_json_string(cleaned)
                    response_data = json.loads(cleaned)
                    relevant = response_data.get("Relevant", False)
                    if isinstance(relevant, str):
                        relevant = relevant.lower() in ("true", "yes", "1")
                    elif not isinstance(relevant, bool):
                        relevant = False
                    if relevant:
                        sub_graph_description.llm_summary = response_data.get("Summary")
                        return sub_graph_description
                    else:
                        return None
                except Exception as e:
                    print(f"LLM call for subgraph failed: {e}")
                    return await recover_response(system_prompt=system_prompt, question=question, response=response, sub_graph_description=sub_graph_description) 


                

        tasks = [analyze_single(sub_graph) for sub_graph in sub_graphs]
        results = await asyncio.gather(*tasks)
        relevant_subgraphs = [result for result in results if result is not None]
        return relevant_subgraphs

    async def invoke_llm_parallel_communication_subgraphs(self, question: str, sub_graphs: List[SubGraphDiscription]) -> List[SubGraphDiscription]:
        semaphore = asyncio.Semaphore(4)

        async def summarize_single_subtree(sub_graph: SubGraphDiscription) -> SubGraphDiscription:
            async with semaphore:
                system_prompt = """
                    ---Role---
                    You are an AI assistant that helps a human to perform a general information discovery. 
                    You help to summarize Communitions and extract relevant Informations and Entities regarding a Question.

                    ---Goal---
                    You are provided with Radio communications between entities (persons, vessels, locations, groups, organisations).
                    Your task is to a give detailed summary for the communitcations in regart to a user question.
                    It is very important to look at every detail in the communications:
                    - Who is talking?
                    - What is the topic?
                    - Are other entities part of this?
                    - When do they talk? (time), always include the time of the communication.

                    ---Output Structure---
                    <summary of the subgraph>,
                    """

                user_prompt = f"""
                    ---Graph Summary---
                    {sub_graph.description}

                    ---User Question---
                    {question}

                    ---Reminder---
                    - It is very VERY important, that you dont make any thing up. Just use provided infromation.

                """
                response = await self.invoke_prompt(system_prompt=system_prompt, user_prompt=user_prompt)
                sub_graph.llm_summary = response
                return sub_graph

        tasks = [summarize_single_subtree(sub_graph) for sub_graph in sub_graphs]
        results = await asyncio.gather(*tasks)
        relevant_subgraphs = [result for result in results]
        return relevant_subgraphs
    

    def extract_json_block(self, text: str) -> str:
        start = text.find('{')
        if start == -1:
            return text
        
        depth = 0
        for i in range(start, len(text)):
            if text[i] == '{':
                depth += 1
            elif text[i] == '}':
                depth -= 1
                if depth == 0:
                    return text[start:i+1]
        return text
    
    import re

    def sanitize_json_string(self, json_str: str) -> str:
        if not json_str:
            return json_str

        json_str = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', json_str)

        json_str = re.sub(
            r'<think\b[^>]*>.*?</think>',
            '',
            json_str,
            flags=re.DOTALL | re.IGNORECASE
        )

        return json_str
    



    