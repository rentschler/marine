from typing import List
from models.Graph import Node


async def get_neighbor_entities(session, node: Node) -> List[Node]:
    query = """
    MATCH (n)-[]-(neighbor)
    WHERE n.id = $node_id
    RETURN neighbor
    """

    result = await session.run(query, node_id=node.id)
    neighbors = []

    async for record in result:
        props = dict(record["neighbor"])
        neighbors.append(Node(**props))

    return neighbors
