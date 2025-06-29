import json, os

from nl_querying.utils.llm.llm import LLM
from retriver.query_params import QueryParams


import json
import os

class KnowleadgeGraphRetriver:
    def __init__(self, llm: LLM, index_summary_path: str):
        self.llm = llm
        self.index_summary_path = index_summary_path

        try:
            with open(self.index_summary_path, "r", encoding="utf-8") as f:
                self.summary = json.load(f)
        except FileNotFoundError:
            print(f"[ERROR] File not found: {self.index_summary_path}")
            self.summary = {}
        except json.JSONDecodeError as e:
            print(f"[ERROR] JSON decode failed: {e}")
            self.summary = {}


    async def extract_query_params_from_question(self, question: str):
        system_prompt = """
        ---Role---
        You are an AI assistant that helps a human to perform a general information discovery.
        Information discovery is the process of identifying and assessing relevant information associated with certain
        entities (e.g., organizations and individuals) within a network.

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
        Question: I think Nadia Conti covers herself with a cover name. Are there some hints for this?
        {{
        "Persons": ["Nadia Conti", "The Intern", "The Lookout", "The Accountant", "Mrs. Money", "The Middleman", "Boss", "Small Fry"],
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
            return response
        except Exception as e:
            raise e