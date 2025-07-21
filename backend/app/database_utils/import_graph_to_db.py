import json
import networkx as nx
from database_utils.import_nodes import import_nodes
from database_utils.import_edges import import_edges
from database_utils.import_edges import import_edges
from database_utils.import_communities import import_communities_to_database
from database_utils.update_node_communities import update_node_communities
from networkx.readwrite import json_graph


async def import_graph_to_db(session):
    """
    Loads the MC3 graph from file and imports it into Neo4j.
    Also imports community summaries and updates node attributes.
    """
    try:
        with open('data/MC3_graph.json', 'r') as f:
            json_data = json.load(f)

        G = json_graph.node_link_graph(json_data, directed=True, edges="edges")

        pos = nx.nx_agraph.graphviz_layout(G, prog="sfdp")
        pos = nx.rescale_layout_dict(pos)

        nodes = list(G.nodes(data=True))
        edges = list(G.edges(data=True))

        print("Importing nodes...")
        await import_nodes(session, nodes, pos)

        print("Importing edges...")
        await import_edges(session, edges)

        level = 2
        summaries_path = f"summaries/level_{level}"
        print(f"Importing community summaries from {summaries_path}...")

        imported_count = await import_communities_to_database(session, level, summaries_path)
        print(f"Imported {imported_count} communities.")

        updated_count = await update_node_communities(session, level)
        print(f"Updated {updated_count} nodes with community information.")

    except Exception as e:
        print(f"Error during graph import: {e}")