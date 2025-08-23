# AI SDK v5 Helpers for Format Conversion

## Overview

The AI SDK v5 provides several helpers to handle streaming responses and format conversion. Instead of manually parsing and converting streaming formats, we should use these built-in utilities.

## Key Helpers Available

### 1. `streamText()` - Primary Streaming Helper

The main helper for creating streaming text responses that are compatible with `useChat`.

```typescript
import { streamText } from "ai";

const result = streamText({
  model: yourModel,
  prompt: "Your prompt",
});

return result.toDataStreamResponse();
```

**Key Features:**

- Automatically formats output for AI SDK v5 data stream protocol
- Returns proper SSE format with correct headers
- Compatible with `useChat` hook out of the box

### 2. `toDataStreamResponse()` Method

Converts a streaming result to a proper HTTP response.

```typescript
const result = streamText({...});
return result.toDataStreamResponse({
  headers: {
    'Custom-Header': 'value'
  }
});
```

### 3. `createUIMessageStream()` - Custom Stream Creation

For creating custom streaming responses when you need more control.

```typescript
import { createUIMessageStream } from "ai";

const messageStream = createUIMessageStream({
  execute: async ({ writer }) => {
    // Custom streaming logic
    writer.write({
      type: "text-delta",
      delta: "Hello",
      id: messageId,
    });
  },
});

return new Response(messageStream.pipeThrough(new JsonToSseTransformStream()), {
  headers: {
    "Content-Type": "text/event-stream",
    "x-vercel-ai-data-stream": "v1",
  },
});
```

### 4. `JsonToSseTransformStream` - Format Transformer

Converts JSON objects to Server-Sent Events format.

```typescript
import { JsonToSseTransformStream } from 'ai';

const stream = new ReadableStream({...});
return new Response(
  stream.pipeThrough(new JsonToSseTransformStream()),
  { headers: { 'Content-Type': 'text/event-stream' } }
);
```

## Proper Usage Patterns

### Pattern 1: Direct Model Integration (Recommended)

```typescript
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";

export async function POST(request: Request) {
  const { messages } = await request.json();

  const result = streamText({
    model: openai("gpt-4"),
    messages,
  });

  return result.toDataStreamResponse();
}
```

### Pattern 2: Custom Provider Integration

```typescript
import { streamText } from 'ai';

// Create a custom provider that wraps your backend
const customProvider = {
  languageModel: (modelId: string) => ({
    provider: 'custom',
    modelId,
    // Implement the LanguageModel interface
    doStream: async (options) => {
      // Your custom streaming logic here
      // This should return a proper stream that AI SDK can handle
    },
  }),
};

export async function POST(request: Request) {
  const result = streamText({
    model: customProvider.languageModel('your-model'),
    messages: [...],
  });

  return result.toDataStreamResponse();
}
```

### Pattern 3: Proxy with Format Conversion (Current Approach - Not Recommended)

```typescript
// This is what we're currently doing - manually converting formats
// This is complex and error-prone
const messageStream = createUIMessageStream({
  execute: async ({ writer }) => {
    // Manual parsing and conversion of external API response
    // Convert from backend format to AI SDK format
  },
});
```

## Expected Data Stream Format

The AI SDK v5 expects this format:

```
Content-Type: text/event-stream
x-vercel-ai-data-stream: v1

data: {"type":"text-delta","delta":"Hello","id":"msg-123"}
data: {"type":"text-delta","delta":" world","id":"msg-123"}
data: {"type":"finish","finishReason":"stop","usage":{"promptTokens":10,"completionTokens":5}}
```

## Why Use AI SDK Helpers?

### Benefits:

1. **Automatic Format Handling**: No manual parsing/conversion needed
2. **Error Handling**: Built-in error handling and recovery
3. **Type Safety**: Full TypeScript support
4. **Compatibility**: Guaranteed compatibility with `useChat`
5. **Performance**: Optimized streaming performance
6. **Maintenance**: Less code to maintain and debug

### Problems with Manual Conversion:

1. **Format Mismatch**: Easy to get the format wrong
2. **Error Prone**: Manual parsing can fail on edge cases
3. **Maintenance**: Need to update when AI SDK changes
4. **Performance**: Less optimized than built-in helpers
5. **Complexity**: Much more complex code

## Recommended Solution for External APIs

### Option 1: Create a Custom Language Model (Best)

```typescript
import { LanguageModel } from "ai";

class WoollyLanguageModel implements LanguageModel {
  // Implement the LanguageModel interface
  // This integrates directly with streamText()
}

const result = streamText({
  model: new WoollyLanguageModel(),
  messages,
});

return result.toDataStreamResponse();
```

### Option 2: Use AI SDK's Streaming Utilities

```typescript
import { streamText, createStreamableValue } from "ai";

export async function POST(request: Request) {
  const stream = createStreamableValue("");

  // Start streaming from your backend
  (async () => {
    const response = await fetch("your-backend");
    const reader = response.body?.getReader();

    // Process backend stream and update streamable value
    // AI SDK handles the format conversion
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // Parse your backend format and append to stream
      stream.append(parsedText);
    }

    stream.done();
  })();

  return stream.value;
}
```

## Conclusion

The AI SDK provides powerful helpers that handle format conversion automatically. Instead of manually parsing and converting streaming formats, we should:

1. **Use `streamText()` with a custom language model** (preferred)
2. **Use `createStreamableValue()`** for simpler cases
3. **Avoid manual format conversion** with `createUIMessageStream()`

This approach is more reliable, maintainable, and performant than manual conversion.
