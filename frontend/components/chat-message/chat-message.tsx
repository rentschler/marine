import { Message, MessageType } from "@/types/message-type";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { Button } from "@heroui/react";
import { useFilterContext } from "@/context/filter-context";


export function ChatMessage(props: {
  message: Message;
}) {
  const { message } = props;
  const { setCurrentData } = useFilterContext();

  const isUser = message.type === MessageType.User;
  console.log(message)

  const contentMarkdown =
    typeof message.content === "string"
      ? message.content
      : message.content.answer;

  const graphData =
    typeof message.content !== "string" ? message.content.hole_graph : undefined;

  return (
    <div
      className={`w-full flex flex-col gap-2 ${
        isUser ? "items-end" : "items-start"
      }`}
    >
      <div
        className={`
          p-3 
          max-w-[80%] 
          ${isUser ? "bg-blue-100 text-right rounded-lg" : "bg-gray-100 text-left rounded-lg"}
        `}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
        >
          {contentMarkdown}
        </ReactMarkdown>
      </div>

      {graphData && (
        <Button onPress={() => setCurrentData(graphData)}>
          Show Graph
        </Button>
      )}
    </div>
  );
}
