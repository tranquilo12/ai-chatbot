import { getWoollyBackendUrl } from '../constants';
import { MessageTransforms } from '../message-transforms';
import { ErrorHandler } from '../error-handler';
import type { ChatMessage } from '@/lib/types';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface BackendError {
  detail: string;
  status?: number;
}

export interface BackendChat {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
}

export interface BackendMessage {
  id: string;
  chat_id: string;
  role: 'user' | 'assistant';
  content: string;
  model: string;
  created_at: string;
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  tool_invocations?: any[];
}

export interface BackendAgent {
  id: string;
  name: string;
  description: string;
  system_prompt: string;
  tools: string[];
  created_at: string;
  is_active: boolean;
  repository?: string;
}

export interface BackendHealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp?: string;
}

export interface CreateChatRequest {
  agent_id?: string;
}

export interface CreateChatResponse {
  id: string;
}

export interface UpdateChatTitleRequest {
  title: string;
}

export interface UpdateChatTitleResponse {
  success: boolean;
  title: string;
}

export interface GenerateTitleRequest {
  chat_id: string;
  model?: string;
}

export interface GenerateTitleResponse {
  chat_id: string;
  title: string;
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface GenerateSummaryRequest {
  chat_id: string;
  model?: string;
}

export interface GenerateSummaryResponse {
  chat_id: string;
  summary: string;
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface GenerateRollingSummaryRequest {
  chat_id: string;
  skip_interactions: number;
  model?: string;
}

export interface GenerateRollingSummaryResponse {
  chat_id: string;
  summary: string;
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface CreateMessageRequest {
  role: 'user' | 'assistant';
  content: string;
  toolInvocations?: any[];
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
}

export interface UpdateMessageRequest {
  content: string;
}

export interface UpdateMessageModelRequest {
  model: string;
}

export interface CreateAgentRequest {
  name: string;
  description: string;
  system_prompt: string;
  tools: string[];
  repository?: string;
}

export interface UpdateAgentRequest {
  name?: string;
  description?: string;
  system_prompt?: string;
  tools?: string[];
  is_active?: boolean;
}

export interface DeleteResponse {
  success: boolean;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Convert snake_case keys to camelCase recursively
 */
function toCamelCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(toCamelCase);
  } else if (obj !== null && typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      if (Object.hasOwn(obj, key)) {
        const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        result[camelKey] = toCamelCase(obj[key]);
      }
    }
    return result;
  }
  return obj;
}

/**
 * Convert camelCase keys to snake_case recursively
 */
function toSnakeCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(toSnakeCase);
  } else if (obj !== null && typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      if (Object.hasOwn(obj, key)) {
        const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
        result[snakeKey] = toSnakeCase(obj[key]);
      }
    }
    return result;
  }
  return obj;
}

/**
 * Convert backend error to a standardized error object
 */
function fromBackendError(error: any, status?: number): BackendError {
  if (typeof error === 'string') {
    return { detail: error, status };
  }
  if (error && typeof error === 'object' && error.detail) {
    return { detail: error.detail, status: status || error.status };
  }
  return { detail: 'An unknown error occurred', status: status || 500 };
}

// ============================================================================
// Core Request Function
// ============================================================================

/**
 * Generic request function with error handling and data transformation
 */
async function request<T = any>(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  body?: any
): Promise<T> {
  const url = `${getWoollyBackendUrl()}${path}`;

  // Validate URL before making request
  try {
    new URL(url);
  } catch (error) {
    throw fromBackendError(`Invalid backend URL: ${url}`, 500);
  }

  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body && method !== 'GET') {
    options.body = JSON.stringify(toSnakeCase(body));
  }

  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      let errorData: any;
      try {
        errorData = await response.json();
      } catch {
        errorData = `HTTP ${response.status}: ${response.statusText}`;
      }
      throw fromBackendError(errorData, response.status);
    }

    // Handle empty responses (like DELETE operations)
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return {} as T;
    }

    const data = await response.json();
    return toCamelCase(data) as T;
  } catch (error) {
    if (error instanceof Error && 'detail' in error) {
      throw error; // Re-throw BackendError
    }
    throw fromBackendError(error);
  }
}

// ============================================================================
// API Namespaces
// ============================================================================

/**
 * Chat management namespace
 */
export const chat = {
  /**
   * Create a new chat
   */
  async create(params?: CreateChatRequest): Promise<CreateChatResponse> {
    return request<CreateChatResponse>('POST', '/api/chat/create', params);
  },

  /**
   * List all chats
   */
  async list(): Promise<BackendChat[]> {
    return request<BackendChat[]>('GET', '/api/chats');
  },

  /**
   * Delete a chat
   */
  async delete(chatId: string): Promise<DeleteResponse> {
    return request<DeleteResponse>('DELETE', `/api/chat/${chatId}`);
  },

  /**
   * Update chat title
   */
  async updateTitle(chatId: string, params: UpdateChatTitleRequest): Promise<UpdateChatTitleResponse> {
    return request<UpdateChatTitleResponse>('PATCH', `/api/chat/${chatId}/title`, params);
  },

  /**
   * Generate chat title using AI
   */
  async generateTitle(chatId: string, model: string = 'gpt-4o-mini'): Promise<GenerateTitleResponse> {
    return request<GenerateTitleResponse>('POST', `/api/chat/${chatId}/generate-title`, {
      chat_id: chatId,
      model,
    });
  },

  /**
   * Generate conversation summary using AI
   */
  async generateSummary(chatId: string, model: string = 'gpt-4o-mini'): Promise<GenerateSummaryResponse> {
    return request<GenerateSummaryResponse>('POST', `/api/chat/${chatId}/generate-summary`, {
      chat_id: chatId,
      model,
    });
  },

  /**
   * Generate rolling summary using AI (skips first N interactions)
   */
  async generateRollingSummary(
    chatId: string,
    skipInteractions: number,
    model: string = 'gpt-4o-mini'
  ): Promise<GenerateRollingSummaryResponse> {
    return request<GenerateRollingSummaryResponse>('POST', `/api/chat/${chatId}/generate-rolling-summary`, {
      chat_id: chatId,
      skip_interactions: skipInteractions,
      model,
    });
  },
};

