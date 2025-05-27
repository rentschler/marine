from collections import defaultdict
from typing import Dict, List, Set, Tuple
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field
import json, os
from langchain_neo4j.vectorstores.neo4j_vector import remove_lucene_chars
from langchain_neo4j import Neo4jGraph

from models.Graph import EDefault, Graph, GraphData, Link


class Entities(BaseModel):
    entities: List[str] = Field(
        ...,
        description="All the person, locations that appear in the database"
    )
class Node(BaseModel):
    id: str
    labels: List[str]
    properties: Dict[str, object]

class Relationship(BaseModel):
    type: str
    source: str  
    target: str  
    properties: Dict[str, object]

class PathResult(BaseModel):
    nodes: List[Node]
    relationships: List[Relationship]

def clean_json_string(dirty_string):
    dirty_string = dirty_string.replace('json', '', 1).strip()
    dirty_string = dirty_string.replace('```', '', 1).strip()
    dirty_string = dirty_string.replace('```', '', 1).strip()
    return dirty_string



def extract_all_entities_from_query(query: str, llm) -> List[str]:
    prompt_entities = ChatPromptTemplate.from_messages([
    (
        "system",
        "You are an information extraction assistant. Extract all PERSONS and LOCATIONS names from the text below. "
        "Combine both types into a single array called `entities`. "
        "Output ONLY a valid JSON object with the following format (no extra text, no markdown, no list wrappers, no explanation):\n\n"
        "{{\n"
        "  \"entities\": [\"Entity\", \"Entity\"]\n"
        "}}\n\n"
        "If no names are found, return: {{\"entities\": []}}. "
        "Do NOT return a list, markdown, or anything else. Only this JSON object."
        "Do not use  ```json."
    ),
    ("human", "Text: {input}")
])


    formatted_prompt = prompt_entities.format(input=query)
    response = llm.invoke(formatted_prompt)
    response = clean_json_string(response)
    print(response)
    try:
        data = json.loads(response)
        entities = Entities(**data)
        return entities.entities
    except Exception as e:
        print("Parsing failed:", e)
        raise

def extract_all_relevant_communities(query: str, llm, folder: str = "community_descriptions") -> List[int]:
    summaries = []
    for file_name in os.listdir(folder):
        if file_name.endswith(".json"):
            with open(os.path.join(folder, file_name), "r", encoding="utf-8") as f:
                data = json.load(f)
                community_id = data.get("community")
                summary = data.get("summary")
                summaries.append((community_id, summary))

    summary_text = "\n\n".join(
        f"Community {cid}: {text}" for cid, text in summaries
    )
    prompt = f"""
        You are an assistant for analyzing knowledge graphs.

        Here is a user question:
        \"{query}\"

        And here are summaries of communities in the graph:
        {summary_text}

        Which of these communities are relevant for answering the question?

        Return only a valid JSON object in the following format:
        {{
        "\"relevant_communities\": [1, 5, 7]\n"
        }}

        Only include numbers (IDs), no explanations or text. The answer **must** be valid JSON.
        Do not return anything else.
    """


    try:
        response = llm.invoke(prompt)
        response = clean_json_string(response)

        print(response)
        data = json.loads(response)
        return data.get("relevant_communities", [])
    except Exception as e:
        print("Error parsing LLM Answer:", e)
        print("Answer:", response)
        raise

def extract_all_relevant_entities_from_communities(communities: List[int], llm, folder: str = "community_descriptions") -> List[str]:
    summaries = []

    for i in communities:
        file_path = os.path.join(folder, f"community_{i}.json")
        if os.path.exists(file_path):
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                summaries.append(f"Community {i}: {data.get('summary', '')}")

    summary_text = "\n\n".join(summaries)

    prompt = f"""
        You are an information extraction assistant.

        Given the following summaries from a knowledge graph:

        {summary_text}

        Extract all named entities that appear in these summaries.

        Keep in mind the diffent Types of Entities: Person, Vessel, Organization, Group, Location.

        Dont use other entities.

        Return **only** a valid JSON object like this:

        "entities": ["Entity A", "Entity B", "Entity C"]

        Do not include any explanation, only valid JSON.
    """

    try:
        response = llm(prompt)
        response = clean_json_string(response)

        print(response)
        data = json.loads(response)
        return data.get("entities", [])
    except Exception as e:
        print("Parsing failed:", e)
        return []
    
def generate_full_text_query(input: str) -> str:

    full_text_query = ""
    words = [el for el in remove_lucene_chars(input).split() if el]
    for word in words[:-1]:
        full_text_query += f" {word}~2 AND"
    full_text_query += f" {words[-1]}~2"
    return full_text_query.strip()

def init_neo4j_graph():
    NEO4J_URI = "bolt://" + os.environ.get('DB_HOST') + ":7687"
    NEO4J_USER = "neo4j"
    NEO4J_PASSWORD = os.environ.get('DB_PASSWORD')
    graph = Neo4jGraph(
        url=NEO4J_URI,
        username=NEO4J_USER,
        password=NEO4J_PASSWORD
    )
    graph.query(
        "CREATE FULLTEXT INDEX entity IF NOT EXISTS FOR (n:Entity) ON EACH [n.id]"
    )
    return graph
    
