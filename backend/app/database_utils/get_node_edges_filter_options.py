async def get_node_edges_filter_options(session):
    node_properties = [
        "type", "monitoring_type", "findings", "content", "assessment_type", "results", "movement_type",
        "destination", "enforcement_type", "outcome", "activity_type", "participants", "thing_collected",
        "reference", "date", "time", "friendship_type", "permission_type", "start_date", "end_date",
        "report_type", "submission_date", "jurisdiction_type", "authority_level", "coordination_type",
        "operational_role"
    ]
    result = {}
    for prop in node_properties:
        query = f"MATCH (n) WHERE n.{prop} IS NOT NULL RETURN DISTINCT n.{prop} AS value"
        try:
            records = await session.run(query)
            values = [record["value"] async for record in records]
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