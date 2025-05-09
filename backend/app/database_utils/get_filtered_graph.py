from models.Graph import EDefault, Graph, GraphData, Link, Node
from models.filter_request_body import FilterRequestBody

def build_node_filters(filters: FilterRequestBody) -> str:
    conditions = []
    conditions.append("n.type = 'Entity'")

    if filters.showEvents:
        conditions.append("n.type = 'Event'")
    if filters.showRelations:
        conditions.append("n.type = 'Relation'")
    if filters.showEvidenceFor:
        conditions.append("n.type = 'Evidence'")
    if filters.showReceived:
        conditions.append("n.direction = 'received'")
    if filters.showSent:
        conditions.append("n.direction = 'sent'")
    if filters.showNull:
        conditions.append("n.type IS NULL")

    return " OR ".join(conditions) if conditions else "true"

def build_edge_filters(filters: FilterRequestBody) -> str:
    conditions = []

    if filters.showRelations:
        conditions.append("type(r) = 'RELATION'")
    if filters.showSent:
        conditions.append("r.direction = 'sent'")
    if filters.showReceived:
        conditions.append("r.direction = 'received'")
    if filters.showNull:
        conditions.append("r.type IS NULL")

    return " OR ".join(conditions) if conditions else "true"

async def get_filtered_graph(session, filters: FilterRequestBody):
    property_filters = []
    for field, value in filters.dict().items():
        if value is not None and isinstance(value, list):
            cypher_list = "[" + ", ".join(f"'{v}'" for v in value) + "]"
            property_filters.append(f"n.{field} IN {cypher_list}")

    node_type_filter = build_node_filters(filters)
    
    where_clauses = f"({node_type_filter})"
    if property_filters:
        where_clauses += " AND " + " AND ".join(property_filters)
        
    query = f"""
        MATCH (n)
        WITH n, SIZE([(n)--() | 1]) AS degree
        WHERE degree >= $minDegree AND degree <= $maxDegree
        {"AND " + where_clauses if where_clauses else ""}
        RETURN n
    """


    records = await session.run(query, minDegree=filters.minDegree, maxDegree=filters.maxDegree)

    nodes = []
    node_ids = set()
    async for record in records:
        n = record["n"]
        node_data = {**n._properties}
        nodes.append(Node(**node_data))
        node_ids.add(n.id)

    edge_filter = build_edge_filters(filters)
    edge_query = f"""
        MATCH (a)-[r]-(b)
        WHERE id(a) IN $node_ids AND id(b) IN $node_ids AND ({edge_filter})
        RETURN r, a, b
    """
    link_result = await session.run(edge_query, node_ids=list(node_ids))

    links = []
    async for record in link_result:
        r = record["r"]
        link_data = {
            "id": r.id,
            "source": record["a"].get("id"),
            "target": record["b"].get("id"),
            "type": r.get("type"),
            "is_inferred": r.get("is_inferred", False)
        }
        links.append(Link(**link_data))

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
