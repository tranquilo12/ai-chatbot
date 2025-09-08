'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
	Server,
	Plus,
	Activity,
	AlertTriangle,
	CheckCircle,
	RefreshCw,
	Settings,
	Zap,
	X,
	ExternalLink,
	Trash2,
	TestTube
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMCPServers } from '@/hooks/use-mcp-servers';

interface MCPPanelProps {
	className?: string;
}

export function MCPPanel({ className }: MCPPanelProps) {
	const {
		activeServer,
		mcpStatus,
		registryStatus,
		isLoading,
		error,
		isAddingServer,
		refreshStatus,
		registerServer,
		deregisterServer,
		hotSwapServer,
		testConnection,
		setIsAddingServer,
		clearError,
		hasCapability,
	} = useMCPServers();

	const [showSystemStatus, setShowSystemStatus] = useState(false);
	const [newServerUrl, setNewServerUrl] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);

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
		await refreshStatus();
	};

	const handleRegisterServer = async () => {
		if (!newServerUrl.trim()) return;

		setIsSubmitting(true);
		try {
			const result = await registerServer(newServerUrl.trim(), true);
			if (result.success) {
				setNewServerUrl('');
				setIsAddingServer(false);
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleHotSwap = async () => {
		if (!newServerUrl.trim()) return;

		setIsSubmitting(true);
		try {
			const result = await hotSwapServer(newServerUrl.trim(), true);
			if (result.success) {
				setNewServerUrl('');
				setIsAddingServer(false);
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDeregister = async () => {
		setIsSubmitting(true);
		try {
			await deregisterServer();
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleTestConnection = async () => {
		setIsSubmitting(true);
		try {
			await testConnection();
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className={cn('flex flex-col h-full', className)}>
			{/* Header */}
			<div className="flex items-center justify-between p-4 border-b">
				<div className="flex items-center gap-2">
					<Server className="size-5" />
					<h2 className="text-lg font-semibold">MCP Registry</h2>
					{getStatusIcon()}
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={handleRefresh}
						disabled={isLoading}
					>
						<RefreshCw className={cn('size-4', isLoading && 'animate-spin')} />
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => setShowSystemStatus(!showSystemStatus)}
					>
						<Settings className="size-4" />
					</Button>
				</div>
			</div>

			{/* Error Display */}
			{error && (
				<div className="p-4 border-b bg-red-50 border-red-200">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2 text-red-700">
							<AlertTriangle className="size-4" />
							<span className="text-sm">{error}</span>
						</div>
						<Button variant="ghost" size="sm" onClick={clearError}>
							<X className="size-4" />
						</Button>
					</div>
				</div>
			)}

			<ScrollArea className="flex-1">
				<div className="p-4 space-y-4">
					{/* System Status */}
					{showSystemStatus && (
						<Card>
							<CardHeader>
								<CardTitle className="text-sm">System Status</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								<div className="grid grid-cols-2 gap-4 text-sm">
									<div>
										<span className="text-muted-foreground">MCP Status:</span>
										<Badge variant={getStatusColor()} className="ml-2">
											{mcpStatus.status}
										</Badge>
									</div>
									<div>
										<span className="text-muted-foreground">Available:</span>
										<span className="ml-2">{mcpStatus.available ? 'Yes' : 'No'}</span>
									</div>
									<div>
										<span className="text-muted-foreground">Registry Active:</span>
										<span className="ml-2">{registryStatus.isActive ? 'Yes' : 'No'}</span>
									</div>
									<div>
										<span className="text-muted-foreground">Fallback Mode:</span>
										<span className="ml-2">{mcpStatus.fallbackMode ? 'Yes' : 'No'}</span>
									</div>
								</div>

								{mcpStatus.capabilities.length > 0 && (
									<div>
										<span className="text-sm text-muted-foreground">Capabilities:</span>
										<div className="flex flex-wrap gap-1 mt-1">
											{mcpStatus.capabilities.map((cap) => (
												<Badge key={cap} variant="outline" className="text-xs">
													{cap}
												</Badge>
											))}
										</div>
									</div>
								)}

								{mcpStatus.errorDetails && (
									<div className="text-sm text-red-600">
										<span className="font-medium">Error:</span> {mcpStatus.errorDetails.message}
									</div>
								)}
							</CardContent>
						</Card>
					)}

					{/* Active Server */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Activity className="size-4" />
								Active MCP Server
							</CardTitle>
							<CardDescription>
								{activeServer
									? 'Currently registered MCP server'
									: 'No MCP server currently registered'
								}
							</CardDescription>
						</CardHeader>
						<CardContent>
							{activeServer ? (
								<div className="space-y-4">
									{/* Server Info */}
									<div className="p-3 bg-muted rounded-lg">
										<div className="flex items-center justify-between mb-2">
											<div className="flex items-center gap-2">
												<span className="font-medium">{activeServer.url}</span>
												<Button
													variant="ghost"
													size="sm"
													onClick={() => window.open(activeServer.url, '_blank')}
												>
													<ExternalLink className="size-3" />
												</Button>
											</div>
											<div className="flex items-center gap-2">
												<Badge variant={activeServer.isHealthy ? 'default' : 'destructive'}>
													{activeServer.isHealthy ? 'Healthy' : 'Unhealthy'}
												</Badge>
											</div>
										</div>

										{activeServer.capabilities.length > 0 && (
											<div>
												<span className="text-sm text-muted-foreground">Capabilities:</span>
												<div className="flex flex-wrap gap-1 mt-1">
													{activeServer.capabilities.map((cap) => (
														<Badge key={cap} variant="outline" className="text-xs">
															{cap}
														</Badge>
													))}
												</div>
											</div>
										)}

										{activeServer.lastCheck && (
											<div className="text-xs text-muted-foreground mt-2">
												Last checked: {new Date(activeServer.lastCheck).toLocaleString()}
											</div>
										)}
									</div>

									{/* Server Actions */}
									<div className="flex gap-2">
										<Button
											variant="outline"
											size="sm"
											onClick={handleTestConnection}
											disabled={isSubmitting}
										>
											<TestTube className="size-4 mr-1" />
											Test Connection
										</Button>
										<Button
											variant="outline"
											size="sm"
											onClick={handleDeregister}
											disabled={isSubmitting}
										>
											<Trash2 className="size-4 mr-1" />
											Deregister
										</Button>
									</div>
								</div>
							) : (
								<div className="text-center py-8 text-muted-foreground">
									<Server className="size-12 mx-auto mb-2 opacity-50" />
									<p>No MCP server registered</p>
									<p className="text-sm">Register a server to enable code analysis features</p>
								</div>
							)}
						</CardContent>
					</Card>

					{/* Server Registration */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Plus className="size-4" />
								{activeServer ? 'Hot-Swap Server' : 'Register Server'}
							</CardTitle>
							<CardDescription>
								{activeServer
									? 'Replace the current server with a new one'
									: 'Register a new MCP server to enable code analysis'
								}
							</CardDescription>
						</CardHeader>
						<CardContent>
							{isAddingServer ? (
								<div className="space-y-4">
									<div>
										<Label htmlFor="server-url">Server URL</Label>
										<Input
											id="server-url"
											placeholder="http://localhost:8009/sse/"
											value={newServerUrl}
											onChange={(e) => setNewServerUrl(e.target.value)}
											onKeyDown={(e) => {
												if (e.key === 'Enter') {
													activeServer ? handleHotSwap() : handleRegisterServer();
												}
											}}
										/>
									</div>
									<div className="flex gap-2">
										<Button
											onClick={activeServer ? handleHotSwap : handleRegisterServer}
											disabled={!newServerUrl.trim() || isSubmitting}
											className="flex-1"
										>
											<Zap className="size-4 mr-1" />
											{activeServer ? 'Hot-Swap' : 'Register'}
										</Button>
										<Button
											variant="outline"
											onClick={() => {
												setIsAddingServer(false);
												setNewServerUrl('');
											}}
											disabled={isSubmitting}
										>
											Cancel
										</Button>
									</div>
								</div>
							) : (
								<Button
									onClick={() => setIsAddingServer(true)}
									className="w-full"
									variant={activeServer ? "outline" : "default"}
								>
									<Plus className="size-4 mr-1" />
									{activeServer ? 'Hot-Swap Server' : 'Register Server'}
								</Button>
							)}
						</CardContent>
					</Card>

					{/* Quick Actions */}
					<Card>
						<CardHeader>
							<CardTitle className="text-sm">Quick Actions</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-2 gap-2">
								<Button
									variant="outline"
									size="sm"
									onClick={() => {
										setNewServerUrl('http://localhost:8009/sse/');
										setIsAddingServer(true);
									}}
									className="text-xs"
								>
									Local Code Index
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={() => {
										setNewServerUrl('http://localhost:8010/sse/');
										setIsAddingServer(true);
									}}
									className="text-xs"
								>
									Custom Server
								</Button>
							</div>
						</CardContent>
					</Card>
				</div>
			</ScrollArea>
		</div>
	);
}