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
      // Reset height to auto to correctly calculate scrollHeight.
      textarea.style.height = "auto";
      // Calculate new height with max of 200px.
      const newHeight = Math.min(textarea.scrollHeight, 200);
      // Set the new height with a minimum of 40px.
      textarea.style.height = `${Math.max(40, newHeight)}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  return (
    // Parent container absolutely positioned at the bottom
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10, // Ensures it overlays content above if needed.
      }}
    >
      <form onSubmit={handleSubmit} style={{ display: "flex", alignItems: "flex-end" }}>
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          style={{
            resize: "none",
            overflow: "hidden",
            minHeight: "40px",
            maxHeight: "200px",
          }}
        />
        <Button type="submit">
          <SendIcon />
        </Button>
      </form>
    </div>
  );
}
