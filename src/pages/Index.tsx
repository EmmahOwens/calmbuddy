import { useState, useEffect } from "react";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { ChatSidebar } from "@/components/ChatSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { PanelLeftOpen, PanelLeftClose } from "lucide-react";
import { DeleteChatDialog } from "@/components/DeleteChatDialog";

interface Message {
  id: string;
  content: string;
  isBot: boolean;
}

interface ChatSession {
  id: string;
  title: string;
  updated_at: string;
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSessions = async () => {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to load chat history",
          variant: "destructive",
        });
        return;
      }

      setSessions(data);
      if (data.length > 0 && !currentSessionId) {
        setCurrentSessionId(data[0].id);
      }
    };

    fetchSessions();
  }, [currentSessionId]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!currentSessionId) return;

      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', currentSessionId)
        .order('created_at', { ascending: true });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to load messages",
          variant: "destructive",
        });
        return;
      }

      setMessages(
        (data || []).map(msg => ({
          id: msg.id,
          content: msg.content,
          isBot: msg.is_bot
        }))
      );
    };

    fetchMessages();
  }, [currentSessionId]);

  const createNewChat = async () => {
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert([
        { title: 'New Chat' }
      ])
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create new chat",
        variant: "destructive",
      });
      return;
    }

    setSessions(prev => [data, ...prev]);
    setCurrentSessionId(data.id);
    setMessages([]);

    const welcomeMessage = {
      content: "Hi, I'm your mental health companion. How are you feeling today? I'm here to listen and support you.",
      is_bot: true,
      session_id: data.id
    };

    const { error: messageError } = await supabase
      .from('chat_messages')
      .insert([welcomeMessage]);

    if (messageError) {
      console.error("Failed to save welcome message:", messageError);
    } else {
      setMessages([{
        id: Date.now().toString(),
        content: welcomeMessage.content,
        isBot: welcomeMessage.is_bot
      }]);
    }
  };

  const handleSend = async (message: string) => {
    if (!message.trim() || !currentSessionId) return;

    try {
      setIsLoading(true);

      const userMessage = {
        content: message,
        is_bot: false,
        session_id: currentSessionId
      };

      const { data: savedMessage, error: messageError } = await supabase
        .from('chat_messages')
        .insert([userMessage])
        .select()
        .single();

      if (messageError) throw new Error(messageError.message);

      setMessages(prev => [...prev, {
        id: savedMessage.id,
        content: savedMessage.content,
        isBot: savedMessage.is_bot
      }]);

      if (messages.length === 1) {
        await supabase
          .from('chat_sessions')
          .update({ title: message.slice(0, 50) })
          .eq('id', currentSessionId);

        setSessions(prev =>
          prev.map(session =>
            session.id === currentSessionId
              ? { ...session, title: message.slice(0, 50) }
              : session
          )
        );
      }

      const conversationHistory = messages.slice(-4).map(msg => ({
        role: msg.isBot ? "assistant" : "user",
        content: msg.content
      }));

      const { data, error } = await supabase.functions.invoke('chat', {
        body: {
          messages: [
            { role: "system", content: systemPrompt },
            ...conversationHistory,
            { role: "user", content: message }
          ]
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      const aiResponse = data.choices[0].message.content;

      const { data: savedAiMessage, error: aiMessageError } = await supabase
        .from('chat_messages')
        .insert([{
          content: aiResponse,
          is_bot: true,
          session_id: currentSessionId
        }])
        .select()
        .single();

      if (aiMessageError) throw new Error(aiMessageError.message);

      setMessages(prev => [...prev, {
        id: savedAiMessage.id,
        content: savedAiMessage.content,
        isBot: savedAiMessage.is_bot
      }]);

      await supabase
        .from('chat_sessions')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', currentSessionId);

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

  const handleDeleteChat = async () => {
    if (!currentSessionId) return;

    try {
      const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', currentSessionId);

      if (error) throw error;

      setSessions(prev => prev.filter(session => session.id !== currentSessionId));
      setMessages([]);
      
      const nextSession = sessions.find(session => session.id !== currentSessionId);
      setCurrentSessionId(nextSession?.id || null);

      toast({
        title: "Success",
        description: "Chat deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting chat:", error);
      toast({
        title: "Error",
        description: "Failed to delete chat",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex h-screen">
      {showSidebar && (
        <ChatSidebar
          sessions={sessions}
          currentSessionId={currentSessionId}
          onNewChat={createNewChat}
          onSelectChat={setCurrentSessionId}
        />
      )}
      <div className="flex-1 flex flex-col min-h-screen p-4 relative">
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
          {currentSessionId && <DeleteChatDialog onConfirm={handleDeleteChat} />}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSidebar(!showSidebar)}
            className="shadow-lg hover:shadow-xl transition-shadow duration-200"
          >
            {showSidebar ? <PanelLeftClose /> : <PanelLeftOpen />}
          </Button>
          <ThemeToggle className="shadow-lg hover:shadow-xl transition-shadow duration-200" />
        </div>
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 pt-16">
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message.content}
              isBot={message.isBot}
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
    </div>
  );
};

export default Index;
