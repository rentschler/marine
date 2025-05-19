async def get_node_edges_filter_options(session):
    node_properties = [
        "type", "sub_type"
    ]
    result = {}
    for prop in node_properties:
        query = f"MATCH (n) WHERE n.{prop} IS NOT NULL RETURN DISTINCT n.{prop} AS value"
        try:
            records = await session.run(query)
            values = []
            async for record in records:
                if record["value"] != "Entity":
                    values.append(record["value"])
            result[prop] = sorted(values)
        except Exception as e:
            result[prop] = []
            print(f"Fehler bei Property {prop}: {e}")
    
    edge_query = "MATCH ()-[r]->() WHERE r.type IS NOT NULL RETURN DISTINCT r.type AS type"
    edge_result = await session.run(edge_query)
    edge_types = [record["type"] async for record in edge_result]
    edge_types.append("missing")

    result["edge_types"] = sorted(edge_types)

    return result