// ============================================================================
// MCP Server Types
// ============================================================================

export interface MCPServer {
	id: string;
	name: string;
	url: string;
	description?: string;
	capabilities: string[];
	isActive: boolean;
	isHealthy: boolean;
	lastHealthCheck?: string;
	healthCheckError?: string;
	responseTimeMs?: number;
	createdAt: string;
	updatedAt: string;
	createdByUserId: string;
}

export interface CreateMCPServerRequest {
	name: string;
	url: string;
	description?: string;
	validateConnection?: boolean;
}

export interface UpdateMCPServerRequest {
	name?: string;
	url?: string;
	description?: string;
	isActive?: boolean;
}

// ============================================================================
// Agent-MCP Server Mapping Types
// ============================================================================

export interface AgentMCPServerMapping {
	id: string;
	agentId: string;
	mcpServerId: string;
	priority: number;
	isEnabled: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface CreateAgentMCPMappingRequest {
	agentId: string;
	mcpServerId: string;
	priority?: number;
	isEnabled?: boolean;
}

export interface UpdateAgentMCPMappingRequest {
	priority?: number;
	isEnabled?: boolean;
}

// ============================================================================
// MCP Response Tracking Types
// ============================================================================

export interface MCPResponse {
	id: string;
	chatId: string;
	messageId: string;
	mcpServerId: string;
	agentId?: string;
	toolName?: string;
	toolCallId?: string;
	requestPayload?: any;
	responsePayload?: any;
	responseStatus: 'success' | 'error' | 'timeout' | 'cancelled';
	errorMessage?: string;
	executionTimeMs?: number;
	repositoryName?: string;
	createdAt: string;
}

export interface CreateMCPResponseRequest {
	chatId: string;
	messageId: string;
	mcpServerId: string;
	agentId?: string;
	toolName?: string;
	toolCallId?: string;
	requestPayload?: any;
	responsePayload?: any;
	responseStatus: 'success' | 'error' | 'timeout' | 'cancelled';
	errorMessage?: string;
	executionTimeMs?: number;
	repositoryName?: string;
}

// ============================================================================
// MCP Status and Registry Types
// ============================================================================

export interface MCPStatus {
	status: 'healthy' | 'degraded' | 'failed' | 'disabled' | 'unknown' | 'connecting' | 'retrying';
	available: boolean;
	capabilities: string[];
	serverInfo?: {
		url: string;
		version?: string;
		responseTimeMs?: number;
		lastCheck?: string;
	};
	fallbackMode: boolean;
	errorDetails?: {
		message: string;
		errorCount: number;
		consecutiveFailures: number;
	};
}

export interface MCPRegistryStatus {
	status: string;
	message: string;
	url?: string;
	details?: {
		registry_active: boolean;
		server_url: string;
		server_type: string;
	};
	// Computed properties for backward compatibility
	activeServer?: string;
	isActive: boolean;
}

export interface MCPServerRegistrationRequest {
	url: string;
	validateConnection?: boolean;
}

export interface MCPServerRegistrationResponse {
	success: boolean;
	message: string;
	serverInfo?: {
		url: string;
		capabilities: string[];
	};
}

// ============================================================================
// MCP Chat Integration Types
// ============================================================================

export interface MCPChatHeaders {
	'X-Chat-Type'?: string;
	'X-MCP-Enabled'?: string;
	'X-MCP-Status'?: string;
	'X-MCP-Fallback'?: string;
	'X-MCP-Capabilities'?: string;
	'X-Repository'?: string;
}

export interface MCPChatRequest {
	messages: any[];
	model: string;
	repositoryName?: string;
	agentId?: string;
}

// ============================================================================
// UI State Types
// ============================================================================

export interface MCPServerCardState {
	server: MCPServer;
	isExpanded: boolean;
	isEditing: boolean;
	lastStatusCheck: string;
}

export interface MCPPanelState {
	servers: MCPServer[];
	selectedServerId?: string;
	isAddingServer: boolean;
	statusRefreshInterval: number;
	globalMCPStatus: MCPStatus;
}

// ============================================================================
// Utility Types
// ============================================================================

export type MCPServerStatus = 'healthy' | 'degraded' | 'failed' | 'disabled' | 'unknown';

export interface MCPCapability {
	name: string;
	description: string;
	available: boolean;
}

export interface MCPServerWithMappings extends MCPServer {
	agentMappings: AgentMCPServerMapping[];
	recentResponses: MCPResponse[];
}

// ============================================================================
// Error Types
// ============================================================================

export interface MCPError {
	code: string;
	message: string;
	details?: any;
	serverId?: string;
	timestamp: string;
}

export interface MCPValidationError extends MCPError {
	field: string;
	value: any;
}
