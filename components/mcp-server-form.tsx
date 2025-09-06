'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Plus, X, Server } from 'lucide-react';
import type { CreateMCPServerRequest } from '@/lib/mcp/types';

interface MCPServerFormProps {
	onSubmit: (params: CreateMCPServerRequest) => Promise<{ success: boolean; error?: string }>;
	onCancel: () => void;
	isLoading?: boolean;
}

export function MCPServerForm({ onSubmit, onCancel, isLoading = false }: MCPServerFormProps) {
	const [form, setForm] = useState<CreateMCPServerRequest>({
		name: '',
		url: '',
		description: '',
		validateConnection: true,
	});

	const [errors, setErrors] = useState<Record<string, string>>({});

	const validateForm = (): boolean => {
		const newErrors: Record<string, string> = {};

		if (!form.name.trim()) {
			newErrors.name = 'Server name is required';
		}

		if (!form.url.trim()) {
			newErrors.url = 'Server URL is required';
		} else {
			try {
				new URL(form.url);
			} catch {
				newErrors.url = 'Please enter a valid URL';
			}
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!validateForm()) {
			return;
		}

		const result = await onSubmit(form);

		if (result.success) {
			// Reset form on success
			setForm({
				name: '',
				url: '',
				description: '',
				validateConnection: true,
			});
			setErrors({});
		}
	};

	const handlePresetUrl = (preset: string) => {
		setForm(prev => ({ ...prev, url: preset }));
		setErrors(prev => ({ ...prev, url: '' }));
	};

	const urlPresets = [
		{ label: 'Local MCP Server', url: 'http://localhost:8009/sse/' },
		{ label: 'Local Development', url: 'http://localhost:3001/mcp' },
	];

	return (
		<Card className="w-full">
			<CardHeader>
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Server className="size-4" />
						<CardTitle className="text-sm">Add MCP Server</CardTitle>
					</div>
					<Button
						variant="ghost"
						size="sm"
						onClick={onCancel}
						className="size-6 p-0"
					>
						<X className="size-3" />
					</Button>
				</div>
				<CardDescription className="text-xs">
					Configure a new Model Context Protocol server
				</CardDescription>
			</CardHeader>

			<CardContent>
				<form onSubmit={handleSubmit} className="space-y-4">
					{/* Server Name */}
					<div className="space-y-1">
						<Label htmlFor="name" className="text-xs">
							Server Name *
						</Label>
						<Input
							id="name"
							value={form.name}
							onChange={(e) => {
								setForm(prev => ({ ...prev, name: e.target.value }));
								setErrors(prev => ({ ...prev, name: '' }));
							}}
							placeholder="e.g., Code Indexing Server"
							className="h-8 text-xs"
							disabled={isLoading}
						/>
						{errors.name && (
							<p className="text-xs text-red-500">{errors.name}</p>
						)}
					</div>

					{/* Server URL */}
					<div className="space-y-1">
						<Label htmlFor="url" className="text-xs">
							Server URL *
						</Label>
						<Input
							id="url"
							value={form.url}
							onChange={(e) => {
								setForm(prev => ({ ...prev, url: e.target.value }));
								setErrors(prev => ({ ...prev, url: '' }));
							}}
							placeholder="http://localhost:8009/sse/"
							className="h-8 text-xs font-mono"
							disabled={isLoading}
						/>
						{errors.url && (
							<p className="text-xs text-red-500">{errors.url}</p>
						)}

						{/* URL Presets */}
						<div className="flex flex-wrap gap-1 mt-1">
							{urlPresets.map((preset) => (
								<Button
									key={preset.url}
									type="button"
									variant="outline"
									size="sm"
									onClick={() => handlePresetUrl(preset.url)}
									className="h-6 px-2 text-xs"
									disabled={isLoading}
								>
									{preset.label}
								</Button>
							))}
						</div>
					</div>

					{/* Description */}
					<div className="space-y-1">
						<Label htmlFor="description" className="text-xs">
							Description
						</Label>
						<Textarea
							id="description"
							value={form.description}
							onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
							placeholder="Optional description of this server's purpose..."
							className="text-xs resize-none"
							rows={2}
							disabled={isLoading}
						/>
					</div>

					{/* Validate Connection */}
					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label htmlFor="validate" className="text-xs">
								Validate Connection
							</Label>
							<p className="text-xs text-muted-foreground">
								Test server connectivity before adding
							</p>
						</div>
						<Switch
							id="validate"
							checked={form.validateConnection}
							onCheckedChange={(checked) =>
								setForm(prev => ({ ...prev, validateConnection: checked }))
							}
							disabled={isLoading}
						/>
					</div>

					{/* Actions */}
					<div className="flex items-center justify-end gap-2 pt-2 border-t">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={onCancel}
							disabled={isLoading}
							className="h-8 px-3 text-xs"
						>
							Cancel
						</Button>
						<Button
							type="submit"
							size="sm"
							disabled={isLoading}
							className="h-8 px-3 text-xs"
						>
							<Plus className="size-3 mr-1" />
							{isLoading ? 'Adding...' : 'Add Server'}
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	);
}
