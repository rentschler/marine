from collections import defaultdict
from models.Graph import EDefault, Graph, GraphData, Link, Node
from models.diff_request_body import DiffRequestBody
from datetime import datetime
import networkx as nx


def build_edge_filters(filters: DiffRequestBody) -> str:
    conditions = []
    if filters.edgeTypes:
        type_list = ", ".join(f"'{t}'" for t in filters.edgeTypes)
        conditions.append(f"type(r) IN [{type_list}]")
    return " AND ".join(conditions) if conditions else "true"


def build_community_filter(filters: DiffRequestBody, node_name: str) -> str:
    if not filters.communities or len(filters.communities) == 0:
        return "true"
    community_list = ", ".join(f"'{c}'" for c in filters.communities)
    return f"{node_name}.community IN [{community_list}]"


def build_node_date_filter_range(start: str, end: str) -> str:
    if not start or not end:
        return "true"
    start_date = datetime.fromisoformat(start).isoformat()
    end_date = datetime.fromisoformat(end).isoformat()
    return f"(c.timestamp IS NOT NULL AND c.timestamp >= '{start_date}' AND c.timestamp < '{end_date}')"


async def get_diff_graph(session, filters: DiffRequestBody):
    if filters.startDate and filters.endDate:
        filters.startDateA = filters.startDate
        filters.endDateA = filters.endDate

    print(f"Filters: {filters}")

    nodes_dict = {}

    node_ids = set()
    entity_ids = set()
    event_ids = set()

    # 1. Get all entities (as before)
    entity_query = f"""
        MATCH (n)
        WHERE n.type = "Entity"
        AND {build_community_filter(filters, "n")} 
        WITH n, SIZE([(n)--() | 1]) AS degree
        WHERE degree >= $minDegree AND degree <= $maxDegree
        RETURN DISTINCT n
    """
    records_entities = await session.run(
        entity_query, minDegree=filters.minDegree, maxDegree=filters.maxDegree
    )

    async for record in records_entities:
        n = record["n"]
        node_data = {**n._properties}
        node = Node(**node_data)
        nodes_dict[node.id] = node
        if n.element_id not in node_ids:
            node_ids.add(n.element_id)
            entity_ids.add(n.element_id)

    # 2. Get events for both date ranges
    nodesA, nodesB = dict(), dict()
    if filters.nodeTypes and "Event" in filters.nodeTypes:
        # Date range A
        if filters.startDateA and filters.endDateA:
            date_filter_A = build_node_date_filter_range(
                filters.startDateA, filters.endDateA
            )
            event_query_A = f"""
                MATCH (e)-[]-(c)
                WHERE e.type = "Entity" AND c.type = "Event"
                AND elementId(e) IN $entity_ids
                AND {date_filter_A}
                AND {build_community_filter(filters, "e")}
                AND {build_community_filter(filters, "c")}
                RETURN DISTINCT c
            """
            records_events_A = await session.run(
                event_query_A, entity_ids=list(entity_ids)
            )

            event_count_A = 0
            async for record in records_events_A:
                c = record["c"]
                node_data = {**c._properties}
                node = Node(**node_data)
                nodesA[node.id] = node
                if c.element_id not in node_ids:
                    node_ids.add(c.element_id)
                    event_ids.add(c.element_id)
                    event_count_A += 1

            print(f"Found {event_count_A} events in range A")

        # Date range B
        if filters.startDateB and filters.endDateB:
            date_filter_B = build_node_date_filter_range(
                filters.startDateB, filters.endDateB
            )
            event_query_B = f"""
                MATCH (e)-[]-(c)
                WHERE e.type = "Entity" AND c.type = "Event"
                AND elementId(e) IN $entity_ids
                AND {date_filter_B}
                AND {build_community_filter(filters, "e")}
                AND {build_community_filter(filters, "c")}
                RETURN DISTINCT c
            """
            records_events_B = await session.run(
                event_query_B, entity_ids=list(entity_ids)
            )

            event_count_B = 0
            async for record in records_events_B:
                c = record["c"]
                node_data = {**c._properties}
                node = Node(**node_data)
                nodesB[node.id] = node
                if c.element_id not in node_ids:
                    node_ids.add(c.element_id)
                    event_ids.add(c.element_id)
                    event_count_B += 1

            print(f"Found {event_count_B} events in range B")

    # 3. Merge and annotate nodes
    merged_nodes = {}
    for node_id, node in nodesA.items():
        merged_nodes[node_id] = node
        if filters.startDateB:
            # if the second thime filter does not exist, skip the annotation
            merged_nodes[node_id].subset = "A"
    for node_id, node in nodesB.items():
        if node_id in merged_nodes:
            merged_nodes[node_id].subset = "A∩B"
        else:
            merged_nodes[node_id] = node
            merged_nodes[node_id].subset = "B"

    # 4. Optionally filter by subset
    if filters.subsetFilter and filters.subsetFilter != "A∪B":
        merged_nodes = {
            nid: n
            for nid, n in merged_nodes.items()
            if n.subset == filters.subsetFilter
        }

    # 5. Add entities and relationships if needed (as before)
    # (You may want to add logic to include only entities connected to merged events)
    if filters.nodeTypes and "Relationship" in filters.nodeTypes:
        relationship_query = f"""
            MATCH (c)-[]->(r)
            WHERE c.type = "Event" AND r.type = "Relationship"
            AND elementId(c) IN $event_ids
            AND {build_community_filter(filters, "c")}
            AND {build_community_filter(filters, "r")}
            RETURN DISTINCT r
        """
        records_relationships = await session.run(
            relationship_query, event_ids=list(event_ids)
        )
        async for record in records_relationships:
            r = record["r"]
            node_data = {**r._properties}
            node = Node(**node_data)
            nodes_dict[node.id] = node
            node_ids.add(r.element_id)

    # 6. Collect node IDs for edge filtering
    merged_node_ids = set(merged_nodes.keys())
    print(f"Total merged nodes: {len(merged_node_ids)}")
    # Optionally add entity nodes if you want to show them
    # merged_node_ids.update(entity_ids)

    # 7. Fetch edges where source or target is in merged_node_ids
    links_dict = {}
    connected_node_ids = set()
    
    # 7.1 only return nodes where the timestamp is within the specified range
    if not filters.neighboorNodes:
        if filters.edgeTypes and len(filters.edgeTypes) > 0:
            edge_filter = build_edge_filters(filters)

            edge_query = f"""
                MATCH (a)-[r]->(b)
                WHERE (a.id IN $node_ids AND b.id IN $node_ids) AND ({edge_filter})
                RETURN DISTINCT r, a, b
            """
            link_result = await session.run(edge_query, node_ids=list(merged_node_ids))
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
                    is_inferred=r.get("is_inferred", False),
                )
    # 7.2 return nodes within the specified range, and add their neighbors (to include the enteties not only the event nodes)
    else:
        if filters.edgeTypes and len(filters.edgeTypes) > 0:
            edge_filter = build_edge_filters(filters)

            edge_query = f"""
                MATCH (a)-[r]->(b)
                WHERE (a.id IN $node_ids OR b.id IN $node_ids)
                AND ({edge_filter})
                RETURN DISTINCT r, a, b
            """
            link_result = await session.run(edge_query, node_ids=list(merged_node_ids))
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
                    is_inferred=r.get("is_inferred", False),
                )
                # add node if not already in merged_nodes
                if source_id not in merged_nodes:
                    merged_nodes[source_id] = record["a"]
                elif target_id not in merged_nodes:
                    merged_nodes[target_id] = record["b"]

    # 8. Prepare final node and edge lists
    nodes = list(merged_nodes.values())

    links = list(links_dict.values())

    # get nodes that are connected by links
    for link in links:
        connected_node_ids.add(link.source)
        connected_node_ids.add(link.target)

    # nodes = list(nodes_dict.values())
    # nodes = [node for node in nodes if node.id in connected_node_ids]


    graph_meta = Graph(
        mode="default",
        edge_default=EDefault(),
        node_default=EDefault(),
        name="Knowledge Graph",
    )

    graph = GraphData(
        directed=True,
        multigraph=False,
        graph=graph_meta,
        nodes=nodes,
        links=links,
    )
    return graph
