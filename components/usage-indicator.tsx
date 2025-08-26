'use client';

import { cn } from '@/lib/utils';
import { useUsage } from '@/lib/contexts/usage-context';

interface UsageIndicatorProps {
	className?: string;
}

export function UsageIndicator({ className }: UsageIndicatorProps) {
	const { usage } = useUsage();

	if (usage.currentChatTokens === 0) {
		return null;
	}

	// Simple visual indicator - just show current chat tokens
	const displayTokens = usage.currentChatTokens.toLocaleString();

	return (
		<div className={cn(
			"text-xs text-muted-foreground/60 font-mono",
			"px-2 py-1 rounded-md bg-muted/30",
			"transition-opacity duration-200",
			className
		)}>
			{displayTokens} tokens
		</div>
	);
}
