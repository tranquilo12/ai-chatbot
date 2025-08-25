import { cookies } from 'next/headers';

import { Chat } from '@/components/chat';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import { backend } from '@/lib/api/backend-client';
import { ErrorHandler } from '@/lib/error-handler';
import type { ChatMessage } from '@/lib/types';

// Mock session for development without auth
const mockSession = {
  user: {
    id: 'mock-user-id',
    email: 'user@example.com',
    type: 'regular' as const,
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;
  
  const session = mockSession;
  
  // Fetch messages from Woolly backend using our DRY utilities
  let uiMessages: ChatMessage[] = [];
  try {
    uiMessages = await backend.message.list(id);
  } catch (error) {
    // If chat doesn't exist or has no messages, start with empty array
    console.log('No messages found for chat:', id, error);
    uiMessages = [];
  }

  const cookieStore = await cookies();
  const chatModelFromCookie = cookieStore.get('chat-model');

  if (!chatModelFromCookie) {
    return (
      <>
        <Chat
          id={id}
          initialMessages={uiMessages}
          initialChatModel={DEFAULT_CHAT_MODEL}
          initialVisibilityType="private"
          isReadonly={false}
          session={session}
          autoResume={true}
        />
        <DataStreamHandler />
      </>
    );
  }

  return (
    <>
      <Chat
        id={id}
        initialMessages={uiMessages}
        initialChatModel={chatModelFromCookie.value}
        initialVisibilityType="private"
        isReadonly={false}
        session={session}
        autoResume={true}
      />
      <DataStreamHandler />
    </>
  );
}
