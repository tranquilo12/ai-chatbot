'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
	Server,
	Activity,
	AlertCircle,
	CheckCircle,
	Clock,
	Edit,
	Trash2,
	Save,
	X,
	Play,
	Pause,
	RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MCPServer, UpdateMCPServerRequest } from '@/lib/mcp/types';

interface MCPServerCardProps {
	server: MCPServer;
	isSelected: boolean;
	onSelect: (serverId: string) => void;
	onUpdate: (serverId: string, params: UpdateMCPServerRequest) => Promise<{ success: boolean; error?: string }>;
	onDelete: (serverId: string) => Promise<{ success: boolean; error?: string }>;
	onTestHealth: (serverId: string) => Promise<{ success: boolean; error?: string }>;
	className?: string;
}

export function MCPServerCard({
	server,
	isSelected,
	onSelect,
	onUpdate,
	onDelete,
	onTestHealth,
	className,
}: MCPServerCardProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [editForm, setEditForm] = useState({
		name: server.name,
		url: server.url,
		description: server.description || '',
		isActive: server.isActive,
	});

	const handleEdit = () => {
		setEditForm({
			name: server.name,
			url: server.url,
			description: server.description || '',
			isActive: server.isActive,
		});
		setIsEditing(true);
	};

	const handleSave = async () => {
		setIsLoading(true);
		try {
			const result = await onUpdate(server.id, editForm);
			if (result.success) {
				setIsEditing(false);
			}
		} finally {
			setIsLoading(false);
		}
	};

	const handleCancel = () => {
		setIsEditing(false);
		setEditForm({
			name: server.name,
			url: server.url,
			description: server.description || '',
			isActive: server.isActive,
		});
	};

	const handleDelete = async () => {
		if (window.confirm(`Are you sure you want to delete "${server.name}"?`)) {
			setIsLoading(true);
			try {
				await onDelete(server.id);
			} finally {
				setIsLoading(false);
			}
		}
	};

	const handleTestHealth = async () => {
		setIsLoading(true);
		try {
			await onTestHealth(server.id);
		} finally {
			setIsLoading(false);
		}
	};

	const getStatusIcon = () => {
		if (!server.isActive) return <Pause className="size-4 text-muted-foreground" />;
		if (server.isHealthy) return <CheckCircle className="size-4 text-green-500" />;
		return <AlertCircle className="size-4 text-red-500" />;
	};

	const getStatusText = () => {
		if (!server.isActive) return 'Inactive';
		if (server.isHealthy) return 'Healthy';
		return 'Unhealthy';
	};

	const getStatusColor = () => {
		if (!server.isActive) return 'secondary';
		if (server.isHealthy) return 'default';
		return 'destructive';
	};

	return (
		<Card
			className={cn(
				'transition-all duration-200 cursor-pointer hover:shadow-md',
				isSelected && 'ring-2 ring-primary ring-offset-2',
				className
			)}
			onClick={() => !isEditing && onSelect(server.id)}
		>
			<CardHeader className="pb-3">
				<div className="flex items-start justify-between">
					<div className="flex items-center gap-2">
						<Server className="size-4 text-muted-foreground" />
						{isEditing ? (
							<Input
								value={editForm.name}
								onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
								className="h-6 text-sm font-medium"
								onClick={(e) => e.stopPropagation()}
							/>
						) : (
							<CardTitle className="text-sm font-medium">{server.name}</CardTitle>
						)}
					</div>

					<div className="flex items-center gap-1">
						{getStatusIcon()}
						<Badge variant={getStatusColor() as any} className="text-xs">
							{getStatusText()}
						</Badge>
					</div>
				</div>

				{isEditing ? (
					<Textarea
						value={editForm.description}
						onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
						placeholder="Server description..."
						className="text-xs resize-none"
						rows={2}
						onClick={(e) => e.stopPropagation()}
					/>
				) : (
					server.description && (
						<CardDescription className="text-xs">
							{server.description}
						</CardDescription>
					)
				)}
			</CardHeader>

			<CardContent className="pt-0 space-y-3">
				{/* URL */}
				<div className="space-y-1">
					<Label className="text-xs text-muted-foreground">URL</Label>
					{isEditing ? (
						<Input
							value={editForm.url}
							onChange={(e) => setEditForm(prev => ({ ...prev, url: e.target.value }))}
							className="h-7 text-xs font-mono"
							onClick={(e) => e.stopPropagation()}
						/>
					) : (
						<div className="text-xs font-mono bg-muted/50 rounded px-2 py-1 break-all">
							{server.url}
						</div>
					)}
				</div>

				{/* Capabilities */}
				{server.capabilities.length > 0 && (
					<div className="space-y-1">
						<Label className="text-xs text-muted-foreground">Capabilities</Label>
						<div className="flex flex-wrap gap-1">
							{server.capabilities.map((capability) => (
								<Badge key={capability} variant="outline" className="text-xs px-1 py-0">
									{capability}
								</Badge>
							))}
						</div>
					</div>
				)}

				{/* Health Info */}
				{server.responseTimeMs && (
					<div className="flex items-center gap-2 text-xs text-muted-foreground">
						<Clock className="size-3" />
						<span>{server.responseTimeMs}ms</span>
						{server.lastHealthCheck && (
							<span>• Last check: {new Date(server.lastHealthCheck).toLocaleTimeString()}</span>
						)}
					</div>
				)}

				{/* Error Message */}
				{server.healthCheckError && (
					<div className="text-xs text-red-500 bg-red-50 dark:bg-red-950/20 rounded px-2 py-1">
						{server.healthCheckError}
					</div>
				)}

				{/* Actions */}
				<div className="flex items-center justify-between pt-2 border-t">
					{isEditing ? (
						<div className="flex items-center gap-1">
							<Button
								size="sm"
								variant="outline"
								onClick={(e) => {
									e.stopPropagation();
									setEditForm(prev => ({ ...prev, isActive: !prev.isActive }));
								}}
								className="h-7 px-2 text-xs"
							>
								{editForm.isActive ? <Pause className="size-3" /> : <Play className="size-3" />}
								{editForm.isActive ? 'Deactivate' : 'Activate'}
							</Button>
						</div>
					) : (
						<div className="flex items-center gap-1">
							<Button
								size="sm"
								variant="outline"
								onClick={(e) => {
									e.stopPropagation();
									handleTestHealth();
								}}
								disabled={isLoading}
								className="h-7 px-2 text-xs"
							>
								<RefreshCw className={cn("size-3", isLoading && "animate-spin")} />
								Test
							</Button>

							<Button
								size="sm"
								variant="outline"
								onClick={(e) => {
									e.stopPropagation();
									handleEdit();
								}}
								className="h-7 px-2 text-xs"
							>
								<Edit className="size-3" />
							</Button>
						</div>
					)}

					<div className="flex items-center gap-1">
						{isEditing ? (
							<>
								<Button
									size="sm"
									onClick={(e) => {
										e.stopPropagation();
										handleSave();
									}}
									disabled={isLoading}
									className="h-7 px-2 text-xs"
								>
									<Save className="size-3" />
									Save
								</Button>
								<Button
									size="sm"
									variant="outline"
									onClick={(e) => {
										e.stopPropagation();
										handleCancel();
									}}
									className="h-7 px-2 text-xs"
								>
									<X className="size-3" />
								</Button>
							</>
						) : (
							<Button
								size="sm"
								variant="outline"
								onClick={(e) => {
									e.stopPropagation();
									handleDelete();
								}}
								disabled={isLoading}
								className="h-7 px-2 text-xs text-red-600 hover:text-red-700"
							>
								<Trash2 className="size-3" />
							</Button>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
