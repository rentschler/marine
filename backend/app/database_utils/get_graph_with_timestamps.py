from models.Graph import GraphData, Graph, Node, Link, EDefault

async def get_graph_with_timestamps(session) -> GraphData:
    nodes_result = await session.run(
        """MATCH (n)     
        WHERE n.timestamp IS NOT NULL
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
        name="Knowledge Graph"
    )

    return GraphData(
        directed=True,
        multigraph=False,
        graph=graph_meta,
        nodes=nodes,
        links=[]
    )