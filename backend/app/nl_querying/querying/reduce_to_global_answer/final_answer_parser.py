import re
from typing import List, Set

from database_utils.get_edge_by_target_source import get_edge_by_source_target
from database_utils.get_nighbor_entities import get_neighbor_entities
from database_utils.get_node_by_id import get_node_by_id
from models.Graph import EDefault, Graph, GraphData, Link, Node
from nl_querying.querying.models.final_report import FinalReport, Section


class FinalAnswerParser:

    async def parse_llm_final_response(self, text: dict, session) -> FinalReport:
        answer_text = text.get("answer", "").strip()
        lines = answer_text.split('\n')

        title_line = lines[0].replace('##', '').strip()
        sections = []
        current_section = {"heading": "Summary", "content": "", "data_nodes": []}

        for line in lines[1:]:
            if line.strip().startswith("### "):
                if current_section["content"].strip():
                    current_section["data_nodes"] = self._extract_data_nodes(current_section["content"])
                    sections.append(Section(**current_section))
                heading = line.strip().replace("### ", "").strip()
                current_section = {"heading": heading, "content": "", "data_nodes": []}
            else:
                current_section["content"] += line + '\n'

        if current_section["content"].strip():
            current_section["data_nodes"] = self._extract_data_nodes(current_section["content"])
            sections.append(Section(**current_section))

        report =  FinalReport(
            title=title_line,
            summary=sections[0].content.strip() if sections else "",
            sections=sections
        )
        graph = await self.build_answer_graph(report=report, session=session)
        report.graph = graph
        report.model_dump(exclude_unset=True, exclude_none=True)
        return report


    def _extract_data_nodes(self, text: str) -> List[str]:
        matches = re.findall(r'(?:\b|\()[A-Za-z]+_[A-Za-z]+_\d+\b', text)
        clean_nodes = sorted(set(match.strip("()") for match in matches))
        return clean_nodes
    
    async def build_answer_graph(self, report: FinalReport, session) -> GraphData:
        seen_node_ids: Set[str] = set()
        graph_nodes: dict[str, Node] = {}
        graph_links: List[Link] = []

        for section in report.sections:
            if not section.data_nodes:
                continue
            for node_id in section.data_nodes:
                if node_id in seen_node_ids:
                    continue

                node: Node = await get_node_by_id(session, node_id)
                graph_nodes[node.id] = node
                seen_node_ids.add(node.id)

                neighbors: List[Node] = await get_neighbor_entities(session, node)

                for neighbor in neighbors:
                    if neighbor.id not in seen_node_ids:
                        graph_nodes[neighbor.id] = neighbor
                        seen_node_ids.add(neighbor.id)

                    edge = await get_edge_by_source_target(session, node, neighbor)
                    if edge:
                        graph_links.append(edge)

        graph = Graph(
            mode="default",  
            edge_default=EDefault(),
            node_default=EDefault(),
            name="LLM Answer Graph"
        )

        return GraphData(
            directed=True,
            graph = graph,
            multigraph=False,
            nodes=list(graph_nodes.values()),
            links=graph_links
        )
