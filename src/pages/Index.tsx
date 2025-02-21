
import { useState } from "react";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useToast } from "@/components/ui/use-toast";

interface Message {
  id: number;
  content: string;
  isBot: boolean;
  image?: string;
}

const systemPrompt = `You are an empathetic and professional mental health companion chatbot. Your responses should be:
- Supportive and non-judgmental
- Focused on active listening and validation
- Professional but warm in tone
- Clear about not being a replacement for professional mental health care
- Brief but meaningful (keep responses under 3 sentences unless necessary)
- Structured to encourage user expression

If you sense any serious mental health concerns, always recommend seeking professional help.`;

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      content: "Hi, I'm your mental health companion. How are you feeling today? I'm here to listen and support you.",
      isBot: true,
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSend = async (message: string, image?: File) => {
    if (!message.trim() && !image) return;

    try {
      setIsLoading(true);
      let imageUrl: string | undefined;

      if (image) {
        // Convert image to base64 for demo
        imageUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(image);
        });
      }

      // Add user message
      const userMessage = {
        id: Date.now(),
        content: message,
        isBot: false,
        image: imageUrl,
      };
      setMessages(prev => [...prev, userMessage]);

      // Prepare conversation history for context
      const conversationHistory = messages.slice(-4).map(msg => ({
        role: msg.isBot ? "assistant" : "user",
        content: msg.content
      }));

      // Call AI endpoint to get response
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            { role: "system", content: systemPrompt },
            ...conversationHistory,
            { role: "user", content: message }
          ],
          temperature: 0.7,
          max_tokens: 150,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to get AI response");
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;

      // Add AI response
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        content: aiResponse,
        isBot: true,
      }]);
    } catch (error) {
      console.error("Error in chat:", error);
      toast({
        title: "Error",
        description: error.message || "Sorry, I couldn't process your message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen p-4 max-w-3xl mx-auto relative">
      <ThemeToggle className="absolute top-4 right-4" />
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pt-16">
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message.content}
            isBot={message.isBot}
            image={message.image}
          />
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="neumorphic animate-pulse p-4 rounded-tr-2xl max-w-[80%]">
              <p className="text-muted-foreground">Thinking...</p>
            </div>
          </div>
        )}
      </div>
      <ChatInput onSend={handleSend} />
    </div>
  );
};

export default Index;
