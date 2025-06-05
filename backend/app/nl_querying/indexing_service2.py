import networkx as nx
from nl_querying.query_utils import _flatten_nodes, describe_edge, describe_node, estimate_tokens
from nl_querying.init_llm import LLM
import leidenalg
import igraph as ig
from typing import Dict, List, Tuple
import json, os

class IndexService2:
    
    def __init__(self, llm: LLM, community_path: str = "community_descriptions2") -> None:
            self.community_path = community_path
            self.llm = llm
            self.community_summary_generation_prompt = {
        "system_prompt": """
        ---Role--
        You are an AI assistant that helps a human analyst to perform general information discovery. Information
        discovery is the process of identifying and assessing relevant information associated with certain
        entities (e.g., organizations and individuals) within a network.

        ---Goal--
        Write a comprehensive report of a community, given a list of entities that belong to the community as well
        as their relationships and optional associated claims. The report will be used to inform decision-makers
        about information associated with the community and their potential impact. The content of this report
        includes an overview of the community’s key entities, their legal compliance, technical capabilities,
        reputation, and noteworthy claims.

        ---Report Structure--
        The report should include the following sections:
        - TITLE: community’s name that represents its key entities - title should be short but specific. When
        possible, include representative named entities in the title.
        - SUMMARY: An executive summary of the community’s overall structure, how its entities are related to each
        other, and significant information associated with its entities.
        - IMPACT SEVERITY RATING: a float score between 0-10 that represents the severity of IMPACT posed by
        entities within the community. IMPACT is the scored importance of a community.
        - RATING EXPLANATION: Give a single sentence explanation of the IMPACT severity rating.
        - DETAILED FINDINGS: A list of 5-10 key insights about the community. Each insight should have a short
        summary followed by multiple paragraphs of explanatory text grounded according to the grounding rules
        below. Be comprehensive.

        Return output as a well-formed JSON-formatted string with the following format:
        {{
        "title": <report title>,
        "summary": <executive summary>,
        "rating": <impact severity rating>,
        "rating explanation": <rating explanation>,
        "findings": [
        {{
        "summary":<insight 1 summary>,
        "explanation": <insight 1 explanation>
        }},
        {{
        "summary":<insight 2 summary>,
        "explanation": <insight 2 explanation>
        }}
        ]
        }}

        ---Grounding Rules--
        Points supported by data should list their data references as follows:
        "This is an example sentence supported by multiple data references [Data: <dataset name> (record ids);
        <dataset name> (record ids)]."
        Do not list more than 5 record ids in a single reference. Instead, list the top 5 most relevant record
        ids and add "+more" to indicate that there are more.
        For example:
        "Person X is the owner of Company Y and subject to many allegations of wrongdoing [Data: Reports (1),
        Entities (5, 7); Relationships (23); Claims (7, 2, 34, 64, 46, +more)]."
        where 1, 5, 7, 23, 2, 34, 46, and 64 represent the id (not the index) of the relevant data record.
        Do not include information where the supporting evidence for it is not provided.
        ---Example--
        Input:
        Entities
        id,entity,description
        5,VERDANT OASIS PLAZA,Verdant Oasis Plaza is the location of the Unity March
        6,HARMONY ASSEMBLY,Harmony Assembly is an organization that is holding a march at Verdant Oasis Plaza
        Relationships
        id,source,target,description
        37,VERDANT OASIS PLAZA,UNITY MARCH,Verdant Oasis Plaza is the location of the Unity March
        38,VERDANT OASIS PLAZA,HARMONY ASSEMBLY,Harmony Assembly is holding a march at Verdant Oasis Plaza
        39,VERDANT OASIS PLAZA,UNITY MARCH,The Unity March is taking place at Verdant Oasis Plaza
        40,VERDANT OASIS PLAZA,TRIBUNE SPOTLIGHT,Tribune Spotlight is reporting on the Unity march taking place at
        Verdant Oasis Plaza
        41,VERDANT OASIS PLAZA,BAILEY ASADI,Bailey Asadi is speaking at Verdant Oasis Plaza about the march
        43,HARMONY ASSEMBLY,UNITY MARCH,Harmony Assembly is organizing the Unity Marc

        Output:
        {{
        "title": "Verdant Oasis Plaza and Unity March",
        "summary": "The community revolves around the Verdant Oasis Plaza, which is the location of the Unity
        March. The plaza has relationships with the Harmony Assembly, Unity March, and Tribune Spotlight, all of
        which are associated with the march event.",
        "rating": 5.0,
        "rating explanation": "The impact severity rating is moderate due to the potential for unrest or conflict
        during the Unity March.",
        "findings": [
        {{
        "summary": "Verdant Oasis Plaza as the central location",
        "explanation": "Verdant Oasis Plaza is the central entity in this community, serving as the location for
        the Unity March. This plaza is the common link between all other entities, suggesting its significance
        in the community. The plaza’s association with the march could potentially lead to issues such as
        public disorder or conflict, depending on the nature of the march and the reactions it provokes. [Data:
        Entities (5), Relationships (37, 38, 39, 40, 41,+more)]"
        }},
        {{
        "summary": "Harmony Assembly’s role in the community",
        "explanation": "Harmony Assembly is another key entity in this community, being the organizer of the
        march at Verdant Oasis Plaza. The nature of Harmony Assembly and its march could be a potential source of
        threat, depending on their objectives and the reactions they provoke. The relationship between Harmony
        Assembly and the plaza is crucial in understanding the dynamics of this community. [Data: Entities(6),
        Relationships (38, 43)]"
        }},
        {{
        "summary": "Unity March as a significant event",
        "explanation": "The Unity March is a significant event taking place at Verdant Oasis Plaza. This event
        is a key factor in the community’s dynamics and could be a potential source of threat, depending on the
        nature of the march and the reactions it provokes. The relationship between the march and the plaza is
        crucial in understanding the dynamics of this community. [Data: Relationships (39)]"
        }},
        {{
        "summary": "Role of Tribune Spotlight", "explanation": "Tribune Spotlight is reporting on the Unity
        March taking place in Verdant Oasis Plaza. This suggests that the event has attracted media attention,
        which could amplify its impact on the community. The role of Tribune Spotlight could be significant in
        shaping public perception of the event and the entities involved. [Data: Relationships (40)]"
        }}
        ]
        }}
        """,
        "user_prompt":
        "Use the following text for your answer. Do not make anything up in your answer. Input:"
    }

    def detect_communities_hierarchical(self, graph: nx.Graph, min_size = 6) -> List:
            """
            Hierachically detects communities using the Leiden algoritm.

            Parameters
            ----------
            graph: nx.Graph
                The input graph in NetworkX foramt.
            min_size: int
                Minimum community size to consider further splitting.

            Returns
            -------
            List
                A nested list representing the hierachical community structure.
            """
            nodes = list(graph.nodes())
            node_idx = {node: idx for idx, node in enumerate(nodes)}
            edges = [(node_idx[u], node_idx[v]) for u, v in graph.edges()]

            g = ig.Graph()
            g.add_vertices(len(nodes))
            g.vs["id"] = nodes
            g.add_edges(edges)

            partition = leidenalg.find_partition(g, leidenalg.ModularityVertexPartition)

            if len(partition) == 1 or all(len(c) == len(nodes) for c in partition):
                return nodes

            result = []
            for community in partition:
                community_nodes = [g.vs[v]["id"] for v in community]
                if len(community) >= min_size:
                    subgraph = graph.subgraph(community_nodes)
                    if subgraph.number_of_edges() > 0 and len(subgraph.nodes()) > 1:
                        sub_communities = self.detect_communities_hierarchical(subgraph, min_size)
                        result.append(sub_communities)
                    else:
                        result.append(community_nodes)
                else:
                    result.append(community_nodes)

            return result
    
    def get_community_description(self, graph: nx.Graph, nodes: List[str]) -> List[str]:
        """
        Generates prioritized element summaries for a given community.

        - Sorts edges by combined source and target node degree (descending).
        - For each edge, adds:
            1. Description of source node
            2. Description of target node
            3. Description of the edge itself

        Parameters:
        -----------
        graph : nx.Graph
            The full graph.
        nodes : List[str]
            List of node IDs representing the community.

        Returns:
        --------
        List[str]
            A prioritized list of textual element summaries.
        """
        subgraph = graph.subgraph(nodes)

        node_degrees = dict(subgraph.degree())
        
        edges_sorted = sorted(
             subgraph.edges(data=True),
             key=lambda x: node_degrees[x[0]] + node_degrees[x[1]],
             reverse=True
        )

        descriptions = []
        added_nodes = set()
        
        for source, target, edge_data in edges_sorted:
            if source not in added_nodes:
                source_desc = describe_node(subgraph.nodes[source])
                descriptions.append(source_desc)
                added_nodes.add(source) 

            if target not in added_nodes:
                target_desc = describe_node(subgraph.nodes[target])
                descriptions.append(target_desc)
                added_nodes.add(target)

            edge_desc = describe_edge(source, target, edge_data)
            descriptions.append(edge_desc)
    
        return descriptions

    async def summarize_communities_hierarchical(
        self,
        graph: nx.Graph,
        community_structure: List,
        sub_community_summaries: Dict[str, str] = None,
        token_limit: int = 2048
    ) -> str:
        """
        Summarizes a hierarchical community structure using the GraphRAG approach.
        Leaf-level communities: summarize element summaries.
        Higher-level communities: summarize sub-community summaries if element summaries exceed the token limit.

        Parameters:
        -----------
        graph : nx.Graph
            The full graph.
        community_structure : List
            The hierarchical community structure from detect_communities_hierarchical.
        sub_community_summaries : Dict[str, str]
            A dictionary to cache sub-community summaries by community identifier.
        token_limit : int
            The LLM token limit.

        Returns:
        --------
        str
            A textual summary of the community.
        """
        if sub_community_summaries is None:
            sub_community_summaries = {}

        if all(isinstance(node, str) for node in community_structure):

            print("summarizing sub graph")
            element_summaries = self.get_community_description(graph, community_structure)
            token_count = sum(estimate_tokens(summary) for summary in element_summaries)

            selected_summaries = []
            running_tokens = 0
            for summary in element_summaries:
                summary_tokens = estimate_tokens(summary)
                if running_tokens + summary_tokens <= token_limit:
                    selected_summaries.append(summary)
                    running_tokens += summary_tokens
                else:
                    break

            final_text = "\n".join(selected_summaries)
            community_id = self._community_id(community_structure)
            sub_community_summaries[community_id] = final_text
            
            final_result = await self.llm.invoke_prompt(
                system_prompt=self.community_summary_generation_prompt.get("system_prompt"),
                user_prompt= f"{self.community_summary_generation_prompt.get("user_prompt")}\n\n {final_text}"
            )

        else:
            sub_summaries = []
            sub_tokens = []
            for sub in  community_structure:
                print("summarizing sub graph")
                sub_summary = await self.summarize_communities_hierarchical(
                    graph, sub, sub_community_summaries, token_limit
                )
                community_id = self._community_id(sub)
                sub_community_summaries[community_id] = sub_summary
                sub_summaries.append(sub_summary)
                sub_tokens.append(estimate_tokens(sub_summary))

            flat_nodes = _flatten_nodes(community_structure)
            element_summaries = self.get_community_description(graph, flat_nodes)
            element_tokens = sum(estimate_tokens(s) for s in element_summaries)
            if element_tokens <= token_limit:
                final_text = "\n".join(element_summaries)
                final_result= await self.llm.invoke_prompt(
                    system_prompt=self.community_summary_generation_prompt.get("system_prompt"),
                    user_prompt= f"{self.community_summary_generation_prompt.get("user_prompt")}\n\n {final_text}"
                )
            else:
                sub_community_sorted = sorted(
                    zip(sub_summaries, sub_tokens),
                    key=lambda x: x[1],
                    reverse=True
                )
                selected_summaries = []
                running_tokens = 0
                for summary, tokens in sub_community_sorted:
                    if running_tokens + tokens <= token_limit:
                        selected_summaries.append(summary)
                        running_tokens += tokens
                    else:
                        break
                final_text = "\n".join(selected_summaries)

                final_result= await self.llm.invoke_prompt(
                    system_prompt=self.community_summary_generation_prompt.get("system_prompt"),
                    user_prompt= f"{self.community_summary_generation_prompt.get("user_prompt")}\n\n {final_text}"
                )
        try:
            print(final_result)
            summary_json = json.loads(final_result)  
            summary_obj = {
                "title": summary_json.get("title"),
                "summary": summary_json.get("summary"),
                "rating": summary_json.get("rating"),
                "rating explanation": summary_json.get("rating explanation"),
                "findings": summary_json.get("findings"),
                "nodes": final_text
            }
            community_id = self._community_id(community_structure)
            await self.save_community_summary(community_id, summary_obj)
            return summary_json
        except json.JSONDecodeError:
            community_id = self._community_id(community_structure)
            summary_obj = {
                "title": f"Community_{community_id}",
                "summary": final_text,
                "rating": 0.0,
                "rating explanation": "Could not parse full summary",
                "findings": []
            }
            await self.save_community_summary(community_id, summary_obj)
            return summary_obj

    
    def _community_id(self, community_nodes: List[str]) -> str:
        """Generates a unique but readable identifier for a community."""
        if not community_nodes:
            return "empty_community"
        
        base_name = "_".join(sorted(community_nodes)[:3]).lower()
        unique_hash = hash(frozenset(community_nodes)) % (10**8)
        return f"{base_name}_{unique_hash}"
    
    async def save_community_summary(self, community_id: str, summary: dict):
        """Saves a community summary as JSON file with descriptive name."""
        if not os.path.exists(self.community_path):
            os.makedirs(self.community_path)
        
        title = summary.get("title", "community").lower()
        title = "".join(c if c.isalnum() else "_" for c in title)
        
        filename = f"{title}_{community_id[:50]}.json"
        filepath = os.path.join(self.community_path, filename)
        
        with open(filepath, "w") as f:
            json.dump(summary, f, indent=2)


    async def indexing(self, graph: nx.graph):
        print("starting Pipeline")
        community_structure = self.detect_communities_hierarchical(graph)
        summary = await self.summarize_communities_hierarchical(
        graph, 
        community_structure
    )