'use client';

import { useState, useEffect } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Maximize2, Minimize2, Monitor } from 'lucide-react';

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

	const setPresetWidth = (width: number) => {
		setChatWidth(width);
		localStorage.setItem('chat-width', width.toString());
		// Force panel resize
		window.dispatchEvent(new Event('resize'));
	};

	const presets = [
		{ label: 'Narrow', width: 50, icon: Minimize2 },
		{ label: 'Medium', width: 70, icon: Monitor },
		{ label: 'Wide', width: 85, icon: Maximize2 },
	];

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
				className="flex flex-col items-center justify-center panel-tertiary-bg p-6"
			>
				<div className="text-muted-foreground text-xs text-center">
					<div className="mb-4 text-xl">📏</div>
					<div className="mb-2 font-medium">Chat Width Control</div>
					<div className="mb-4 text-xs opacity-70">
						Current: {Math.round(chatWidth)}%
					</div>

					<div className="space-y-2 mb-4">
						<div className="text-xs opacity-70 mb-2">Quick Presets:</div>
						{presets.map((preset) => {
							const Icon = preset.icon;
							return (
								<Button
									key={preset.width}
									variant={Math.abs(chatWidth - preset.width) < 2 ? "default" : "outline"}
									size="sm"
									onClick={() => setPresetWidth(preset.width)}
									className="w-full justify-start gap-2"
								>
									<Icon className="h-3 w-3" />
									{preset.label} ({preset.width}%)
								</Button>
							);
						})}
					</div>

					<div className="text-xs opacity-50">
						Drag the handle or use presets to adjust
					</div>
				</div>
			</ResizablePanel>
		</ResizablePanelGroup>
	);
}
