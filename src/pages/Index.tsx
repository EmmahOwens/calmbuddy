
import { useState } from "react";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { ThemeToggle } from "@/components/ThemeToggle";

interface Message {
  id: number;
  content: string;
  isBot: boolean;
  image?: string;
}

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      content: "Hi, I'm your mental health companion. How are you feeling today?",
      isBot: true,
    },
  ]);

  const handleSend = async (message: string, image?: File) => {
    let imageUrl: string | undefined;

    if (image) {
      // Convert image to base64 for demo
      imageUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(image);
      });
    }

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        content: message,
        isBot: false,
        image: imageUrl,
      },
    ]);

    // Simulate bot response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          content: "Thank you for sharing. I'm here to listen and support you.",
          isBot: true,
        },
      ]);
    }, 1000);
  };

  return (
    <div className="flex flex-col min-h-screen p-4 max-w-3xl mx-auto relative">
      <ThemeToggle />
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message.content}
            isBot={message.isBot}
            image={message.image}
          />
        ))}
      </div>
      <ChatInput onSend={handleSend} />
    </div>
  );
};

export default Index;
