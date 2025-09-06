import { backend } from './backend-client';
import type {
	MCPServer,
	MCPStatus,
	AgentMCPServerMapping,
	CreateMCPServerRequest,
	UpdateMCPServerRequest,
	MCPServerRegistrationRequest,
} from '../mcp/types';

/**
 * High-level MCP client with convenience methods
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
	 * Get all MCP servers with their health status
	 */
	static async getAllServers(): Promise<MCPServer[]> {
		try {
			return await backend.mcpServer.list();
		} catch (error) {
			console.warn('Failed to fetch MCP servers:', error);
			return [];
		}
	}

	/**
	 * Get active (healthy) MCP servers
	 */
	static async getActiveServers(): Promise<MCPServer[]> {
		const servers = await this.getAllServers();
		return servers.filter(server => server.isActive && server.isHealthy);
	}

	/**
	 * Register a new MCP server with validation
	 */
	static async registerServer(params: MCPServerRegistrationRequest): Promise<{ success: boolean; server?: MCPServer; error?: string }> {
		try {
			const registrationResult = await backend.mcp.register(params);

			if (registrationResult.success) {
				// Fetch the updated server list to get the new server details
				const servers = await this.getAllServers();
				const newServer = servers.find(s => s.url === params.url);

				return {
					success: true,
					server: newServer,
				};
			} else {
				return {
					success: false,
					error: registrationResult.message,
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
	 * Create and register a server in one operation
	 */
	static async createAndRegisterServer(params: CreateMCPServerRequest): Promise<{ success: boolean; server?: MCPServer; error?: string }> {
		try {
			// First create the server record
			const server = await backend.mcpServer.create(params);

			// Then register it with the MCP system
			const registrationResult = await this.registerServer({
				url: server.url,
				validateConnection: params.validateConnection,
			});

			if (registrationResult.success) {
				return {
					success: true,
					server: registrationResult.server || server,
				};
			} else {
				// If registration failed, clean up the created server
				await backend.mcpServer.delete(server.id).catch(console.warn);
				return registrationResult;
			}
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			};
		}
	}

	/**
	 * Update server and refresh registration if needed
	 */
	static async updateServer(serverId: string, params: UpdateMCPServerRequest): Promise<{ success: boolean; server?: MCPServer; error?: string }> {
		try {
			const server = await backend.mcpServer.update(serverId, params);

			// If URL changed and server is active, re-register
			if (params.url && server.isActive) {
				const registrationResult = await this.registerServer({
					url: server.url,
					validateConnection: true,
				});

				if (!registrationResult.success) {
					console.warn('Failed to re-register server after URL update:', registrationResult.error);
				}
			}

			return {
				success: true,
				server,
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			};
		}
	}

	/**
	 * Delete server and deregister from MCP system
	 */
	static async deleteServer(serverId: string): Promise<{ success: boolean; error?: string }> {
		try {
			// First deregister from MCP system (if it's the active server)
			const registryStatus = await backend.mcp.registryStatus();
			const server = await backend.mcpServer.get(serverId);

			if (registryStatus.activeServer === server.url) {
				await backend.mcp.deregister().catch(console.warn);
			}

			// Then delete the server record
			await backend.mcpServer.delete(serverId);

			return { success: true };
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			};
		}
	}

	/**
	 * Test server health and update status
	 */
	static async testServerHealth(serverId: string): Promise<{ success: boolean; status?: string; responseTime?: number; error?: string }> {
		try {
			const result = await backend.mcpServer.testHealth(serverId);
			return {
				success: result.status === 'healthy',
				status: result.status,
				responseTime: result.responseTimeMs,
				error: result.error,
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			};
		}
	}

	/**
	 * Get servers mapped to a specific agent
	 */
	static async getServersForAgent(agentId: string): Promise<{ servers: MCPServer[]; mappings: AgentMCPServerMapping[] }> {
		try {
			const mappings = await backend.agentMCPMapping.listByAgent(agentId);
			const allServers = await this.getAllServers();

			const servers = mappings
				.filter(mapping => mapping.isEnabled)
				.sort((a, b) => a.priority - b.priority)
				.map(mapping => allServers.find(server => server.id === mapping.mcpServerId))
				.filter((server): server is MCPServer => server !== undefined);

			return { servers, mappings };
		} catch (error) {
			console.warn('Failed to get servers for agent:', error);
			return { servers: [], mappings: [] };
		}
	}

	/**
	 * Map an agent to MCP servers with priority ordering
	 */
	static async mapAgentToServers(agentId: string, serverIds: string[], priorities?: number[]): Promise<{ success: boolean; mappings?: AgentMCPServerMapping[]; error?: string }> {
		try {
			// Remove existing mappings for this agent
			const existingMappings = await backend.agentMCPMapping.listByAgent(agentId);
			await Promise.all(existingMappings.map(mapping =>
				backend.agentMCPMapping.delete(mapping.id).catch(console.warn)
			));

			// Create new mappings
			const mappings = await Promise.all(
				serverIds.map((serverId, index) =>
					backend.agentMCPMapping.create({
						agentId,
						mcpServerId: serverId,
						priority: priorities?.[index] || index + 1,
						isEnabled: true,
					})
				)
			);

			return {
				success: true,
				mappings,
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			};
		}
	}

	/**
	 * Deregister the current MCP server
	 */
	static async deregisterServer(): Promise<{ success: boolean; error?: string }> {
		try {
			const result = await backend.mcp.deregister();
			return {
				success: result.success,
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
	 * Get comprehensive MCP system status
	 */
	static async getSystemStatus(): Promise<{
		mcpStatus: MCPStatus;
		totalServers: number;
		activeServers: number;
		healthyServers: number;
		servers: MCPServer[];
	}> {
		const [mcpStatus, servers] = await Promise.all([
			this.getStatus(),
			this.getAllServers(),
		]);

		const activeServers = servers.filter(s => s.isActive).length;
		const healthyServers = servers.filter(s => s.isHealthy).length;

		return {
			mcpStatus,
			totalServers: servers.length,
			activeServers,
			healthyServers,
			servers,
		};
	}
}

export default MCPClient;
