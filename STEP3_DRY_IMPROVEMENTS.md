# Step 3: DRY Improvements - Eliminating Duplication

## 🔍 **Major Duplication Patterns Identified**

### **1. Message Transformation Logic** 🔴 **Critical Duplication**

**Problem**: Message format conversion scattered across multiple files

| **Location**                         | **Duplication**                      | **Impact**                   |
| ------------------------------------ | ------------------------------------ | ---------------------------- |
| `app/(chat)/api/chat/route.ts:14-23` | Frontend → Backend format conversion | Manual `parts.find()` logic  |
| `lib/utils.ts:100-109`               | DB → UI format conversion            | `convertToUIMessages()`      |
| `lib/utils.ts:111-116`               | Extract text from message            | `getTextFromMessage()`       |
| `components/chat.tsx:69-79`          | Message preparation                  | `prepareSendMessagesRequest` |

**Solution**: Create unified message transformation utilities

### **2. Streaming Logic** 🔴 **Critical Duplication**

**Problem**: Complex streaming parsing logic duplicated

| **Location**                                      | **Duplication**                   | **Lines of Code** |
| ------------------------------------------------- | --------------------------------- | ----------------- |
| `app/(chat)/api/chat/route.ts:50-158`             | Woolly stream → AI SDK conversion | ~108 lines        |
| `app/(chat)/api/chat/[id]/stream/route.ts:98-106` | AI SDK stream creation            | ~8 lines          |
| Multiple console.log statements                   | Debug logging                     | ~20 lines         |

**Solution**: Extract reusable streaming utilities

### **3. Message Display Components** 🟡 **Medium Duplication**

**Problem**: Nearly identical message rendering logic

| **Component**                            | **Duplication**            | **Similarity** |
| ---------------------------------------- | -------------------------- | -------------- |
| `components/messages.tsx:23-95`          | Message list rendering     | 90% identical  |
| `components/artifact-messages.tsx:22-97` | Artifact message rendering | 90% identical  |
| Message props interface                  | Props definition           | 100% identical |

**Solution**: Create shared message list component

### **4. Error Handling** 🟡 **Medium Duplication**

**Problem**: Repeated error handling patterns

| **Location**                        | **Pattern**                 | **Duplication**   |
| ----------------------------------- | --------------------------- | ----------------- |
| `components/chat.tsx:87-94`         | `ChatSDKError` → toast      | Repeated pattern  |
| `components/swr-provider.tsx:25-35` | SWR error handling          | Similar pattern   |
| Backend client error handling       | HTTP error → `ChatSDKError` | Manual conversion |

**Solution**: Centralized error handling utilities

---

## 🛠 **DRY Refactoring Plan**

### **Phase 1: Message Transformation Utilities**

#### **1.1 Create Message Transform Library**

**File**: `lib/message-transforms.ts`

```typescript
// Unified message transformation utilities
export class MessageTransforms {
  // Frontend ChatMessage → Backend format
  static toBackendMessage(message: ChatMessage): BackendMessageRequest {
    return {
      role: message.role,
      content: this.extractTextContent(message),
      id: message.id,
      tool_invocations: message.toolInvocations || [],
    };
  }

  // Backend format → Frontend ChatMessage
  static fromBackendMessage(backendMessage: BackendMessage): ChatMessage {
    return {
      id: backendMessage.id,
      role: backendMessage.role,
      parts: [{ type: "text", text: backendMessage.content }],
      toolInvocations: backendMessage.tool_invocations || [],
      createdAt: new Date(backendMessage.created_at),
    };
  }

  // Extract text content from ChatMessage parts
  static extractTextContent(message: ChatMessage): string {
    return message.parts?.find((part) => part.type === "text")?.text || "";
  }

  // Prepare messages for API request
  static prepareMessagesForBackend(
    messages: ChatMessage[]
  ): BackendMessageRequest[] {
    return messages.map((msg) => this.toBackendMessage(msg));
  }
}
```

#### **1.2 Update Backend Client**

**File**: `lib/api/backend-client.ts`

