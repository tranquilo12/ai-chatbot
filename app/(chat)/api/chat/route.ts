import { WoollyStreamAdapter } from '@/lib/streaming/woolly-stream-adapter';
import { ErrorHandler } from '@/lib/error-handler';
import { backend } from '@/lib/api/backend-client';
import { generateId, createUIMessageStreamResponse } from 'ai';

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Handle both custom format and standard AI SDK format
    const chatId = body.id || body.chatId || crypto.randomUUID();

    // Extract all messages for conversation context
    const messages = body.messages || (body.message ? [body.message] : []);

    if (!messages || messages.length === 0) {
      throw new Error('No messages provided');
    }

    // Generate a proper message ID for the assistant response
    const messageId = generateId();

    // Use the WoollyStreamAdapter to create a properly formatted AI SDK stream with full conversation history
    const stream = await WoollyStreamAdapter.createMessageStream(chatId, messages, { messageId });

    const response = createUIMessageStreamResponse({
      stream,
      headers: {
        'Content-Encoding': 'none',
        'Cache-Control': 'no-cache, no-transform',
        'X-Accel-Buffering': 'no', // Critical for nginx proxy
        'x-vercel-ai-ui-message-stream': 'v1', // Critical for AI SDK UI message stream
      }
    });

    return response;
  } catch (error) {
    return ErrorHandler.toResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('id');

    if (!chatId) {
      throw new Error('Chat ID is required');
    }

    await backend.chat.delete(chatId);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('❌ Error deleting chat:', error);
    return ErrorHandler.toResponse(error);
  }
}
