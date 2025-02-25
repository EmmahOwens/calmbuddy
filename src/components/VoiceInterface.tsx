
import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { RealtimeChat } from '@/utils/RealtimeAudio';
import { Mic, MicOff } from 'lucide-react';

interface VoiceInterfaceProps {
  selectedVoice: string;
  onSpeakingChange: (speaking: boolean) => void;
  onMessage: (text: string) => void;
}

const VoiceInterface: React.FC<VoiceInterfaceProps> = ({ selectedVoice, onSpeakingChange, onMessage }) => {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const chatRef = useRef<RealtimeChat | null>(null);

  const handleMessage = (event: any) => {
    console.log('Received message:', event);
    
    if (event.type === 'response.audio.delta') {
      onSpeakingChange(true);
    } else if (event.type === 'response.audio.done') {
      onSpeakingChange(false);
    } else if (event.type === 'response.transcript.delta' && event.delta) {
      onMessage(event.delta);
    }
  };

  const startConversation = async () => {
    try {
      chatRef.current = new RealtimeChat(handleMessage);
      await chatRef.current.init(selectedVoice);
      setIsConnected(true);
      
      toast({
        title: "Connected",
        description: "Voice interface is ready",
      });
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to start conversation',
        variant: "destructive",
      });
    }
  };

  const endConversation = () => {
    chatRef.current?.disconnect();
    setIsConnected(false);
    onSpeakingChange(false);
  };

  useEffect(() => {
    return () => {
      chatRef.current?.disconnect();
    };
  }, []);

  return (
    <Button 
      onClick={isConnected ? endConversation : startConversation}
      variant={isConnected ? "destructive" : "default"}
      size="icon"
      className="neumorphic"
    >
      {isConnected ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
    </Button>
  );
};

export default VoiceInterface;