```typescript
import { MessageTransforms } from "../message-transforms";

export const message = {
  async create(chatId: string, message: ChatMessage): Promise<BackendMessage> {
    const backendMessage = MessageTransforms.toBackendMessage(message);
    return request<BackendMessage>(
      "POST",
      `/api/chat/${chatId}/messages`,
      backendMessage
    );
  },

  async list(chatId: string): Promise<ChatMessage[]> {
    const backendMessages = await request<BackendMessage[]>(
      "GET",
      `/api/chat/${chatId}/messages`
    );
    return backendMessages.map((msg) =>
      MessageTransforms.fromBackendMessage(msg)
    );
  },

  // ... other methods
};
```

### **Phase 2: Streaming Utilities**

#### **2.1 Create Streaming Helper**

**File**: `lib/streaming/woolly-stream-adapter.ts`

```typescript
import { MessageTransforms } from "../message-transforms";

export class WoollyStreamAdapter {
  static async createMessageStream(
    chatId: string,
    message: ChatMessage,
    options: { onProgress?: (chunk: string) => void } = {}
  ) {
    return createUIMessageStream<ChatMessage>({
      execute: async ({ writer }) => {
        const backendMessage = MessageTransforms.toBackendMessage(message);

        const response = await fetch(
          `${getWoollyBackendUrl()}/api/chat/${chatId}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messages: [backendMessage],
              model: "gpt-4o",
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`Backend error: ${response.status}`);
        }

        await this.processWoollyStream(response, writer, options.onProgress);
      },
    });
  }

  private static async processWoollyStream(
    response: Response,
    writer: any,
    onProgress?: (chunk: string) => void
  ) {
    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body to stream");

    const decoder = new TextDecoder();
    let buffer = "";
    const messageId = crypto.randomUUID();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.trim() && line.startsWith("0:")) {
          const data = JSON.parse(line.substring(2));
          if (data.type === "text" && data.text) {
            writer.write({
              type: "text-delta",
              delta: data.text,
              id: messageId,
            });
            onProgress?.(data.text);
          }
        }
      }
    }
  }
}
```

#### **2.2 Update Chat API Route**

**File**: `app/(chat)/api/chat/route.ts`

```typescript
import { WoollyStreamAdapter } from "@/lib/streaming/woolly-stream-adapter";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, message } = body;
    const chatId = id || crypto.randomUUID();

    // Use the DRY streaming adapter
    const messageStream = await WoollyStreamAdapter.createMessageStream(
      chatId,
      message
    );

    return new Response(
      messageStream.pipeThrough(new JsonToSseTransformStream()),
      {
        headers: {
          "Content-Type": "text/event-stream",
          "x-vercel-ai-data-stream": "v1",
        },
      }
    );
  } catch (error) {
    return ErrorHandler.toResponse(error);
  }
}
```

### **Phase 3: Shared Message Components**

#### **3.1 Create Unified Message List**

**File**: `components/shared/message-list.tsx`

```typescript
interface MessageListProps {
  chatId: string;
  messages: ChatMessage[];
  status: UseChatHelpers<ChatMessage>["status"];
  votes: Array<Vote> | undefined;
  setMessages: UseChatHelpers<ChatMessage>["setMessages"];
  regenerate: UseChatHelpers<ChatMessage>["regenerate"];
  isReadonly: boolean;
  variant?: "default" | "artifact";
  className?: string;
}

export function MessageList({
  chatId,
  messages,
  status,
  votes,
  setMessages,
  regenerate,
  isReadonly,
  variant = "default",
  className,
}: MessageListProps) {
  const {
    containerRef,
    endRef,
    onViewportEnter,
    onViewportLeave,
    hasSentMessage,
  } = useMessages({ chatId, status });

  useDataStream();

  const containerClasses = cn(
    "flex flex-col gap-4 overflow-y-scroll",
    {
      "min-w-0 gap-6 flex-1 pt-4 relative": variant === "default",
      "h-full items-center px-4 pt-20": variant === "artifact",
    },
    className
  );

  return (
    <div ref={containerRef} className={containerClasses}>
      {messages.length === 0 && variant === "default" && <Greeting />}

      {messages.map((message, index) => (
        <PreviewMessage
          key={message.id}
          chatId={chatId}
          message={message}
          isLoading={status === "streaming" && messages.length - 1 === index}
          vote={votes?.find((vote) => vote.messageId === message.id)}
          setMessages={setMessages}
          regenerate={regenerate}
          isReadonly={isReadonly}
          requiresScrollPadding={
            hasSentMessage && index === messages.length - 1
          }
        />
      ))}

      {status === "submitted" &&
        messages.length > 0 &&
        messages[messages.length - 1].role === "user" && <ThinkingMessage />}

      <motion.div
        ref={endRef}
        className="shrink-0 min-w-[24px] min-h-[24px]"
        onViewportLeave={onViewportLeave}
        onViewportEnter={onViewportEnter}
      />
    </div>
  );
}
```

#### **3.2 Update Components to Use Shared List**

**File**: `components/messages.tsx`

```typescript
import { MessageList } from "./shared/message-list";

