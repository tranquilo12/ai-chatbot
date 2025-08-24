// Proxy to Woolly Backend using AI SDK v5 createUIMessageStream (correct approach for useChat)
import { getWoollyBackendUrl } from '@/lib/constants';
import { createUIMessageStream, JsonToSseTransformStream } from 'ai';
import type { ChatMessage } from '@/lib/types';

export const maxDuration = 60;

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { id, message } = body;

		// Transform frontend request to Woolly backend format
		const woollyRequest = {
			messages: [
				{
					role: message.role,
					content: message.parts.find((part: { type: string; text: string; }) => part.type === 'text')?.text || '',
					id: message.id,
				}
			],
			model: 'gpt-4o',
		};

		// Use provided ID or generate new UUID (backend will auto-create chat if needed)
		const chatId = id || crypto.randomUUID();

		// Create UI message stream using AI SDK helper (correct approach for useChat)
		const messageStream = createUIMessageStream<ChatMessage>({
			execute: async ({ writer }) => {
				try {
					// Proxy to Woolly backend
					const response = await fetch(`${getWoollyBackendUrl()}/api/chat/${chatId}`, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
						},
						body: JSON.stringify(woollyRequest),
					});

					if (!response.ok) {
						throw new Error(`Backend error: ${response.status}`);
					}

					const reader = response.body?.getReader();
					if (!reader) {
						throw new Error('No response body to stream');
					}

					const decoder = new TextDecoder();
					let buffer = '';
					let messageId = crypto.randomUUID();
					let chunkCount = 0;
					let textDeltaCount = 0;

					console.log('🚀 Starting to read from Woolly backend...');

					while (true) {
						const { done, value } = await reader.read();
						if (done) {
							console.log('📝 Backend stream ended, total chunks:', chunkCount);
							break;
						}

						chunkCount++;
						const rawChunk = decoder.decode(value, { stream: true });
						console.log(`📦 Raw chunk ${chunkCount}:`, JSON.stringify(rawChunk));
						
						buffer += rawChunk;
						const lines = buffer.split('\n');
						buffer = lines.pop() || ''; // Keep incomplete line in buffer

						console.log(`🔍 Processing ${lines.length} lines from chunk ${chunkCount}`);

						for (const line of lines) {
							if (line.trim()) {
								console.log('📄 Processing line:', JSON.stringify(line));
								
								// Parse Woolly backend streaming format and convert to AI SDK format
								if (line.startsWith('0:')) {
									// Text chunk: 0:{"type":"text","text":"content"}
									const jsonStr = line.substring(2);
									console.log('🔤 Text chunk JSON:', jsonStr);
									try {
										const data = JSON.parse(jsonStr);
										console.log('🔤 Parsed text data:', data);
										if (data.type === 'text' && data.text) {
											textDeltaCount++;
											console.log(`✅ Writing text-delta #${textDeltaCount}:`, JSON.stringify(data.text));
											// Write text delta using AI SDK writer
											writer.write({
												type: 'text-delta',
												delta: data.text,
												id: messageId,
											});
											console.log(`📤 Sent text-delta #${textDeltaCount} to AI SDK`);
										} else {
											console.log('⚠️ Text chunk missing type or text:', data);
										}
									} catch (e) {
										console.error('❌ Failed to parse text chunk:', e, 'Line:', line);
									}
								} else if (line.startsWith('1:')) {
									// Message start from backend - extract the ID if provided
									const jsonStr = line.substring(2);
									console.log('🆔 Message start JSON:', jsonStr);
									try {
										const data = JSON.parse(jsonStr);
										console.log('🆔 Parsed message start:', data);
										if (data.id) {
											messageId = data.id;
											console.log('🆔 Updated messageId to:', messageId);
											// Send text-start event to AI SDK
											console.log('🚀 Writing text-start event...');
											writer.write({
												type: 'text-start',
												id: messageId,
											});
											console.log('✅ Text-start event sent!');
										}
									} catch (e) {
										console.error('❌ Failed to parse message start:', e);
									}
								} else if (line.startsWith('2:')) {
									// Final message - we can ignore this as we're streaming deltas
									const jsonStr = line.substring(2);
									console.log('📋 Final message JSON:', jsonStr);
									console.log('⏭️ Skipping final message (using deltas instead)');
									continue;
								} else if (line.startsWith('e:')) {
									// Finish event: e:{"finishReason":"stop","usage":{...}}
									const jsonStr = line.substring(2);
									console.log('🏁 Finish event JSON:', jsonStr);
									try {
										const data = JSON.parse(jsonStr);
										console.log('🏁 Parsed finish data:', data);
										// Write finish event to properly close the AI SDK stream
										console.log('🏁 Writing finish event to AI SDK...');
										writer.write({
											type: 'finish',
										});
										console.log('✅ Finish event sent! Stream should be complete.');
										console.log('📊 Final stats - Chunks:', chunkCount, 'Text deltas:', textDeltaCount);
									} catch (e) {
										console.error('❌ Failed to parse finish event:', e);
										// Write a default finish event if parsing fails
										console.log('🏁 Writing default finish event...');
										writer.write({
											type: 'finish',
										});
										console.log('✅ Default finish event sent!');
									}
								} else {
									console.log('❓ Unknown line format:', JSON.stringify(line));
								}
							}
						}
					}
				} catch (error) {
					console.error('❌ Error in streaming:', error);
					// Write error finish event
					console.log('🏁 Writing error finish event...');
					writer.write({
						type: 'finish',
					});
					console.log('✅ Error finish event sent!');
				}
				console.log('🔚 Execute function completing, stream will auto-close');
			},
		});

		// Return the AI SDK compatible streaming response (correct format for useChat)
		return new Response(
			messageStream.pipeThrough(new JsonToSseTransformStream()),
			{
				status: 200,
				headers: {
					'Content-Type': 'text/event-stream',
					'Cache-Control': 'no-cache',
					'Connection': 'keep-alive',
					'x-vercel-ai-data-stream': 'v1',
				},
			}
		);

	} catch (error) {
		console.error('Chat API error:', error);
		return new Response(
			JSON.stringify({ error: 'Internal server error' }),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			}
		);
	}
}

export async function DELETE(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const chatId = searchParams.get('id');

		if (!chatId) {
			return new Response(
				JSON.stringify({ error: 'Chat ID is required' }),
				{
					status: 400,
					headers: { 'Content-Type': 'application/json' },
				}
			);
		}

		// Import backend client here to avoid circular imports
		const { backend } = await import('@/lib/api/backend-client');
		
		// Delete chat using backend client
		await backend.chat.delete(chatId);

		return new Response(
			JSON.stringify({ success: true }),
			{
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			}
		);

	} catch (error) {
		console.error('Chat delete error:', error);
		return new Response(
			JSON.stringify({ error: 'Failed to delete chat' }),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			}
		);
	}
}