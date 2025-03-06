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
import { useIsMobile } from "@/hooks/use-mobile";
import { PromptSuggestions } from "@/components/PromptSuggestions";

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

Use relevant emojis to express emotions when appropriate:
- Use 😊 for greetings and positive encouragement
- Use 🤔 when asking thoughtful questions
- Use 💭 when reflecting on the user's thoughts
- Use 💪 for motivation and strength
- Use 🌱 for growth and progress
- Use 🧘 for mindfulness and calm
- Use ❤️ for empathy and care

Balance emoji usage - typically use 1-2 emojis per message. Don't overuse them.
If you sense any serious mental health concerns, always recommend seeking professional help.`;

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [showScrollUp, setShowScrollUp] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const mainContainerRef = useRef<HTMLDivElement>(null);
  
  const [promptSuggestions, setPromptSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const SWIPE_THRESHOLD = 50;
  const EDGE_THRESHOLD = 30;

  const handleTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const swipeDistance = touchEndX.current - touchStartX.current;
    const isLeftEdgeSwipe = touchStartX.current < EDGE_THRESHOLD;
    const isRightEdgeSwipe = touchEndX.current > window.innerWidth - EDGE_THRESHOLD;
    
    if (swipeDistance > SWIPE_THRESHOLD && isLeftEdgeSwipe && !showSidebar) {
      setShowSidebar(true);
    }
    
    if (swipeDistance < -SWIPE_THRESHOLD && showSidebar) {
      setShowSidebar(false);
    }
    
    touchStartX.current = null;
    touchEndX.current = null;
  };

  useEffect(() => {
    if (!isMobile) return;
    
    const container = mainContainerRef.current;
    if (container) {
      container.addEventListener('touchstart', handleTouchStart, { passive: true });
      container.addEventListener('touchmove', handleTouchMove, { passive: true });
      container.addEventListener('touchend', handleTouchEnd, { passive: true });
      
      return () => {
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchmove', handleTouchMove);
        container.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [showSidebar, isMobile]);

  const fetchPromptSuggestions = async () => {
    try {
      setIsLoadingSuggestions(true);
      
      console.log("Fetching prompt suggestions with", messages.length, "messages as context");
      
      const { data, error } = await supabase.functions.invoke('generate-prompts', {
        body: {
          messages: messages
        }
      });

      if (error) throw new Error(error.message);
      
      console.log("Got suggestions:", data.suggestions);
      setPromptSuggestions(data.suggestions || []);
    } catch (error) {
      console.error("Error fetching prompt suggestions:", error);
      setPromptSuggestions([
        "I'm feeling anxious today",
        "Can you suggest some coping techniques?",
        "I've been having trouble sleeping",
        "Let me tell you more about what's happening",
        "How can I manage stress better?"
      ]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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

      const messagesList = (data || []).map(msg => ({
        id: msg.id,
        content: msg.content,
        isBot: msg.is_bot
      }));
      
      setMessages(messagesList);
      
      if (messagesList.length > 0) {
        fetchPromptSuggestions();
      }
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
      } else {
        fetchPromptSuggestions();
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
      
      fetchPromptSuggestions();
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

      const newMessages = [...messages, {
        id: savedMessage.id,
        content: savedMessage.content,
        isBot: savedMessage.is_bot
      }];
      
      setMessages(newMessages);

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

      const conversationHistory = newMessages.slice(-6).map(msg => ({
        role: msg.isBot ? "assistant" : "user",
        content: msg.content
      }));

      const { data, error } = await supabase.functions.invoke('chat', {
        body: {
          messages: [
            { role: "system", content: systemPrompt },
            ...conversationHistory
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
        
      fetchPromptSuggestions();

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

  const handleSuggestionClick = (suggestion: string) => {
    handleSend(suggestion);
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

  useEffect(() => {
    if (messages.length > 0) {
      fetchPromptSuggestions();
    }
  }, [messages]);

  return (
    <div className="flex h-screen relative" ref={mainContainerRef}>
      <div 
        className={`
          fixed left-0 top-0 min-h-screen h-full z-40 
          transition-transform duration-300 ease-in-out
          ${showSidebar ? 'translate-x-0' : '-translate-x-full'}
          w-64
        `}
      >
        <div className="w-64 h-screen relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSidebar(false)}
            className="absolute right-3 top-3 z-50 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <PanelLeftClose />
          </Button>
          <ChatSidebar
            sessions={sessions}
            currentSessionId={currentSessionId}
            onNewChat={createNewChat}
            onSelectChat={setCurrentSessionId}
            onDeleteChat={handleDeleteChat}
            onArchiveChat={handleArchiveChat}
            onUnarchiveChat={handleUnarchiveChat}
          />
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => setShowSidebar(true)}
        className={`
          fixed left-4 top-4 z-50 
          shadow-lg hover:shadow-xl 
          transition-opacity duration-300
          ${showSidebar ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'}
        `}
      >
        <PanelLeftOpen />
      </Button>

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
              className="fixed bottom-32 right-8 z-50 rounded-full shadow-lg hover:shadow-xl transition-opacity duration-200 opacity-80 hover:opacity-100"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          )}
          
          {showScrollDown && (
            <Button
              variant="secondary"
              size="icon"
              onClick={scrollToBottom}
              className="fixed bottom-20 right-8 z-50 rounded-full shadow-lg hover:shadow-xl transition-opacity duration-200 opacity-80 hover:opacity-100"
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          )}

          <div 
            ref={chatContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto custom-scrollbar scrollbar-hide hover:scrollbar-show space-y-4 pb-24 pt-16"
          >
            {messages.length === 0 && (
              <div className="flex flex-col gap-6 items-center justify-center min-h-[50vh] px-4">
                <h2 className="text-xl font-medium text-center">Welcome to your mental health companion</h2>
                <p className="text-center text-muted-foreground">
                  I'm here to listen and support you. Feel free to share anything that's on your mind.
                </p>
                {promptSuggestions.length > 0 && (
                  <div className="w-full max-w-md">
                    <h3 className="text-sm text-center mb-2 text-muted-foreground">You could start with:</h3>
                    <PromptSuggestions 
                      suggestions={promptSuggestions} 
                      onSuggestionClick={handleSuggestionClick}
                      isLoading={isLoadingSuggestions}
                    />
                  </div>
                )}
              </div>
            )}

            {messages.map((message, index) => (
              <div key={message.id}>
                <ChatMessage
                  message={message.content}
                  isBot={message.isBot}
                />
                {message.isBot && index === messages.length - 1 && promptSuggestions.length > 0 && (
                  <div className="ml-10 mt-2 max-w-[80%]">
                    <PromptSuggestions 
                      suggestions={promptSuggestions} 
                      onSuggestionClick={handleSuggestionClick}
                      isLoading={isLoadingSuggestions}
                      isInline={true}
                      className="justify-start"
                    />
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start w-full gap-3 py-3">
                <div className="neumorphic-box max-w-[80%] p-5 animate-pulse rounded-2xl bg-white dark:bg-slate-800">
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
