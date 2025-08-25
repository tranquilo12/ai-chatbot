import { backend } from '@/lib/api/backend-client';
import { WoollyStreamAdapter } from '@/lib/streaming/woolly-stream-adapter';
import { ErrorHandler } from '@/lib/error-handler';
import type { ChatMessage } from '@/lib/types';
import { differenceInSeconds } from 'date-fns';

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: chatId } = await params;

    if (!chatId) {
      throw new Error('Chat ID is required');
    }

    // TODO: Implement proper stream resumption with Woolly backend
    // For now, we'll check if there are recent messages and restore the last one
    
    const resumeRequestedAt = new Date();
    
    // Get messages from backend to check for recent activity
    let messages: ChatMessage[] = [];
    try {
      messages = await backend.message.list(chatId);
    } catch (error) {
      // If no messages or chat doesn't exist, return empty stream
      console.log('No messages found for stream resumption:', chatId);
      return new Response(null, { status: 204 });
    }

    const mostRecentMessage = messages.at(-1);

    if (!mostRecentMessage) {
      return new Response(null, { status: 204 });
    }

    // Only resume if it's an assistant message
    if (mostRecentMessage.role !== 'assistant') {
      return new Response(null, { status: 204 });
    }

    // Only resume if the message is recent (within 15 seconds)
    // Note: ChatMessage might not have createdAt, so we'll use current time as fallback
    const messageCreatedAt = new Date(); // For now, assume recent messages
    if (differenceInSeconds(resumeRequestedAt, messageCreatedAt) > 15) {
      return new Response(null, { status: 204 });
    }

    // For now, just return 204 since stream resumption needs more backend support
    // TODO: Implement proper stream resumption when Woolly backend supports it
    return new Response(null, { status: 204 });
    
  } catch (error) {
    console.error('❌ Error in stream resumption:', error);
    return ErrorHandler.toResponse(error);
  }
}