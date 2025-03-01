
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: string;
  isBot: boolean;
  image?: string;
}

export function ChatMessage({ message, isBot, image }: ChatMessageProps) {
  return (
    <div
      className={cn(
        "flex w-full gap-2 py-2",
        isBot ? "justify-start" : "justify-end"
      )}
    >
      <div
        className={cn(
          "neumorphic-box max-w-[80%] p-4 rounded-2xl message-transition animate-fade-in",
          isBot ? "rounded-bl-sm" : "rounded-br-sm"
        )}
      >
        {image && (
          <img
            src={image}
            alt="Uploaded content"
            className="max-w-full h-auto rounded-lg mb-2"
          />
        )}
        <p className="text-foreground">{message}</p>
      </div>
    </div>
  );
}
