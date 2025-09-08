import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useChatTitle } from '@/components/chat-title-context';
import { useChatList } from '@/components/chat-list-context';
import { useTitleGeneration } from '@/components/title-generation-context';

interface UseAutoTitleGenerationProps {
	chatId: string | null;
	messages: any[];
	enabled?: boolean;
}

export function useAutoTitleGeneration({
	chatId,
	messages,
	enabled = true
}: UseAutoTitleGenerationProps) {
	const { setTitle } = useChatTitle();
	const { refreshChats } = useChatList();
	const { setIsGeneratingTitle } = useTitleGeneration();
	const [isGeneratingTitle, setLocalGeneratingTitle] = useState(false);
	const [hasGeneratedTitle, setHasGeneratedTitle] = useState(false);

	const generateTitle = useCallback(async (forceGenerate = false) => {
		if (!chatId || !enabled || isGeneratingTitle) return;

		// Only auto-generate once, unless forced
		if (hasGeneratedTitle && !forceGenerate) return;

		// Need at least one user message to generate a title
		const userMessages = messages.filter(m => m.role === 'user');
		if (userMessages.length === 0) return;

		setLocalGeneratingTitle(true);
		setIsGeneratingTitle(true);

		try {
			const response = await fetch(`/api/chat/${chatId}/generate-title`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					chat_id: chatId,
					model: 'gpt-4o-mini'
				}),
			});

			if (!response.ok) {
				throw new Error('Failed to generate title');
			}

			const result = await response.json();

			// Update the title in both navbar and sidebar
			setTitle(result.title);
			refreshChats();

			setHasGeneratedTitle(true);

			// Show success toast with animation
			toast.success(`✨ Generated title: "${result.title}"`, {
				duration: 3000,
			});

			return result;
		} catch (error) {
			console.error('Failed to generate title:', error);
			toast.error('Failed to generate chat title');
		} finally {
			setLocalGeneratingTitle(false);
			setIsGeneratingTitle(false);
		}
	}, [chatId, enabled, isGeneratingTitle, hasGeneratedTitle, messages, setTitle, refreshChats, setIsGeneratingTitle]);

	// Auto-generate title when we have the first user message and first assistant response
	useEffect(() => {
		if (!enabled || hasGeneratedTitle || isGeneratingTitle) return;

		const userMessages = messages.filter(m => m.role === 'user');
		const assistantMessages = messages.filter(m => m.role === 'assistant');

		// Generate title after first complete interaction (user + assistant)
		if (userMessages.length >= 1 && assistantMessages.length >= 1) {
			// Add a small delay to ensure the conversation has settled
			const timer = setTimeout(() => {
				generateTitle();
			}, 1000);

			return () => clearTimeout(timer);
		}
	}, [messages, enabled, hasGeneratedTitle, isGeneratingTitle, generateTitle]);

	// Reset when chatId changes
	useEffect(() => {
		setHasGeneratedTitle(false);
		setLocalGeneratingTitle(false);
		setIsGeneratingTitle(false);
	}, [chatId, setIsGeneratingTitle]);

	return {
		generateTitle,
		isGeneratingTitle,
		hasGeneratedTitle,
	};
}
