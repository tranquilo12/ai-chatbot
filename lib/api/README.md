# Backend API Client

A typed client for interacting with the Woolly backend API. This client provides organized namespaces for different API operations with automatic data transformation and error handling.

## Features

- **Typed interfaces** for all API requests and responses
- **Automatic data transformation** between camelCase (frontend) and snake_case (backend)
- **Organized namespaces** for chat, message, agent, and health operations
- **Consistent error handling** with standardized error objects
- **Zero dependencies** beyond standard fetch API

## Usage

```typescript
import { backend } from "@/lib/api/backend-client";

// Chat operations
const chat = await backend.chat.create();
const chats = await backend.chat.list();
await backend.chat.updateTitle(chat.id, { title: "New Title" });
await backend.chat.delete(chat.id);

// Message operations
const messages = await backend.message.list(chat.id);
const message = await backend.message.create(chat.id, {
  role: "user",
  content: "Hello, world!",
});

// Agent operations
const agents = await backend.agent.list();
const agent = await backend.agent.create({
  name: "My Agent",
  description: "A helpful agent",
  systemPrompt: "You are a helpful assistant",
  tools: ["search", "analyze"],
});

// Health checks
const health = await backend.health.check();
const agentHealth = await backend.agent.health();
```

## Error Handling

All methods throw standardized `BackendError` objects:

```typescript
try {
  const chat = await backend.chat.create();
} catch (error) {
  if (error.detail) {
    console.error("Backend error:", error.detail);
    console.error("Status code:", error.status);
  }
}
```

## Configuration

The client uses the `WOOLLY_BACKEND_URL` constant from `../constants`, which defaults to `http://localhost:8000` and can be overridden with the `NEXT_PUBLIC_BACKEND_URL` environment variable.

## Data Transformation

The client automatically converts between frontend camelCase and backend snake_case:

- **Outgoing requests**: `{ userId: '123' }` → `{ user_id: '123' }`
- **Incoming responses**: `{ created_at: '...' }` → `{ createdAt: '...' }`

## Namespaces

### `backend.chat`

- `create(params?)` - Create new chat
- `list()` - List all chats
- `delete(chatId)` - Delete chat
- `updateTitle(chatId, params)` - Update chat title

### `backend.message`

- `list(chatId)` - Get chat messages
- `create(chatId, params)` - Create message
- `update(chatId, messageId, params)` - Update message
- `delete(chatId, messageId)` - Delete message
- `updateModel(chatId, messageId, params)` - Update message model

### `backend.agent`

- `list(params?)` - List agents (with optional filtering)
- `get(agentId)` - Get specific agent
- `create(params)` - Create agent
- `update(agentId, params)` - Update agent
- `delete(agentId)` - Delete agent
- `health()` - Agent system health check

### `backend.health`

- `check()` - Basic API health check

## Advanced Usage

For advanced use cases, utility functions are also exported:

```typescript
import { backend } from "@/lib/api/backend-client";

// Direct API calls
const data = await backend.request("GET", "/api/custom-endpoint");

// Manual data transformation
const camelData = backend.toCamelCase(snakeData);
const snakeData = backend.toSnakeCase(camelData);

// Error handling
const error = backend.fromBackendError(rawError, 400);
```
