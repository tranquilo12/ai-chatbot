'use client';

import { useState, useEffect, useCallback } from 'react';
import { MCPClient } from '@/lib/api/mcp-client';
import type {
	MCPServer,
	MCPStatus,
	MCPPanelState,
	CreateMCPServerRequest,
	UpdateMCPServerRequest,
} from '@/lib/mcp/types';

interface UseMCPServersReturn {
	// State
	servers: MCPServer[];
	mcpStatus: MCPStatus;
	isLoading: boolean;
	error: string | null;
	selectedServerId: string | undefined;
	isAddingServer: boolean;

	// Actions
	refreshServers: () => Promise<void>;
	refreshStatus: () => Promise<void>;
	createServer: (params: CreateMCPServerRequest) => Promise<{ success: boolean; error?: string }>;
	updateServer: (serverId: string, params: UpdateMCPServerRequest) => Promise<{ success: boolean; error?: string }>;
	deleteServer: (serverId: string) => Promise<{ success: boolean; error?: string }>;
	testServerHealth: (serverId: string) => Promise<{ success: boolean; error?: string }>;
	registerServer: (url: string) => Promise<{ success: boolean; error?: string }>;
	deregisterServer: () => Promise<{ success: boolean; error?: string }>;

	// UI State
	setSelectedServerId: (id: string | undefined) => void;
	setIsAddingServer: (adding: boolean) => void;
	clearError: () => void;
}

export function useMCPServers(): UseMCPServersReturn {
	const [state, setState] = useState<MCPPanelState>({
		servers: [],
		selectedServerId: undefined,
		isAddingServer: false,
		statusRefreshInterval: 30000, // 30 seconds
		globalMCPStatus: {
			status: 'unknown',
			available: false,
			capabilities: [],
			fallbackMode: true,
		},
	});

	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Refresh servers list
	const refreshServers = useCallback(async () => {
		try {
			setError(null);
			const servers = await MCPClient.getAllServers();
			setState(prev => ({ ...prev, servers }));
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to fetch servers';
			setError(errorMessage);
			console.error('Failed to refresh servers:', err);
		}
	}, []);

	// Refresh MCP status
	const refreshStatus = useCallback(async () => {
		try {
			const mcpStatus = await MCPClient.getStatus();
			setState(prev => ({ ...prev, globalMCPStatus: mcpStatus }));
		} catch (err) {
			console.error('Failed to refresh MCP status:', err);
			setState(prev => ({
				...prev,
				globalMCPStatus: {
					status: 'unknown',
					available: false,
					capabilities: [],
					fallbackMode: true,
					errorDetails: {
						message: err instanceof Error ? err.message : 'Unknown error',
						errorCount: 1,
						consecutiveFailures: 1,
					},
				},
			}));
		}
	}, []);

	// Create server
	const createServer = useCallback(async (params: CreateMCPServerRequest) => {
		try {
			setError(null);
			setIsLoading(true);

			const result = await MCPClient.createAndRegisterServer(params);

			if (result.success) {
				await refreshServers();
				await refreshStatus();
				setState(prev => ({ ...prev, isAddingServer: false }));
			} else {
				setError(result.error || 'Failed to create server');
			}

			return result;
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to create server';
			setError(errorMessage);
			return { success: false, error: errorMessage };
		} finally {
			setIsLoading(false);
		}
	}, [refreshServers, refreshStatus]);

	// Update server
	const updateServer = useCallback(async (serverId: string, params: UpdateMCPServerRequest) => {
		try {
			setError(null);
			setIsLoading(true);

			const result = await MCPClient.updateServer(serverId, params);

			if (result.success) {
				await refreshServers();
				await refreshStatus();
			} else {
				setError(result.error || 'Failed to update server');
			}

			return result;
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to update server';
			setError(errorMessage);
			return { success: false, error: errorMessage };
		} finally {
			setIsLoading(false);
		}
	}, [refreshServers, refreshStatus]);

	// Delete server
	const deleteServer = useCallback(async (serverId: string) => {
		try {
			setError(null);
			setIsLoading(true);

			const result = await MCPClient.deleteServer(serverId);

			if (result.success) {
				await refreshServers();
				await refreshStatus();
				setState(prev => ({
					...prev,
					selectedServerId: prev.selectedServerId === serverId ? undefined : prev.selectedServerId
				}));
			} else {
				setError(result.error || 'Failed to delete server');
			}

			return result;
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to delete server';
			setError(errorMessage);
			return { success: false, error: errorMessage };
		} finally {
			setIsLoading(false);
		}
	}, [refreshServers, refreshStatus]);

	// Test server health
	const testServerHealth = useCallback(async (serverId: string) => {
		try {
			setError(null);

			const result = await MCPClient.testServerHealth(serverId);

			if (result.success) {
				await refreshServers(); // Refresh to get updated health status
			} else {
				setError(result.error || 'Health check failed');
			}

			return result;
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to test server health';
			setError(errorMessage);
			return { success: false, error: errorMessage };
		}
	}, [refreshServers]);

	// Register server with MCP system
	const registerServer = useCallback(async (url: string) => {
		try {
			setError(null);

			const result = await MCPClient.registerServer({ url, validateConnection: true });

			if (result.success) {
				await refreshServers();
				await refreshStatus();
			} else {
				setError(result.error || 'Failed to register server');
			}

			return result;
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to register server';
			setError(errorMessage);
			return { success: false, error: errorMessage };
		}
	}, [refreshServers, refreshStatus]);

	// Deregister current server
	const deregisterServer = useCallback(async () => {
		try {
			setError(null);

			const result = await MCPClient.deregisterServer();

			if (result.success) {
				await refreshStatus();
			} else {
				setError(result.error || 'Failed to deregister server');
			}

			return result;
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to deregister server';
			setError(errorMessage);
			return { success: false, error: errorMessage };
		}
	}, [refreshStatus]);

	// UI state setters
	const setSelectedServerId = useCallback((id: string | undefined) => {
		setState(prev => ({ ...prev, selectedServerId: id }));
	}, []);

	const setIsAddingServer = useCallback((adding: boolean) => {
		setState(prev => ({ ...prev, isAddingServer: adding }));
	}, []);

	const clearError = useCallback(() => {
		setError(null);
	}, []);

	// Initial load and periodic refresh
	useEffect(() => {
		const loadInitialData = async () => {
			setIsLoading(true);
			await Promise.all([refreshServers(), refreshStatus()]);
			setIsLoading(false);
		};

		loadInitialData();

		// Set up periodic status refresh
		const interval = setInterval(refreshStatus, state.statusRefreshInterval);

		return () => clearInterval(interval);
	}, [refreshServers, refreshStatus, state.statusRefreshInterval]);

	return {
		// State
		servers: state.servers,
		mcpStatus: state.globalMCPStatus,
		isLoading,
		error,
		selectedServerId: state.selectedServerId,
		isAddingServer: state.isAddingServer,

		// Actions
		refreshServers,
		refreshStatus,
		createServer,
		updateServer,
		deleteServer,
		testServerHealth,
		registerServer,
		deregisterServer,

		// UI State
		setSelectedServerId,
		setIsAddingServer,
		clearError,
	};
}
