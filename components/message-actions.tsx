import { useSWRConfig } from 'swr';
import { useCopyToClipboard } from 'usehooks-ts';

import type { Vote } from '@/lib/db/schema';

import { CopyIcon, ThumbDownIcon, ThumbUpIcon } from './icons';
import { Button } from './ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import { memo } from 'react';
import equal from 'fast-deep-equal';
import { toast } from 'sonner';
import type { ChatMessage } from '@/lib/types';
import { MessageUsage } from './message-usage';

export function PureMessageActions({
  chatId,
  message,
  vote,
  isLoading,
  usage,
  allMessages,
}: {
  chatId: string;
  message: ChatMessage;
  vote: Vote | undefined;
  isLoading: boolean;
  usage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number };
  allMessages?: ChatMessage[];
}) {
  const { mutate } = useSWRConfig();
  const [_, copyToClipboard] = useCopyToClipboard();

  if (isLoading) return null;
  if (message.role === 'user') return null;

  // Calculate running total of tokens up to this message
  const currentMessageIndex = allMessages?.findIndex(msg => msg.id === message.id) ?? -1;
  const messagesUpToHere = allMessages?.slice(0, currentMessageIndex + 1) ?? [];
  const runningTotal = messagesUpToHere.reduce((total, msg) => {
    const msgUsage = (msg.metadata as any)?.usage;
    return total + (msgUsage?.totalTokens || 0);
  }, 0);

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex flex-row gap-2 items-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="py-1 px-2 h-fit text-muted-foreground"
              variant="outline"
              onClick={async () => {
                const textFromParts = message.parts
                  ?.filter((part) => part.type === 'text')
                  .map((part) => part.text)
                  .join('\n')
                  .trim();

                if (!textFromParts) {
                  toast.error("There's no text to copy!");
                  return;
                }

                await copyToClipboard(textFromParts);
                toast.success('Copied to clipboard!');
              }}
            >
              <CopyIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copy</TooltipContent>
        </Tooltip>

        {/* Usage information for this message */}
        {(usage || runningTotal > 0) && (
          <MessageUsage
            promptTokens={usage?.promptTokens}
            completionTokens={usage?.completionTokens}
            totalTokens={usage?.totalTokens}
            showRunningTotal={!usage?.totalTokens && runningTotal > 0}
            runningTotal={runningTotal}
          />
        )}

        {/* TODO: Implement voting with Woolly backend when available
            Temporarily disabled since Woolly backend doesn't support voting yet */}
      </div>
    </TooltipProvider>
  );
}

export const MessageActions = memo(
  PureMessageActions,
  (prevProps, nextProps) => {
    if (!equal(prevProps.vote, nextProps.vote)) return false;
    if (prevProps.isLoading !== nextProps.isLoading) return false;

    return true;
  },
);
