import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Button } from '@heroui/react';

import { finalReportToMarkdown } from './chat-message-helper';

import { useFilterContext } from '@/context/filter-context';
import { Message, MessageType } from '@/types/message-type';

export function ChatMessage(props: { message: Message }) {
  const { message } = props;
  const { setCurrentData } = useFilterContext();

  const isUser = message.type === MessageType.User;

  console.log(message);

  const contentMarkdown =
    typeof message.content === 'string' ? message.content : finalReportToMarkdown(message.content);

  const graphData = typeof message.content !== 'string' ? message.content.hole_graph : undefined;

  return (
    <div className={`w-full flex flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}>
      <div
        className={`
          p-3 
          max-w-[80%] 
          ${isUser ? 'bg-blue-100 text-right rounded-lg' : 'bg-gray-100 text-left rounded-lg'}
        `}
      >
        <ReactMarkdown
          components={{
            a: ({ node, href, children, ...props }) => {
              const sectionId = href?.replace('#section-', '');

              if (typeof message.content != 'string') {
                if (sectionId && message.content.sub_graphs.length > parseInt(sectionId)) {
                  return (
                    <a
                      {...props}
                      href={href}
                      style={{
                        cursor: 'pointer',
                        color: 'blue',
                        textDecoration: 'underline',
                      }}
                      title={`Show Subgraph ${sectionId}`}
                      onClick={(e) => {
                        e.preventDefault(); // <--- wichtig, damit Seite nicht scrollt
                        if (typeof message.content !== 'string') {
                          setCurrentData(message.content.sub_graphs[parseInt(sectionId)].graph);
                        }
                      }}
                    >
                      {children}
                    </a>
                  );
                }
              }
            },
          }}
          rehypePlugins={[rehypeHighlight]}
          remarkPlugins={[remarkGfm]}
        >
          {contentMarkdown}
        </ReactMarkdown>
      </div>

      {graphData && <Button onPress={() => setCurrentData(graphData)}>Show Graph</Button>}
    </div>
  );
}
