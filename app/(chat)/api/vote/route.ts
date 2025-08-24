import { auth } from '@/app/(auth)/auth';
import { ChatSDKError } from '@/lib/errors';

// TODO: Implement voting with Woolly backend when available
// Temporarily disabled since Woolly backend doesn't support voting yet

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError('unauthorized:vote').toResponse();
  }

  // Return empty votes array since voting is disabled
  return Response.json([], { status: 200 });
}

export async function PATCH(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError('unauthorized:vote').toResponse();
  }

  // Return success but don't actually vote since voting is disabled
  return new Response('Voting temporarily disabled during backend migration', { 
    status: 501 // Not Implemented
  });
}
