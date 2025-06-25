from typing import List
import networkx as nx
from nl_querying.indexing.find_communities.models.community import Community
import igraph as ig
import leidenalg


class LeidenAlgorithm:
    def __init__(self, min_size: int):
        self.min_size = min_size
        self.opt = leidenalg.Optimiser()

    def detect_communities(self, graph: nx.DiGraph, level: int) -> Community:
        nodes = list(graph.nodes())
        edges = list(graph.edges())

        g = ig.Graph()
        g.add_vertices(nodes)
        g.vs["id"] = nodes
        g.add_edges(edges)

        partition = leidenalg.find_partition(g, leidenalg.ModularityVertexPartition)
        self.opt.optimise_partition(partition, n_iterations=-1)

        if len(partition) == 1 or all(len(c) == len(nodes) for c in partition):
            return Community(
                level=level,
                nodes=nodes
            )
        
        result: List[Community] = []
        for community in partition:
            community_nodes = [g.vs[v]["id"] for v in community]
            if len(community_nodes) >= self.min_size:
                subgraph = graph.subgraph(community_nodes).copy()
                result.append(self.detect_communities(graph=subgraph, level=level + 1))
            else:
                result.append(
                    Community(
                        level=level + 1,
                        nodes=community_nodes
                    )
                )
        return Community(
            level=level,
            nodes=result
        )

