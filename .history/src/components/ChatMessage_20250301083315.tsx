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
          "max-w-[80%] p-4 message-transition animate-fade-in rounded-lg",
          "bg-gray-200 dark:bg-gray-800"
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
