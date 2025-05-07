from database_utils.import_edges import flatten_attrs


async def import_nodes(session, nodes, pos):
    print("Importing nodes ...")
    for node_id, node_attrs in nodes:
        node_attrs = flatten_attrs(node_attrs)

        if node_id in pos:
            x, y = pos[node_id]
            node_attrs["x"] = float(x)
            node_attrs["y"] = float(y)

        await session.run(
            """
            MERGE (n:Node {id: $id})
            SET n += $props
            """,
            id=node_id,
            props=node_attrs
        )