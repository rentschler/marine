from nl_querying.querying.reduce_to_global_answer.final_answer_parser import FinalAnswerParser
from typing import List
from retriver.knowleadge_graph_retriver import KnowleadgeGraphRetriver
from nl_querying.querying.reduce_to_global_answer.final_answer_parser import FinalAnswerParser
from database_utils.turn_communication_into_edge import turn_communication_into_edge
from nl_querying.querying.reduce_to_global_answer.final_answer_reducer import FinalAnswerReducer
from nl_querying.querying.intermidate_answer_generator.intermidate_answer_generator import IntermidateAnswerGenerator
from nl_querying.querying.prepare_community_summaries.community_summary_loader import CommunitySummaryLoader
from nl_querying.indexing.indexing_service import IndexingService3
from models.Graph import Node
from nl_querying.query_service import QueryService
from nl_querying.indexing_service import IndexingService
from nl_querying.utils.llm.llm import LLM
from database_utils.get_filtered_graph import get_filtered_graph
from database_utils.get_diff_graph import get_diff_graph
from models.diff_request_body import DiffRequestBody
from models.filter_request_body import FilterRequestBody
from models.message import Message, MessageType
from database_utils.get_node_edges_filter_options import get_node_edges_filter_options
from database_utils.get_min_max_node_degree import get_min_max_node_degree
from database_utils.get_hole_graph import get_hole_graph
from database_utils.get_node_count import get_node_count_in_db
from database_utils.import_edges import import_edges
from database_utils.import_nodes import import_nodes
from database_utils.get_min_max_date import get_min_max_date
from database_utils.get_graph_with_timestamps import get_graph_with_timestamps
from database_utils.update_node_communities import update_node_communities
from database_utils.import_communities import (
    import_communities_to_database,
    get_communities_with_nodes,
    get_community_by_title,
    get_nodes_by_community,
    delete_communities,
    get_community_connections,
    get_community_connections_by_title,
    get_community_graph
)
from fastapi import APIRouter, HTTPException, WebSocket
from fastapi.responses import HTMLResponse, JSONResponse
from neo4j import AsyncGraphDatabase
import os
from langchain_ollama import OllamaLLM


import json
import networkx as nx
from networkx.readwrite import json_graph

# Credentials
DB_HOST = os.environ.get('DB_HOST')
DB_PASSWORD = os.environ.get('DB_PASSWORD')

if not DB_HOST:
    raise ValueError("DB_HOST environment variable is not set")
if not DB_PASSWORD:
    raise ValueError("DB_PASSWORD environment variable is not set")

NEO4J_URI = f"bolt://{DB_HOST}:7687"
NEO4J_USER = "neo4j"
NEO4J_PASSWORD = DB_PASSWORD

# LLM
llm = LLM(model= "phi4:latest")

# services
indexing_service = IndexingService(llm=llm)
indexing_service3 = IndexingService3(llm=llm)
query_service = QueryService(llm=llm)

#Message-Cache
message_cache: List[Message] = []

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

                # read communities from file and load communities summaries into db
                level = 2
                summaries_path = f"summaries/level_{level}"
                imported_count = await import_communities_to_database(session, level, summaries_path)
                print(f"Successfully imported {imported_count} communities to database")

                # read communities from db and update nodes with community information
                updated_count = await update_node_communities(session, level)
                print(f"Successfully updated {updated_count} nodes with community information from level {level}")

            await driver.close()
            print("Database is ready")
    except Exception as e:
        print(f"Error during DB setup: \n {e}")

@router.get("/get-cached-messages")
async def get_cached_messages():
    return message_cache

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
        message_cache.append(Message(
            type = MessageType.User,
            content = question
        ))
        await websocket.send_text("Received question...")
        async with AsyncGraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD)) as driver:
            kr = KnowleadgeGraphRetriver(llm=llm, index_summary_path="retriver/index/retriever_summary.json", driver=driver)
            answer = await kr.reducer_pipeline_reporter(ws=websocket, question=question)
            result = answer.model_dump(exclude_unset=True, exclude_none=True)
            message_cache.append(Message(
                type = MessageType.System,
                content = result
            ))

        await websocket.send_text(json.dumps(result, default=str))
    except Exception as e:
        print("Error in WebSocket:", e)
        message_cache.append(Message(
                type = MessageType.System,
                content = "result"
            ))
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
    
@router.post("/test_indexing")
async def index():
    try:
        # 1. Graph laden
        if not os.path.exists('data/MC3_graph.json'):
            raise HTTPException(status_code=404, detail="Graph file not found")
            
        with open('data/MC3_graph.json', 'r') as f:
            json_data = json.load(f)
        print("Loading Graph")
        nodes = json_data["nodes"]
        edges = json_data["edges"]
        G = nx.Graph()

        for node in nodes:
            node_id = node["id"]
            attrs = {k: v for k, v in node.items() if k != "id"}
            G.add_node(node_id, **attrs)

        for edge in edges:
            source = edge["source"]
            target = edge["target"]
            if source in G.nodes and target in G.nodes:
                attrs = {k: v for k, v in edge.items() if k not in ["source", "target"]}
                G.add_edge(source, target, **attrs)
        
        print(G)
        print("Indexing")
        result = await indexing_service3.index(graph=G)
        
        return {
            "status": "success",
            "communities_detected": len(result["communities"]),
            "summaries_generated": len(result["summaries"]),
        }
        
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON format")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.post("/test-query")
async def test_query(question: str):
    async with AsyncGraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD)) as driver:
        kr = KnowleadgeGraphRetriver(llm=llm, index_summary_path="retriver/index/retriever_summary.json", driver=driver)
        qp =  await kr.extract_query_params_from_question(question=question)
        print(qp)
        sub_graphs =  await kr.query_subgraph(query_params=qp)
        sub_graphs_descs=  await kr.anaylse_subgraphs(question=question, sub_graphs=sub_graphs)
        return await kr.get_final_answer(question=question, sub_graph_desctiptions=sub_graphs_descs)


