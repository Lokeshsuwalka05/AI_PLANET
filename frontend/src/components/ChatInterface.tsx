import React, { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReactMarkdown from 'react-markdown';

// Error boundary component for markdown rendering
class MarkdownErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <div className="text-sm">Error rendering markdown content</div>;
    }
    return this.props.children;
  }
}

interface ChatInterfaceProps {
  document: {
    filename: string;
  };
  messages: {
    id: string;
    type: 'user' | 'ai';
    content: string;
    timestamp: Date;
  }[];
  onQuestionSubmit: (question: string) => void;
  isLoading: boolean;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  document,
  messages,
  onQuestionSubmit,
  isLoading,
}) => {
  const [question, setQuestion] = React.useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim() && !isLoading) {
      onQuestionSubmit(question);
      setQuestion('');
    }
  };

  const renderMessage = (message: { type: 'user' | 'ai'; content: string }) => {
    if (message.type === 'user') {
      return message.content;
    }

    return (
      <MarkdownErrorBoundary>
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-2">{children}</p>,
              ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
              li: ({ children }) => <li className="mb-1">{children}</li>,
              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
              em: ({ children }) => <em className="italic">{children}</em>,
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      </MarkdownErrorBoundary>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="p-4 border-b bg-white">
        <h2 className="text-lg font-semibold">{document.filename}</h2>
      </div>

      <ScrollArea
        ref={scrollRef}
        className="flex-1 p-4 overflow-y-auto"
        style={{ maxHeight: 'calc(100vh - 16rem)' }}
      >
        <div className="space-y-4 max-w-4xl mx-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'
                }`}
            >
              <div
                className={`max-w-[85%] rounded-lg p-4 ${message.type === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-900'
                  }`}
              >
                {renderMessage(message)}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg p-4">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t bg-white">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="flex space-x-2">
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question about the document..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !question.trim()}>
              Send
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};