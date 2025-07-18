from collections import defaultdict
from datetime import datetime
import json
from typing import List, Set, Tuple

from retriver.summary import Finding, Summary
from database_utils import get_node_by_id
from database_utils.get_edge_by_target_source import get_edge_by_source_target
from database_utils.get_nighbor_entities import get_neighbor_entities
from retriver.final_answer import FinalAnswer
from retriver.sub_graph_discription import SubGraphDiscription
from models.Graph import EDefault, Graph, GraphData, Link, Node
from nl_querying.utils.llm.llm import LLM
from retriver.query_params import QueryParams
from neo4j.graph import Relationship
from fastapi import WebSocket
import asyncio



import json
import os

class KnowleadgeGraphRetriver:
    def __init__(self, llm: LLM, index_summary_path: str, driver):
        self.llm = llm
        self.index_summary_path = index_summary_path
        self.driver = driver
        self.graph_meta = Graph(
                mode="default",  
                edge_default=EDefault(),
                node_default=EDefault(),
                name="Knowledge Graph"
            )

        try:
            with open(self.index_summary_path, "r", encoding="utf-8") as f:
                self.summary = json.load(f)
        except FileNotFoundError:
            print(f"[ERROR] File not found: {self.index_summary_path}")
            self.summary = {}
        except json.JSONDecodeError as e:
            print(f"[ERROR] JSON decode failed: {e}")
            self.summary = {}

    async def analyse_of_communitcations(self, question: str):
        print("Extracting Entities.")
        entities = await self._extract_entities(question=question)
        sub_tree_descs =  await self._get_communication_subtrees(entities=entities, question=question)
        return sub_tree_descs


    async def _extract_entities(self, question: str) -> QueryParams:
        system_prompt = """
        ---Role--- 
        You are an AI assistant that helps a human to perform a general information discovery.

        ---Goal---
        Identify all Entities, which are named in the user query. Only include directly named entities.
        Only include Entities, which are also included here: 
        "Sam",
        "Kelly",
        "Nadia Conti",
        "Elise",
        "Liam Thorne",
        "Samantha Blake",
        "Davis",
        "Rodriguez",
        "Sailor Shift",
        "Clepper Jensen",
        "Miranda Jordan",
        "The Intern",
        "The Lookout",
        "The Accountant",
        "Mrs. Money",
        "The Middleman",
        "Boss",
        "Small Fry",
        "Neptune",
        "Marlin",
        "Serenity",
        "Mako",
        "Reef Guardian",
        "Horizon",
        "Seawatch",
        "EcoVigil",
        "Sentinel",
        "Osprey",
        "Defender",
        "Northern Light",
        "Remora",
        "Knowles",
        "Mariner's Dream",
        "Paackland Harbor",
        "Haacklee Harbor",
        "Himark Harbor",
        "Nemo Reef",
        "Restricted areas",
        "Azure Cove",
        "Protected areas",
        "Eastern reefs",
        "Eastern Coastline",
        "Southern islands",
        "Southern coastline",
        "Coral Point",
        "Dolphin Bay",
        "E7",
        "Northern quadrant",
        "Southern quadrant",
        "Eastern quadrant",
        "Western quadrant",
        "Eastern Islands",
        "Western Boundary",
        "Eastern Boundary",
        "Southern Boundary",
        "Eastern Shoals",
        "Restricted Zone",
        "Route C",
        "South Dock",
        "Castaway Cove",
        "Berth 14",
        "Port Security",
        "Recreational Fishing Boats",
        "City Officials",
        "Diving Tour Operators",
        "Tourists",
        "Conservation Vessels",
        "Glitters Team",
        "Oceanus City Council",
        "Green Guardians",
        "V. Miesel Shipping",
        "Sailor Shifts Team"

        ---Output Structure---
        The Output should ONLY include a JSON-Object of the following format:
        {
            "Entities": []
        }

        ---Examples---
        Question: Is Nadia Conti talking to Liam Throne?
        Output:
        {
            "Entities": ["Nadia Conti", "Liam Throne"]
        }

        Question: Is Haacklee Harbor communitcating with  Oceanus City Council ? And what are the talking about?
        Output:
        {
            "Entities": ["Haacklee Harbor, "Oceanus City Council"]
        }

        Question: Are the Boss, the middleman and the Intern talk to each other?
        Output:
        {
            "Entities":["Boss", "The Middleman", "The Intern"]
        }
        """
        user_prompt = f"""
        ---User Question---
        {question}
        
        """
        try:
            response = await self.llm.invoke_prompt(
                system_prompt=system_prompt,
                user_prompt=user_prompt
            )
            response_dict = json.loads(response.strip())
            query_params = QueryParams(
                Persons=response_dict.get("Entities", []),
                Vessels=response_dict.get("Vessels", []),
                Locations=response_dict.get("Locations", []),
                Groups=response_dict.get("Groups", []),
                Organizations=response_dict.get("Organizations", []),
                RelationshipTypes=response_dict.get("RelationshipTypes", []),
                EventTypes=response_dict.get("EventTypes", []),
            )
            return query_params
            

        except json.JSONDecodeError as e:
            raise ValueError(f"Failed to parse LLM JSON response: {response}") from e
    
        except Exception as e:
            raise e
        
    async def _get_communication_subtrees(self, entities: QueryParams, question: str) -> List[SubGraphDiscription]:
        entities_list: List[str] = entities.Persons
        
        communication_sub_graphs = await self._get_communcation_subgraphs_per_day(entities=entities_list)
        
        communication_sub_graphs = await self.llm.invoke_llm_parallel_communication_subgraphs(
            question=question,
            sub_graphs=communication_sub_graphs
        )
        
        return communication_sub_graphs


    async def _get_communcation_subgraphs_per_day(self, entities: List[str]) -> List[SubGraphDiscription]:
        graph_data = await self._get_all_communications(entities=entities)

        node_lookup = {str(node.id): node for node in graph_data.nodes}
        daily_data = defaultdict(lambda: {
            "messages": [],
            "nodes": {},
            "links": set()
        })

        for link1 in graph_data.links:
            if str(link1.source) not in node_lookup or str(link1.target) not in node_lookup:
                continue

            if node_lookup[str(link1.source)].type == "Entity" and node_lookup[str(link1.target)].sub_type == "Communication":
                entity1_id = str(link1.source)
                communication_id = str(link1.target)
            elif node_lookup[str(link1.target)].type == "Entity" and node_lookup[str(link1.source)].sub_type == "Communication":
                entity1_id = str(link1.target)
                communication_id = str(link1.source)
            else:
                continue

            for link2 in graph_data.links:
                if link2 == link1:
                    continue

                if communication_id in [str(link2.source), str(link2.target)]:
                    entity2_id = str(link2.target) if str(link2.source) == communication_id else str(link2.source)
                    if entity2_id == entity1_id:
                        continue

                    entity1 = node_lookup[entity1_id]
                    entity2 = node_lookup[entity2_id]
                    communication = node_lookup[communication_id]

                    timestamp = communication.timestamp
                    content = communication.content


                    try:
                        if isinstance(timestamp, str):
                            dt = datetime.fromisoformat(timestamp)
                        elif isinstance(timestamp, datetime):
                            dt = timestamp
                        else:
                            dt = None

                        if dt:
                            date_key = dt.date().isoformat()
                            timestamp_str = dt.strftime("%Y-%m-%d %H:%M:%S")
                        else:
                            date_key = "unknown"
                            timestamp_str = str(timestamp)
                    except:
                        date_key = "unknown"
                        timestamp_str = str(timestamp)

                    message_str = (
                        f'At {timestamp_str} {entity1.id} -> send -> '
                        f'"{content}" -> received -> {entity2.id}'
                    )
                    print(f"Found link: {entity1.id} <-> {entity2.id} via {communication_id} on {timestamp_str}")

                    day_data = daily_data[date_key]
                    day_data["messages"].append({
                        "timestamp": timestamp_str,
                        "message_str": message_str
                    })
                    for node in [entity1, entity2, communication]:
                        day_data["nodes"][str(node.id)] = node
                    for link in [link1, link2]:
                        link_key = (link.source, link.target, link.type, link.is_inferred)
                        day_data["links"].add(link_key)

        result = []
        for day, data in daily_data.items():
            sorted_messages = sorted(data["messages"], key=lambda x: x["timestamp"])
            
            # Hier die Tuples wieder zu Link-Objekten machen:
            links = [
                Link(source=src, target=tgt, type=typ, is_inferred=inf)
                for (src, tgt, typ, inf) in data["links"]
            ]
            
            graph = GraphData(
                directed=True,
                multigraph=False,
                graph=self.graph_meta,
                nodes=list(data["nodes"].values()),
                links=links,
            )

            sub_graph = SubGraphDiscription(
                day=day,
                description="\n".join(m["message_str"] for m in sorted_messages),
                graph=graph
            )
            result.append(sub_graph)

        return sorted(result, key=lambda x: x.day)

    async def _get_all_communications(self, entities: List[str]) -> GraphData:
        nodes = {}
        links_set = set()  
        try:
            async with self.driver.session() as session:
                for i in range(len(entities)):
                    for j in range(i + 1, len(entities)):
                        entity1 = entities[i]
                        entity2 = entities[j]

                        query = """
                            MATCH (e1:Entity)-[l1]-(c:Event)-[l2]-(e2:Entity)
                            WHERE e1.id = $entity1
                            AND e2.id = $entity2
                            AND c.sub_type = "Communication"
                            RETURN 
                                e1, e2, c, 
                                startNode(l1) AS s1, endNode(l1) AS t1, type(l1) AS type1,
                                startNode(l2) AS s2, endNode(l2) AS t2, type(l2) AS type2
                        """


                        result = await session.run(query, entity1=entity1, entity2=entity2)
                        records = await result.data()
                        print("running query")

                        for record in records:
                            
                            for key in ["e1", "e2", "c"]:
                                node_data = record.get(key)
                                if node_data:
                                    node_dict = dict(node_data.items())
                                    node_id = node_dict.get("id")
                                    if node_id and node_id not in nodes:
                                        nodes[node_id] = Node(**node_dict)

                            
                            for prefix in [("s1", "t1", "type1"), ("s2", "t2", "type2")]:
                                source = record.get(prefix[0])
                                target = record.get(prefix[1])
                                link_type = record.get(prefix[2])

                                source_id = source.get("id") if isinstance(source, dict) else source
                                target_id = target.get("id") if isinstance(target, dict) else target

                                link_key = (source_id, target_id, link_type)
                                if link_key not in links_set:
                                    links_set.add(link_key)
            print("Building graph")
            links = [
                Link(source=src, target=tgt, type=typ, is_inferred=True)
                for (src, tgt, typ) in links_set
            ]

            return GraphData(
                directed=True,
                multigraph=False,
                graph=self.graph_meta,
                nodes=list(nodes.values()),
                links=links
            )

        except Exception as e:
            print(f"Error in _get_all_communications: {e}")
            return GraphData(
                directed=True,
                multigraph=False,
                graph=self.graph_meta,
                nodes=[],
                links=[]
            )


    async def extract_query_params_from_summaries_and_question(self, question: str) -> QueryParams:
        summaries: List[Summary] = self._laod_summaries()

        semaphore = asyncio.Semaphore(4)

        async def analyze_single_summary(summary: Summary) -> QueryParams:
            async with semaphore:
                try:
                    return await self._parse_summary_with_question(question=question, summary=summary)
                except Exception as e:
                    print(f"Error in LLM call for summary {summary.title}: {e}")
                    return QueryParams(
                        Persons=[], Vessels=[], Locations=[], Groups=[],
                        Organizations=[], RelationshipTypes=[], EventTypes=[]
                    )
                
        tasks = [analyze_single_summary(summary) for summary in summaries]
        query_params_list: List[QueryParams] = await asyncio.gather(*tasks)

        data = {
            'Persons': set(),
            'Vessels': set(),
            'Locations': set(),
            'Groups': set(),
            'Organizations': set(),
            'RelationshipTypes': set(),
            'EventTypes': set()
        }

        for query_param in query_params_list:
            for key in data:
                items = getattr(query_param, key, [])
                data[key].update(items)

        return QueryParams(**{k: list(v) for k, v in data.items()})


    def _laod_summaries(self, path: str = "summaries/level_2") -> List[Summary]:
        summaries: List[Summary] = []
        if not os.path.isdir(path):
            return summaries
        
        for file_name in os.listdir(path):
            if file_name.endswith(".json"):
                with open(os.path.join(path, file_name), "r", encoding="utf-8") as f:
                    try:
                        data = json.load(f)
                        summary_obj = Summary(
                            title=data.get("title"),
                            summary=data.get("summary"),
                            rating=data.get("rating"),
                            rating_explanation=data.get("rating explanation"),
                            findings=[
                                Finding(
                                    summary=finding.get("summary"),
                                    explanation=finding.get("explanation")
                                )
                                for finding in data.get("findings", [])
                            ]
                        )
                        summaries.append(summary_obj)
                    except json.JSONDecodeError as e:
                        print(f"Error loading Summary: {file_name}")
                        raise e
        return summaries

    async def _parse_summary_with_question(self, question: str, summary: Summary) -> QueryParams:
        system_prompt = """
        ---Role---
        You are an AI assistant that helps a human to perform a general information discovery.
        Information discovery is the process of identifying and assessing relevant information associated with certain
        entities (e.g., organizations and individuals) within a Community Summary.

        ---Goal---
        Indentify all relevent Entities from the summary, which could be relevent for the question asked by the user.
        hen indentify which Relationship types could be relevant for the Question and the Entities (e.g. If Persons and vessels 
        are relevent the Operates Relationship is relevant).
        Then indentify which Event types could be relevant for the Question and the Entities (e.g. If a Vessel and a Location are relevant
        the Monitoring Event Type is relevent).

        ---Output Structure---
        The Output should ONLY include a JSON-Object of the following format:
        {{
        "Persons": <list all relevant Persons>,
        "Vessels": <list all relevant Vessels>,
        "Locations": <list all relevant Locations>,
        "Groups": <list all relevant Groups>,
        "Organizations": <list all relevant Organizations>,
        "RelationshipTypes": <list all relevant RelationshipTypes>,
        "EventTypes": <list all relevant EventTypes>
        }}

        ---Grounding Rules---
        Do not include anything that is not provided in the summary Object.
        If the user ask for general information (e.g is there a person or vessel, etc.) it is important, that you include all Entity with this type,
        so no information is lost.
        It is very important that you only include the json object in this structure and dont explain or justify, 
        because this object is used in a downstream task.
        ---Examples---
        Question: Are there Person with are often seen at Nemo Reef?
        Output: 
        {{
        "Persons": ["Sam", "Kelly", "Nadia Conti", "Elise", "Liam Thorne", "Samantha Blake", "Davis", "Rodriguez", "Sailor Shift", "Clepper Jensen", "Miranda Jordan", "The Intern", "The Lookout", "The Accountant", "Mrs. Money", "The Middleman", "Boss", "Small Fry"],    
        "Vessels": [],    
        "Locations": ["Nemo Reef"],
        "Groups": [],
        "Organizations": [],    
        "RelationshipTypes": ["AccessPermission"],   
        "EventTypes": ["Monitoring"]}"
        }}

        Question: Which vessels frequently enter Paackland Harbor?
        Output:
        {{
        "Persons": [],
        "Vessels": ["Neptune", "Marlin", "Serenity", "Mako", "Horizon", "Seawatch", "EcoVigil", "Sentinel", "Osprey", "Defender"],
        "Locations": ["Paackland Harbor"],
        "Groups": [],
        "Organizations": [],
        "RelationshipTypes": ["AccessPermission"],
        "EventTypes": ["VesselMovement", "Monitoring"]
        }}

        Question: Which organizations have jurisdiction over Eastern reefs?
        {{
        "Persons": [],
        "Vessels": [],
        "Locations": ["Eastern reefs"],
        "Groups": [],
        "Organizations": ["Oceanus City Council", "Green Guardians"],
        "RelationshipTypes": ["Jurisdiction"],
        "EventTypes": ["Assessment", "Monitoring"]
        }}

        Question: Are diving tours conducted around Dolphin Bay?
        {{
        "Persons": [],
        "Vessels": [],
        "Locations": ["Dolphin Bay"],
        "Groups": ["Diving Tour Operators", "Tourists"],
        "Organizations": [],
        "RelationshipTypes": ["AccessPermission"],
        "EventTypes": ["TourActivity"]
        }}

        Question:Are there suspicious activities near Restricted Zone involving vessels?
        {{
        "Persons": [],
        "Vessels": ["Neptune", "Marlin", "Serenity", "Mako", "Horizon", "Seawatch", "EcoVigil", "Sentinel", "Osprey", "Defender"],
        "Locations": ["Restricted Zone"],
        "Groups": [],
        "Organizations": [],
        "RelationshipTypes": ["Suspicious"],
        "EventTypes": ["Enforcement", "Monitoring"]
        }}
        Question: I think some Persons are covering themself with a cover name. Are there some hints for this?
        {{
        "Persons": ["Sam", "Kelly", "Nadia Conti", "Elise", "Liam Thorne", "Samantha Blake", "Davis", "Rodriguez", "Sailor Shift", "Clepper Jensen", "Miranda Jordan", "The Intern", "The Lookout", "The Accountant", "Mrs. Money", "The Middleman", "Boss", "Small Fry"],
        "Vessels": [],
        "Locations": [],
        "Groups": [],
        "Organizations": [],
        "RelationshipTypes": ["Suspicious", "Colleagues","Friends"],
        "EventTypes": []
        }}
        """
        user_prompt = f"""
        ---Summary---
        {summary}

        ---User Question---
        {question}

        ---Graph Summary---
        This is a summary of all Entities, all possible Events and Relationship:
        {self.summary}
        Only use Entities, Events and Relationships, which are included.
        Dont make anything up and only use Entities, who are used in the summary.
        """

        try:
            response = await self.llm.invoke_prompt(
                system_prompt=system_prompt,
                user_prompt=user_prompt
            )
            response_dict = json.loads(response.strip())
            query_params = QueryParams(
                Persons=response_dict.get("Persons", []),
                Vessels=response_dict.get("Vessels", []),
                Locations=response_dict.get("Locations", []),
                Groups=response_dict.get("Groups", []),
                Organizations=response_dict.get("Organizations", []),
                RelationshipTypes=response_dict.get("RelationshipTypes", []),
                EventTypes=response_dict.get("EventTypes", []),
            )
            print(query_params)
            return query_params

        except json.JSONDecodeError as e:
            raise ValueError(f"Failed to parse LLM JSON response: {response}") from e
    
        except Exception as e:
            raise e


    async def extract_query_params_from_question(self, question: str) -> QueryParams:
        system_prompt = """
        ---Role---
        You are an AI assistant that helps a human to perform a general information discovery.
        Information discovery is the process of identifying and assessing relevant information associated with certain
        entities (e.g., organizations and individuals) within a network.

        ---Background Knowleadge---
        Over the past decade, the community of Oceanus has faced numerous transformations and challenges evolving from its fishing-centric origins. 
        Following major crackdowns on illegal fishing activities, suspects have shifted investments into more regulated sectors such 
        as the ocean tourism industry, resulting in growing tensions. 
        This increased tourism has recently attracted the likes of international pop star Sailor Shift, who announced plans to film a music video on the island.

        Clepper Jessen, a former analyst at FishEye and now a seasoned journalist for the Hacklee Herald, has been keenly observing these rising tensions. 
        Recently, he turned his attention towards the temporary closure of Nemo Reef. 
        By listening to radio communications and utilizing his investigative tools, Clepper uncovered a complex web of expedited approvals and secretive logistics. 
        These efforts revealed a story involving high-level Oceanus officials, Sailor Shift’s team, local influential families, and local conservationist group 
        The Green Guardians, pointing towards a story of corruption and manipulation.

        ---Goal---
        Indentify all relevent Entities from the summary, which could be relevent for the question asked by the user. 
        If you dont know if a Entity could be relevant or not dont list it. 
        Then indentify which Relationship types could be relevant for the Question and the Entities (e.g. If Persons and vessels 
        are relevent the Operates Relationship is relevant).
        Then indentify which Event types could be relevant for the Question and the Entities (e.g. If a Vessel and a Location are relevant
        the Monitoring Event Type is relevent).

        ---Output Structure---
        The Output should ONLY include a JSON-Object of the following format:
        {{
        "Persons": <list all relevant Persons>,
        "Vessels": <list all relevant Vessels>,
        "Locations": <list all relevant Locations>,
        "Groups": <list all relevant Groups>,
        "Organizations": <list all relevant Organizations>,
        "RelationshipTypes": <list all relevant RelationshipTypes>,
        "EventTypes": <list all relevant EventTypes>
        }}

        ---Grounding Rules---
        Do not include anything that is not provided in the summary Object.
        If the user ask for general information (e.g is there a person or vessel, etc.) it is important, that you include all Entity with this type,
        so no information is lost.
        It is very important that you only include the json object in this structure and dont explain or justify, 
        because this object is used in a downstream task.

        ---Examples---
        Question: Are there Person with are often seen at Nemo Reef?
        Output: 
        {{
        "Persons": ["Sam", "Kelly", "Nadia Conti", "Elise", "Liam Thorne", "Samantha Blake", "Davis", "Rodriguez", "Sailor Shift", "Clepper Jensen", "Miranda Jordan", "The Intern", "The Lookout", "The Accountant", "Mrs. Money", "The Middleman", "Boss", "Small Fry"],    
        "Vessels": [],    
        "Locations": ["Nemo Reef"],
        "Groups": [],
        "Organizations": [],    
        "RelationshipTypes": ["AccessPermission"],   
        "EventTypes": ["Monitoring"]}"
        }}

        Question: Which vessels frequently enter Paackland Harbor?
        Output:
        {{
        "Persons": [],
        "Vessels": ["Neptune", "Marlin", "Serenity", "Mako", "Horizon", "Seawatch", "EcoVigil", "Sentinel", "Osprey", "Defender"],
        "Locations": ["Paackland Harbor"],
        "Groups": [],
        "Organizations": [],
        "RelationshipTypes": ["AccessPermission"],
        "EventTypes": ["VesselMovement", "Monitoring"]
        }}

        Question: Which organizations have jurisdiction over Eastern reefs?
        {{
        "Persons": [],
        "Vessels": [],
        "Locations": ["Eastern reefs"],
        "Groups": [],
        "Organizations": ["Oceanus City Council", "Green Guardians"],
        "RelationshipTypes": ["Jurisdiction"],
        "EventTypes": ["Assessment", "Monitoring"]
        }}

        Question: Are diving tours conducted around Dolphin Bay?
        {{
        "Persons": [],
        "Vessels": [],
        "Locations": ["Dolphin Bay"],
        "Groups": ["Diving Tour Operators", "Tourists"],
        "Organizations": [],
        "RelationshipTypes": ["AccessPermission"],
        "EventTypes": ["TourActivity"]
        }}

        Question:Are there suspicious activities near Restricted Zone involving vessels?
        {{
        "Persons": [],
        "Vessels": ["Neptune", "Marlin", "Serenity", "Mako", "Horizon", "Seawatch", "EcoVigil", "Sentinel", "Osprey", "Defender"],
        "Locations": ["Restricted Zone"],
        "Groups": [],
        "Organizations": [],
        "RelationshipTypes": ["Suspicious"],
        "EventTypes": ["Enforcement", "Monitoring"]
        }}
        Question: I think some Persons are covering themself with a cover name. Are there some hints for this?
        {{
        "Persons": ["Sam", "Kelly", "Nadia Conti", "Elise", "Liam Thorne", "Samantha Blake", "Davis", "Rodriguez", "Sailor Shift", "Clepper Jensen", "Miranda Jordan", "The Intern", "The Lookout", "The Accountant", "Mrs. Money", "The Middleman", "Boss", "Small Fry"],
        "Vessels": [],
        "Locations": [],
        "Groups": [],
        "Organizations": [],
        "RelationshipTypes": ["Suspicious", "Colleagues","Friends"],
        "EventTypes": []
        }}

        """
        user_prompt = f"""
        ---Graph Summary---
        {self.summary}

        ---User Question---
        {question}
        """
        try:
            response = await self.llm.invoke_prompt(
                system_prompt=system_prompt,
                user_prompt=user_prompt
            )
            response_dict = json.loads(response.strip())
            query_params = QueryParams(
                Persons=response_dict.get("Persons", []),
                Vessels=response_dict.get("Vessels", []),
                Locations=response_dict.get("Locations", []),
                Groups=response_dict.get("Groups", []),
                Organizations=response_dict.get("Organizations", []),
                RelationshipTypes=response_dict.get("RelationshipTypes", []),
                EventTypes=response_dict.get("EventTypes", []),
            )
            return query_params

        except json.JSONDecodeError as e:
            raise ValueError(f"Failed to parse LLM JSON response: {response}") from e
    
        except Exception as e:
            raise e
        
    async def query_subgraph(self, query_params: QueryParams) -> List[Graph]:
        entities = query_params.Persons
        entities.extend(query_params.Vessels)
        entities.extend(query_params.Locations)
        entities.extend(query_params.Organizations)
        entities.extend(query_params.Groups)
        sub_graphs: List[Graph] = []

        for entity1 in entities:
            for entity2 in entities:
                if entity1 == entity2:
                    break
                for relationship in query_params.RelationshipTypes:
                    sub_graph = await self._get_subtree_with_relationship(
                        entity1=entity1,
                        entity2= entity2,
                        relationship=relationship
                    )
                    if len(sub_graph.nodes) > 0:
                        sub_graphs.append(sub_graph)
                for event in query_params.EventTypes:
                    sub_graph = await self._get_subtree_with_event(
                        entity1=entity1,
                        entity2= entity2,
                        event=event
                    )
                    if len(sub_graph.nodes) > 0:
                        sub_graphs.append(sub_graph)
        return sub_graphs

    async def _get_subtree_with_relationship(self, entity1: str, entity2: str, relationship:str) -> GraphData:
        try: 
            async with self.driver.session() as session:
                query = """
                MATCH (e1:Entity)-[l1]-(r: Relationship)-[l2]-(e2:Entity)
                WHERE e1.id = $entity1
                AND r.label = $relationship
                AND e2.id = $entity2

                OPTIONAL MATCH (evidence_node)-[ef: evidence_for]->(r)
                OPTIONAL MATCH (entity_node:Entity)-[le]-(evidence_node)

                RETURN e1, e2, r, l1, l2, evidence_node, entity_node, le, ef
                """
                result = await session.run(
                    query,
                    entity1=entity1,
                    relationship=relationship,
                    entity2=entity2
                )

                nodes = {}
                links = []

                records = await result.data()

                for record in records:
                    for key in ["e1", "e2", "r", "evidence_node", "entity_node"]:
                        node_data = record.get(key)
                        if node_data is not None:
                            node_dict = dict(node_data)
                            node_id = node_dict.get("id")
                            if node_id is not None and node_id not in nodes:
                                nodes[node_id] = Node(**node_dict)

                    for key in ["l1", "l2", "le", "ef"]:
                        link_data = record.get(key)
                        if link_data is not None:
                            source_node = link_data[0]
                            link_type = link_data[1]
                            target_node = link_data[2]

                            
                            source_id = source_node.get('id') if isinstance(source_node, dict) else source_node
                            target_id = target_node.get('id') if isinstance(target_node, dict) else target_node
                            links.append(Link(
                                source=source_id,
                                target=target_id,
                                type=link_type,
                                is_inferred=True
                            ))

                graph_meta = Graph(
                mode="default",  
                edge_default=EDefault(),
                node_default=EDefault(),
                name="Knowledge Graph"
            )
                
            nodes = list(nodes.values())

            return GraphData(
                directed=True,
                multigraph=False,
                graph=graph_meta,
                nodes=nodes,
                links=links,
            )

        except Exception as e:
            print(e)


    async def _get_subtree_with_event(self, entity1: str, entity2: str, event:str) -> GraphData:
        try: 
            async with self.driver.session() as session:
                query = """
                MATCH (e1:Entity)-[l1]-(r:Event)-[l2]-(e2:Entity)
                WHERE e1.id = $entity1
                AND r.sub_type = $event
                AND e2.id = $entity2

                OPTIONAL MATCH (evidence_node)-[ef:evidence_for]->(r)
                OPTIONAL MATCH (entity_node:Entity)-[le]-(evidence_node)

                RETURN e1, e2, r, l1, l2, evidence_node, entity_node, le, ef
                """
                result = await session.run(
                    query,
                    entity1=entity1,
                    event=event,
                    entity2=entity2
                )

                nodes = {}
                links = []

                records = await result.data()

                for record in records:
                    for key in ["e1", "e2", "r", "evidence_node", "entity_node"]:
                        node_data = record.get(key)
                        if node_data is not None:
                            node_dict = dict(node_data)
                            node_id = node_dict.get("id")
                            if node_id is not None and node_id not in nodes:
                                nodes[node_id] = Node(**node_dict)

                    for key in ["l1", "l2", "le", "ef"]:
                        link_data = record.get(key)
                        if link_data is not None:
                            if isinstance(link_data, Relationship):
                                source_id = link_data.start_node.id
                                target_id = link_data.end_node.id
                                link_type = link_data.type
                                links.append(Link(
                                    source=source_id,
                                    target=target_id,
                                    type=link_type,
                                    is_inferred=True
                                ))
                            elif isinstance(link_data, (list, tuple)) and len(link_data) == 3:
                                source_node = link_data[0]
                                link_type = link_data[1]
                                target_node = link_data[2]
                                source_id = source_node.get('id') if isinstance(source_node, dict) else source_node
                                target_id = target_node.get('id') if isinstance(target_node, dict) else target_node
                                links.append(Link(
                                    source=source_id,
                                    target=target_id,
                                    type=link_type,
                                    is_inferred=True
                                ))


                graph_meta = Graph(
                mode="default",  
                edge_default=EDefault(),
                node_default=EDefault(),
                name="Knowledge Graph"
            )
                
            nodes = list(nodes.values())

            return GraphData(
                directed=True,
                multigraph=False,
                graph=graph_meta,
                nodes=nodes,
                links=links,
            )

        except Exception as e:
            print(e)
        

    async def anaylse_subgraphs(self, question: str, sub_graphs: List[Graph]):
        return await self.llm.invoke_llm_parallel_subgraphs(
            question=question,
            sub_graphs=sub_graphs,
            describe_subgraph_func=self.descripe_subgraph
    )

    def descripe_subgraph(self, sub_graph: GraphData) -> SubGraphDiscription:
        nodes_by_id = {node.id: node for node in sub_graph.nodes}
        relationship_node = next(
            (node for node in sub_graph.nodes if node.type == "Relationship"),
            None
        )
        if not relationship_node:
            event = [n for n in sub_graph.nodes if n.sub_type != "Communication"]
            if event:
                relationship_node = event[0]

        
        connected_entities = []
        for link in sub_graph.links:
            if link.source == relationship_node.id or link.target == relationship_node.id:
                other_id = link.target if link.source == relationship_node.id else link.source
                other_node = nodes_by_id.get(other_id)
                if other_node and other_node.type == "Entity":
                    connected_entities.append(other_node)
        if len(connected_entities) == 0:
            description = f"Main Relationship: {relationship_node.label}"
        elif len(connected_entities) == 1:
            description = f"Main Relationship: {connected_entities[0].id} -({relationship_node.label})\n\n"
        else:
            entity1, entity2 = connected_entities[:2]
            description = f"Main Relationship: {entity1.id} -({relationship_node.label}) -> {entity2.id}\n\n"
        description += "Communications:\n"
        communications = []
        for link in sub_graph.links:
            if link.type == "evidence_for" and link.target == relationship_node.id:
                comm_node = nodes_by_id.get(link.source)
                if comm_node and comm_node.sub_type == "Communication":
                    communications.append(comm_node)

        communications.sort(key=lambda n: n.timestamp or datetime.min)
        for comm in communications:
            sender = None
            receiver = None

            for link in sub_graph.links:
                if link.type == "sent" and link.target == comm.id:
                    sender_node = nodes_by_id.get(link.source)
                    if sender_node and sender_node.type == "Entity":
                        sender = sender_node
                if link.type == "received" and link.source == comm.id:
                    receiver_node = nodes_by_id.get(link.target)
                    if receiver_node and receiver_node.type == "Entity":
                        receiver = receiver_node

            timestamp_str = comm.timestamp.isoformat() if comm.timestamp else "unknown time"
            sender_name = sender.name if sender else "Unknown Sender"
            receiver_name = receiver.name if receiver else "Unknown Receiver"
            comm_content = comm.content or "(no content)"

            description += f"{sender_name} sent:\n"
            description += f"\"{comm_content}\"\n"
            description += f"received by {receiver_name} at {timestamp_str}\n\n"

        return SubGraphDiscription(
            graph=sub_graph,
            description=description
        )

    async def get_final_answer(self, question: str, sub_graph_desctiptions: List[SubGraphDiscription]):
        chunks = self.chunk_subgraphs(sub_graph_desctiptions, 5)

        semaphore = asyncio.Semaphore(4)

        async def safe_partial_answer(idx, chunk):
            async with semaphore:
                return await self.get_partial_answer(question, chunk, idx)

        partial_answers = await asyncio.gather(*[
            safe_partial_answer(idx, chunk)
            for idx, chunk in enumerate(chunks)
        ])

        final_answer_str = await self.merge_partial_answers(question, partial_answers)

        return FinalAnswer(
            sub_graphs=sub_graph_desctiptions,
            hole_graph=self.build_answer_graph(sub_graphs=sub_graph_desctiptions),
            answer=final_answer_str
    )

    
    def build_answer_graph(self, sub_graphs: List[SubGraphDiscription]) -> GraphData:
        graph = Graph(
            mode="default",  
            edge_default=EDefault(),
            node_default=EDefault(),
            name="LLM Answer Graph"
        )
        combined_graph = GraphData(
            directed=True,
            graph = graph,
            multigraph=False,
            nodes=[], 
            links=[]
        )
        seen_node_ids = set()

        for sub_graph_desc in sub_graphs:
            sub_graph = sub_graph_desc.graph
            for node in sub_graph.nodes:
                if node.id not in seen_node_ids:
                    combined_graph.nodes.append(node)
                    seen_node_ids.add(node.id)

            for edge in sub_graph.links:
                combined_graph.links.append(edge)

        return combined_graph
    
    def chunk_subgraphs(self, subgraphs: List[SubGraphDiscription], chunk_size: int) -> List[List[Tuple[int, SubGraphDiscription]]]:
        return [
            list(enumerate(subgraphs[i:i + chunk_size], start=i))
            for i in range(0, len(subgraphs), chunk_size)
        ]

    async def get_partial_answer(self, question: str, subgraphs_chunk: List[Tuple[int, SubGraphDiscription]], chunk_index: int):
        final_context = ""
        for global_index, sub_graph in subgraphs_chunk:
            final_context += f"Subgraph: {global_index}\n{sub_graph.llm_summary}\n\n"


        system_prompt = """
            ### Role
            You are an advanced AI assistant supporting a human in information discovery and research.

            ### Goal
            Your task is to give detailed summaries for the subgraphs in regart to a user question.
            It is very important to look at every detail in the communications:
            - Who is talking?
            - What is the topic?
            - Are other entities part of this?
            - When do they talk? (time) if possible include time.

            Your task is to **answer the question using only the provided information** from the subgraphs.

            ### Instructions
            - Integrate relevant details and entities from the subgraphs into your answer.
            - When information comes from a specific subgraph, indicate it clearly by citing it at the end of the relevant paragraph in the form: (see Subgraph 3).
            - Do not fabricate or hallucinate information. Use only what is provided.
            - Write clearly, concisely, and in professional academic style.
            - Do not do something like this: subgraphs (13, 15, 19, 20) do this: (Subgraph 13, Subgraph 15, Subgraph 19, Subgraph 20)

            ### Output Format
            Provide a **Markdown** formatted summary as your final answer.
            """

        user_prompt = f"""
            ---Graph Summary---
            {final_context}

            ---User Question---
            {question}

            Remember:
            - Cite relevant Subgraph indices explicitly (e.g., (Subgraph {chunk_index})).
            - Use only the provided information, no hallucinations.
            - It is very VERY important, that you dont make any thing up. Just use provided infromation.
            - If no Graph Summary is Provided, just say so. Dont make ANYTHING up.
            """

        partial_answer = await self.llm.invoke_prompt(
            system_prompt=system_prompt,
            user_prompt=user_prompt
        )
        return partial_answer

    async def merge_partial_answers(self, question: str, partial_answers: List[str]) -> str:
        merged_context = "\n\n".join(f"Partial Answer {idx}:\n{ans}" for idx, ans in enumerate(partial_answers))

        system_prompt = """
            ### Role
            You are an advanced AI assistant supporting a human in information discovery and research.

            ### Goal
            Your task is to give detailed summaries for the subgraphs in regart to a user question.
            It is very important to look at every detail in the communications:
            - Who is talking?
            - What is the topic?
            - Are other entities part of this?
            - When do they talk? (time) if possible include time.

            Your task is to **answer the question using only the provided information** from the subgraphs.

            ### Instructions
            - Integrate relevant details and entities from the subgraphs into your answer.
            - When information comes from a specific subgraph, indicate it clearly by citing it at the end of the relevant paragraph in the form: (see Subgraph 3).
            - Do not fabricate or hallucinate information. Use only what is provided.
            - If no context is Provided, just say so.
            - Write clearly, concisely, and in professional academic style.
            - Do not do something like this: subgraphs (13, 15, 19, 20) do this: (Subgraph 13, Subgraph 15, Subgraph 19, Subgraph 20)

            ### Output Format
            Provide a **Markdown** formatted summary as your final answer.
            """

        user_prompt = f"""
            ---Graph Summary---
            {merged_context}

            ---User Question---
            {question}

            Remember:
            - Cite relevant Subgraph indices explicitly (e.g., (Subgraph 1)).
            - Use only the provided information, no hallucinations.
            - It is very VERY important, that you dont make any thing up. Just use provided infromation.
            - If no Graph Summary is Provided, just say so. Dont make ANYTHING up.
            """

        final_answer = await self.llm.invoke_prompt(
            system_prompt=system_prompt,
            user_prompt=user_prompt
        )
        return final_answer

    
    async def reducer_pipeline_reporter(self, ws: WebSocket, question: str, use_context: bool):
        await ws.send_text("[0/4] Starting Pipeline")
        if not use_context:
            entities = await self._extract_entities(question=question)
            await ws.send_text("[1/4] Extracted query parameters")
            print(entities)
            await ws.send_text(f"[2/4] Retrieved Entities.")
            sub_graphs_descs =  await self._get_communication_subtrees(entities=entities, question=question)
            print(f"Relevent Subgraphs: {len(sub_graphs_descs)}")
            if len(sub_graphs_descs) == 0:
                return FinalAnswer(
                    sub_graphs=[],
                    hole_graph= None,
                    answer="Dont find any Data. You can try searching with more entities or reformulate your question."
                )
            if len(sub_graphs_descs) > 25:
                return FinalAnswer(
                    sub_graphs=[],
                    hole_graph= None,
                    answer="The LLM couldnt handle the amount of context. Please lower the scope of your prompt."
                )
        else:
            qp =  await self.extract_query_params_from_summaries_and_question(question=question)
            print(qp)
            await ws.send_text("[1/4] Extracted query parameters")
            sub_graphs =  await self.query_subgraph(query_params=qp)
            print(f"Fund {len(sub_graphs)} Subgraps")
            if len(sub_graphs) == 0:
                return FinalAnswer(
                    sub_graphs=[],
                    hole_graph= None,
                    answer="Dont find any Data. You can try searching with more entities or reformulate your question."
                )
            await ws.send_text(f"[2/4] Retrieved {len(sub_graphs)} subgraphs.")
            sub_graphs_descs =  await self.anaylse_subgraphs(question=question, sub_graphs=sub_graphs)
            print(f"Relevant subgraphs: {len(sub_graphs_descs)}")
            if len(sub_graphs_descs) == 0:
                return FinalAnswer(
                    sub_graphs=[],
                    hole_graph= None,
                    answer="Dont find any Data. You can try searching with more entities or reformulate your question."
                )
            if len(sub_graphs_descs) > 25:
                return FinalAnswer(
                    sub_graphs=[],
                    hole_graph= None,
                    answer="The LLM couldnt handle the amount of context. Please lower the scope of your prompt."
                )
        await ws.send_text("[3/4] Analyzed subgraphs and prepared summaries.")
        return await self.get_final_answer(question=question, sub_graph_desctiptions=sub_graphs_descs)