@router.post("/update-database-communities")
async def update_database_communities(level: int = 2):
    """
    Update all nodes in the database with their community information from the specified level.
    This will read the community summaries from summaries/level_{level} and update each node
    with a 'community' attribute containing the community title.
    """
    try:
        async with AsyncGraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD)) as driver:
            async with driver.session() as session:
                updated_count = await update_node_communities(session, level)
                return {
                    "status": "success",
                    "message": f"Successfully updated {updated_count} nodes with community information from level {level}",
                    "updated_count": updated_count
                }
    except Exception as e:
        print(f"Error updating database with community information: {e}")
        raise HTTPException(status_code=500, detail=f"Error updating database: {str(e)}")


@router.post("/import-communities")
async def import_communities(level: int = 2):
    """
    Import level 2 communities into the database with proper graph structure.
    This creates Community nodes, Finding nodes, and relationships between them.
    """
    summaries_path = f"summaries/level_{level}"
    try:
        async with AsyncGraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD)) as driver:
            async with driver.session() as session:
                imported_count = await import_communities_to_database(session, level, summaries_path)
                return {
                    "status": "success",
                    "message": f"Successfully imported {imported_count} communities to database",
                    "imported_count": imported_count
                }
    except Exception as e:
        print(f"Error importing communities: {e}")
        raise HTTPException(status_code=500, detail=f"Error importing communities: {str(e)}")


@router.get("/communities")
async def get_communities(level: int = 2):
    """
    Retrieve all communities with their findings and nodes.
    """
    try:
        async with AsyncGraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD)) as driver:
            async with driver.session() as session:
                communities = await get_communities_with_nodes(session, level)
                return JSONResponse(content=communities)
    except Exception as e:
        print(f"Error fetching communities: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching communities: {str(e)}")


@router.get("/communities/{title}")
async def get_community(title: str, level: int = 2):
    """
    Retrieve a specific community by title.
    """
    try:
        async with AsyncGraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD)) as driver:
            async with driver.session() as session:
                community = await get_community_by_title(session, title, level)
                if community:
                    return JSONResponse(content=community)
                else:
                    raise HTTPException(status_code=404, detail=f"Community '{title}' not found")
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching community: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching community: {str(e)}")


@router.get("/communities/{title}/nodes")
async def get_community_nodes(title: str, level: int = 2):
    """
    Get all nodes that belong to a specific community.
    """
    try:
        async with AsyncGraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD)) as driver:
            async with driver.session() as session:
                nodes = await get_nodes_by_community(session, title, level)
                return JSONResponse(content=nodes)
    except Exception as e:
        print(f"Error fetching community nodes: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching community nodes: {str(e)}")


@router.delete("/communities")
async def delete_communities_endpoint(level: int = 2):
    """
    Delete all communities and their findings for a specific level.
    """
    try:
        async with AsyncGraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD)) as driver:
            async with driver.session() as session:
                deleted_count = await delete_communities(session, level)
                return {
                    "status": "success",
                    "message": f"Successfully deleted {deleted_count} community nodes",
                    "deleted_count": deleted_count
                }
    except Exception as e:
        print(f"Error deleting communities: {e}")
        raise HTTPException(status_code=500, detail=f"Error deleting communities: {str(e)}")


@router.get("/community-connections")
async def get_community_connections_endpoint(level: int = 2):
    """
    Get all community connections for a specific level.
    """
    try:
        async with AsyncGraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD)) as driver:
            async with driver.session() as session:
                connections = await get_community_connections(session, level)
                return JSONResponse(content=connections)
    except Exception as e:
        print(f"Error fetching community connections: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching community connections: {str(e)}")


@router.get("/community-connections/{title}")
async def get_community_connections_by_title_endpoint(title: str, level: int = 2):
    """
    Get all connections for a specific community.
    """
    try:
        async with AsyncGraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD)) as driver:
            async with driver.session() as session:
                connections = await get_community_connections_by_title(session, title, level)
                return JSONResponse(content=connections)
    except Exception as e:
        print(f"Error fetching community connections: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching community connections: {str(e)}")



@router.get("/get-community-graph")
async def get_community_graph_endpoint(level: int = 2, include_findings: bool = True):
    """
    Get a community graph with nodes representing communities and edges representing connections between them.
    CommunityConnection nodes are transformed into edges to reduce clutter.
    
    Args:
        level: Community level to fetch (default: 2)
        include_findings: Whether to include Finding nodes in the response (default: True)
    
    Returns:
        JSON response with nodes (communities + optional findings) and edges (community connections)
    """
    try:
        async with AsyncGraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD)) as driver:
            async with driver.session() as session:
                graph_data = await get_community_graph(session, level)
                return JSONResponse(content=graph_data)
    except Exception as e:
        print(f"Error fetching community graph: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching community graph: {str(e)}")
    