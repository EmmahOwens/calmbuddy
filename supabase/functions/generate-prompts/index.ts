
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.4.0';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
    const { messages = [], currentState = "initial" } = await req.json();
    console.log(`Generating prompts for state: ${currentState}`);
    
    // Initial conversation suggestions (statements rather than questions)
    const initialSuggestions = [
      "I've been feeling anxious lately.",
      "My work stress is becoming overwhelming.",
      "I struggle with setting boundaries with others.",
      "Sometimes I feel disconnected from people around me.",
      "I have trouble sleeping most nights."
    ];

    // If we don't have an OpenAI API key or if this is just initial prompts
    // return default suggestions
    if (!openAIApiKey || currentState === "initial") {
      console.log("Using default initial suggestions");
      return new Response(
        JSON.stringify({ suggestions: initialSuggestions }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For ongoing conversations, generate context-aware prompts
    const systemPrompt = `
      You are a mental health companion chatbot.
      Generate 3-4 statements (NOT questions) that a user might say to continue a conversation about their mental health.
      These should be first-person statements that a user would type, like "I've been feeling stressed about work lately."
      Make them relevant to the current conversation context if provided.
      Keep statements brief (under 8 words) and natural.
      Focus on common mental health concerns like anxiety, stress, mood, relationships, etc.
      Provide only the statements with no additional text.
    `;

    let prompt = "Generate natural first-person statements a user might say to a mental health companion.";
    
    // Add conversation context if we have messages
    if (messages && messages.length > 0) {
      prompt = `Based on this conversation, generate relevant statements the user might say next:\n\n`;
      const chatHistory = messages.map(msg => 
        `${msg.isBot ? "Assistant" : "User"}: ${msg.content}`
      ).join("\n");
      
      prompt += chatHistory;
    }

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 150,
      }),
    });

    // Process OpenAI response
    const data = await response.json();
    console.log("OpenAI response received");
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.log("Invalid response from OpenAI, using fallbacks");
      throw new Error("Invalid response from OpenAI");
    }

    const content = data.choices[0].message.content;
    console.log("Raw content from OpenAI:", content);
    
    // Parse the statements, looking for lines/items which could be an array or numbering
    const suggestionRegex = /(?:\d+\.\s+|[-*•]\s*|")(.*?)(?=(?:\d+\.\s+|[-*•]\s*|"|\n|$))/g;
    const matches = [...content.matchAll(suggestionRegex)].map(match => match[1].trim());
    
    let suggestions = matches.length > 0 
      ? matches 
      : content.split('\n').filter(line => line.trim().length > 0).map(line => line.trim());
    
    // Clean up suggestions (remove quotes, numbering, etc.)
    suggestions = suggestions.map(s => s.replace(/^["']|["']$/g, '').trim());
    
    // Ensure we have at least some suggestions
    if (suggestions.length === 0) {
      console.log("No valid suggestions extracted, using fallbacks");
      suggestions = initialSuggestions;
    }

    console.log(`Generated ${suggestions.length} suggestions`);

    return new Response(
      JSON.stringify({ suggestions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error generating prompts:", error);
    
    // Fallback suggestions (statements rather than questions)
    const fallbackSuggestions = [
      "I've been feeling anxious lately.",
      "My work stress is becoming overwhelming.",
      "I struggle with setting boundaries.",
      "I feel disconnected from others.",
      "I have trouble sleeping at night."
    ];
    
    return new Response(
      JSON.stringify({ 
        suggestions: fallbackSuggestions,
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
