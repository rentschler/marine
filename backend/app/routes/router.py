from database_utils.turn_communication_into_edge import turn_communication_into_edge
from models.Graph import Node
from nl_querying.query_service import QueryService
from nl_querying.indexing_service import IndexingService
from nl_querying.init_llm import LLM
from database_utils.get_filtered_graph import get_filtered_graph
from database_utils.get_diff_graph import get_diff_graph
from models.diff_request_body import DiffRequestBody
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
                #G = await indexing_service.add_graph_communities(graph=G)

                pos = nx.nx_agraph.graphviz_layout(G, prog="sfdp") 
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
                if request.collapseComms:
                    print("Collapsing communication nodes into edges...")
                    graph = turn_communication_into_edge(graph)
                return graph.model_dump(exclude_unset=True, exclude_none=True)

    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))
    
    
@router.post("/diff")
async def diff_graph(request: DiffRequestBody):
    try:
        async with AsyncGraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD)) as driver:
            async with driver.session() as session:
                graph = await get_diff_graph(session, request)
                if request.collapseComms:
                    print("Collapsing communication nodes into edges...")
                    graph = turn_communication_into_edge(graph)
                return graph.model_dump(exclude_unset=True, exclude_none=True)

    except Exception as e:
        print(e)
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

# @router.get("/graph-data-timestamps")
# async def graph_with_timestamps():
#     try:
#         async with AsyncGraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD)) as driver:
#             async with driver.session() as session:
#                 graph = await get_graph_with_timestamps(session)
#                 return graph.model_dump(exclude_unset=True, exclude_none=True)
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

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

