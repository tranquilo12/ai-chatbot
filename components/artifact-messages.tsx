import { MessageList } from './shared/message-list';
import type { Vote } from '@/lib/db/schema';
import type { UIArtifact } from './artifact';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { ChatMessage } from '@/lib/types';

interface ArtifactMessagesProps {
  chatId: string;
  status: UseChatHelpers<ChatMessage>['status'];
  votes: Array<Vote> | undefined;
  messages: ChatMessage[];
  setMessages: UseChatHelpers<ChatMessage>['setMessages'];
  regenerate: UseChatHelpers<ChatMessage>['regenerate'];
  isReadonly: boolean;
  artifactStatus: UIArtifact['status'];
}

export function ArtifactMessages(props: ArtifactMessagesProps) {
  return <MessageList {...props} variant="artifact" />;
}