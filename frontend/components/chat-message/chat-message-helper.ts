import { FinalAnswer, Message } from "@/types/message-type";

export function finalReportToMarkdown(answer: FinalAnswer): string {
  const replaced = answer.answer.replace(/\(see Subgraphs ([\d,\sand]+)\)/gi, (match, sectionList) => {
    const sections = sectionList
      .split(/,|\sand\s/)
      .map(s => s.trim())
      .filter(s => s !== "");

    const links = sections.map(sectionId => {
      const idNum = parseInt(sectionId);
      if (!isNaN(idNum) && idNum < answer.sub_graphs.length) {
        return `[Subgraph ${idNum}](#section-${idNum})`;
      } else {
        return `Subgraph ${sectionId}`;
      }
    });

    return `(${links.join(", ")})`;
  });

  return replaced;
}

  