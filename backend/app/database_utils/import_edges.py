async def import_edges(session, edges):
    print("Importing edges ...")
    for u, v, edge_attrs in edges:
        edge_attrs = flatten_attrs(edge_attrs)
        await session.run(
            """
            MATCH (a:Node {id: $u}), (b:Node {id: $v})
            MERGE (a)-[r:RELATED]->(b)
            SET r += $props
            """,
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