import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: string;
  isBot: boolean;
  image?: string;
}

export function ChatMessage({ message, isBot, image }: ChatMessageProps) {
  return (
    <div className={cn("flex w-full gap-2 py-2", isBot ? "justify-start" : "justify-end")}>
      <div
        className={cn(
          "neumorphic max-w-[80%] p-4 message-transition animate-fade-in",
          isBot ? "rounded-tr-2xl" : "rounded-tl-2xl"
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
