
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
      if (textareaRef.current) {
        textareaRef.current.style.height = "40px";
      }
    }
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = "auto";
      // Calculate the new height with a max of 200px
      const newHeight = Math.min(textarea.scrollHeight, 200);
      // Set the new height with a minimum of 40px
      textarea.style.height = `${Math.max(40, newHeight)}px`;
    }
  };

  // Adjust height whenever message changes
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
      <div className="flex-1 relative neumorphic-inset">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className="absolute inset-0 border-none focus-visible:ring-0 resize-none bg-transparent py-2 px-3 min-h-[40px] overflow-hidden"
        />
      </div>
      <Button type="submit" size="icon" className="neumorphic self-end">
        <SendIcon className="h-5 w-5 dark:text-neuro-purple text-black" />
      </Button>
    </form>
  );
}
