from models.Graph import GraphData, Node, Link
from collections import defaultdict

def turn_communication_into_edge(graph: GraphData) -> GraphData:
    """
    Simplifies the graph by replacing communication nodes (messages) that connect exactly two entities
    with a single edge between those entities. Removes the communication node and its two edges.
    """
    # Build lookup for nodes and links
    node_dict = {node.id: node for node in graph.nodes}
    links_by_node = defaultdict(list)
    for link in graph.links:
        links_by_node[link.source].append(link)
        links_by_node[link.target].append(link)

    # Identify communication nodes (messages) that connect exactly two entities
    comm_nodes = []
    for node in graph.nodes:
        if node.sub_type == "Communication":
            # Find all edges connected to this node
            connected_links = links_by_node[node.id]
            # Find the two entities connected
            entity_ids = []
            for link in connected_links:
                other_id = link.source if link.target == node.id else link.target
                if node_dict[other_id].type == "Entity":
                    entity_ids.append(other_id)
            if len(entity_ids) == 2:
                comm_nodes.append((node.id, entity_ids[0], entity_ids[1]))
            # print(f"Found communication node {node.id} connecting entities {entity_ids}")

    # Build new nodes and links
    new_nodes = [node for node in graph.nodes if node.sub_type != "Communication"]
    new_links = []
    removed_link_ids = set()
    # Remove links connected to communication nodes, add new entity-entity links
    for comm_id, ent1, ent2 in comm_nodes:
        node = node_dict[comm_id]
        # Remove links connected to comm node
        for link in links_by_node[comm_id]:
            removed_link_ids.add(link.id)
        # Add new edge between entities (avoid duplicates)
        new_links.append(Link(
            id=f"{ent1}_{ent2}_comm",
            source=ent1,
            target=ent2,
            type="Communication",
            is_inferred=True,
            is_collapsed=True,
            message=f"Communication replaced by edge between {ent1} and {ent2}",
            content=node.content
        ))
        print(f"Replacing communication node {comm_id} with edge between {ent1} and {ent2}")
    # Add all other links not removed
    for link in graph.links:
        if link.id not in removed_link_ids:
            new_links.append(link)

    linked_node_ids = {link.source for link in new_links} | {link.target for link in new_links}

    connected_nodes = [node for node in new_nodes if node.id in linked_node_ids]



    # Return new GraphData
    return GraphData(
        directed=graph.directed,
        multigraph=graph.multigraph,
        graph=graph.graph,
        nodes=connected_nodes,
        links=new_links
    )
