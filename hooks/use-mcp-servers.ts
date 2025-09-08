import { useState, useCallback, useEffect } from 'react';
import { MCPClient } from '@/lib/api/mcp-client';
import type { MCPStatus, MCPRegistryStatus } from '@/lib/mcp/types';

// ============================================================================
// Types for Registry-Based MCP Management
// ============================================================================

interface MCPServerInfo {
	url: string;
	capabilities: string[];
	isActive: boolean;
	isHealthy: boolean;
	lastCheck?: string;
}

interface MCPRegistryState {
	// Current active server info (null if no server registered)
	activeServer: MCPServerInfo | null;

	// MCP system status
	mcpStatus: MCPStatus;

	// Registry status
	registryStatus: MCPRegistryStatus;

	// UI state
	isAddingServer: boolean;
	statusRefreshInterval: number;
}

interface UseMCPServersReturn {
	// State
	activeServer: MCPServerInfo | null;
	mcpStatus: MCPStatus;
	registryStatus: MCPRegistryStatus;
	isLoading: boolean;
	error: string | null;
	isAddingServer: boolean;

	// Actions
	refreshStatus: () => Promise<void>;
	registerServer: (url: string, validateConnection?: boolean) => Promise<{ success: boolean; error?: string }>;
	deregisterServer: () => Promise<{ success: boolean; error?: string }>;
	hotSwapServer: (newUrl: string, validateConnection?: boolean) => Promise<{ success: boolean; error?: string; message?: string }>;
	testConnection: () => Promise<{ success: boolean; error?: string }>;

	// UI State
	setIsAddingServer: (adding: boolean) => void;
	clearError: () => void;

	// Utility
	hasCapability: (capability: string) => boolean;
	isServerActive: (url: string) => boolean;
}

export function useMCPServers(): UseMCPServersReturn {
	const [state, setState] = useState<MCPRegistryState>({
		activeServer: null,
		mcpStatus: {
			status: 'unknown',
			available: false,
			capabilities: [],
			fallbackMode: true,
		},
		registryStatus: {
			status: 'inactive',
			isActive: false,
			message: 'Registry not available',
			url: undefined,
			details: undefined,
		},
		isAddingServer: false,
		statusRefreshInterval: 30000, // 30 seconds
	});

	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Refresh MCP and registry status
	const refreshStatus = useCallback(async () => {
		try {
			setError(null);
			const systemStatus = await MCPClient.getSystemStatus();

			// Build active server info from status - prioritize registry status for server existence
			const activeServer: MCPServerInfo | null = systemStatus.activeServerUrl ? {
				url: systemStatus.activeServerUrl,
				capabilities: systemStatus.capabilities,
				isActive: systemStatus.registryStatus.isActive,
				isHealthy: systemStatus.isHealthy,
				lastCheck: new Date().toISOString(),
			} : null;

			// If we have a registered server but it's not healthy, still show it but mark as unhealthy
			if (systemStatus.registryStatus.isActive && systemStatus.activeServerUrl && !systemStatus.isHealthy) {
				// Clear any previous errors since we found a registered server
				setError(null);
			}

			setState(prev => ({
				...prev,
				activeServer,
				mcpStatus: systemStatus.mcpStatus,
				registryStatus: systemStatus.registryStatus,
			}));
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to refresh MCP status';
			setError(errorMessage);
			console.error('Failed to refresh MCP status:', err);

			// Set fallback state
			setState(prev => ({
				...prev,
				activeServer: null,
				mcpStatus: {
					status: 'unknown',
					available: false,
					capabilities: [],
					fallbackMode: true,
					errorDetails: {
						message: errorMessage,
						errorCount: 1,
						consecutiveFailures: 1,
					},
				},
			}));
		}
	}, []);

	// Register a new MCP server
	const registerServer = useCallback(async (url: string, validateConnection = true) => {
		try {
			setError(null);

			const result = await MCPClient.registerServer({
				url,
				validateConnection,
			});

			if (result.success) {
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
	}, [refreshStatus]);

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

	// Hot-swap server (deregister current, register new)
	const hotSwapServer = useCallback(async (newUrl: string, validateConnection = true) => {
		try {
			setError(null);

			const result = await MCPClient.hotSwapServer(newUrl, validateConnection);

			if (result.success) {
				await refreshStatus();
			} else {
				setError(result.error || 'Failed to swap server');
			}

			return result;
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to swap server';
			setError(errorMessage);
			return { success: false, error: errorMessage };
		}
	}, [refreshStatus]);

	// Test connection to current server
	const testConnection = useCallback(async () => {
		try {
			setError(null);

			const result = await MCPClient.testConnection();

			if (!result.success) {
				setError(result.error || 'Connection test failed');
			}

			return result;
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to test connection';
			setError(errorMessage);
			return { success: false, error: errorMessage };
		}
	}, []);

	// UI state setters
	const setIsAddingServer = useCallback((adding: boolean) => {
		setState(prev => ({ ...prev, isAddingServer: adding }));
	}, []);

	const clearError = useCallback(() => {
		setError(null);
	}, []);

	// Utility functions
	const hasCapability = useCallback((capability: string): boolean => {
		return state.mcpStatus.capabilities.includes(capability);
	}, [state.mcpStatus.capabilities]);

	const isServerActive = useCallback((url: string): boolean => {
		return state.activeServer?.url === url && state.activeServer?.isActive;
	}, [state.activeServer]);

	// Initial load and periodic refresh
	useEffect(() => {
		const loadInitialData = async () => {
			setIsLoading(true);
			await refreshStatus();
			setIsLoading(false);
		};

		loadInitialData();

		// Set up periodic status refresh
		const interval = setInterval(refreshStatus, state.statusRefreshInterval);

		return () => clearInterval(interval);
	}, [refreshStatus, state.statusRefreshInterval]);

	return {
		// State
		activeServer: state.activeServer,
		mcpStatus: state.mcpStatus,
		registryStatus: state.registryStatus,
		isLoading,
		error,
		isAddingServer: state.isAddingServer,

		// Actions
		refreshStatus,
		registerServer,
		deregisterServer,
		hotSwapServer,
		testConnection,

		// UI State
		setIsAddingServer,
		clearError,

		// Utility
		hasCapability,
		isServerActive,
	};
}

// Legacy compatibility - export individual functions for backward compatibility
export const useMCPStatus = () => {
	const { mcpStatus, refreshStatus } = useMCPServers();
	return { mcpStatus, refreshStatus };
};

export const useMCPRegistry = () => {
	const { registryStatus, activeServer, refreshStatus } = useMCPServers();
	return { registryStatus, activeServer, refreshStatus };
};