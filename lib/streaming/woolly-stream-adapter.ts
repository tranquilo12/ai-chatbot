import { createUIMessageStream } from 'ai';
import { getWoollyBackendUrl } from '../constants';
import type { ChatMessage } from '@/lib/types';
import { MessageTransforms } from '../message-transforms';
import { ErrorHandler } from '../error-handler';

// Add constants for the write types
const STREAM_PARTS = {
  START: (messageId: string) => ({
    type: 'start' as const,
    messageId: messageId,
  }),
  TEXT_START: (id: string) => ({
    type: 'text-start' as const,
    id: id,
  }),
  TEXT_DELTA: (id: string, delta: string) => ({
    type: 'text-delta' as const,
    delta: delta,
    id: id,
  }),
  TEXT_END: (id: string) => ({
    type: 'text-end' as const,
    id: id,
  }),
  FINISH: (messageMetadata?: { createdAt: string }) => ({
    type: 'finish' as const,
    messageMetadata: messageMetadata,
  }),
  ERROR: (errorText: string) => ({
    type: 'error' as const,
    errorText: errorText,
  }),
} as const;


export class WoollyStreamAdapter {
  static async createMessageStream(
    chatId: string,
    message: ChatMessage,
    options: { onProgress?: (chunk: string) => void; messageId?: string } = {}
  ) {
    return createUIMessageStream<ChatMessage>({
      execute: async ({ writer }) => {
        try {
          const backendMessage = MessageTransforms.toBackendMessage(message);

          const response = await fetch(`${getWoollyBackendUrl()}/api/chat/${chatId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: [backendMessage],
              model: 'gpt-4o',
            }),
          }).then(async (res) => {
            if (!res.ok) {
              throw ErrorHandler.fromBackendError(await res.json());
            }
            return res;
          });

          const reader = response.body?.getReader();
          if (!reader) throw new Error('No response body to stream');

          const decoder = new TextDecoder();
          let buffer = '';
          let messageId: string = '';
          // const messageId = options.messageId || crypto.randomUUID();

          // Send message start event first

          // Send initial text start event
          // writer.write(STREAM_PARTS.TEXT_START(messageId));

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {

              if (line.trim() && line.startsWith('1:')) {
                // Handle message start event if needed, e.g., extract message ID
                const data: { id: string; role: string, parts: { type: string; text: string }[] } = JSON.parse(line.substring(2));
                messageId = data.id;
                writer.write(STREAM_PARTS.START(messageId));
                writer.write(STREAM_PARTS.TEXT_START(messageId));
              }
              else if (line.trim() && line.startsWith('0:')) {
                const data: { type: string; text: string } = JSON.parse(line.substring(2));
                if (data.type === 'text' && data.text) {
                  writer.write(STREAM_PARTS.TEXT_DELTA(messageId, data.text));
                  options.onProgress?.(data.text);
                }
              } else if (line.trim() && line.startsWith('2:')) {
                // Handle final message event if needed
                // const data: { id: string; role: string, parts: { type: string; text: string }[] } = JSON.parse(line.substring(2));
                writer.write(STREAM_PARTS.TEXT_END(messageId));
              } else if (line.trim() && line.startsWith('e:')) {
                // Handle finish event - send completion event
                // const data: { finishReason: string; usage: { promptTokens: number; completionTokens: number; totalTokens: number }, isContinued: boolean } = JSON.parse(line.substring(2));
                writer.write(STREAM_PARTS.FINISH({ createdAt: new Date().toISOString() }));
                break;
              }
            }
          }
        } catch (error) {
          console.error('❌ Error in WoollyStreamAdapter:', error);
          throw error;
        }
      },
    });
  }
}