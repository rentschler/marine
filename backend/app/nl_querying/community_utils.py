import json
import os
from typing import List, Tuple
import leidenalg
import igraph as ig
import networkx as nx


def detect_communities(graph: nx.Graph):
    nodes = list(graph.nodes())
    edges = list(graph.edges())

    g = ig.Graph()
    g.add_vertices(len(nodes))
    g.vs["name"] = nodes
    g.add_edges(edges)

    partition = leidenalg.find_partition(g, leidenalg.ModularityVertexPartition)

    return [[g.vs[v]['name'] for v in community] for community in partition]

def describe_community(graph: nx.Graph, nodes: List[str]) -> str:
    subgraph = graph.subgraph(nodes)

    node_descriptions = []
    for node_id in subgraph.nodes():
        data = subgraph.nodes[node_id]
        label = data.get("node_type", "Node")
        props = ", ".join(
            f"{k}: {v}" for k, v in data.items() if k not in ["x", "y"]
        )

        desc = f"{label}"
        if props:
            desc += f" [{props}]"
        node_descriptions.append(desc)

    edge_descriptions = []
    for source, target, data in subgraph.edges(data=True):
        source_name = subgraph.nodes[source].get("name") or source
        target_name = subgraph.nodes[target].get("name") or target
        rel_type = data.get("edge_type") or data.get("label") or "related_to"

        props = ", ".join(
            f"{k}: {v}" for k, v in data.items() if k not in ["edge_type", "label"]
        )
        edge_text = f"{source_name} -[{rel_type}]-> {target_name}"
        if props:
            edge_text += f" [{props}]"
        edge_descriptions.append(edge_text)

    description = "Nodes:\n" + "\n".join(node_descriptions)
    description += "\nRelationships:\n" + "\n".join(edge_descriptions)
    return description


def summarize_community_nl(graph: nx.Graph, community_nodes: List[str], llm) -> str:
    description = describe_community(graph, community_nodes)

    prompt = f"""
        You are given a group of related nodes and edges from a knowledge graph.

        Summarize what this group is about in natural language in 4–7 sentences.
        
        Keep in mind the diffent Types of Entities: Person, Vessel, Organization, Group, Location.
        And how such diffent Entities interact.


        Graph Section:
        {description}

        Only respond with a paragraph of natural language. Do not include code or metadata.
    """

    return llm(prompt)


def summarize_all_communities(graph: nx.Graph, llm):
    communities = detect_communities(graph)
    summaries = []

    for i, community in enumerate(communities):
        matched_nodes = []
        for node in community:
            if node in graph.nodes:
                graph.nodes[node]["community"] = i
                matched_nodes.append(node)

        summary = summarize_community_nl(graph, matched_nodes, llm)
        summaries.append((i, summary))

    return graph, summaries


def write_community_descriptions(summaries: List[Tuple[int, str]], folder: str = "community_descriptions"):
    os.makedirs(folder, exist_ok=True)

    for i, summary in summaries:
        file_path = os.path.join(folder, f"community_{i}.json")
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump({
                "community": i,
                "summary": summary
            }, f, ensure_ascii=False, indent=2)

def add_graph_communities(graph: nx.Graph, llm, folder: str = "community_descriptions"):
    graph_with_communities, summaries = summarize_all_communities(graph=graph, llm=llm)
    write_community_descriptions(summaries, folder)
    return graph_with_communities

