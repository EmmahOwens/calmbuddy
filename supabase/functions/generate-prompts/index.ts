
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const systemPrompt = `You are an empathetic and professional mental health companion chatbot. Your job is to suggest helpful prompts that the human user might want to ask or say next based on the conversation context. Generate prompts from the user's perspective, as if the user is talking to you.

Your suggestions should be:
- From the user's perspective (what THEY would say to YOU)
- Supportive of their mental health journey
- Relevant to the current conversation topic
- Natural follow-ups to the conversation flow
- Brief (max 10 words per suggestion)
- Phrased as questions or statements the user might make

If the conversation is just starting, suggest general mental health topics the user might want to discuss.
If the conversation has context, suggest relevant follow-up questions or statements the user might want to make.`;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, currentState } = await req.json();
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const conversationContext = messages.map(msg => ({
      role: msg.isBot ? "assistant" : "user",
      content: msg.content
    }));

    // Initial prompts if no context is available
    if (currentState === "initial" || conversationContext.length === 0) {
      console.log("Generating initial prompt suggestions");
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: "I'm starting a new conversation. Suggest 5 things I might want to say to you as my mental health companion." }
          ],
          temperature: 0.7,
          max_tokens: 150,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('OpenAI API error:', data.error);
        throw new Error(data.error?.message || 'Failed to get AI response');
      }

      const suggestionsText = data.choices[0].message.content;
      const suggestions = suggestionsText
        .split(/\n|•|-|\d+\./)
        .map(line => line.trim())
        .filter(line => line.length > 0 && line.length < 70)
        .slice(0, 5);

      return new Response(JSON.stringify({ suggestions }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      // Context-aware prompts based on conversation history
      console.log("Generating context-aware prompt suggestions based on conversation");
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            ...conversationContext,
            { role: "user", content: "Based on our conversation, suggest 5 things I might want to say to you next, from my perspective as the human user." }
          ],
          temperature: 0.7,
          max_tokens: 150,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('OpenAI API error:', data.error);
        throw new Error(data.error?.message || 'Failed to get AI response');
      }

      const suggestionsText = data.choices[0].message.content;
      const suggestions = suggestionsText
        .split(/\n|•|-|\d+\./)
        .map(line => line.trim())
        .filter(line => line.length > 0 && line.length < 70)
        .slice(0, 5);

      return new Response(JSON.stringify({ suggestions }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error in generate-prompts function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        suggestions: [
          "How are you feeling today?",
          "What's been on your mind lately?",
          "Can you help me with my anxiety?",
          "I've been feeling sad recently.",
          "Tell me about mindfulness techniques."
        ]
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
