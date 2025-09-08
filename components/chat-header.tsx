'use client';

import { useRouter } from 'next/navigation';
import { useWindowSize } from 'usehooks-ts';

import { ModelSelector } from '@/components/model-selector';
import { SidebarToggle } from '@/components/sidebar-toggle';
import { Button } from '@/components/ui/button';
import { PlusIcon } from './icons';
import { useSidebar } from './ui/sidebar';
import { memo, useEffect, useState } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { type VisibilityType, VisibilitySelector } from './visibility-selector';
import { UsageIndicator } from './usage-indicator';
import type { Session, User } from 'next-auth';
import { useTheme } from 'next-themes';
import { MoonIcon, SunIcon } from 'lucide-react';
import { SidebarUserNav } from './sidebar-user-nav';

function PureChatHeader({
  chatId,
  selectedModelId,
  selectedVisibilityType,
  isReadonly,
  session,
}: {
  chatId: string;
  selectedModelId: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
  session: Session;
}) {
  const router = useRouter();
  const { open } = useSidebar();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const { width: windowWidth } = useWindowSize();

  // Prevent hydration mismatch by only rendering theme-dependent content after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="flex sticky top-0 panel-primary-bg items-center gap-2 justify-between header-container-padding">
      <div className="flex items-center gap-2">
        <SidebarToggle />

        {(!open || windowWidth < 768) && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                className="order-2 md:order-1 md:px-2 px-2 md:h-fit ml-auto md:ml-0"
                onClick={() => {
                  router.push('/');
                  router.refresh();
                }}
              >
                <PlusIcon />
                <span className="md:sr-only">New Chat</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>New Chat</TooltipContent>
          </Tooltip>
        )}

        {!isReadonly && (
          <ModelSelector
            session={session}
            selectedModelId={selectedModelId}
            className="order-1 md:order-2"
          />
        )}

        {!isReadonly && (
          <VisibilitySelector
            chatId={chatId}
            selectedVisibilityType={selectedVisibilityType}
            className="order-1 md:order-3"
          />
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="order-3 md:order-4"
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            >
              {mounted ? (
                resolvedTheme === 'dark' ? (
                  <SunIcon className="size-4" />
                ) : (
                  <MoonIcon className="size-4" />
                )
              ) : (
                <SunIcon className="size-4" />
              )}
              <span className="sr-only">Toggle theme</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {mounted ? `Toggle ${resolvedTheme === 'light' ? 'dark' : 'light'} mode` : 'Toggle theme'}
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="flex items-center gap-2">
        {session?.user && <SidebarUserNav user={session.user as User} />}
      </div>
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader, (prevProps, nextProps) => {
  return prevProps.selectedModelId === nextProps.selectedModelId;
});
