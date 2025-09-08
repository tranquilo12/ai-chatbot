'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

interface ChatTitleContextType {
	title: string;
	setTitle: (title: string) => void;
}

const ChatTitleContext = createContext<ChatTitleContextType | undefined>(undefined);

interface ChatTitleProviderProps {
	children: ReactNode;
	initialTitle?: string;
}

export function ChatTitleProvider({ children, initialTitle = 'New Chat' }: ChatTitleProviderProps) {
	const [title, setTitle] = useState(initialTitle);

	return (
		<ChatTitleContext.Provider value={{ title, setTitle }}>
			{children}
		</ChatTitleContext.Provider>
	);
}

export function useChatTitle() {
	const context = useContext(ChatTitleContext);
	if (context === undefined) {
		throw new Error('useChatTitle must be used within a ChatTitleProvider');
	}
	return context;
}
