
import { Button } from "@/components/ui/button";
import { PlusCircle, MessageSquare, MoreVertical, Archive, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChatSession {
  id: string;
  title: string;
  updated_at: string;
}

interface ChatSidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onNewChat: () => void;
  onSelectChat: (sessionId: string) => void;
  onDeleteChat: (sessionId: string) => void;
}

export function ChatSidebar({ 
  sessions, 
  currentSessionId, 
  onNewChat, 
  onSelectChat,
  onDeleteChat 
}: ChatSidebarProps) {
  const handleDelete = (sessionId: string) => {
    if (confirm("Are you sure you want to delete this chat? This action cannot be undone.")) {
      onDeleteChat(sessionId);
    }
  };

  const ChatActions = ({ sessionId }: { sessionId: string }) => (
    <>
      <DropdownMenuItem
        onSelect={() => handleDelete(sessionId)}
        className="text-destructive focus:text-destructive"
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Delete
      </DropdownMenuItem>
      <DropdownMenuItem disabled>
        <Archive className="mr-2 h-4 w-4" />
        Archive
      </DropdownMenuItem>
    </>
  );

  return (
    <div className="w-64 h-full bg-background border-r p-4 flex flex-col gap-4">
      <Button onClick={onNewChat} className="w-full gap-2">
        <PlusCircle className="h-4 w-4" />
        New Chat
      </Button>
      <div className="flex-1 overflow-y-auto space-y-2">
        {sessions.map((session) => (
          <ContextMenu key={session.id}>
            <ContextMenuTrigger>
              <div
                className={cn(
                  "w-full text-left p-3 rounded-lg flex items-center gap-3 hover:bg-accent transition-colors group",
                  currentSessionId === session.id && "bg-accent"
                )}
              >
                <button
                  onClick={() => onSelectChat(session.id)}
                  className="flex-1 flex items-center gap-3 min-w-0"
                >
                  <MessageSquare className="h-4 w-4 shrink-0" />
                  <div className="flex-1 overflow-hidden">
                    <p className="truncate text-sm">{session.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(session.updated_at), { addSuffix: true })}
                    </p>
                  </div>
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <ChatActions sessionId={session.id} />
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ChatActions sessionId={session.id} />
            </ContextMenuContent>
          </ContextMenu>
        ))}
      </div>
    </div>
  );
}
