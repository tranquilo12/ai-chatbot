'use server';

import { cookies } from 'next/headers';
import type { UIMessage } from 'ai';
import type { VisibilityType } from '@/components/visibility-selector';

export async function saveChatModelAsCookie(model: string) {
  const cookieStore = await cookies();
  cookieStore.set('chat-model', model);
}

export async function generateTitleFromUserMessage({
  message,
}: {
  message: UIMessage;
}) {
  // Return a simple title for now - we'll let Woolly backend handle this
  const text = message.parts?.find(part => part.type === 'text')?.text || 'New Chat';
  return text.slice(0, 50) + (text.length > 50 ? '...' : '');
}

export async function deleteTrailingMessages({ id }: { id: string }) {
  // Disabled for now - let Woolly backend handle message management
  console.log('deleteTrailingMessages called with id:', id);
}

export async function updateChatVisibility({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: VisibilityType;
}) {
  // Disabled for now - let Woolly backend handle visibility
  console.log('updateChatVisibility called:', { chatId, visibility });
}
