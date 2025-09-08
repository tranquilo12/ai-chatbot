'use client';

import { useState, useEffect } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { cn } from '@/lib/utils';
import { MCPPanel } from './mcp-panel';

interface ResizableChatLayoutProps {
	children: React.ReactNode;
	className?: string;
}

export function ResizableChatLayout({ children, className }: ResizableChatLayoutProps) {
	const [chatWidth, setChatWidth] = useState(70); // Default to 70% width

	// Save width preference to localStorage
	useEffect(() => {
		const savedWidth = localStorage.getItem('chat-width');
		if (savedWidth) {
			setChatWidth(Number(savedWidth));
		}
	}, []);

	const handleResize = (sizes: number[]) => {
		const newChatWidth = sizes[0];
		setChatWidth(newChatWidth);
		localStorage.setItem('chat-width', newChatWidth.toString());
	};


	return (
		<ResizablePanelGroup
			direction="horizontal"
			onLayout={handleResize}
			className={cn('h-full w-full', className)}
		>
			<ResizablePanel
				defaultSize={chatWidth}
				minSize={30}
				maxSize={90}
				className="flex flex-col"
			>
				<div className="flex flex-col h-full max-w-none">
					{children}
				</div>
			</ResizablePanel>

			<ResizableHandle withHandle className="w-2 hover:bg-muted/50 transition-colors" />

			<ResizablePanel
				defaultSize={100 - chatWidth}
				minSize={10}
				maxSize={70}
				className="flex flex-col panel-tertiary-bg"
			>
				<MCPPanel className="h-full" />
			</ResizablePanel>
		</ResizablePanelGroup>
	);
}
