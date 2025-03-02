
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: string;
  isBot: boolean;
  image?: string;
}

export function ChatMessage({ message, isBot, image }: ChatMessageProps) {
  return (
    <div className={cn("flex w-full gap-3 py-3", isBot ? "justify-start" : "justify-end")}>
      <div
        className={cn(
          "neumorphic max-w-[80%] p-5 message-transition animate-fade-in rounded-2xl",
          isBot 
            ? "bg-neuro-light dark:bg-neuro-dark" 
            : "bg-neuro-lavender dark:bg-slate-700",
          // Improved shadows for both light and dark mode
          "shadow-[5px_5px_15px_rgba(0,0,0,0.1),-5px_-5px_15px_rgba(255,255,255,0.8)]",
          "dark:shadow-[5px_5px_15px_rgba(0,0,0,0.5),-5px_-5px_15px_rgba(255,255,255,0.05)]"
        )}
      >
        {image && (
          <img
            src={image}
            alt="Uploaded content"
            className="max-w-full h-auto rounded-xl mb-3"
          />
        )}
        <p className="text-foreground leading-relaxed">{message}</p>
      </div>
    </div>
  );
}
