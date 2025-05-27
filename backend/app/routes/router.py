import random
from nl_querying.query_utils import query_pipeline
from nl_querying.community_utils import add_graph_communities
from database_utils.get_filtered_graph import get_filtered_graph
from models.filter_request_body import FilterRequestBody
from database_utils.get_node_edges_filter_options import get_node_edges_filter_options
from database_utils.get_min_max_node_degree import get_min_max_node_degree
from models.Graph import GraphData
from database_utils.get_hole_graph import get_hole_graph
from database_utils.get_node_count import get_node_count_in_db
from database_utils.import_edges import import_edges
from database_utils.import_nodes import import_nodes
from fastapi import APIRouter, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from neo4j import AsyncGraphDatabase
import os
from langchain_ollama import OllamaLLM


import json
import networkx as nx
from networkx.readwrite import json_graph


# Credentials
NEO4J_URI = "bolt://" + os.environ.get('DB_HOST') + ":7687"
NEO4J_USER = "neo4j"
NEO4J_PASSWORD = os.environ.get('DB_PASSWORD')

# LLM
llm = OllamaLLM(
            model="llama3.1",
            base_url="https://ollama.joos.dbvis.de",
        )

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
                G = add_graph_communities(graph=G, llm=llm)

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
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/options")
async def get_options():
    try:
        async with AsyncGraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD)) as driver:
            async with driver.session() as session:
                degrees = await get_min_max_node_degree(session)
                types = await get_node_edges_filter_options(session)
                return {**degrees, **types}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.post("/filter")
async def filter_graph(request: FilterRequestBody):
    try:
        async with AsyncGraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD)) as driver:
            async with driver.session() as session:
                graph = await get_filtered_graph(session, request)
                return graph.model_dump(exclude_unset=True, exclude_none=True)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/nl-query")
async def nl_query(question: str):
    return query_pipeline(question, llm)