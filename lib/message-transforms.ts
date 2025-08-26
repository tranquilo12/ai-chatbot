import type { ChatMessage } from '@/lib/types';
import type { BackendMessage } from '@/lib/api/backend-client';

export interface BackendMessageRequest {
  role: 'user' | 'assistant';
  content: string;
  id?: string;
  tool_invocations?: any[];
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
}

export interface BackendChatRequest {
  messages: BackendMessageRequest[];
  model: string;
  agent_id?: string;
}

/**
 * Unified message transformation utilities
 * Eliminates duplication across the codebase for message format conversion
 */
export class MessageTransforms {
  /**
   * Convert frontend ChatMessage to backend message format
   * Replaces scattered parts.find() logic throughout the codebase
   */
  static toBackendMessage(message: ChatMessage): BackendMessageRequest {
    // Backend only supports 'user' and 'assistant' roles
    const role = message.role === 'system' ? 'assistant' : message.role as 'user' | 'assistant';

    return {
      role,
      content: this.extractTextContent(message),
      id: message.id,
      // tool_invocations: [], // TODO: Add when AI SDK supports it
    };
  }

  /**
   * Convert backend message to frontend ChatMessage format
   * Replaces convertToUIMessages() logic in lib/utils.ts
   */
  static fromBackendMessage(backendMessage: BackendMessage): ChatMessage {
    const message: ChatMessage = {
      id: backendMessage.id,
      role: backendMessage.role,
      parts: [{ type: "text", text: backendMessage.content }],
      // toolInvocations: backendMessage.tool_invocations || [], // TODO: Add when AI SDK supports it
    } as ChatMessage;

    // Add usage data to metadata if available
    // Note: Backend client converts snake_case to camelCase, so we use camelCase field names
    const promptTokens = (backendMessage as any).promptTokens;
    const completionTokens = (backendMessage as any).completionTokens;
    const totalTokens = (backendMessage as any).totalTokens;
    const createdAt = (backendMessage as any).createdAt;

    if (promptTokens != null || completionTokens != null || totalTokens != null) {
      message.metadata = {
        createdAt: createdAt,
        usage: {
          promptTokens: promptTokens,
          completionTokens: completionTokens,
          totalTokens: totalTokens,
        }
      };
    } else if (createdAt) {
      message.metadata = {
        createdAt: createdAt,
      };
    }

    return message;
  }

  /**
   * Extract text content from ChatMessage parts
   * Replaces getTextFromMessage() logic in lib/utils.ts
   */
  static extractTextContent(message: ChatMessage): string {
    return message.parts?.find((part) => part.type === "text")?.text || "";
  }

  /**
   * Prepare multiple messages for backend API request
   * Replaces prepareSendMessagesRequest logic in components/chat.tsx
   */
  static prepareMessagesForBackend(
    messages: ChatMessage[]
  ): BackendMessageRequest[] {
    return messages.map((msg) => this.toBackendMessage(msg));
  }

  /**
   * Create a backend chat request from frontend data
   * Unifies the request format used in API routes
   */
  static createChatRequest(
    messages: ChatMessage[],
    model: string = 'gpt-4o',
    agentId?: string
  ): BackendChatRequest {
    return {
      messages: this.prepareMessagesForBackend(messages),
      model,
      ...(agentId && { agent_id: agentId }),
    };
  }

  /**
   * Convert multiple backend messages to frontend format
   * Batch conversion utility
   */
  static fromBackendMessages(backendMessages: BackendMessage[]): ChatMessage[] {
    return backendMessages.map((msg) => this.fromBackendMessage(msg));
  }

  /**
   * Extract the last message from a messages array
   * Common pattern used in chat components
   */
  static getLastMessage(messages: ChatMessage[]): ChatMessage | undefined {
    return messages.at(-1);
  }

  /**
   * Check if a message has text content
   * Utility for validation
   */
  static hasTextContent(message: ChatMessage): boolean {
    return this.extractTextContent(message).trim().length > 0;
  }

  /**
   * Create a user message from text input
   * Utility for creating messages from user input
   */
  static createUserMessage(text: string, id?: string): ChatMessage {
    return {
      id: id || crypto.randomUUID(),
      role: 'user',
      parts: [{ type: 'text', text }],
      // createdAt: new Date(), // TODO: Add when AI SDK supports it
    } as ChatMessage;
  }

  /**
   * Update message content while preserving other properties
   * Utility for message editing
   */
  static updateMessageContent(message: ChatMessage, newContent: string): ChatMessage {
    return {
      ...message,
      parts: [{ type: 'text', text: newContent }],
    };
  }
}
