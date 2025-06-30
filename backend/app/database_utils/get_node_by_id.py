from models.Graph import Node

async def get_node_by_id(session, node_id: str) -> Node:
    query = """
    MATCH (n)
    WHERE n.id = $node_id
    RETURN n
    """
    
    result = await session.run(query, node_id=node_id)
    record = await result.single()
    
    if not record:
        return None 
    
    node = record["n"]
    props = dict(node)
    
    return Node(
        **props
    )