export function Messages(props: MessagesProps) {
  return <MessageList {...props} variant="default" />;
}
```

**File**: `components/artifact-messages.tsx`

```typescript
import { MessageList } from "./shared/message-list";

export function ArtifactMessages(props: ArtifactMessagesProps) {
  return <MessageList {...props} variant="artifact" />;
}
```

### **Phase 4: Error Handling Utilities**

#### **4.1 Create Error Handler**

**File**: `lib/error-handler.ts`

```typescript
export class ErrorHandler {
  static toResponse(error: unknown): Response {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }

    const chatError = new ChatSDKError(
      "internal_server_error",
      error instanceof Error ? error.message : "Unknown error"
    );
    return chatError.toResponse();
  }

  static toToast(error: unknown): void {
    const message =
      error instanceof ChatSDKError
        ? error.message
        : "Something went wrong. Please try again.";

    toast({
      type: "error",
      description: message,
    });
  }

  static fromBackendError(error: any): ChatSDKError {
    return new ChatSDKError(
      "backend_error",
      error.detail || error.message || "Backend request failed"
    );
  }
}
```

#### **4.2 Update Components to Use Error Handler**

**File**: `components/chat.tsx`

```typescript
import { ErrorHandler } from "@/lib/error-handler";

const {
  /* ... */
} = useChat<ChatMessage>({
  // ...
  onError: ErrorHandler.toToast,
});
```

---

## 📊 **DRY Benefits Analysis**

### **Code Reduction**

- **Before**: ~300 lines of duplicated code
- **After**: ~150 lines of reusable utilities
- **Reduction**: 50% less code to maintain

### **Maintainability Improvements**

- ✅ **Single source of truth** for message transformations
- ✅ **Centralized streaming logic** - fix once, works everywhere
- ✅ **Shared components** - consistent UI behavior
- ✅ **Unified error handling** - consistent UX

### **Testing Benefits**

- ✅ **Focused unit tests** for utilities
- ✅ **Reduced test duplication**
- ✅ **Better test coverage** with isolated functions

### **Developer Experience**

- ✅ **Clear abstractions** - easier to understand
- ✅ **Consistent patterns** - predictable codebase
- ✅ **Easier refactoring** - change once, update everywhere

---

## 🎯 **Updated Step 3 Plan**

### **New Phase Structure**

1. **Phase 1**: Create DRY utilities (message transforms, streaming, errors)
2. **Phase 2**: Update backend client to use utilities
3. **Phase 3**: Refactor API routes to use utilities
4. **Phase 4**: Update components to use shared utilities
5. **Phase 5**: Create shared message components
6. **Phase 6**: Clean up duplicated code

### **Success Criteria**

- ✅ **50% reduction** in duplicated code
- ✅ **All message operations** use backend client
- ✅ **Consistent error handling** across all components
- ✅ **Shared streaming logic** for all message creation
- ✅ **Unified message transformations**

---

## 🚀 **Implementation Priority**

1. **🔴 Critical**: Message transformation utilities (enables everything else)
2. **🔴 Critical**: Streaming utilities (core functionality)
3. **🟡 Medium**: Error handling utilities (better UX)
4. **🟢 Low**: Shared message components (nice to have)

This DRY approach will make Step 3 much more maintainable and set us up for success in future steps!
