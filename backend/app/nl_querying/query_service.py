from typing import Dict, List, Tuple
import json
import os
from fastapi import WebSocket


from nl_querying.init_llm import LLM
from nl_querying.query_utils import Entities, PathResult, clean_json_string, construct_answer_graph
from nl_querying.init_graph import Neo4JGraph


class QueryService:
    """
    A service for extracting and analyzing entities and communities in a knowledge graph.
    """

    def __init__(self, llm: LLM, community_summary_path: str = "community_descriptions") -> None:
        """
        Initializes the QueryService with the provided LLM and community summary directory.

        Args:
            llm (LLM): The language model interface for prompt-based queries.
            community_summary_path (str, optional): Path to community summary files. Defaults to "community_descriptions".
        """
        self.community_summary_path = community_summary_path
        self.llm = llm
        self.graph = Neo4JGraph()

    async def classify_question(
        self, question: str
    ) -> Tuple[bool, str]:
        """
        Classifies whether the question requires the RAG pipeline or can be answered directly.
        Returns:
            needs_pipeline (bool): True if question needs the pipeline, False otherwise
            message (str): Additional message for the user
        """

        prompt = (
            "Given a user question, classify it as either:\n"
            "- 'pipeline' if it needs retrieval-augmented generation (like database queries),\n"
            "- or 'general' if it can be answered directly by the language model.\n\n"
            "Respond with just 'pipeline' or 'general' (case-insensitive).\n\n"
            "Question:\n"
            f"{question}"
        )

        response = await self.llm.invoke_prompt(
            system_prompt="You are a helpful assistant. ",
            user_prompt=prompt
        )

        result = response.strip().lower()
        needs_pipeline = result == "pipeline"

        reminder = ""
        if not needs_pipeline:
            reminder = (
                "Note: This question might not be well-suited for the retrieval pipeline. "
                "Please consider asking questions that involve our knowledge base or require deeper context."
            )

        return needs_pipeline, reminder

    async def extract_all_entities_from_query(self, query: str) -> List[str]:
        """
        Extracts all named PERSONS and LOCATIONS from a user query using the LLM.

        Args:
            query (str): The user-provided query text.

        Returns:
            List[str]: A list of extracted entity names.
        """
        try:
            response = await self.llm.invoke_prompt(
                system_prompt="""
                    You are an information extraction assistant. Extract all PERSONS and LOCATIONS names from the text below.
                    Combine both types into a single array called `entities`.
                    Output ONLY a valid JSON object with the following format (no extra text, no markdown, no explanation):

                    {
                      "entities": ["Entity A", "Entity B"]
                    }

                    If no names are found, return: {"entities": []}.
                    Do NOT return a list, markdown, or anything else. Only this JSON object.
                    """,
                user_prompt=query
            )
            response = clean_json_string(response)
            print(response)
            data = json.loads(response)
            entities = Entities(**data)
            return entities.entities
        except Exception as e:
            print("Parsing failed:", e)
            raise

    async def extract_all_relevant_communities(self, query: str) -> List[int]:
        """
        Determines which communities are relevant to a user query based on precomputed summaries.

        Args:
            query (str): The user-provided question.

        Returns:
            List[int]: A list of relevant community IDs.
        """
        summaries = []
        for file_name in os.listdir(self.community_summary_path):
            if file_name.endswith(".json"):
                with open(os.path.join(self.community_summary_path, file_name), "r", encoding="utf-8") as f:
                    data = json.load(f)
                    community_id = data.get("community")
                    summary = data.get("summary")
                    summaries.append((community_id, summary))

        summary_text = "\n\n".join(
            f"Community {cid}: {text}" for cid, text in summaries
        )

        prompt = f"""
            Here is a user question:
            "{query}"

            And here are summaries of communities in the graph:
            {summary_text}

            Which of these communities are relevant for answering the question?

            Return only a valid JSON object in the following format:
            {{
              "relevant_communities": [1, 5, 7]
            }}

            Only include numbers (IDs), no explanations or text. The answer **must** be valid JSON.
            Do not return anything else.
        """

        try:
            response = await self.llm.invoke_prompt(
                system_prompt="You are an assistant for analyzing knowledge graphs.",
                user_prompt=prompt
            )
            response = clean_json_string(response)
            print(response)
            data = json.loads(response)
            return data.get("relevant_communities", [])
        except Exception as e:
            print("Error parsing LLM Answer:", e)
            print("Answer:", response)
            raise

    async def extract_all_relevant_entities_from_communities(self, communities: List[int]) -> List[str]:
        """
        Extracts all named entities from the summaries of relevant communities.

        Args:
            communities (List[int]): A list of relevant community IDs.

        Returns:
            List[str]: A list of extracted entity names.
        """
        summaries = []
        for i in communities:
            file_path = os.path.join(self.community_summary_path, f"community_{i}.json")
            if os.path.exists(file_path):
                with open(file_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    summaries.append(f"Community {i}: {data.get('summary', '')}")

        summary_text = "\n\n".join(summaries)

        prompt = f"""
            Given the following summaries from a knowledge graph:

            {summary_text}

            Extract all named entities that appear in these summaries.

            Keep in mind the different types of Entities: Person, Vessel, Organization, Group, Location.

            Do not include any other types.

            Return **only** a valid JSON object like this:
            {{
              "entities": ["Entity A", "Entity B", "Entity C"]
            }}

            Do not include any explanation, only valid JSON.
        """

        try:
            response = await self.llm.invoke_prompt(
                system_prompt="You are an information extraction assistant.",
                user_prompt=prompt
            )
            response = clean_json_string(response)
            print(response)
            data = json.loads(response)
            return data.get("entities", [])
        except Exception as e:
            print("Parsing failed:", e)
            return []
        
    def describe_path(self, path: PathResult) -> str:
        """
        Generates a human-readable textual description of a graph path, including both nodes and relationships.

        Args:
            path (PathResult): 
                The path object containing nodes and relationships. It is expected to have:
                - nodes: A list of Node objects with at least 'id', 'type', and other relevant properties.
                - relationships: A list of Relationship objects with 'source', 'target', 'type', and other properties.

        Returns:
            str:
                A formatted string that first lists all nodes in the path, each described by its ID, type, and
                any non-null properties (excluding coordinates 'x' and 'y'), followed by a list of relationships,
                each described by its source and target node IDs, type, and all available properties.

        Notes:
            - Nodes are described in the format: 
                <node_id> (<node_type>) [<prop1>: <val1>, <prop2>: <val2>, ...]
            - Relationships are described in the format: 
                <source_id> -[<relationship_type>]-> <target_id> [<prop1>: <val1>, <prop2>: <val2>, ...]
            - If a property is None, it is excluded from the description.
            - If no properties are available, the node or relationship description omits the properties section.

        Example output:
            Nodes:
            1 (Person) [name: Alice, age: 30]
            2 (Location) [name: Wonderland]
            Relationships:
            1 -[LIVES_IN]-> 2 [since: 2020]

        """
        nodes = path.nodes
        relationships = path.relationships
        node_map = {node.id: node for node in nodes}

        node_descriptions = []
        for node in nodes:
            props = ", ".join(
                f"{k}: {v}" 
                for k, v in node.dict().items() 
                if v is not None and k not in ["id", "x", "y"]
            )

            desc = f"{node.id} ({node.type})"
            if props:
                desc += f" [{props}]"
            node_descriptions.append(desc)

        edge_descriptions = []
        for rel in relationships:
            source_node = node_map.get(rel.source)
            target_node = node_map.get(rel.target)

            if source_node and target_node:
                source_name = source_node.id
                target_name = target_node.id
                rel_type = rel.type
                props = ", ".join(f"{k}: {v}" for k, v in rel.dict().items())
                edge_text = f"{source_name} -[{rel_type}]-> {target_name}"
                if props:
                    edge_text += f" [{props}]"
                edge_descriptions.append(edge_text)

        full_description = "Nodes:\n" + "\n".join(node_descriptions)
        full_description += "\nRelationships:\n" + "\n".join(edge_descriptions)
        return full_description
    
    async def summarize_and_score_paths(self, paths: List[PathResult], question: str) -> Dict[str, object]:
        """
        Summarizes a list of knowledge graph paths and assesses their relevance to a given user question.

        Args:
            paths (List[PathResult]):
                A list of PathResult objects, each representing a path in the knowledge graph. Each path includes nodes and relationships.
            question (str):
                The user's question to which the paths should be evaluated for relevance.

        Returns:
            Dict[str, object]:
                A dictionary with two keys:
                - 'summary': A natural language summary of all provided paths (single summary, up to 6 sentences).
                - 'relevant': A boolean indicating whether the paths are relevant to answering the user's question.

        Notes:
            - The method first converts each path into a textual description using the describe_path() method.
            - It then constructs a prompt for a language model that includes:
                - The question
                - The descriptions of all paths
            - The model is instructed to:
                - Summarize the paths in natural language (single summary, no multiple summaries)
                - Assess whether the paths are relevant
                - Return only a valid JSON object with the 'summary' and 'relevant' fields.
            - The model output is cleaned and parsed as JSON.
            - If parsing fails, a default dictionary is returned indicating parsing failure and relevance as False.

        Example output:
            {
                "summary": "This summary describes the key entities and relationships relevant to the user's question.",
                "relevant": true
            }
        """
        path_descriptions = []
        for i, path in enumerate(paths, start=1):
            desc = self.describe_path(path)
            path_descriptions.append(f"Path {i}:\n{desc}")

        combined_description = "\n\n".join(path_descriptions)

        prompt = f"""
            You are given multiple paths from a knowledge graph and a user question.
            Summarize the paths in natural language (Use up to 6 Sentences to discribe the paths) and assess whether they are relevant to answering the user's question.

            Summarize all paths at once, dont make multipal summaries.

            Keep in mind the diffent Types of Entities: Person, Vessel, Organization, Group, Location

            Question: {question}

            Paths:
            {combined_description}

            Just answer with a JSON object with the following structure:
            {{
            "summary": "<natural language summary>",
            "relevant": <true|false>
            }}
            Don't include any explanation or extra output.
        """
        try:
            response = await self.llm.invoke_prompt(
                system_prompt="You are an information extraction assistant.",
                user_prompt=prompt
            )
            response = clean_json_string(response)
            print(response)
            return json.loads(response)
        except json.JSONDecodeError:
            return {
                "summary": "Could not parse model response.",
                "relevant": False
            }

    async def answer_question(self, question: str, path_summaries: List[Dict[str, object]]) -> str:
        """
        Generates a natural language answer to a user's question using relevant paths from a knowledge graph.

        Args:
            question (str):
                The user's question to be answered.
            path_summaries (List[Dict[str, object]]):
                A list of dictionaries containing summaries of relevant paths, each with a 'summary' key.
                Each summary provides condensed information about a knowledge graph path that may help answer the question.

        Returns:
            str:
                A fluent, informative, natural English answer to the user's question, based only on the provided path summaries.

        Notes:
            - The method first concatenates all path summaries into a single text block.
            - It constructs a prompt that includes:
                - The user question
                - The concatenated path summaries
                - Instructions to answer only using the provided information, without external data or speculation.
            - The language model is instructed to produce a concise, well-formed answer that integrates relevant information.
            - The output is stripped of leading/trailing whitespace before returning.

        Example output:
            "Based on the paths provided, the person is associated with an organization that was involved in the event."
        """
        summaries_text = "\n".join(
            f"- {summary['summary']}" for summary in path_summaries if "summary" in summary
        )

        prompt = f"""
            The user asked the following question:
            "{question}"

            Based on the following relevant paths from the graph:
            {summaries_text}

            Keep in mind the diffent Types of Entities: Person, Vessel, Organization, Group, and Location.

            And how such diffent Entities interact.

            Please answer the user's question in fluent, informative natural English.

            Only use Information provided in the paths.
        """

        response = await self.llm.invoke_prompt(
            system_prompt="You are a helpful assistant working with knowledge graph results.",
            user_prompt=prompt
        )
        return response.strip() 
    
    async def pipeline_reporter(self, question: str, websocket: WebSocket):
        """
        Executes the RAG (Retrieval-Augmented Generation) pipeline and reports progress via WebSocket.

        This asynchronous function runs the entire RAG pipeline to answer a question. It provides real-time
        status updates to a connected WebSocket client. The steps include:

        1. Extracting entities from the question.
        2. Identifying relevant communities.
        3. Extracting relevant entities from those communities.
        4. Performing a full-text search over important entities in the graph.
        5. Summarizing and scoring the search paths.
        6. Generating a final answer from the summarized paths.
        7. Constructing an answer graph.

        Each step sends a message to the WebSocket to inform the client of the current status.

        Args:
            question (str):
                The user-provided question that should be answered using the RAG pipeline.
            websocket (WebSocket):
                An active WebSocket connection to communicate progress and status updates.

        Returns:
            dict:
                A dictionary containing:
                    - "answer": The final answer generated by the pipeline.
                    - "graph": The serialized answer graph as a dictionary, with unset and None fields excluded.

        Raises:
            Exception:
                If any step in the pipeline fails, the exception is propagated. The caller is responsible
                for error handling and user notification.
        """
        needs_pipeline, reminder = await self.classify_question(question)
        if not needs_pipeline:
            return{
                "answer": reminder
            }
        await websocket.send_text("Starting RAG pipeline...")

        await websocket.send_text("Extracting entities from the question...")
        entities = await self.extract_all_entities_from_query(question)

        await websocket.send_text("Identifying relevant communities...")
        relevant_communities = await self.extract_all_relevant_communities(question)

        await websocket.send_text("Extracting relevant entities from communities...")
        relevant_entities = await self.extract_all_relevant_entities_from_communities(relevant_communities)

        await websocket.send_text("Performing full-text search on important entities...")
        await self.graph.initialize()
        paths: Dict[Tuple[str, str], List[PathResult]] = await self.graph.full_text_search_on_important_entities(entities, relevant_entities)

        await websocket.send_text("Summarizing and scoring paths...")
        number_of_paths = len(paths)
        current_path = 1
        overall_calls = 0
        path_summaries = []

        for path_list in paths.values():
            sub_paths = len(path_list)
            overall_calls += 1
            await websocket.send_text(f"Processing path group {current_path}/{number_of_paths} with {sub_paths} sub-paths...")
            path_summary = await self.summarize_and_score_paths(path_list, question)
            if path_summary.get("relevant", False):
                path_summaries.append(path_summary)
            current_path += 1

        await websocket.send_text("Generating final answer...")
        answer = await self.answer_question(question=question, path_summaries=path_summaries)

        await websocket.send_text("Building answer graph...")
        graph = construct_answer_graph(paths)

        await websocket.send_text("Pipeline completed successfully.")
        return {
            "answer": answer,
            "graph": graph.model_dump(exclude_unset=True, exclude_none=True)
        }

