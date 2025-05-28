from collections import defaultdict
from models.Graph import EDefault, Graph, GraphData, Link, Node
from models.filter_request_body import FilterRequestBody
from datetime import datetime, timedelta

def build_edge_filters(filters: FilterRequestBody) -> str:
    conditions = []
    if filters.edgeTypes:
        type_list = ", ".join(f"'{t}'" for t in filters.edgeTypes)
        conditions.append(f"r.type IN [{type_list}]")
    return " AND ".join(conditions) if conditions else "true"

def build_node_date_filter(filters: FilterRequestBody) -> str:
    if not filters.startDate or not filters.endDate:
        return "true"
    
    # Convert ISO format dates to datetime objects
    start_date = datetime.fromisoformat(filters.startDate.replace('Z', '+00:00'))
    end_date = datetime.fromisoformat(filters.endDate.replace('Z', '+00:00')) + timedelta(days=1)
    
    # Format dates for Neo4j
    start_str = start_date.strftime('%Y-%m-%dT%H:%M:%S')
    end_str = end_date.strftime('%Y-%m-%dT%H:%M:%S')


    
    return f"(c.timestamp IS NOT NULL AND c.timestamp >= '{start_str}' AND c.timestamp <= '{end_str}')"

async def get_filtered_graph(session, filters: FilterRequestBody):
    nodes_dict = {}

    node_ids = set()
    entity_ids = set()
    event_ids = set()

    # Build date filter condition
    date_filter = build_node_date_filter(filters)
    entity_query = f"""
        MATCH (n)
        WHERE n.type = "Entity"
        WITH n, SIZE([(n)--() | 1]) AS degree
        WHERE degree >= $minDegree AND degree <= $maxDegree
        RETURN DISTINCT n
    """
    records_entities = await session.run(entity_query, minDegree=filters.minDegree, maxDegree=filters.maxDegree)

    async for record in records_entities:
        n = record["n"]
        node_data = {**n._properties}
        node = Node(**node_data)
        nodes_dict[node.id] = node
        if n.element_id not in node_ids:
            node_ids.add(n.element_id)
            entity_ids.add(n.element_id)

    if filters.nodeTypes and "Event" in filters.nodeTypes:
        event_query = f"""
            MATCH (e)-[]-(c)
            WHERE e.type = "Entity" AND c.type = "Event"
            AND elementId(e) IN $entity_ids
            AND {date_filter}
            RETURN DISTINCT c
        """
        records_events = await session.run(event_query, entity_ids=list(entity_ids))
        async for record in records_events:
            c = record["c"]
            node_data = {**c._properties}
            node = Node(**node_data)
            nodes_dict[node.id] = node
            if c.element_id not in node_ids:
                node_ids.add(c.element_id)
                event_ids.add(c.element_id)

    if filters.nodeTypes and "Relationship" in filters.nodeTypes:
        relationship_query = f"""
            MATCH (c)-[]-(r)
            WHERE c.type = "Event" AND r.type = "Relationship"
            AND elementId(c) IN $event_ids
            RETURN DISTINCT r
        """
        records_relationships = await session.run(relationship_query, event_ids=list(event_ids))
        async for record in records_relationships:
            r = record["r"]
            node_data = {**r._properties }
            node = Node(**node_data)
            nodes_dict[node.id] = node
            node_ids.add(r.element_id)
    
    links_dict = {}
    connected_node_ids = set()
    
    if len(filters.edgeTypes) > 0:
        edge_filter = build_edge_filters(filters)

        edge_query = f"""
            MATCH (a)-[r]->(b)
            WHERE elementId(a) IN $node_ids AND elementId(b) IN $node_ids AND ({edge_filter})
            RETURN DISTINCT r, a, b
        """

        link_result = await session.run(edge_query, node_ids=list(node_ids)) 

        async for record in link_result:
            r = record["r"]
            source_id = record["a"].get("id")
            target_id = record["b"].get("id")
            key = (source_id, target_id)

            links_dict[key] = Link(
                id=r.get("id"),
                source=source_id,
                target=target_id,
                type=r.get("type"),
                is_inferred=r.get("is_inferred", False)
            )

    links = list(links_dict.values())

    for link in links:
        connected_node_ids.add(link.source)
        connected_node_ids.add(link.target)

    nodes = list(nodes_dict.values())
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
