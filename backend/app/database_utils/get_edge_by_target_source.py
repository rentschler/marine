from models.Graph import Link, Node

async def get_edge_by_source_target(session, source: Node, target: Node) -> Link | None:
    query = """
    MATCH (a)-[r]->(b)
    WHERE a.id = $source_id AND b.id = $target_id
    RETURN type(r) AS type, r AS rel
    """

    result = await session.run(query, source_id=source.id, target_id=target.id)
    record = await result.single()

    if record:
        rel_props = dict(record["rel"]) 
        return Link(
            source=source.id,
            target=target.id,
            label=record["type"],  
            **rel_props
        )
    return None
