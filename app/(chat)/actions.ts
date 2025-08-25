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
  // TODO: Implement trailing message deletion with Woolly backend
  // This would require the backend to support deleting messages after a specific message ID
  // For now, we'll log the request and return success to maintain UI functionality
  console.log('deleteTrailingMessages called with id:', id);
  
  // In the future, this would be something like:
  // await backend.message.deleteAfter(chatId, messageId);
  
  return { success: true };
}

export async function updateChatVisibility({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: VisibilityType;
}) {
  // TODO: Implement visibility update when backend supports it
  // For now, we'll use a placeholder that could be extended later
  try {
    // This would be: await backend.chat.updateVisibility(chatId, { visibility });
    console.log('updateChatVisibility called:', { chatId, visibility });
    
    // Return success for now to maintain UI functionality
    return { success: true };
  } catch (error) {
    console.error('Failed to update chat visibility:', error);
    throw error;
  }
}
