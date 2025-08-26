'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface UsageData {
	promptTokens: number;
	completionTokens: number;
	totalTokens: number;
	currentChatTokens: number;
}

interface UsageContextType {
	usage: UsageData;
	updateUsage: (tokens: { promptTokens: number; completionTokens: number; totalTokens: number }) => void;
	resetChatUsage: () => void;
}

const UsageContext = createContext<UsageContextType | undefined>(undefined);

export function UsageProvider({ children }: { children: ReactNode }) {
	const [usage, setUsage] = useState<UsageData>({
		promptTokens: 0,
		completionTokens: 0,
		totalTokens: 0,
		currentChatTokens: 0,
	});

	const updateUsage = useCallback((tokens: { promptTokens: number; completionTokens: number; totalTokens: number }) => {
		setUsage(prev => ({
			promptTokens: prev.promptTokens + tokens.promptTokens,
			completionTokens: prev.completionTokens + tokens.completionTokens,
			totalTokens: prev.totalTokens + tokens.totalTokens,
			currentChatTokens: prev.currentChatTokens + tokens.totalTokens,
		}));
	}, []);

	const resetChatUsage = useCallback(() => {
		setUsage(prev => ({
			...prev,
			currentChatTokens: 0,
		}));
	}, []);

	return (
		<UsageContext.Provider value={{ usage, updateUsage, resetChatUsage }}>
			{children}
		</UsageContext.Provider>
	);
}

export function useUsage() {
	const context = useContext(UsageContext);
	if (!context) {
		throw new Error('useUsage must be used within a UsageProvider');
	}
	return context;
}