/**
 * Message management namespace - now using DRY utilities
 */
export const message = {
  /**
   * Get all messages for a chat and convert to frontend format
   */
  async list(chatId: string): Promise<ChatMessage[]> {
    const backendMessages = await ErrorHandler.withErrorHandling(
      () => request<BackendMessage[]>('GET', `/api/chat/${chatId}/messages`),
      'Fetching messages'
    );
    return MessageTransforms.fromBackendMessages(backendMessages);
  },

  /**
   * Create a new message from ChatMessage
   */
  async create(chatId: string, message: ChatMessage): Promise<BackendMessage> {
    const backendMessage = MessageTransforms.toBackendMessage(message);
    return ErrorHandler.withErrorHandling(
      () => request<BackendMessage>('POST', `/api/chat/${chatId}/messages`, backendMessage),
      'Creating message'
    );
  },

  /**
   * Create a new message from raw parameters (legacy support)
   */
  async createRaw(chatId: string, params: CreateMessageRequest): Promise<BackendMessage> {
    return ErrorHandler.withErrorHandling(
      () => request<BackendMessage>('POST', `/api/chat/${chatId}/messages`, params),
      'Creating message'
    );
  },

  /**
   * Update a message content
   */
  async update(chatId: string, messageId: string, content: string): Promise<BackendMessage> {
    return ErrorHandler.withErrorHandling(
      () => request<BackendMessage>('PATCH', `/api/chat/${chatId}/messages/${messageId}`, { content }),
      'Updating message'
    );
  },

  /**
   * Update a message from ChatMessage
   */
  async updateFromMessage(chatId: string, message: ChatMessage): Promise<BackendMessage> {
    const content = MessageTransforms.extractTextContent(message);
    return this.update(chatId, message.id, content);
  },

  /**
   * Delete a message
   */
  async delete(chatId: string, messageId: string): Promise<DeleteResponse> {
    return ErrorHandler.withErrorHandling(
      () => request<DeleteResponse>('DELETE', `/api/chat/${chatId}/messages/${messageId}`),
      'Deleting message'
    );
  },

  /**
   * Update message model
   */
  async updateModel(chatId: string, messageId: string, model: string): Promise<BackendMessage> {
    return ErrorHandler.withErrorHandling(
      () => request<BackendMessage>('PATCH', `/api/chat/${chatId}/messages/${messageId}/model`, { model }),
      'Updating message model'
    );
  },
};

/**
 * Agent management namespace
 */
export const agent = {
  /**
   * List all agents
   */
  async list(params?: { repository?: string; type?: string }): Promise<BackendAgent[]> {
    const searchParams = new URLSearchParams();
    if (params?.repository) searchParams.set('repository', params.repository);
    if (params?.type) searchParams.set('type', params.type);

    const query = searchParams.toString();
    const path = query ? `/api/agents?${query}` : '/api/agents';

    return request<BackendAgent[]>('GET', path);
  },

  /**
   * Get a specific agent
   */
  async get(agentId: string): Promise<BackendAgent> {
    return request<BackendAgent>('GET', `/api/agents/${agentId}`);
  },

  /**
   * Create a new agent
   */
  async create(params: CreateAgentRequest): Promise<BackendAgent> {
    return request<BackendAgent>('POST', '/api/agents', params);
  },

  /**
   * Update an agent
   */
  async update(agentId: string, params: UpdateAgentRequest): Promise<BackendAgent> {
    return request<BackendAgent>('PATCH', `/api/agents/${agentId}`, params);
  },

  /**
   * Delete an agent
   */
  async delete(agentId: string): Promise<DeleteResponse> {
    return request<DeleteResponse>('DELETE', `/api/agents/${agentId}`);
  },

  /**
   * Agent health check
   */
  async health(): Promise<BackendHealthStatus> {
    return request<BackendHealthStatus>('GET', '/api/agents/health');
  },
};

/**
 * Health check namespace
 */
export const health = {
  /**
   * Basic health check
   */
  async check(): Promise<BackendHealthStatus> {
    return request<BackendHealthStatus>('GET', '/api/health');
  },
};

// ============================================================================
// Default Export
// ============================================================================

/**
 * Backend API client with organized namespaces
 */
export const backend = {
  chat,
  message,
  agent,
  health,
  // Expose utility functions for advanced usage
  request,
  toCamelCase,
  toSnakeCase,
  fromBackendError,
};

export default backend;
