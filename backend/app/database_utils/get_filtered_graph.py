from collections import defaultdict
from models.Graph import EDefault, Graph, GraphData, Link, Node
from models.filter_request_body import FilterRequestBody

def build_edge_filters(filters: FilterRequestBody) -> str:
    conditions = []
    if filters.edgeTypes:
        type_list = ", ".join(f"'{t}'" for t in filters.edgeTypes)
        conditions.append(f"r.type IN [{type_list}]")
    return " AND ".join(conditions) if conditions else "true"

async def get_filtered_graph(session, filters: FilterRequestBody):
    nodes = []
    node_ids = set()
    entity_ids = set()
    event_ids = set()

    entity_query = """
        MATCH (n)
        WHERE n.type = "Entity"
        WITH n, SIZE([(n)--() | 1]) AS degree
        WHERE degree >= $minDegree AND degree <= $maxDegree
        RETURN n
    """
    records_entities = await session.run(entity_query, minDegree=filters.minDegree, maxDegree=filters.maxDegree)

    async for record in records_entities:
        n = record["n"]
        if n.element_id not in node_ids:
            node_ids.add(n.element_id)
            entity_ids.add(n.element_id)
            node_data = {**n._properties}
            nodes.append(Node(**node_data))

    if filters.nodeTypes and "Event" in filters.nodeTypes:
        event_query = """
            MATCH (e)-[]-(c)
            WHERE e.type = "Entity" AND c.type = "Event"
            AND elementId(e) IN $entity_ids
            RETURN DISTINCT c
        """
        records_events = await session.run(event_query, entity_ids=list(entity_ids))
        async for record in records_events:
            c = record["c"]
            if c.element_id not in event_ids:
                event_ids.add(c.element_id)
                node_data = {**c._properties}
                nodes.append(Node(**node_data))
                node_ids.add(c.element_id)

    if filters.nodeTypes and "Relationship" in filters.nodeTypes:
        relationship_query = """
            MATCH (c)-[]-(r)
            WHERE c.type = "Event" AND r.type = "Relationship"
            AND elementId(c) IN $event_ids
            RETURN DISTINCT r
        """
        records_relationships = await session.run(relationship_query, event_ids=list(event_ids))
        async for record in records_relationships:
            r = record["r"]
            node_data = {**r._properties }
            nodes.append(Node(**node_data))
            node_ids.add(r.element_id)
    
    links = []
    edge_counter = defaultdict(list) 
    connected_node_ids = set()
    
    if len(filters.edgeTypes) > 0:
        edge_filter = build_edge_filters(filters)

        edge_query = f"""
            MATCH (a)-[r]->(b)
            WHERE elementId(a) IN $node_ids AND elementId(b) IN $node_ids AND ({edge_filter})
            RETURN r, a, b
        """

        link_result = await session.run(edge_query, node_ids=list(node_ids)) 

        async for record in link_result:
            r = record["r"]
            source_id = record["a"].get("id")
            target_id = record["b"].get("id")

            key = frozenset({source_id, target_id})
            edge_counter[key].append(r.get("type"))

            link_data = {
                "id": r.get("id"),
                "source": source_id,
                "target": target_id,
                "type": r.get("type"),
                "is_inferred": r.get("is_inferred", False)
            }
            links.append(Link(**link_data))

        for key, edge_types in edge_counter.items():
            if len(edge_types) > 1:
                node_a, node_b = tuple(key)
                print(f"Multiple edges between nodes {node_a} and {node_b}: {edge_types}")

    if "Event" in filters.nodeTypes:
        for link in links:
            connected_node_ids.add(link.source)
            connected_node_ids.add(link.target)

        nodes = [node for node in nodes if node.id in connected_node_ids]


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
        links=links
    )
