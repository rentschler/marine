from typing import List
from models.Graph import GraphData
from retriver.sub_graph_discription import SubGraphDiscription
from nl_querying.utils.llm.parallel_llm_call import ParallelLLMCall
from nl_querying.query_utils import clean_json_string
from openai import AsyncOpenAI
import asyncio, json
import re

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
        self.host = "https://ollama.joos.dbvis.de/v1"
        self.client = AsyncOpenAI(api_key='ollama', base_url=self.host)

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
        return clean_json_string(response.choices[0].message.content)
    
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
                    print("Response: ", response)
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
        semaphore = asyncio.Semaphore(4)  # adjust concurrency as needed

        async def analyze_single(sub_graph: GraphData) -> SubGraphDiscription:
            async with semaphore:
                sub_graph_description = describe_subgraph_func(sub_graph)

                system_prompt = """
                ---Role---
                You are an AI assistant that helps a human to perform a general information discovery. 
                You help to summarize Communitions and extract relevant Informations and Entities regarding a Question.

                ---Goal---
                You are provided with the description of a relationship between two Entities and Communtions,
                which support that relationship. Answer the question with the information in the subtree. If there
                is no important information regarding the question in the subtree, say so, dont make anything up.
                It is important that you include all relevant Entities and Informations. But don't make anything up.
                Only use the Information provided to you.

                ---Output Structure---
                Provide a markdown text summary. 
                Not longer then 5 sentences.
                """

                user_prompt = f"""
                ---Graph Summary---
                {sub_graph_description.description}

                ---User Question---
                {question}
                """

                try:
                    summary = await self.invoke_prompt(system_prompt=system_prompt, user_prompt=user_prompt)
                    sub_graph_description.llm_summary = summary
                except Exception as e:
                    print(f"LLM call for subgraph failed: {e}")
                    sub_graph_description.llm_summary = f"Error during summarization: {e}"

                return sub_graph_description

        tasks = [analyze_single(sub_graph) for sub_graph in sub_graphs]
        results = await asyncio.gather(*tasks)
        return results

    

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

        return json_str


    