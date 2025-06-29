import { FinalAnswer, Message } from "@/types/message-type";

export function finalReportToMarkdown(report: FinalAnswer): string {
  let md = `# ${report.title}\n\n`;
  md += `**Summary:** ${report.summary}\n\n`;

  for (const section of report.sections) {
    md += `## ${section.heading}\n\n`;
    md += `${section.content}\n\n`;

    if (section.data_nodes.length > 0) {
      md += `**Data Nodes:** ${section.data_nodes.join(", ")}\n\n`;
    }

    if (section.sub_graph) {
      md += `_This section includes a graph._\n\n`;
    }
  }

  if (report.graph) {
    md += `_This report includes a global graph._\n`;
  }

  return md;
}
  