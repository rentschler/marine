import re, json
from typing import Dict, List
#from models.final_answer import FinalAnswer


class FinalAnswerParser:

    def parse_llm_final_response(self, text: str) -> Dict:
        answer_text = text.get("answer", "").strip()
        lines = answer_text.strip().split('\n')

        title_line = lines[0].replace('##', '').strip()
        sections = []
        current_section = {"heading": "Summary", "content": "", "data_nodes": []}
        for line in lines[1:]:
            if line.strip().startswith("### "):
                if current_section["content"].strip():
                    current_section["data_nodes"] =self._extract_data_nodes(current_section["content"])
                    sections.append(current_section)
                heading = line.strip().replace("### ", "").strip()
                current_section = {"heading": heading, "content": "", "data_nodes": []}
            else:
                current_section["content"] += line + '\n'

        if current_section["content"].strip():
            current_section["data_nodes"] = self._extract_data_nodes(current_section["content"])
            sections.append(current_section)

        return {
            "title": title_line,
            "summary": sections[0]["content"].strip() if sections else "",
            "sections": sections
        }


    def _extract_data_nodes(self, text: str) -> List[str]:
        matches = re.findall(r'(?:\b|\()[A-Za-z]+_[A-Za-z]+_\d+\b', text)
        clean_nodes = sorted(set(match.strip("()") for match in matches))
        return clean_nodes