def full_text_search_on_important_entities(query_entities: List[str], relevant_entities: List[str]) -> Dict[Tuple[str, str], List[PathResult]]:
    valid_entities = set(query_entities + relevant_entities)
    result: Dict[Tuple[str, str], List[PathResult]] = defaultdict(list)
    graph = init_neo4j_graph()

    for entity in valid_entities:
        response = graph.query(
            """
            CALL db.index.fulltext.queryNodes('entity', $query, {limit: 2})
            YIELD node AS start_entity
            MATCH path = (start_entity)-[rels*..3]-(end_entity:Entity)
            WHERE all(n IN nodes(path)[1..-1] WHERE NOT n:Entity)
            AND start_entity <> end_entity
            RETURN {
                nodes: [n IN nodes(path) | {
                    id: n.id, 
                    labels: labels(n), 
                    properties: properties(n)
                }],
                relationships: [r IN rels | {
                    type: type(r),
                    source: startNode(r).id,
                    target: endNode(r).id,
                    properties: properties(r)
                }]
            } AS path_data
            """,
            {"query": generate_full_text_query(entity)},
        )

        for record in response:
            path_data = record["path_data"]

            nodes = [
                Node(
                    id=node["id"],
                    labels=node["labels"],
                    properties=node["properties"]
                ) for node in path_data["nodes"]
            ]

            relationships = [
                Relationship(
                    type=rel["type"],
                    source=rel["source"],
                    target=rel["target"],
                    properties=rel["properties"]
                ) for rel in path_data["relationships"]
            ]

            start_node = nodes[0]
            end_node = nodes[-1]

            start_id = start_node.properties.get("id") or start_node.id
            end_id = end_node.properties.get("id") or end_node.id

            if not (start_id in valid_entities and end_id in valid_entities):
                continue

            key = tuple(sorted((start_id, end_id)))

            result[key].append(PathResult(
                nodes=nodes,
                relationships=relationships
            ))

    return result


def describe_path(path: PathResult) -> str:
    nodes = path.nodes
    relationships = path.relationships
    node_map = {node.id: node for node in nodes}

    node_descriptions = []
    for node in nodes:
        label = node.labels[0] if node.labels else "Node"
        name = node.properties.get("name") or node.properties.get("title") or node.id
        props = ", ".join(f"{k}: {v}" for k, v in node.properties.items() if k not in ["name", "title"])
        desc = f"{name} ({label})"
        if props:
            desc += f" [{props}]"
        node_descriptions.append(desc)

    edge_descriptions = []
    for rel in relationships:
        source_node = node_map.get(rel.source)
        target_node = node_map.get(rel.target)

        if source_node and target_node:
            source_name = source_node.properties.get("name") or source_node.id
            target_name = target_node.properties.get("name") or target_node.id
            rel_type = rel.type
            props = ", ".join(f"{k}: {v}" for k, v in rel.properties.items())
            edge_text = f"{source_name} -[{rel_type}]-> {target_name}"
            if props:
                edge_text += f" [{props}]"
            edge_descriptions.append(edge_text)

    full_description = "Nodes:\n" + "\n".join(node_descriptions)
    full_description += "\nRelationships:\n" + "\n".join(edge_descriptions)
    return full_description

def summarize_and_score_paths(paths: List[PathResult], question: str, llm) -> Dict[str, object]:
    path_descriptions = []
    for i, path in enumerate(paths, start=1):
        desc = describe_path(path)
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

    response = llm(prompt)
    response = clean_json_string(response)

    print(response)
    try:
        return json.loads(response)
    except json.JSONDecodeError:
        return {
            "summary": "Could not parse model response.",
            "relevant": False
        }

def retriever(question: str, llm):
    print(f"Search query: {question}")
    entities = extract_all_entities_from_query(question, llm)
    relevant_communities = extract_all_relevant_communities(question, llm)
    relevant_entities = extract_all_relevant_entities_from_communities(relevant_communities, llm)
    paths: Dict[Tuple[str, str], List[PathResult]] = full_text_search_on_important_entities(entities, relevant_entities)

    number_of_paths = len(paths)
    if number_of_paths > 10:
        paths = dict(sorted(paths.items(), key=lambda item: len(item[1]), reverse=True)[:10])
        number_of_paths = 10

    current_path = 1
    overall_calls = 0
    path_summaries = []
    for path_list in paths.values():
        sub_paths = len(path_list)
        overall_calls += 1
        print(f"{current_path}/{number_of_paths}: Subpaths: {sub_paths}")
        path_summary = summarize_and_score_paths(path_list, question, llm)
        if path_summary.get("relevant", False):
            path_summaries.append(path_summary)
        current_path += 1
    print(f"Overall LLM calls: {overall_calls}")

    return paths, path_summaries

def answer_question(question: str, path_summaries: List[Dict[str, object]], llm) -> str:
    summaries_text = "\n".join(
        f"- {summary['summary']}" for summary in path_summaries if "summary" in summary
    )

    prompt = f"""
        You are a helpful assistant working with knowledge graph results.

        The user asked the following question:
        "{question}"

        Based on the following relevant paths from the graph:
        {summaries_text}

        Keep in mind the diffent Types of Entities: Person, Vessel, Organization, Group, and Location.

        And how such diffent Entities interact.

        Please answer the user's question in fluent, informative natural English.

        Only use Information provided in the paths.
    """

    response = llm(prompt)
    return response.strip()


def query_pipeline(question: str, llm):
    paths, path_summaries = retriever(question=question, llm=llm)
    answer = answer_question(question=question, path_summaries=path_summaries, llm=llm)
    return {
        "answer": answer,
        "graph": []
    }

