'use client';

import { createContext, useContext, useCallback, type ReactNode } from 'react';
import { mutate } from 'swr';

interface ChatListContextType {
	refreshChats: () => void;
	refreshChat: (chatId: string) => void;
}

const ChatListContext = createContext<ChatListContextType | undefined>(undefined);

interface ChatListProviderProps {
	children: ReactNode;
}

export function ChatListProvider({ children }: ChatListProviderProps) {
	const refreshChats = useCallback(() => {
		// Refresh the chat list using SWR's mutate function
		// This will revalidate all chat-related SWR keys
		mutate(key => typeof key === 'string' && key.startsWith('/api/chat'));
	}, []);

	const refreshChat = useCallback((chatId: string) => {
		// Refresh a specific chat
		mutate(`/api/chat/${chatId}`);
	}, []);

	return (
		<ChatListContext.Provider value={{ refreshChats, refreshChat }}>
			{children}
		</ChatListContext.Provider>
	);
}

export function useChatList() {
	const context = useContext(ChatListContext);
	if (context === undefined) {
		throw new Error('useChatList must be used within a ChatListProvider');
	}
	return context;
}
