// Mock auth endpoints - disabled for Woolly backend integration
export async function GET(request: Request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  // Handle session requests
  if (pathname.includes('session')) {
    return Response.json({
      user: {
        id: 'mock-user-id',
        email: 'user@example.com',
        type: 'regular',
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
  }
  
  // Handle other auth requests
  return Response.json({ message: 'Auth disabled' });
}

export async function POST(request: Request) {
  return Response.json({ message: 'Auth disabled' });
}
