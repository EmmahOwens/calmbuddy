
import { Button } from "@/components/ui/button";
import { PlusCircle, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

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
}

export function ChatSidebar({ sessions, currentSessionId, onNewChat, onSelectChat }: ChatSidebarProps) {
  return (
    <div className="w-64 h-full bg-background border-r p-4 flex flex-col gap-4">
      <Button onClick={onNewChat} className="w-full gap-2">
        <PlusCircle className="h-4 w-4" />
        New Chat
      </Button>
      <div className="flex-1 overflow-y-auto space-y-2">
        {sessions.map((session) => (
          <button
            key={session.id}
            onClick={() => onSelectChat(session.id)}
            className={cn(
              "w-full text-left p-3 rounded-lg flex items-center gap-3 hover:bg-accent transition-colors",
              currentSessionId === session.id && "bg-accent"
            )}
          >
            <MessageSquare className="h-4 w-4 shrink-0" />
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm">{session.title}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(session.updated_at), { addSuffix: true })}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
