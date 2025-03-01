
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

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
    const { messages, currentState } = await req.json();
    
    // Define system message based on context
    let systemMessage = "Generate 3 helpful prompt suggestions that a user might want to ask a mental health chatbot. ";
    
    if (currentState === "initial") {
      systemMessage += "These should be welcoming, gentle first-time prompts that encourage opening up.";
    } else {
      systemMessage += "Based on the conversation history, suggest thoughtful follow-up questions or topics that would be therapeutic to discuss next.";
    }
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemMessage },
          ...messages.map(msg => ({
            role: msg.isBot ? 'assistant' : 'user',
            content: msg.content
          }))
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    
    if (!data.choices || !data.choices[0]) {
      throw new Error('Invalid response from OpenAI API');
    }
    
    const suggestionsText = data.choices[0].message.content;
    
    // Parse the numbered list into an array
    let suggestions = [];
    try {
      // Look for numbered items (1., 2., 3.) or dash/bullet points and extract them
      const regex = /(?:\d+\.|\-|\*)\s*(.+?)(?=(?:\d+\.|\-|\*)|$)/gs;
      let match;
      while ((match = regex.exec(suggestionsText)) !== null) {
        if (match[1].trim()) {
          suggestions.push(match[1].trim());
        }
      }
      
      // If regex didn't work, split by newlines and clean up
      if (suggestions.length === 0) {
        suggestions = suggestionsText.split('\n')
          .map(line => line.replace(/^\d+\.\s*|\*\s*|-\s*/, '').trim())
          .filter(line => line.length > 0);
      }
      
      // Limit to 3 suggestions
      suggestions = suggestions.slice(0, 3);
    } catch (error) {
      console.error('Error parsing suggestions:', error);
      suggestions = [
        "How are you feeling today?",
        "What's been on your mind lately?",
        "Would you like to talk about something specific?"
      ];
    }

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-prompts function:', error);
    
    // Return fallback suggestions if there's an error
    const fallbackSuggestions = [
      "How are you feeling today?",
      "What's been on your mind lately?",
      "Would you like to talk about something specific?"
    ];
    
    return new Response(JSON.stringify({ 
      suggestions: fallbackSuggestions,
      error: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200, // Return 200 with fallbacks instead of 500
    });
  }
});
