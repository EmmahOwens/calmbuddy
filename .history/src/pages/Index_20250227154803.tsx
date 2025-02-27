import { useState, useEffect, useRef } from "react";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { ChatSidebar } from "@/components/ChatSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ChatSettings } from "@/components/ChatSettings";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { PanelLeftOpen, PanelLeftClose, ArrowDown, ArrowUp } from "lucide-react";

interface Message {
  id: string;
  content: string;
  isBot: boolean;
}

interface ChatSession {
  id: string;
  title: string;
  updated_at: string;
  archived: boolean;
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
  const [showSidebar, setShowSidebar] = useState(false);
  const { toast } = useToast();
  
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [showScrollUp, setShowScrollUp] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (shouldAutoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const scrollToTop = () => {
    chatContainerRef.current?.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  const handleScroll = () => {
    if (!chatContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 50;
    const isAtTop = scrollTop < 50;

    setShowScrollDown(!isAtBottom);
    setShowScrollUp(!isAtTop && scrollTop > 100);
    setShouldAutoScroll(isAtBottom);
  };

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

      setSessions(data.map(session => ({
        ...session,
        archived: session.archived || false
      })));
      
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

  useEffect(() => {
    const initializeChat = async () => {
      const { data: existingSessions } = await supabase
        .from('chat_sessions')
        .select('*')
        .order('updated_at', { ascending: false });

      if (!existingSessions || existingSessions.length === 0) {
        await createNewChat();
      }
    };

    initializeChat();
  }, []);

  const createNewChat = async () => {
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert([
        { title: 'New Chat', archived: false }
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

    setSessions(prev => [{ ...data, archived: false }, ...prev]);
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
      setShouldAutoScroll(true);
      scrollToBottom();

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

  const handleDeleteChat = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;

      setSessions(prev => prev.filter(session => session.id !== sessionId));
      
      if (currentSessionId === sessionId) {
        setMessages([]);
        const remainingSessions = sessions.filter(session => session.id !== sessionId);
        
        if (remainingSessions.length > 0) {
          const nextSession = remainingSessions[0];
          setCurrentSessionId(nextSession.id);
        } else {
          await createNewChat();
        }
      }

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

  const handleArchiveChat = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({ archived: true })
        .eq('id', sessionId);

      if (error) throw error;

      setSessions(prev => prev.map(session => 
        session.id === sessionId 
          ? { ...session, archived: true } 
          : session
      ));

      toast({
        title: "Success",
        description: "Chat archived successfully",
      });
    } catch (error) {
      console.error("Error archiving chat:", error);
      toast({
        title: "Error",
        description: "Failed to archive chat",
        variant: "destructive",
      });
    }
  };

  const handleUnarchiveChat = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({ archived: false })
        .eq('id', sessionId);

      if (error) throw error;

      setSessions(prev => prev.map(session => 
        session.id === sessionId 
          ? { ...session, archived: false } 
          : session
      ));

      toast({
        title: "Success",
        description: "Chat unarchived successfully",
      });
    } catch (error) {
      console.error("Error unarchiving chat:", error);
      toast({
        title: "Error",
        description: "Failed to unarchive chat",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isLoading) {
      scrollToBottom();
    }
  }, [isLoading]);

  return (
    <div className="flex h-screen relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setShowSidebar(!showSidebar)}
        className="fixed top-4 left-4 z-50 shadow-lg hover:shadow-xl transition-shadow duration-200"
      >
        {showSidebar ? <PanelLeftClose /> : <PanelLeftOpen />}
      </Button>

      <div
        className={`
          fixed left-0 top-0 min-h-screen h-full z-40 
          transition-all duration-300 ease-in-out
          overflow-hidden
          ${showSidebar ? 'w-64 translate-x-0' : 'w-0 -translate-x-full'}
        `}
      >
        <div className="w-64 h-screen">
          <ChatSidebar
            sessions={sessions}
            currentSessionId={currentSessionId}
            currentSessionId={currentSessionId}
            onNewChat={createNewChat}
            onSelectChat={setCurrentSessionId}
            onDeleteChat={handleDeleteChat}
            onArchiveChat={handleArchiveChat}
            onUnarchiveChat={handleUnarchiveChat}
          />
        </div>
      </div>

      <div className="flex-1 flex justify-center px-0 md:px-16 lg:px-32 xl:px-48">
        <div className="w-full max-w-3xl flex flex-col min-h-screen p-4 relative">
          <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
            <ChatSettings />
            <ThemeToggle className="shadow-lg hover:shadow-xl transition-shadow duration-200" />
          </div>

          {showScrollUp && (
            <Button
              variant="secondary"
              size="icon"
              onClick={scrollToTop}
              className="fixed bottom-32 right-8 z-50 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 opacity-80 hover:opacity-100"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          )}
          
          {showScrollDown && (
            <Button
              variant="secondary"
              size="icon"
              onClick={() => {
                setShouldAutoScroll(true);
                scrollToBottom();
              }}
              className="fixed bottom-20 right-8 z-50 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 opacity-80 hover:opacity-100"
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          )}

          <div 
            className="flex-1 overflow-y-auto space-y-4 mb-4 pt-16"
            ref={chatContainerRef}
            onScroll={handleScroll}
          >
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
            <div ref={messagesEndRef} />
          </div>
          <ChatInput onSend={handleSend} />
        </div>
      </div>
    </div>
  );
};

export default Index;
