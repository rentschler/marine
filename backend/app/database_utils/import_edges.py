async def import_edges(session, edges):
    print("Importing edges ...")
    for u, v, edge_attrs in edges:
        edge_attrs = flatten_attrs(edge_attrs)
        rel_type = edge_attrs.get("type", "MISSING")
        query = f"""
        MATCH (a {{id: $u}}), (b {{id: $v}})
        MERGE (a)-[r:{rel_type}]->(b)
        SET r += $props
        """

        await session.run(
            query,
            u=u,
            v=v,
            props=edge_attrs
        )

def flatten_attrs(attrs):
    flat = {}
    for k, v in attrs.items():
        if isinstance(v, dict):
            flat.update(v)  
        else:
            flat[k] = v
    return flat