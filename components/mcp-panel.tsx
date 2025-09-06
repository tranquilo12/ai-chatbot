'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
	Server,
	Plus,
	Activity,
	AlertTriangle,
	CheckCircle,
	RefreshCw,
	Settings,
	Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMCPServers } from '@/hooks/use-mcp-servers';
import { MCPServerCard } from './mcp-server-card';
import { MCPServerForm } from './mcp-server-form';

interface MCPPanelProps {
	className?: string;
}

export function MCPPanel({ className }: MCPPanelProps) {
	const {
		servers,
		mcpStatus,
		isLoading,
		error,
		selectedServerId,
		isAddingServer,
		refreshServers,
		refreshStatus,
		createServer,
		updateServer,
		deleteServer,
		testServerHealth,
		setSelectedServerId,
		setIsAddingServer,
		clearError,
	} = useMCPServers();

	const [showSystemStatus, setShowSystemStatus] = useState(false);

	const activeServers = servers.filter(s => s.isActive);
	const healthyServers = servers.filter(s => s.isActive && s.isHealthy);

	const getStatusIcon = () => {
		if (mcpStatus.status === 'healthy') return <CheckCircle className="size-4 text-green-500" />;
		if (mcpStatus.status === 'degraded') return <AlertTriangle className="size-4 text-yellow-500" />;
		return <AlertTriangle className="size-4 text-red-500" />;
	};

	const getStatusColor = () => {
		if (mcpStatus.status === 'healthy') return 'default';
		if (mcpStatus.status === 'degraded') return 'secondary';
		return 'destructive';
	};

	const handleRefresh = async () => {
		await Promise.all([refreshServers(), refreshStatus()]);
	};

	return (
		<div className={cn('flex flex-col h-full', className)}>
			{/* Header */}
			<div className="flex items-center justify-between p-4 border-b">
				<div className="flex items-center gap-2">
					<Zap className="size-4 text-primary" />
					<h2 className="text-sm font-semibold">MCP Servers</h2>
					<Badge variant="outline" className="text-xs">
						{servers.length}
					</Badge>
				</div>

				<div className="flex items-center gap-1">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setShowSystemStatus(!showSystemStatus)}
						className="h-7 px-2"
					>
						<Settings className="size-3" />
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={handleRefresh}
						disabled={isLoading}
						className="h-7 px-2"
					>
						<RefreshCw className={cn("size-3", isLoading && "animate-spin")} />
					</Button>
				</div>
			</div>

			{/* System Status */}
			{showSystemStatus && (
				<Card className="m-4 mb-2">
					<CardHeader className="pb-2">
						<div className="flex items-center justify-between">
							<CardTitle className="text-xs flex items-center gap-2">
								{getStatusIcon()}
								MCP System Status
							</CardTitle>
							<Badge variant={getStatusColor() as any} className="text-xs">
								{mcpStatus.status}
							</Badge>
						</div>
					</CardHeader>
					<CardContent className="pt-0">
						<div className="grid grid-cols-2 gap-2 text-xs">
							<div>
								<span className="text-muted-foreground">Available:</span>
								<span className="ml-1">{mcpStatus.available ? 'Yes' : 'No'}</span>
							</div>
							<div>
								<span className="text-muted-foreground">Fallback:</span>
								<span className="ml-1">{mcpStatus.fallbackMode ? 'Yes' : 'No'}</span>
							</div>
							<div>
								<span className="text-muted-foreground">Active:</span>
								<span className="ml-1">{activeServers.length}/{servers.length}</span>
							</div>
							<div>
								<span className="text-muted-foreground">Healthy:</span>
								<span className="ml-1">{healthyServers.length}/{activeServers.length}</span>
							</div>
						</div>

						{mcpStatus.capabilities.length > 0 && (
							<div className="mt-2">
								<div className="text-xs text-muted-foreground mb-1">Capabilities:</div>
								<div className="flex flex-wrap gap-1">
									{mcpStatus.capabilities.map((cap) => (
										<Badge key={cap} variant="outline" className="text-xs px-1 py-0">
											{cap}
										</Badge>
									))}
								</div>
							</div>
						)}

						{mcpStatus.errorDetails && (
							<div className="mt-2 text-xs text-red-500 bg-red-50 dark:bg-red-950/20 rounded px-2 py-1">
								{mcpStatus.errorDetails.message}
							</div>
						)}
					</CardContent>
				</Card>
			)}

			{/* Error Display */}
			{error && (
				<div className="mx-4 mb-2">
					<div className="text-xs text-red-500 bg-red-50 dark:bg-red-950/20 rounded px-3 py-2 flex items-center justify-between">
						<span>{error}</span>
						<Button
							variant="ghost"
							size="sm"
							onClick={clearError}
							className="size-5 p-0 text-red-500 hover:text-red-600"
						>
							×
						</Button>
					</div>
				</div>
			)}

			{/* Content */}
			<div className="flex-1 overflow-hidden">
				<ScrollArea className="h-full">
					<div className="p-4 space-y-3">
						{/* Add Server Form */}
						{isAddingServer && (
							<MCPServerForm
								onSubmit={createServer}
								onCancel={() => setIsAddingServer(false)}
								isLoading={isLoading}
							/>
						)}

						{/* Add Server Button */}
						{!isAddingServer && (
							<Button
								variant="outline"
								size="sm"
								onClick={() => setIsAddingServer(true)}
								className="w-full h-8 text-xs border-dashed"
							>
								<Plus className="size-3 mr-1" />
								Add MCP Server
							</Button>
						)}

						{/* Server List */}
						{servers.length === 0 && !isAddingServer ? (
							<Card className="border-dashed">
								<CardContent className="flex flex-col items-center justify-center py-8 text-center">
									<Server className="size-8 text-muted-foreground mb-2" />
									<CardTitle className="text-sm mb-1">No MCP Servers</CardTitle>
									<CardDescription className="text-xs mb-3">
										Add your first MCP server to enable advanced AI capabilities
									</CardDescription>
									<Button
										size="sm"
										onClick={() => setIsAddingServer(true)}
										className="h-7 px-3 text-xs"
									>
										<Plus className="size-3 mr-1" />
										Add Server
									</Button>
								</CardContent>
							</Card>
						) : (
							<div className="space-y-2">
								{servers.map((server) => (
									<MCPServerCard
										key={server.id}
										server={server}
										isSelected={selectedServerId === server.id}
										onSelect={setSelectedServerId}
										onUpdate={updateServer}
										onDelete={deleteServer}
										onTestHealth={testServerHealth}
									/>
								))}
							</div>
						)}

						{/* Quick Stats */}
						{servers.length > 0 && (
							<Card className="mt-4">
								<CardContent className="p-3">
									<div className="grid grid-cols-3 gap-2 text-center">
										<div>
											<div className="text-lg font-semibold">{servers.length}</div>
											<div className="text-xs text-muted-foreground">Total</div>
										</div>
										<div>
											<div className="text-lg font-semibold text-green-600">{healthyServers.length}</div>
											<div className="text-xs text-muted-foreground">Healthy</div>
										</div>
										<div>
											<div className="text-lg font-semibold text-blue-600">{activeServers.length}</div>
											<div className="text-xs text-muted-foreground">Active</div>
										</div>
									</div>
								</CardContent>
							</Card>
						)}
					</div>
				</ScrollArea>
			</div>
		</div>
	);
}
