import networkx as nx

from nl_querying.indexing.find_communities.models.community import Community
from nl_querying.indexing.summarize_communities.community_summarizer.community_summarizer import CommunitySummarizer
from nl_querying.indexing.find_communities.leiden_algorithm.leiden_algorithm import LeidenAlgorithm
from nl_querying.utils.llm import LLM


class IndexingService3:
    def __init__(self, llm: LLM, min_size: int = 12):
        self.llm = llm

        self.community_detector = LeidenAlgorithm(min_size=min_size)
        self.community_summarizer = CommunitySummarizer(self.llm, summary_path="summaries")

    async def index(self, graph: nx.DiGraph):
        print("Searching for Communities.")
        communities: Community = self.community_detector.detect_communities(graph=graph, level=1)
        print("Summarizing Communities.")
        await self.community_summarizer.summarize_community(graph=graph, community=communities)