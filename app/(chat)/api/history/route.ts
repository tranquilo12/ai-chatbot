// Proxy to Woolly Backend
const WOOLLY_BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost';

export async function GET(request: Request) {
  try {
    // Proxy to Woolly backend
    const response = await fetch(`${WOOLLY_BACKEND_URL}/api/chats`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}`);
    }

    const chats = await response.json();
    
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
