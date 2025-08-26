'use client';

import { useSWRConfig } from 'swr';
import { unstable_serialize } from 'swr/infinite';
import { getChatHistoryPaginationKey } from '@/components/sidebar-history';
import { chat as chatAPI } from '@/lib/api/backend-client';
import { generateChatTitle } from '@/lib/ai/title-generation';
import { toast } from 'sonner';

/**
 * Unified hook for all chat title operations with optimistic updates
 * This ensures the sidebar updates immediately without requiring a page refresh
 */
export function useChatTitleUpdate() {
	const { mutate } = useSWRConfig();

	/**
	 * Core function to update chat title in all relevant caches
	 */
	const updateChatTitleInCache = (chatId: string, newTitle: string) => {
		// Update all chat history API keys with more comprehensive matching
		mutate((key) => {
			// Check if this is a chat history key (more flexible matching)
			if (typeof key === 'string' && key.includes('/api/history')) {
				return (chatHistories: any) => {
					if (chatHistories) {
						return chatHistories.map((chatHistory: any) => ({
							...chatHistory,
							chats: chatHistory.chats.map((c: any) =>
								c.id === chatId ? { ...c, title: newTitle } : c
							),
						}));
					}
					return chatHistories;
				};
			}
			return undefined;
		}, false);

		// Also update the infinite pagination cache with revalidation
		mutate(unstable_serialize(getChatHistoryPaginationKey), (chatHistories: any) => {
			if (chatHistories) {
				return chatHistories.map((chatHistory: any) => ({
					...chatHistory,
					chats: chatHistory.chats.map((c: any) =>
						c.id === chatId ? { ...c, title: newTitle } : c
					),
				}));
			}
			return chatHistories;
		}, { revalidate: false });

		// Force a revalidation after a short delay to ensure consistency
		setTimeout(() => {
			mutate(unstable_serialize(getChatHistoryPaginationKey));
		}, 100);
	};

	/**
	 * Update chat title manually (for user edits)
	 */
	const updateChatTitle = async (chatId: string, newTitle: string): Promise<boolean> => {
		try {
			// Optimistically update the cache first for immediate UI response
			updateChatTitleInCache(chatId, newTitle);

			// Then update the backend
			await chatAPI.updateTitle(chatId, { title: newTitle });

			return true;
		} catch (error) {
			console.error('Failed to update chat title:', error);
			// Revert the optimistic update on error by re-fetching
			mutate(unstable_serialize(getChatHistoryPaginationKey));
			throw error;
		}
	};

	/**
	 * Generate and update chat title automatically
	 */
	const generateAndUpdateTitle = async (chatId: string): Promise<string> => {
		try {
			// Generate title using the backend API
			const generatedTitle = await generateChatTitle(chatId);

			// Update both cache and backend
			await updateChatTitle(chatId, generatedTitle);

			return generatedTitle;
		} catch (error) {
			console.error('Failed to generate and update title:', error);
			throw error;
		}
	};

	/**
	 * Optimistic-only update (for immediate UI feedback)
	 * Used when the backend update is handled elsewhere
	 */
	const updateChatTitleOptimistic = (chatId: string, newTitle: string) => {
		updateChatTitleInCache(chatId, newTitle);
	};

	return {
		updateChatTitle,
		generateAndUpdateTitle,
		updateChatTitleOptimistic
	};
}
