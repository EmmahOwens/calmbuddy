
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log('Making request to OpenAI with messages:', messages);

    // We don't modify the input messages, but we ensure the system message has emoji instructions
    const hasSystemMessage = messages.some(msg => msg.role === 'system');
    
    const processedMessages = hasSystemMessage 
      ? messages 
      : [
          { 
            role: 'system', 
            content: `You are an empathetic and professional mental health companion chatbot. Your responses should be:
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
If you sense any serious mental health concerns, always recommend seeking professional help.`
          },
          ...messages
        ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: processedMessages,
        temperature: 0.7,
        max_tokens: 150,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('OpenAI API error:', data.error);
      throw new Error(data.error?.message || 'Failed to get AI response');
    }

    console.log('Received successful response from OpenAI');

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in chat function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
