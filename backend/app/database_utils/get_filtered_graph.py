from collections import defaultdict
from models.Graph import EDefault, Graph, GraphData, Link, Node
from models.filter_request_body import FilterRequestBody
from datetime import datetime
import networkx as nx

def build_edge_filters(filters: FilterRequestBody) -> str:
    conditions = []
    if filters.edgeTypes:
        type_list = ", ".join(f"'{t}'" for t in filters.edgeTypes)
        conditions.append(f"type(r) IN [{type_list}]")
    return " AND ".join(conditions) if conditions else "true"

def build_node_date_filter(filters: FilterRequestBody) -> str:
    if not filters.startDate or not filters.endDate:
        return "true"

    # Parse as local time (no timezone conversion)
    start_date = datetime.fromisoformat(filters.startDate).isoformat()
    end_date = datetime.fromisoformat(filters.endDate).isoformat()

    # Return a clause that can be added to a Cypher WHERE condition
    return f"(c.timestamp IS NOT NULL AND c.timestamp >= '{start_date}' AND c.timestamp < '{end_date}')"

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
        print(event_query)
        records_events = await session.run(event_query, entity_ids=list(entity_ids))

        event_count = 0
        async for record in records_events:
            c = record["c"]
            node_data = {**c._properties}
            node = Node(**node_data)
            nodes_dict[node.id] = node
            if c.element_id not in node_ids:
                node_ids.add(c.element_id)
                event_ids.add(c.element_id)
                event_count += 1

        print(f"Found {event_count} events within the specified time range")

    if filters.nodeTypes and "Relationship" in filters.nodeTypes:
        relationship_query = f"""
            MATCH (c)-[]->(r)
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
    #for link in links:
    #   connected_node_ids.add(link.source)
    #   connected_node_ids.add(link.target)

    #nodes = list(nodes_dict.values())
    #nodes = [node for node in nodes if node.id in connected_node_ids]


    """
    if nodes and links:
        G = nx.DiGraph()
        for node in nodes:
            G.add_node(node.id)
        for link in links:
            G.add_edge(link.source, link.target)
        pos = nx.nx_agraph.graphviz_layout(G, prog="sfdp") 
        pos = nx.rescale_layout_dict(pos)
        for node in nodes:
            if node.id in pos:
                node.x, node.y = pos[node.id]
    """
    # Get nodes with timestamps
    nodes_with_timestamps = [node for node in nodes if hasattr(node, "timestamp") and node.timestamp is not None]

    if nodes_with_timestamps:
        # Convert timestamps to datetime objects
        timestamps = [node.timestamp for node in nodes_with_timestamps]
        min_date = min(timestamps)
        max_date = max(timestamps)

        print(f"Min date in graph: {min_date}")
        print(f"Max date in graph: {max_date}")


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
        links=links,
    )
