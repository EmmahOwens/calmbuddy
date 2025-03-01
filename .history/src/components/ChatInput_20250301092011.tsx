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

  const handleSubmit = (e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSend(message);
      setMessage("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "40px";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const newHeight = Math.min(textarea.scrollHeight, 200);
      textarea.style.height = `${Math.max(40, newHeight)}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: "20px",
        zIndex: 10,
      }}
    >
      <form onSubmit={handleSubmit} style={{ display: "flex", alignItems: "flex-end", gap: "0.5rem" }}>
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          style={{
            resize: "none",
            overflow: "hidden",
            minHeight: "40px",
            maxHeight: "200px",
            flex: 1,
          }}
          className="neumorphic-box rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white dark:focus-visible:ring-black focus-visible:ring-offset-2"
        />
        <Button type="submit" size="icon" className="neumorphic rounded-full">
          <SendIcon className="text-black dark:text-current" />
        </Button>
      </form>
    </div>
  );
}
