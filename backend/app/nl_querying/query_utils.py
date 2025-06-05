from typing import Dict, List, Tuple
from pydantic import BaseModel, Field
from langchain_neo4j.vectorstores.neo4j_vector import remove_lucene_chars

from models.Graph import EDefault, Graph, GraphData, Link, Node


class Entities(BaseModel):
    """
    Pydantic model representing a list of entities extracted from user queries.
    
    Attributes:
        entities (List[str]): A list of person names, locations, or other named entities.
    """
    entities: List[str] = Field(
        ...,
        description="All the persons and locations that appear in the database"
    )


class PathResult(BaseModel):
    """
    Pydantic model representing a single result path from a knowledge graph query.
    
    Attributes:
        nodes (List[Node]): The nodes involved in the path.
        relationships (List[Link]): The relationships connecting the nodes.
    """
    nodes: List[Node]
    relationships: List[Link]


def clean_json_string(dirty_string: str) -> str:
    """
    Cleans a JSON string returned by an LLM (or similar source) by removing unwanted 
    formatting artifacts like Markdown code blocks and language tags.
    
    Args:
        dirty_string (str): The raw JSON string to be cleaned.
    
    Returns:
        str: The cleaned JSON string, ready for parsing.
    """
    dirty_string = dirty_string.replace('json', '', 1).strip()
    dirty_string = dirty_string.replace('```', '', 1).strip()
    dirty_string = dirty_string.replace('```', '', 1).strip()
    return dirty_string


def generate_full_text_query(input: str) -> str:
    """
    Generates a fuzzy full-text search query for a Neo4j index from a user input.
    
    This function splits the input into words, applies fuzzy search (~2) for each word,
    and concatenates them with AND operators.
    
    Args:
        input (str): The user input string.
    
    Returns:
        str: The Lucene-compatible full-text search query string.
    """
    full_text_query = ""
    words = [el for el in remove_lucene_chars(input).split() if el]
    for word in words[:-1]:
        full_text_query += f" {word}~2 AND"
    full_text_query += f" {words[-1]}~2"
    return full_text_query.strip()


def construct_answer_graph(
    paths: Dict[Tuple[str, str], List[PathResult]]
) -> GraphData:
    """
    Constructs a merged answer graph from a dictionary of path results.
    
    Deduplicates nodes and relationships to produce a clean GraphData object suitable
    for visualization or further processing.
    
    Args:
        paths (Dict[Tuple[str, str], List[PathResult]]): A dictionary mapping pairs of node IDs
            (start, end) to a list of PathResult objects.
    
    Returns:
        GraphData: A fully constructed graph containing deduplicated nodes and links.
    """
    node_map = {}
    links_map = {}

    for path_list in paths.values():
        for path in path_list:
            # Add nodes to the node_map if not already present
            for node in path.nodes:
                if node.id not in node_map:
                    node_map[node.id] = node
            # Add links to the links_map, using a sorted tuple key to avoid duplicates
            for link in path.relationships:
                key = tuple(sorted([link.source, link.target]))
                links_map[key] = link

    nodes = list(node_map.values())
    links = list(links_map.values())

    graph_meta = Graph(
        mode="default",  
        edge_default=EDefault(),
        node_default=EDefault(),
        name="Knowledge Graph"
    )

    return GraphData(
        directed=True,
        multigraph=False,
        graph=graph_meta,
        nodes=nodes,
        links=links
    )

def describe_node(node: dict) -> str:
    node_type = node.get("sub_type", "Node")
    node_id = node.get("id", "UnknownID")
    props = ", ".join(f"{k}: {v}" for k, v in node.items() if k not in ["x", "y", "sub_type"])
    desc = f"{node_type}({node_id})"
    if props:
        desc += f" [{props}]"
    return desc

def describe_edge(source: str, target: str, edge: dict) -> str:
    rel_type = edge.get("edge_type") or edge.get("label", "MISSING")
    props = ", ".join(f"{k}: {v}" for k, v in edge.items() if k not in ["edge_type", "label", "source", "target", "id"])
    desc = f"{source} -[{rel_type}]-> {target}"
    if props:
        desc += f" [{props}]"
    return desc

def estimate_tokens( text: str) -> int:
    return len(text) // 4

def _community_id(community_nodes: List) -> str:
    """Generates a unique ID for a community based on sorted node IDs."""
    if all(isinstance(node, str) for node in community_nodes):
        return "_".join(sorted(community_nodes))
    else:
        nested_ids = [_community_id(sub) for sub in community_nodes]
        return "_".join(sorted(nested_ids))

def _flatten_nodes(community_structure: List) -> List[str]:
    """Recursively flattens a hierarchical community structure to a list of node IDs."""
    flat_nodes = []
    for item in community_structure:
        if isinstance(item, str):
            flat_nodes.append(item)
        else:
            flat_nodes.extend(_flatten_nodes(item))
    return flat_nodes