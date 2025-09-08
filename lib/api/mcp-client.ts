import { backend } from './backend-client';
import type {
	MCPStatus,
	MCPServerRegistrationRequest,
	MCPRegistryStatus,
} from '../mcp/types';

/**
 * High-level MCP client for registry-based MCP server management
 * 
 * The backend uses a registry-based system where only ONE MCP server
 * can be active at a time. This client provides convenience methods
 * for managing the single active server.
 */
export class MCPClient {
	/**
	 * Get current MCP status with fallback handling
	 */
	static async getStatus(): Promise<MCPStatus> {
		try {
			return await backend.mcp.status();
		} catch (error) {
			console.warn('Failed to get MCP status:', error);
			return {
				status: 'unknown',
				available: false,
				capabilities: [],
				fallbackMode: true,
				errorDetails: {
					message: error instanceof Error ? error.message : 'Unknown error',
					errorCount: 1,
					consecutiveFailures: 1,
				},
			};
		}
	}

	/**
	 * Check if MCP is available and healthy
	 */
	static async isAvailable(): Promise<boolean> {
		const status = await this.getStatus();
		return status.available && ['healthy', 'degraded'].includes(status.status);
	}

	/**
	 * Get registry status (active server information)
	 */
	static async getRegistryStatus(): Promise<MCPRegistryStatus> {
		try {
			const response = await backend.mcp.registryStatus();

			// Map backend response to our expected format
			return {
				...response,
				activeServer: response.url || response.details?.server_url,
				isActive: response.status === 'active' || response.details?.registry_active === true,
			};
		} catch (error) {
			console.warn('Failed to get registry status:', error);
			return {
				status: 'inactive',
				message: 'Registry not available',
				isActive: false,
			};
		}
	}

	/**
	 * Register a new MCP server (replaces any existing active server)
	 */
	static async registerServer(params: MCPServerRegistrationRequest): Promise<{
		success: boolean;
		message?: string;
		error?: string;
		serverInfo?: { url: string; capabilities: string[] };
	}> {
		try {
			const result = await backend.mcp.register(params);

			if (result.success) {
				return {
					success: true,
					message: result.message,
					serverInfo: result.serverInfo,
				};
			} else {
				return {
					success: false,
					error: result.message,
				};
			}
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			};
		}
	}

	/**
	 * Deregister the current active MCP server
	 */
	static async deregisterServer(): Promise<{ success: boolean; error?: string; message?: string }> {
		try {
			const result = await backend.mcp.deregister();
			return {
				success: result.success,
				message: result.message,
				error: result.success ? undefined : result.message,
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			};
		}
	}

	/**
	 * Test connection to the current active MCP server
	 */
	static async testConnection(): Promise<{
		success: boolean;
		connectionTest?: string;
		details?: any;
		error?: string
	}> {
		try {
			const result = await backend.mcp.testConnection();
			return {
				success: result.connectionTest === 'success',
				connectionTest: result.connectionTest,
				details: result.details,
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			};
		}
	}

	/**
	 * Get comprehensive MCP system status including registry information
	 */
	static async getSystemStatus(): Promise<{
		mcpStatus: MCPStatus;
		registryStatus: MCPRegistryStatus;
		activeServerUrl?: string;
		isHealthy: boolean;
		capabilities: string[];
	}> {
		const [mcpStatus, registryStatus] = await Promise.all([
			this.getStatus(),
			this.getRegistryStatus(),
		]);

		// Reconcile registry and MCP status - if registry shows active server but MCP status doesn't,
		// use registry information as the source of truth for server URL
		let activeServerUrl = registryStatus.activeServer;

		// If registry shows active but MCP status shows no server, there might be a connection issue
		// but the server is still registered
		if (registryStatus.isActive && !mcpStatus.available) {
			// Server is registered but not responding - show as registered but unhealthy
			activeServerUrl = registryStatus.activeServer;
		}

		return {
			mcpStatus,
			registryStatus,
			activeServerUrl,
			isHealthy: mcpStatus.available && mcpStatus.status === 'healthy',
			capabilities: mcpStatus.capabilities,
		};
	}

	/**
	 * Hot-swap MCP server (deregister current, register new)
	 */
	static async hotSwapServer(newServerUrl: string, validateConnection = true): Promise<{
		success: boolean;
		error?: string;
		message?: string;
		previousServer?: string;
		newServer?: string;
	}> {
		try {
			// Get current server info
			const currentRegistry = await this.getRegistryStatus();
			const previousServer = currentRegistry.activeServer;

			// Deregister current server (if any)
			if (currentRegistry.isActive) {
				const deregisterResult = await this.deregisterServer();
				if (!deregisterResult.success) {
					console.warn('Failed to deregister current server:', deregisterResult.error);
					// Continue anyway - might be a stale registration
				}
			}

			// Register new server
			const registerResult = await this.registerServer({
				url: newServerUrl,
				validateConnection,
			});

			if (registerResult.success) {
				return {
					success: true,
					message: `Successfully swapped from ${previousServer || 'none'} to ${newServerUrl}`,
					previousServer,
					newServer: newServerUrl,
				};
			} else {
				return {
					success: false,
					error: registerResult.error,
					previousServer,
				};
			}
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			};
		}
	}

	/**
	 * Check if a specific server URL is currently active
	 */
	static async isServerActive(serverUrl: string): Promise<boolean> {
		const registryStatus = await this.getRegistryStatus();
		return registryStatus.isActive && registryStatus.activeServer === serverUrl;
	}

	/**
	 * Get available capabilities from the current active server
	 */
	static async getCapabilities(): Promise<string[]> {
		const status = await this.getStatus();
		return status.capabilities || [];
	}

	/**
	 * Check if a specific capability is available
	 */
	static async hasCapability(capabilityName: string): Promise<boolean> {
		const capabilities = await this.getCapabilities();
		return capabilities.includes(capabilityName);
	}

	/**
	 * Refresh MCP status (useful for polling)
	 */
	static async refresh(): Promise<{
		mcpStatus: MCPStatus;
		registryStatus: MCPRegistryStatus;
		timestamp: string;
	}> {
		const [mcpStatus, registryStatus] = await Promise.all([
			this.getStatus(),
			this.getRegistryStatus(),
		]);

		return {
			mcpStatus,
			registryStatus,
			timestamp: new Date().toISOString(),
		};
	}
}

export default MCPClient;