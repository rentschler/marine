from models.diff_request_body import TimestampRequestBody
from models.Graph import GraphData, Graph, Node, Link, EDefault


def build_community_filter(request: TimestampRequestBody, node_name: str) -> str:
    if not request.communities or len(request.communities) == 0:
        return "true"
    community_list = ", ".join(f"'{c}'" for c in request.communities)
    return f"{node_name}.community IN [{community_list}]"


async def get_graph_with_timestamps(
    session, request: TimestampRequestBody
) -> GraphData:

    community_filter = build_community_filter(request, "n")
    nodes_result = await session.run(
        f"""MATCH (n)
        WHERE n.timestamp IS NOT NULL
        AND {community_filter}
        RETURN n"""
    )
    nodes = []
    async for record in nodes_result:
        n = record["n"]
        node_data = {**n._properties}
        nodes.append(Node(**node_data))

    graph_meta = Graph(
        mode="default",
        edge_default=EDefault(),
        node_default=EDefault(),
        name="Knowledge Graph",
    )

    return GraphData(
        directed=True, multigraph=False, graph=graph_meta, nodes=nodes, links=[]
    )
