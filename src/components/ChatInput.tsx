
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendIcon } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
}

export function ChatInput({ onSend }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSend(message);
      setMessage("");
      // Reset textarea height after sending
      if (textareaRef.current) {
        textareaRef.current.style.height = "24px";
      }
    }
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "24px"; // Start with smaller initial height
      const scrollHeight = textarea.scrollHeight;
      // Limit maximum height to 200px
      textarea.style.height = `${Math.min(scrollHeight, 200)}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 w-full">
      <div className="flex-1 neumorphic-inset">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className="border-none bg-transparent focus-visible:ring-0 min-h-[24px] py-1 px-3 resize-none overflow-y-auto"
          style={{
            height: "24px"
          }}
        />
      </div>
      <Button type="submit" size="icon" className="neumorphic">
        <SendIcon className="h-5 w-5 dark:text-neuro-purple text-black" />
      </Button>
    </form>
  );
}
