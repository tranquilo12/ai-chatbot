import { PreviewMessage, ThinkingMessage } from '../message';
import { Greeting } from '../greeting';
import { memo } from 'react';
import type { Vote } from '@/lib/db/schema';
import equal from 'fast-deep-equal';
import type { UseChatHelpers } from '@ai-sdk/react';
import { motion } from 'framer-motion';
import { useMessages } from '@/hooks/use-messages';
import type { ChatMessage } from '@/lib/types';
import { useDataStream } from '../data-stream-provider';
import { cn } from '@/lib/utils';

interface MessageListProps {
  chatId: string;
  messages: ChatMessage[];
  status: UseChatHelpers<ChatMessage>['status'];
  votes: Array<Vote> | undefined;
  setMessages: UseChatHelpers<ChatMessage>['setMessages'];
  regenerate: UseChatHelpers<ChatMessage>['regenerate'];
  isReadonly: boolean;
  variant?: 'default' | 'artifact';
  className?: string;
}

function PureMessageList({
  chatId,
  messages,
  status,
  votes,
  setMessages,
  regenerate,
  isReadonly,
  variant = 'default',
  className,
}: MessageListProps) {
  const {
    containerRef,
    endRef,
    onViewportEnter,
    onViewportLeave,
    hasSentMessage,
  } = useMessages({ chatId, status });

  useDataStream();

  const containerClasses = cn(
    'flex flex-col overflow-y-scroll overflow-x-hidden message-container prevent-x-overflow',
    {
      'min-w-0 flex-1 pt-4 relative items-center': variant === 'default',
      'h-full items-center px-4 pt-20': variant === 'artifact',
    },
    className
  );

  return (
    <div ref={containerRef} className={containerClasses}>
      {messages.length === 0 && variant === 'default' && <Greeting />}

      <div className="w-full flex flex-col gap-4 chat-container-padding">
        {messages.map((message, index) => (
          <PreviewMessage
            key={message.id}
            chatId={chatId}
            message={message}
            isLoading={status === 'streaming' && messages.length - 1 === index}
            vote={votes?.find((vote) => vote.messageId === message.id)}
            setMessages={setMessages}
            regenerate={regenerate}
            isReadonly={isReadonly}
            requiresScrollPadding={
              hasSentMessage && index === messages.length - 1
            }
            allMessages={messages}
          />
        ))}

        {status === 'submitted' &&
          messages.length > 0 &&
          messages[messages.length - 1].role === 'user' && <ThinkingMessage />}
      </div>

      <motion.div
        ref={endRef}
        className="shrink-0 min-w-[24px] min-h-[24px]"
        onViewportLeave={onViewportLeave}
        onViewportEnter={onViewportEnter}
      />
    </div>
  );
}

function areEqual(
  prevProps: MessageListProps,
  nextProps: MessageListProps,
) {
  // Skip re-render if both are artifact visible (optimization)
  if (prevProps.variant === 'artifact' && nextProps.variant === 'artifact') {
    return true;
  }

  if (prevProps.status !== nextProps.status) return false;
  // Force updates while streaming so deltas show incrementally
  if (nextProps.status === 'streaming') return false;
  if (prevProps.messages.length !== nextProps.messages.length) return false;
  if (!equal(prevProps.messages, nextProps.messages)) return false;
  if (!equal(prevProps.votes, nextProps.votes)) return false;

  return true;
}

export const MessageList = memo(PureMessageList, areEqual);
