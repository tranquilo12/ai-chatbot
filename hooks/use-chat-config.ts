import { useCallback } from 'react';
import { useSWRConfig } from 'swr';
import { DefaultChatTransport } from 'ai';
import { fetchWithErrorHandlers, generateUUID } from '@/lib/utils';
import { ErrorHandler } from '@/lib/error-handler';
import { useUsage } from '@/lib/contexts/usage-context';
import { shouldGenerateTitle } from '@/lib/ai/title-generation';
import { useChatTitleUpdate } from '@/hooks/use-chat-title-update';
import { unstable_serialize } from 'swr/infinite';
import { getChatHistoryPaginationKey } from '@/components/sidebar-history';
import type { ChatMessage } from '@/lib/types';

/**
 * Centralized chat configuration hook that provides consistent
 * AI SDK useChat configuration across the application.
 * This promotes DRY principles and ensures consistent behavior.
 */
export function useChatConfig({
	chatId,
	initialModel,
	currentChatTitle,
	setCurrentChatTitle,
}: {
	chatId: string;
	initialModel: string;
	currentChatTitle: string;
	setCurrentChatTitle: (title: string) => void;
}) {
	const { mutate } = useSWRConfig();
	const { generateAndUpdateTitle } = useChatTitleUpdate();
	const { updateUsage } = useUsage();

	const onFinish = useCallback(
		async ({ message }: { message: any }) => {
			// Handle usage data from message metadata
			if (message.metadata && typeof message.metadata === 'object') {
				const metadata = message.metadata as any;
				if (metadata.usage) {
					updateUsage({
						promptTokens: metadata.usage.promptTokens || 0,
						completionTokens: metadata.usage.completionTokens || 0,
						totalTokens: metadata.usage.totalTokens || 0,
					});
				}
			}

			// Auto-generate title after first assistant response
			if (shouldGenerateTitle(currentChatTitle, [message])) {
				try {
					const newTitle = await generateAndUpdateTitle(chatId);
					setCurrentChatTitle(newTitle);
				} catch (error) {
					console.error('Failed to auto-generate chat title:', error);
				}
			} else {
				mutate(unstable_serialize(getChatHistoryPaginationKey));
			}
		},
		[chatId, currentChatTitle, setCurrentChatTitle, generateAndUpdateTitle, updateUsage, mutate]
	);

	return {
		id: chatId,
		generateId: generateUUID,
		transport: new DefaultChatTransport({
			api: '/api/chat',
			body: { model: initialModel },
			fetch: fetchWithErrorHandlers,
		}),
		experimental_throttle: 100,
		onFinish,
		onError: ErrorHandler.toToast,
	};
}
