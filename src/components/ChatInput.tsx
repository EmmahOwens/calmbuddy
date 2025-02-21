
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageIcon, SendIcon } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string, image?: File) => void;
}

export function ChatInput({ onSend }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() || image) {
      onSend(message, image || undefined);
      setMessage("");
      setImage(null);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 w-full">
      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleImageUpload}
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="neumorphic"
        onClick={() => fileInputRef.current?.click()}
      >
        <ImageIcon className="h-5 w-5" />
      </Button>
      <div className="flex-1 neumorphic-inset">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          className="border-none bg-transparent focus-visible:ring-0"
        />
      </div>
      <Button type="submit" size="icon" className="neumorphic">
        <SendIcon className="h-5 w-5" />
      </Button>
    </form>
  );
}
