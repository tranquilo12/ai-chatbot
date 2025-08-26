import type { ChatMessage } from '@/lib/types';
import { backend } from '@/lib/api/backend-client';

/**
 * Generate a concise, descriptive title for a chat conversation
 * using the backend's AI-powered title generation endpoint
 */
export async function generateChatTitle(chatId: string): Promise<string> {
	try {
		const response = await backend.chat.generateTitle(chatId, 'gpt-4o-mini');
		return response.title || 'New Chat';
	} catch (error) {
		console.error('Failed to generate chat title:', error);
		return 'New Chat';
	}
}

/**
 * Generate title from messages array (for backward compatibility)
 * This now just extracts basic info for fallback titles
 */
export async function generateChatTitleFromMessages(messages: ChatMessage[]): Promise<string> {
	if (messages.length === 0) {
		return 'New Chat';
	}

	// Find the first user message for fallback
	const firstUserMessage = messages.find(msg => msg.role === 'user');
	if (!firstUserMessage) {
		return 'New Chat';
	}

	// Get the text content from the first user message
	const userText = firstUserMessage.parts
		?.filter(part => part.type === 'text')
		.map(part => part.text)
		.join(' ') || '';

	// Create a simple fallback title from the first few words
	const fallbackTitle = userText
		.split(' ')
		.slice(0, 4)
		.join(' ')
		.substring(0, 40);

	return fallbackTitle || 'New Chat';
}

/**
 * Check if a chat should have its title auto-generated
 * Returns true if the chat has a default title and enough messages
 */
export function shouldGenerateTitle(currentTitle: string, messages: ChatMessage[]): boolean {
	// Don't generate if title was already customized
	if (currentTitle !== 'New Chat' && !currentTitle.startsWith('Chat ')) {
		return false;
	}

	// Need at least one user message and one assistant message for good titles
	const hasUserMessage = messages.some(msg => msg.role === 'user');
	const hasAssistantMessage = messages.some(msg => msg.role === 'assistant');

	return hasUserMessage && hasAssistantMessage;
}

/**
 * Generate a comprehensive summary of the entire conversation using AI
 */
export async function generateChatSummary(chatId: string): Promise<string> {
	try {
		const response = await backend.chat.generateSummary(chatId, 'gpt-4o-mini');
		return response.summary || '';
	} catch (error) {
		console.error('Failed to generate chat summary:', error);
		return '';
	}
}

/**
 * Generate a rolling summary of the conversation (skipping first N interactions) using AI
 */
export async function generateChatRollingSummary(chatId: string, skipInteractions: number = 2): Promise<string> {
	try {
		const response = await backend.chat.generateRollingSummary(chatId, skipInteractions, 'gpt-4o-mini');
		return response.summary || '';
	} catch (error) {
		console.error('Failed to generate rolling summary:', error);
		return '';
	}
}
