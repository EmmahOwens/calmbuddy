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
    const { messages, currentState } = await req.json();
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log('Generating prompt suggestions, state:', currentState);

    // Create system message based on current state
    const systemPrompt = currentState === "initial" 
      ? "You are a helpful mental health companion chatbot. Generate 3-5 conversation starter questions that someone might ask a mental health assistant. These should be gentle, supportive questions that encourage people to open up about their feelings and mental state."
      : "You are a helpful mental health companion chatbot. Based on the conversation history provided, generate 3-5 follow-up questions that would be natural for the user to ask next. These should be thoughtful, relevant to the conversation, and encourage further discussion about mental health and wellbeing.";

    // Format conversation history if available
    const conversationHistory = messages.map(msg => ({
      role: msg.isBot ? "assistant" : "user",
      content: msg.content
    }));

    // Prepare OpenAI API request
    const openAIRequest = {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...(conversationHistory.length > 0 ? conversationHistory : [])
      ],
      temperature: 0.7,
      max_tokens: 150
    };

    console.log('Making request to OpenAI with payload:', openAIRequest);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(openAIRequest),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('OpenAI API error:', data.error);
      throw new Error(data.error?.message || 'Failed to get AI response');
    }

    console.log('Received response from OpenAI');

    const aiText = data.choices[0].message.content;
    
    // Extract suggestions from the response text
    // This handles both list formats like "1. Question" and plain text with line breaks
    const suggestionPattern = /(?:\d+\.\s+|[-*]\s+|^)(.*?)(?=\n\d+\.|$)/gs;
    let suggestions = [];
    let match;
    
    while ((match = suggestionPattern.exec(aiText)) !== null) {
      const suggestion = match[1].trim();
      if (suggestion && !suggestion.match(/^(\d+\.|-|\*)\s*$/)) {
        suggestions.push(suggestion);
      }
    }
    
    // If regex didn't find suggestions, fall back to splitting by newlines
    if (suggestions.length === 0) {
      suggestions = aiText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && line.length > 10 && !line.startsWith('#'));
    }
    
    // Filter to only keep items that look like questions
    suggestions = suggestions
      .filter(s => s.endsWith('?'))
      .slice(0, 5); // Limit to 5 suggestions

    // Fallback suggestions if we couldn't generate any
    if (suggestions.length === 0) {
      if (currentState === "initial") {
        suggestions = [
          "How are you feeling today?",
          "What's been on your mind lately?",
          "Would you like to talk about something specific?",
          "Is there anything causing you stress right now?",
          "How has your mood been this week?"
        ];
      } else {
        suggestions = [
          "Can you tell me more about that?",
          "How does that make you feel?",
          "What would help you feel better right now?",
          "Have you talked to anyone else about this?",
          "What coping strategies have worked for you in the past?"
        ];
      }
    }

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-prompts function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        suggestions: [
          "How are you feeling today?",
          "What's been on your mind lately?",
          "Would you like to talk about something specific?"
        ] 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
