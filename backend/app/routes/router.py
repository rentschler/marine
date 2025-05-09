import random
from models.Graph import GraphData
from database_utils.get_hole_graph import get_hole_graph
from database_utils.get_node_count import get_node_count_in_db
from database_utils.import_edges import import_edges
from database_utils.import_nodes import import_nodes
from fastapi import APIRouter, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from neo4j import AsyncGraphDatabase
import os

import json
import networkx as nx
from networkx.readwrite import json_graph


# Credentials
NEO4J_URI = "bolt://" + os.environ.get('DB_HOST') + ":7687"
NEO4J_USER = "neo4j"
NEO4J_PASSWORD = os.environ.get('DB_PASSWORD')

router = APIRouter()

@router.on_event("startup")
async def start_up():
    
    
    with open('data/MC3_graph.json', 'r') as f:
        json_data = json.load(f)

    try:
        driver = AsyncGraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
        async with driver.session() as session:
            print("Checking if Graph is already in Db ...")
            node_count = await get_node_count_in_db(session)
            if node_count == 0:
                print("Laoding graph in DB...")
                G = json_graph.node_link_graph(json_data, directed=True, edges="edges")

                pos = nx.forceatlas2_layout(G)
                pos = nx.rescale_layout_dict(pos)

                nodes = list(G.nodes(data=True))
                edges = list(G.edges(data=True))
                await import_nodes(session, nodes, pos)
                await import_edges(session, edges)

            await driver.close()
            print("Database is ready")
    except Exception as e:
        print(f"Error during DB setup: \n {e}")

@router.get("/graph-data")
async def get_graph_data():
    try:
        async with AsyncGraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD)) as driver:
            async with driver.session() as session:
                graph = await get_hole_graph(session)
                return graph.model_dump(exclude_unset=True, exclude_none=True)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error while fetching data from Neo4j: {str(e)}")