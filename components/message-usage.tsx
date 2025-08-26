'use client';

import { cn } from '@/lib/utils';

interface MessageUsageProps {
	promptTokens?: number;
	completionTokens?: number;
	totalTokens?: number;
	className?: string;
	showRunningTotal?: boolean;
	runningTotal?: number;
}

export function MessageUsage({
	promptTokens = 0,
	completionTokens = 0,
	totalTokens = 0,
	className,
	showRunningTotal = false,
	runningTotal = 0
}: MessageUsageProps) {
	// Show usage if we have token data OR if we want to show running total
	if (totalTokens === 0 && !showRunningTotal) {
		return null;
	}

	return (
		<div className={cn(
			"text-xs text-muted-foreground/60 font-mono",
			"px-2 py-1 rounded-md bg-muted/20 border border-muted/40",
			"flex items-center gap-1",
			className
		)}>
			<span className="text-muted-foreground/40">•</span>

			{totalTokens > 0 ? (
				<>
					<span>{totalTokens.toLocaleString()} tokens</span>
					{(promptTokens > 0 || completionTokens > 0) && (
						<span className="text-muted-foreground/40">
							({promptTokens}+{completionTokens})
						</span>
					)}
				</>
			) : showRunningTotal && runningTotal > 0 ? (
				<span className="text-muted-foreground/50">
					{runningTotal.toLocaleString()} total
				</span>
			) : null}
		</div>
	);
}
