'use client';

import { useChat } from '@ai-sdk/react';
import { useEffect, useState, memo } from 'react';
import { ChatHeader } from '@/components/chat-header';
import type { Vote } from '@/lib/db/schema';
import { Artifact } from './artifact';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages';
import type { VisibilityType } from './visibility-selector';
import { useArtifactSelector } from '@/hooks/use-artifact';
import type { Session } from 'next-auth';
import { useSearchParams } from 'next/navigation';
import { useChatVisibility } from '@/hooks/use-chat-visibility';
import { useAutoResume } from '@/hooks/use-auto-resume';
import type { Attachment, ChatMessage } from '@/lib/types';
import { useUsage } from '@/lib/contexts/usage-context';
import { useChatConfig } from '@/hooks/use-chat-config';
import { ResizableChatLayout } from './resizable-chat-layout';
import { ChatTitleProvider } from './chat-title-context';
import { ChatListProvider } from './chat-list-context';


function PureChat({
  id,
  initialMessages,
  initialChatModel,
  initialVisibilityType,
  isReadonly,
  session,
  autoResume,
}: {
  id: string;
  initialMessages: ChatMessage[];
  initialChatModel: string;
  initialVisibilityType: VisibilityType;
  isReadonly: boolean;
  session: Session;
  autoResume: boolean;
}) {
  const { visibilityType } = useChatVisibility({
    chatId: id,
    initialVisibilityType,
  });

  const [input, setInput] = useState<string>('');
  const { resetChatUsage } = useUsage();
  const [currentChatTitle, setCurrentChatTitle] = useState<string>('New Chat');

  // Use centralized chat configuration for consistency and DRY principles
  const chatConfig = useChatConfig({
    chatId: id,
    initialModel: initialChatModel,
    currentChatTitle,
    setCurrentChatTitle,
  });

  const {
    messages,
    setMessages,
    sendMessage,
    status,
    stop,
    regenerate,
    resumeStream,
  } = useChat<ChatMessage>({
    ...chatConfig,
    messages: initialMessages,
  });

  const searchParams = useSearchParams();
  const query = searchParams.get('query');

  const [hasAppendedQuery, setHasAppendedQuery] = useState(false);

  // Reset usage when chat changes
  useEffect(() => {
    resetChatUsage();
    // Reset to default title for new chats
    setCurrentChatTitle('New Chat');
  }, [id, resetChatUsage]);

  useEffect(() => {
    if (query && !hasAppendedQuery) {
      sendMessage({
        role: 'user' as const,
        parts: [{ type: 'text', text: query }],
      });

      setHasAppendedQuery(true);
      window.history.replaceState({}, '', `/chat/${id}`);
    }
  }, [query, sendMessage, hasAppendedQuery, id]);

  // TODO: Implement voting with Woolly backend when available
  // Temporarily disabled since Woolly backend doesn't support voting yet
  const votes: Array<Vote> = []; // Empty array to maintain component compatibility

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);

  useAutoResume({
    autoResume,
    initialMessages,
    resumeStream,
    setMessages,
  });

  return (
    <>
      <ResizableChatLayout>
        <div className="chat-main-container panel-primary-bg">
          <ChatHeader
            chatId={id}
            selectedModelId={initialChatModel}
            selectedVisibilityType={initialVisibilityType}
            isReadonly={isReadonly}
            session={session}
          />

          <Messages
            chatId={id}
            status={status}
            votes={votes}
            messages={messages}
            setMessages={setMessages}
            regenerate={regenerate}
            isReadonly={isReadonly}
            isArtifactVisible={isArtifactVisible}
          />

          <div className="chat-content-area chat-input-area chat-container-padding panel-primary-bg">
            <form className="flex gap-2 w-full prevent-x-overflow">
              {!isReadonly && (
                <MultimodalInput
                  chatId={id}
                  input={input}
                  setInput={setInput}
                  status={status}
                  stop={stop}
                  attachments={attachments}
                  setAttachments={setAttachments}
                  messages={messages}
                  setMessages={setMessages}
                  sendMessage={sendMessage}
                  selectedVisibilityType={visibilityType}
                />
              )}
            </form>
          </div>
        </div>
      </ResizableChatLayout>

      <Artifact
        chatId={id}
        input={input}
        setInput={setInput}
        status={status}
        stop={stop}
        attachments={attachments}
        setAttachments={setAttachments}
        sendMessage={sendMessage}
        messages={messages}
        setMessages={setMessages}
        regenerate={regenerate}
        votes={votes}
        isReadonly={isReadonly}
        selectedVisibilityType={visibilityType}
      />
    </>
  );
}

// Memoize the Chat component to prevent unnecessary re-renders
export const Chat = memo(PureChat);