@router.get("/test/")
async def test_node_desc():
    try:
        async with AsyncGraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD)) as driver:
            async with driver.session() as session:
                all_entity_query = """
                    MATCH (e:Entity)
                    RETURN e
                    """

                result = await session.run(all_entity_query)

                entities = []

                async for record in result:
                    e = record["e"]
                    node_data = {**e._properties}
                    entity_node = Node(**node_data)

                    get_communications_query = """
                        MATCH (e:Entity {id: $entity_id})

                        /* Outgoing Communications */
                        OPTIONAL MATCH (e)-[:sent]->(outgoing:Event {sub_type: 'Communication'})-[:received]->(receiver:Entity)

                        /* Incoming Communications */
                        OPTIONAL MATCH (sender:Entity)-[:sent]->(incoming:Event {sub_type: 'Communication'})-[:received]->(e)

                        RETURN 
                            collect(DISTINCT {
                                comm: outgoing,
                                receiver: receiver
                            }) AS outgoing_communications,
                            
                            collect(DISTINCT {
                                comm: incoming,
                                sender: sender
                            }) AS incoming_communications
                    """
                    communications_result = await session.run(get_communications_query, {"entity_id": e["id"]})
                    communications_record = await communications_result.single()

                    # Outgoing Communications
                    outgoing_communications = []
                    for comm_entry in communications_record["outgoing_communications"]:
                        comm_node = comm_entry["comm"]
                        receiver_node = comm_entry["receiver"]
                        if comm_node and receiver_node:
                            comm_data = {**comm_node._properties}
                            receiver_data = {**receiver_node._properties}
                            outgoing_communications.append({
                                "path": {
                                    "sender":e["id"],
                                    "communication_id": comm_data["id"],
                                    "message": comm_data["content"],
                                    "receiver": receiver_data["id"]
                                }
                            })

                    # Incoming Communications
                    incoming_communications = []
                    for comm_entry in communications_record["incoming_communications"]:
                        comm_node = comm_entry["comm"]
                        sender_node = comm_entry["sender"]
                        if comm_node and sender_node:
                            comm_data = {**comm_node._properties}
                            sender_data = {**sender_node._properties}
                            incoming_communications.append({
                                "path": {
                                    "sender": sender_data["id"],
                                    "communication_id": comm_data["id"],
                                    "message": comm_data["content"],
                                    "receiver": e["id"]  
                                }
                            })

                    get_events_query = """
                        MATCH (e:Entity {id: $entity_id})

                       OPTIONAL MATCH (e)-[]->(outgoing:Event)-[]-(e2:Entity)
                        WHERE outgoing.sub_type <> 'Communication'

                        /* Incoming Events */
                        OPTIONAL MATCH (e3:Entity)-[]-(incoming:Event)-[]->(e)
                        WHERE incoming.sub_type <> 'Communication'

                        RETURN 
                            collect(DISTINCT {
                                event: outgoing,
                                entity: e2
                            }) AS outgoing_events,
                            
                            collect(DISTINCT {
                                event: incoming,
                                entity: e3
                            }) AS incoming_events
                    """
                    events_result = await session.run(get_events_query, {"entity_id": e["id"]})
                    events_record = await events_result.single()

                    outgoing_events = []
                    for event in events_record["outgoing_events"]:
                        event_node = event["event"]
                        entity = event["entity"]
                        if entity and event_node:
                            event_data = {**event_node._properties}
                            entity_event_data = {**entity._properties}
                            outgoing_events.append({
                                "path": {
                                    "entity":e["id"],
                                    "event_id": event_data["id"],
                                    "involved_entity": entity_event_data["id"]
                                }
                            })
                    incoming_events = []
                    for event in events_record["incoming_events"]:
                        event_node = event["event"]
                        entity = event["entity"]
                        if entity and event_node:
                            event_data = {**event_node._properties}
                            entity_event_data = {**entity._properties}
                            incoming_events.append({
                                "path": {
                                    "entity":e["id"],
                                    "event_id": event_data["id"],
                                    "involved_entity": entity_event_data["id"]
                                }
                            })

                    get_relationships_query = """
                    MATCH (e:Entity {id: $entity_id})

                    /* Outgoing */
                    OPTIONAL MATCH (e)-[]->(r:Relationship)-[]->(target:Entity)

                    /* Incoming */
                    OPTIONAL MATCH (source:Entity)-[]->(r2:Relationship)-[]->(e)

                    /* Third */
                    OPTIONAL MATCH (e2:Entity)-[]->(r3:Relationship)<-[]-(e)

                    RETURN 
                        collect(DISTINCT {direction: 'outgoing', relationship: r, related_entity: target}) AS outgoing_relationships,
                        collect(DISTINCT {direction: 'incoming', relationship: r2, related_entity: source}) AS incoming_relationships,
                        collect(DISTINCT {direction: 'third', relationship: r3, related_entity: e2}) AS third_relationships
                    """

                    relationships_result = await session.run(get_relationships_query, {"entity_id": e["id"]})
                    record = await relationships_result.single()
                    relationships = []

                    # Outgoing
                    for item in record.get("outgoing_relationships", []):
                        rel_node = item.get("relationship")
                        entity_node_rel = item.get("related_entity")
                        if rel_node and entity_node_rel and hasattr(rel_node, '_properties') and hasattr(entity_node_rel, '_properties'):
                            rel_data = {**rel_node._properties}
                            entity_data_rel = {**entity_node_rel._properties}
                            relationships.append({
                                "direction": "outgoing",
                                "relationship": Node(**rel_data).model_dump(exclude_unset=True, exclude_none=True),
                                "related_entity": Node(**entity_data_rel).model_dump(exclude_unset=True, exclude_none=True)
                            })

                    # Incoming
                    for item in record.get("incoming_relationships", []):
                        if item:
                            rel_node = item.get("relationship")
                            entity_node_rel = item.get("related_entity")
                            if rel_node and entity_node_rel and hasattr(rel_node, '_properties') and hasattr(entity_node_rel, '_properties'):
                                rel_data = {**rel_node._properties}
                                entity_data_rel = {**entity_node_rel._properties}
                                relationships.append({
                                    "direction": "incoming",
                                    "relationship": Node(**rel_data).model_dump(exclude_unset=True, exclude_none=True),
                                    "related_entity": Node(**entity_data_rel).model_dump(exclude_unset=True, exclude_none=True)
                                })

                    # Third
                    for item in record.get("third_relationships", []):
                        if item:
                            rel_node = item.get("relationship")
                            entity_node_rel = item.get("related_entity")
                            if rel_node and entity_node_rel and hasattr(rel_node, '_properties') and hasattr(entity_node_rel, '_properties'):
                                rel_data = {**rel_node._properties}
                                entity_data_rel = {**entity_node_rel._properties}
                                relationships.append({
                                    "direction": "third",
                                    "relationship": Node(**rel_data).model_dump(exclude_unset=True, exclude_none=True),
                                    "related_entity": Node(**entity_data_rel).model_dump(exclude_unset=True, exclude_none=True)
                                })

                    entities.append({
                        "entity": entity_node.id,
                        "sub_type": entity_node.sub_type,
                        "relationships": relationships,
                        "outgoing_communications": outgoing_communications,
                        "incoming_communications": incoming_communications,
                        "outgoing_events": outgoing_events,
                        "incoming_events": incoming_events
                    })
        return entities

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

