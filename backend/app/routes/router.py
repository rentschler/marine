from nl_querying.query_service import QueryService
from nl_querying.indexing_service import IndexingService
from nl_querying.init_llm import LLM
from database_utils.get_filtered_graph import get_filtered_graph
from models.filter_request_body import FilterRequestBody
from database_utils.get_node_edges_filter_options import get_node_edges_filter_options
from database_utils.get_min_max_node_degree import get_min_max_node_degree
from database_utils.get_hole_graph import get_hole_graph
from database_utils.get_node_count import get_node_count_in_db
from database_utils.import_edges import import_edges
from database_utils.import_nodes import import_nodes
from database_utils.get_min_max_date import get_min_max_date
from database_utils.get_graph_with_timestamps import get_graph_with_timestamps
from fastapi import APIRouter, HTTPException, WebSocket
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
llm = LLM(model= "phi4:latest")
# services
indexing_service = IndexingService(llm=llm)
query_service = QueryService(llm=llm)

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
                G = await indexing_service.add_graph_communities(graph=G)

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
                dates = await get_min_max_date(session)
                return {**degrees, **types, **dates}
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

@router.get("/graph-data-timestamps")
async def graph_with_timestamps():
    try:
        async with AsyncGraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD)) as driver:
            async with driver.session() as session:
                graph = await get_graph_with_timestamps(session)
                return graph.model_dump(exclude_unset=True, exclude_none=True)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/graph-data-timestamps")
async def graph_with_timestamps():
    try:
        async with AsyncGraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD)) as driver:
            async with driver.session() as session:
                graph = await get_graph_with_timestamps(session)
                return graph.model_dump(exclude_unset=True, exclude_none=True)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.websocket("/ws/nl-query")
async def websocket_nl_query(websocket: WebSocket):
    await websocket.accept()
    try:
        question = await websocket.receive_text()
        await websocket.send_text("Received question...")

        result = await query_service.pipeline_reporter(question=question, websocket=websocket)

        await websocket.send_text(json.dumps(result, default=str))
    except Exception as e:
        print("Error in WebSocket:", e)
        await websocket.send_text(json.dumps({
            "answer": "An error occurred. Please try again or enter a new query."
        }))
        await websocket.close()

