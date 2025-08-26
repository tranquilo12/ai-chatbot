import type { Chat } from '@/lib/db/schema';
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from './ui/sidebar';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  CheckCircleFillIcon,
  GlobeIcon,
  LockIcon,
  MoreHorizontalIcon,
  ShareIcon,
  TrashIcon,
  PenIcon,
} from './icons';
import { memo, useState, useRef, useEffect } from 'react';
import { useChatVisibility } from '@/hooks/use-chat-visibility';
import { toast } from 'sonner';
import { Input } from './ui/input';
import { SparklesIcon } from 'lucide-react';
import { useChatTitleUpdate } from '@/hooks/use-chat-title-update';

const PureChatItem = ({
  chat,
  isActive,
  onDelete,
  setOpenMobile,
  onTitleUpdate,
}: {
  chat: Chat;
  isActive: boolean;
  onDelete: (chatId: string) => void;
  setOpenMobile: (open: boolean) => void;
  onTitleUpdate?: (chatId: string, newTitle: string) => void;
}) => {
  const { visibilityType, setVisibilityType } = useChatVisibility({
    chatId: chat.id,
    initialVisibilityType: chat.visibility,
  });

  const { updateChatTitle, generateAndUpdateTitle } = useChatTitleUpdate();

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(chat.title);
  const [isUpdating, setIsUpdating] = useState(false);
  const [displayTitle, setDisplayTitle] = useState(chat.title);
  const [isAnimating, setIsAnimating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Handle title changes with smooth animation
  useEffect(() => {
    if (chat.title !== displayTitle) {
      setIsAnimating(true);
      // Small delay to trigger the animation
      const timer = setTimeout(() => {
        setDisplayTitle(chat.title);
        // Reset animation state after transition
        const resetTimer = setTimeout(() => {
          setIsAnimating(false);
        }, 300); // Match the CSS transition duration
        return () => clearTimeout(resetTimer);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [chat.title, displayTitle]);

  const handleTitleSubmit = async () => {
    if (!editTitle.trim() || editTitle === chat.title) {
      setIsEditing(false);
      setEditTitle(chat.title);
      return;
    }

    setIsUpdating(true);
    try {
      // Use the unified update mechanism
      await updateChatTitle(chat.id, editTitle.trim());

      // Also call the callback for backward compatibility
      onTitleUpdate?.(chat.id, editTitle.trim());

      toast.success('Chat title updated');
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to update chat title');
      setEditTitle(chat.title);
      setIsEditing(false);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSubmit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditTitle(chat.title);
    }
  };

  const handleGenerateTitle = async () => {
    setIsUpdating(true);
    try {
      // Use the unified generate and update mechanism
      const generatedTitle = await generateAndUpdateTitle(chat.id);

      // Also call the callback for backward compatibility
      onTitleUpdate?.(chat.id, generatedTitle);

      toast.success('Title generated successfully');
    } catch (error) {
      console.error('Failed to generate title:', error);
      toast.error('Failed to generate title');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive}>
        {isEditing ? (
          <div className="flex items-center w-full px-2 py-1.5">
            <Input
              ref={inputRef}
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleTitleSubmit}
              disabled={isUpdating}
              className="h-6 text-sm border-none bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
        ) : (
          <Link href={`/chat/${chat.id}`} onClick={() => setOpenMobile(false)}>
            <span
              className={`transition-all duration-300 ease-in-out ${isAnimating ? 'opacity-70 scale-95' : 'opacity-100 scale-100'
                } ${isUpdating ? 'animate-pulse' : ''}`}
            >
              {displayTitle}
            </span>
          </Link>
        )}
      </SidebarMenuButton>

      <DropdownMenu modal={true}>
        <DropdownMenuTrigger asChild>
          <SidebarMenuAction
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground mr-0.5"
            showOnHover={!isActive}
          >
            <MoreHorizontalIcon />
            <span className="sr-only">More</span>
          </SidebarMenuAction>
        </DropdownMenuTrigger>

        <DropdownMenuContent side="bottom" align="end">
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="cursor-pointer">
              <ShareIcon />
              <span>Share</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem
                  className="cursor-pointer flex-row justify-between"
                  onClick={() => {
                    setVisibilityType('private');
                  }}
                >
                  <div className="flex flex-row gap-2 items-center">
                    <LockIcon size={12} />
                    <span>Private</span>
                  </div>
                  {visibilityType === 'private' ? (
                    <CheckCircleFillIcon />
                  ) : null}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer flex-row justify-between"
                  onClick={() => {
                    setVisibilityType('public');
                  }}
                >
                  <div className="flex flex-row gap-2 items-center">
                    <GlobeIcon />
                    <span>Public</span>
                  </div>
                  {visibilityType === 'public' ? <CheckCircleFillIcon /> : null}
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>

          <DropdownMenuItem
            className="cursor-pointer"
            onSelect={() => setIsEditing(true)}
            disabled={isUpdating}
          >
            <PenIcon />
            <span>Rename</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            className="cursor-pointer"
            onSelect={handleGenerateTitle}
            disabled={isUpdating}
          >
            <SparklesIcon className={`size-4 ${isUpdating ? 'animate-spin' : ''}`} />
            <span>{isUpdating ? 'Generating...' : 'Generate Title'}</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            className="cursor-pointer text-destructive focus:bg-destructive/15 focus:text-destructive dark:text-red-500"
            onSelect={() => onDelete(chat.id)}
            disabled={isUpdating}
          >
            <TrashIcon />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
};

export const ChatItem = memo(PureChatItem, (prevProps, nextProps) => {
  if (prevProps.isActive !== nextProps.isActive) return false;
  return true;
});
