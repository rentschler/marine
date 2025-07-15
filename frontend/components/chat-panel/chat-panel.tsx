import { ChatMessage } from '../chat-message/chat-message';

import { Message } from '@/types/message-type';

export function ChatPanel(props: { messages: Message[] }) {
  const { messages } = props;

  return (
    <div className="h-full w-full p-5 overflow-hidden">
      {messages.length === 0 ? (
        <div className="h-full w-full flex items-center justify-center text-3xl font-bold text-gray-800 mb-2">
          <h1>How can I help you?</h1>
        </div>
      ) : (
        <div className="h-full w-full overflow-y-auto flex flex-col gap-4 pr-2">
          {messages.map((message: Message, index: number) => (
            <ChatMessage key={index} message={message} />
          ))}
        </div>
      )}
    </div>
  );
}
