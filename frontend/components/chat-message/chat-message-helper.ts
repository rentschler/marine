import { FinalAnswer } from "@/types/message-type";

export function finalReportToMarkdown(answer: FinalAnswer): string {
  let replaced = answer.answer;

  replaced = replaced.replace(/\((?:see|e\.g\.)?,?\s*Subgraphs?\s*([\d,\sandthrough\-]+)\)/gi, (match, sectionList) => {
    const sections = sectionList
      .split(/,|\sand\s/)
      .flatMap(part => {
        part = part.trim();
        const rangeMatch = part.match(/^(\d+)\s*(?:through|\-)\s*(\d+)$/);
        if (rangeMatch) {
          const start = parseInt(rangeMatch[1], 10);
          const end = parseInt(rangeMatch[2], 10);
          return Array.from({ length: end - start + 1 }, (_, i) => (start + i).toString());
        }
        return part;
      })
      .filter(s => s !== "");

    const links = sections.map(sectionId => {
      const idNum = parseInt(sectionId, 10);
      if (!isNaN(idNum) && idNum < answer.sub_graphs.length) {
        return `Subgraph ${idNum}`;
      } else {
        return `Subgraph ${sectionId}`;
      }
    });

    return `(${links.join(", ")})`;
  });

  replaced = replaced.replace(/\bSubgraphs?\s+([\d,\sandthrough\-]+)\b/gi, (match, sectionList) => {
    const sections = sectionList
      .split(/,|\sand\s/)
      .flatMap(part => {
        part = part.trim();
        const rangeMatch = part.match(/^(\d+)\s*(?:through|\-)\s*(\d+)$/);
        if (rangeMatch) {
          const start = parseInt(rangeMatch[1], 10);
          const end = parseInt(rangeMatch[2], 10);
          return Array.from({ length: end - start + 1 }, (_, i) => (start + i).toString());
        }
        return part;
      })
      .filter(s => s !== "");

    const links = sections.map(sectionId => {
      const idNum = parseInt(sectionId, 10);
      if (!isNaN(idNum) && idNum < answer.sub_graphs.length) {
        return `[Subgraph ${idNum}](#section-${idNum}) `;
      } else {
        return `Subgraph ${sectionId} `;
      }
    });

    return links.join(", ");
  });

  return replaced;
}
