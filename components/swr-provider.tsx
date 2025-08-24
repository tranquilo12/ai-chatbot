'use client';

import { SWRConfig } from 'swr';
import { toast } from 'sonner';
import { fetcher } from '@/lib/utils';

interface SWRProviderProps {
  children: React.ReactNode;
}

export function SWRProvider({ children }: SWRProviderProps) {
  return (
    <SWRConfig
      value={{
        fetcher: (url: string) => {
          // Allow specific local state keys that don't need fetching
          const localStateKeys = [
            'messages:should-scroll',
            'messages:is-at-bottom', 
            'artifact',
            '-visibility', // for chat visibility keys like "chatId-visibility"
            'artifact-metadata-'
          ];
          
          const isLocalStateKey = localStateKeys.some(key => 
            url === key || url.includes(key)
          );
          
          if (isLocalStateKey) {
            // Return null for local state keys - they don't need fetching
            return Promise.resolve(null);
          }
          
          // Only fetch URLs that start with /api/
          if (!url.startsWith('/api/')) {
            throw new Error(`Invalid SWR key: ${url}. SWR keys should be API endpoints starting with /api/`);
          }
          return fetcher(url);
        },
        onError: (error) => {
          console.error('SWR Error:', error);
          // Only show toast for non-404 errors and actual API errors to avoid spam
          if (error?.status !== 404 && !error.message?.includes('Invalid SWR key')) {
            toast.error('Failed to load data. Please try again.');
          }
        },
        onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
          // Never retry on 404
          if (error?.status === 404) return;
          
          // Never retry on 403 (forbidden)
          if (error?.status === 403) return;
          
          // Only retry up to 3 times
          if (retryCount >= 3) return;
          
          // Retry after 5 seconds
          setTimeout(() => revalidate({ retryCount }), 5000);
        },
        // Global configuration
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        dedupingInterval: 2000,
      }}
    >
      {children}
    </SWRConfig>
  );
}
