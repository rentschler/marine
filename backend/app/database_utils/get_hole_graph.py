from typing import Any
from models.Graph import GraphData, Graph, Node, Link, EDefault

async def get_hole_graph(session) -> GraphData:
    nodes_result = await session.run(
        "MATCH (n: Node) RETURN n"
    )
    nodes = []
    async for record in nodes_result:
        n = record["n"]
        node_data = {**n._properties}
        nodes.append(Node(**node_data))

    link_result = await session.run(
        "MATCH (a)-[r]->(b) RETURN r, a, b"
    )
    links = []
    async for record in link_result:
        r = record["r"]
        link_data = {
            "id": r.id,
            "source": record["a"].get("id"),
            "target": record["b"].get("id"),
            "type": r.get("type"),
            "is_inferred": r.get("is_inferred", False)
        }
        links.append(Link(**link_data))
    
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