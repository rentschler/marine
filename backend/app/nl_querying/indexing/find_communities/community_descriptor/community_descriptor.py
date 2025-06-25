from collections import defaultdict
from typing import Dict, List, Union
import networkx as nx

from nl_querying.indexing.find_communities.models.community import Community


class CommunityDescriptor:

    def describe_community(self, graph:nx.DiGraph, community: Community) -> List[str]:
        nodes = self.extract_nodes_from_community(community=community)
        subgraph = graph.subgraph(nodes)

        node_degrees = dict(subgraph.degree())
        edges_sorted = sorted(
             subgraph.edges(data=True),
             key=lambda x: node_degrees[x[0]] + node_degrees[x[1]],
             reverse=True
        )

        descriptions: List[str] = []
        added_nodes = set()
        
        for source, target, edge_data in edges_sorted:
            if source not in added_nodes:
                source_desc = self._describe_node(source, subgraph.nodes[source])
                descriptions.append(source_desc)
                added_nodes.add(source) 

            if target not in added_nodes:
                target_desc = self._describe_node(target, subgraph.nodes[target])
                descriptions.append(target_desc)
                added_nodes.add(target)

            edge_desc = self._describe_edge(source, target, edge_data)
            descriptions.append(edge_desc)
    
        return descriptions
    
    def describe_community_with_groups(
        self,
        graph: nx.DiGraph,
        community: Community
    ):
        nodes = self.extract_nodes_from_community(community=community)
        subgraph = graph.subgraph(nodes)

        node_degrees = dict(subgraph.degree())
        edges_sorted = sorted(
            subgraph.edges(data=True),
            key=lambda x: node_degrees[x[0]] + node_degrees[x[1]],
            reverse=True
        )

        full_description: List[str] = []
        grouped_descriptions: Dict[str, List[str]] = defaultdict(list)
        added_nodes = set()

        node_to_group = self._get_node_to_subcommunity_map(community)

        for source, target, edge_data in edges_sorted:
            source_group = node_to_group.get(source, None)
            target_group = node_to_group.get(target, None)

            if source not in added_nodes:
                desc = self._describe_node(source, subgraph.nodes[source])
                full_description.append(desc)
                if source_group:
                    grouped_descriptions[source_group].append(desc)
                added_nodes.add(source)

            if target not in added_nodes:
                desc = self._describe_node(target, subgraph.nodes[target])
                full_description.append(desc)
                if target_group:
                    grouped_descriptions[target_group].append(desc)
                added_nodes.add(target)

            edge_desc = self._describe_edge(source, target, edge_data)
            full_description.append(edge_desc)
            if source_group and source_group == target_group:
                grouped_descriptions[source_group].append(edge_desc)

        return full_description, grouped_descriptions
    
    def _get_node_to_subcommunity_map(self, community: Community) -> Dict[str, str]:
        mapping = {}
        for sub in community.nodes:
            if isinstance(sub, Community):
                sub_id = self._community_id(sub.nodes)
                for node in self.extract_nodes_from_community(sub): 
                    mapping[node] = sub_id
        return mapping

    def extract_nodes_from_community(self, community: Community) -> List[str]:
        nodes: List[str] = []
        for entry in community.nodes:
            if isinstance(entry, str):
                nodes.append(entry)
            elif isinstance(entry, Community):
                nodes.extend(self.extract_nodes_from_community(entry))  # ✅ FIXED
        return nodes

    
    def _describe_node(self, node_id: str, node_attrs) -> str:
        node_type = node_attrs.get("sub_type", "Node")
        props = ", ".join(f"{k}: {v}" for k, v in node_attrs.items() if k not in ["x", "y", "sub_type"])
        desc = f"{node_type}({node_id})"
        if props:
            desc += f" [{props}]"
        return desc
    
    def _describe_edge(self, source: str, target: str, edge: dict) -> str:
        rel_type = edge.get("edge_type") or edge.get("label", "")
        props = ", ".join(f"{k}: {v}" for k, v in edge.items() if k not in ["edge_type", "label", "source", "target", "id"])
        desc = f"{source} -[{rel_type}]-> {target}"
        if props:
            desc += f" [{props}]"
        return desc
    
    def _community_id(self, community_nodes: List[Union[str, Community]]) -> str:
        def flatten(nodes: List[Union[str, Community]]) -> List[str]:
            flat = []
            for n in nodes:
                if isinstance(n, str):
                    flat.append(n)
                elif isinstance(n, Community):
                    flat.extend(flatten(n.nodes))
            return flat

        flat_nodes = flatten(community_nodes)
        
        if not flat_nodes:
            return "empty_community"
        
        base_name = "_".join(sorted(flat_nodes)[:3]).lower()
        unique_hash = hash(frozenset(flat_nodes)) % (10**8)
        return f"{base_name}_{unique_hash}"