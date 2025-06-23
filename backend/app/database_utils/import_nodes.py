from database_utils.import_edges import flatten_attrs
from database_utils.import_edges import convert_selected_dates

async def import_nodes(session, nodes, pos):
    print("Importing nodes ...")
    for node_id, node_attrs in nodes:
        node_attrs = flatten_attrs(node_attrs)
        node_attrs = convert_selected_dates(node_attrs)

        if node_id in pos:
            x, y = pos[node_id]
            node_attrs["x"] = float(x)
            node_attrs["y"] = float(y)

        node_type = node_attrs.get("type", "Node")  

        cypher_query = f"""
            MERGE (n:{node_type} {{id: $id}})
            SET n += $props
        """

        await session.run(
            cypher_query,
            id=node_id,
            props=node_attrs
        )
