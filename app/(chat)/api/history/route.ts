import { backend } from '@/lib/api/backend-client';

export async function GET(request: Request) {
  try {
    // Use backend client to fetch chats
    const chats = await backend.chat.list();
    
    // Transform to expected pagination format
    const paginatedResponse = {
      chats: chats || [],
      hasMore: false, // Since we're getting all chats at once
    };
    
    return Response.json(paginatedResponse);

  } catch (error) {
    console.error('Error fetching chat history:', error);
    return new Response(
      JSON.stringify({ 
        chats: [], 
        hasMore: false 
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
