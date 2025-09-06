'use client';

import { createContext, useContext, useState, useCallback } from 'react';

interface TitleGenerationContextType {
	isGeneratingTitle: boolean;
	setIsGeneratingTitle: (generating: boolean) => void;
}

const TitleGenerationContext = createContext<TitleGenerationContextType>({
	isGeneratingTitle: false,
	setIsGeneratingTitle: () => { },
});

export function TitleGenerationProvider({ children }: { children: React.ReactNode }) {
	const [isGeneratingTitle, setIsGeneratingTitleState] = useState(false);

	const setIsGeneratingTitle = useCallback((generating: boolean) => {
		setIsGeneratingTitleState(generating);
	}, []);

	return (
		<TitleGenerationContext.Provider value={{ isGeneratingTitle, setIsGeneratingTitle }}>
			{children}
		</TitleGenerationContext.Provider>
	);
}

export const useTitleGeneration = () => useContext(TitleGenerationContext);
