'use server';

export async function getSuggestions({ documentId }: { documentId: string }) {
  // Disabled for now - let Woolly backend handle suggestions
  console.log('getSuggestions called with documentId:', documentId);
  return [];
}
