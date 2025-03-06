import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const systemPrompt = `You are an empathetic and professional mental health companion chatbot. Your job is to suggest helpful prompts that the human user might want to say next based on the conversation context. Generate prompts from the user's perspective, as if the user is talking to you.

Your suggestions should cover a wide range of mental health topics, including but not limited to:
- Anxiety and stress management
- Mood disorders and depression
- Sleep issues
- Mindfulness and meditation
- Relationships and social support
- Work-life balance
- Self-care practices
- Grief and loss
- Trauma support
- Habit formation and breaking

Your suggestions should be:
- From the user's perspective (what THEY would say to YOU)
- Phrased primarily as statements or expressions rather than questions
- Supportive of their mental health journey
- Relevant to the current conversation topic
- Natural follow-ups to the conversation flow
- Brief (max 10 words per suggestion)
- Diverse in topic and approach
- Personalized to the current conversation history

IMPORTANT: Pay close attention to the previous messages to ensure highly relevant next-message suggestions that would logically follow in the conversation. Analyze the emotional tone, specific topics mentioned, and personal details shared to create truly personalized suggestions. NEVER provide generic suggestions when context is available.

If the user has mentioned specific symptoms, concerns, or situations, your suggestions should directly reference or follow up on those exact points.`;

// Default fallback suggestions for different states
const initialFallbackSuggestions = [
  "I'm feeling anxious today",
  "I've been struggling with sleep lately",
  "Sometimes I feel overwhelmed",
  "I need help with my emotions",
  "I want to improve my mental wellbeing"
];

const ongoingFallbackSuggestions = [
  "That's helpful, thank you",
  "I'd like to explore this further",
  "I never thought about it that way",
  "This is making me feel better",
  "Let me share something else"
];

// Additional backup suggestion sets for different topics
const topicalFallbackSuggestions = {
  anxiety: [
    "I feel anxious in social situations",
    "My anxiety keeps me from sleeping",
    "I'm worried about the future",
    "I have frequent panic attacks", 
    "My anxiety is affecting my work"
  ],
  depression: [
    "I've been feeling down lately",
    "I've lost interest in my hobbies",
    "I'm having trouble getting motivated",
    "Some days I can't get out of bed",
    "I don't enjoy things like I used to"
  ],
  sleep: [
    "I have trouble falling asleep",
    "I wake up feeling tired",
    "My sleep schedule is irregular",
    "I have frequent nightmares",
    "I can't stay asleep through the night"
  ],
  stress: [
    "Work stress is overwhelming me",
    "I feel tense most of the time",
    "I'm having trouble relaxing",
    "My stress is affecting my health",
    "I need better coping strategies"
  ],
  relationships: [
    "I'm having conflict with my family",
    "My relationship is struggling",
    "I feel lonely most of the time",
    "I have trouble connecting with others",
    "I want to improve my social life"
  ],
  mindfulness: [
    "I want to be more present",
    "Meditation has been helping me",
    "I'm trying to practice mindfulness",
    "Being in nature helps me center",
    "I notice my thoughts racing often"
  ],
  general: [
    "Let me tell you about my day",
    "I've been thinking about something",
    "Can we talk about self-care",
    "I'm working on improving my habits",
    "I need some encouragement"
  ]
};

// Enhanced function to detect the topic from conversation context
function detectTopic(messages) {
  if (!messages || messages.length === 0) {
    return "general";
  }
  
  // Extract text from last 3 messages if available to get better context
  const recentText = messages
    .slice(-3)
    .map(msg => msg.content.toLowerCase())
    .join(" ");
  
  if (/anxi|nervous|worry|panic|afraid|fear/i.test(recentText)) {
    return "anxiety";
  }
  
  if (/depress|sad|down|low|unhappy|blue|hopeless/i.test(recentText)) {
    return "depression";
  }
  
  if (/sleep|insomnia|tired|rest|awake|night/i.test(recentText)) {
    return "sleep";
  }
  
  if (/stress|overwhelm|pressure|burden|too much/i.test(recentText)) {
    return "stress";
  }
  
  if (/relation|friend|family|partner|colleague|social|lonely/i.test(recentText)) {
    return "relationships";
  }
  
  if (/mindful|meditat|breath|present|focus|aware/i.test(recentText)) {
    return "mindfulness";
  }
  
  if (/work|job|career|profession|coworker|boss/i.test(recentText)) {
    return "work";
  }
  
  if (/eat|food|diet|nutrition|appetite|weight/i.test(recentText)) {
    return "eating";
  }
  
  if (/exercise|workout|fitness|active|run|walk|gym/i.test(recentText)) {
    return "exercise";
  }
  
  if (/therapy|therapist|counseling|professional|doctor|psychologist/i.test(recentText)) {
    return "professional_help";
  }
  
  return "general";
}

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
    
    console.log(`Generate prompts received ${messages.length} messages for context`);

    // Convert messages to the format expected by the OpenAI API
    const conversationContext = messages.map(msg => ({
      role: msg.isBot ? "assistant" : "user",
      content: msg.content
    }));

    // Always use context if available, regardless of state
    if (conversationContext.length > 0) {
      console.log("Generating context-aware prompt suggestions based on conversation");
      
      try {
        // First attempt with primary model
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
              { 
                role: "user", 
                content: `Based on our conversation history, suggest 5 diverse things I might want to say to you next, from my perspective as the human user. Focus on statements rather than questions. Make sure these are DIRECTLY RELEVANT to our SPECIFIC conversation and topics we've discussed. Use our exact conversation topics, not generic suggestions. Current timestamp: ${new Date().toISOString()} (use this for variety).` 
              }
            ],
            temperature: 0.9,
            max_tokens: 150,
            frequency_penalty: 0.7,
            presence_penalty: 0.7,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          console.error('OpenAI API error with primary model:', data.error);
          throw new Error(data.error?.message || 'Failed to get AI response');
        }

        const suggestionsText = data.choices[0].message.content;
        const suggestions = suggestionsText
          .split(/\n|•|-|\d+\./)
          .map(line => line.trim())
          .filter(line => line.length > 0 && line.length < 70)
          .slice(0, 5);

        console.log("Successfully generated contextual suggestions:", suggestions);

        return new Response(JSON.stringify({ suggestions: suggestions.length > 0 ? suggestions : ongoingFallbackSuggestions }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error) {
        console.error('Error with primary model, attempting fallback model:', error);
        
        try {
          // Fallback to a different model
          const fallbackResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openAIApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: "gpt-3.5-turbo",
              messages: [
                { role: "system", content: systemPrompt },
                ...conversationContext,
                { 
                  role: "user", 
                  content: `Based on our conversation history, suggest 5 diverse things I might want to say to you next, from my perspective as the human user. Focus on statements rather than questions. Make sure these are DIRECTLY RELEVANT to our SPECIFIC conversation and topics we've discussed. Use our exact conversation topics, not generic suggestions. Current timestamp: ${new Date().toISOString()} (use this for variety).` 
                }
              ],
              temperature: 0.9,
              max_tokens: 150,
              frequency_penalty: 0.7,
              presence_penalty: 0.7,
            }),
          });

          const fallbackData = await fallbackResponse.json();

          if (!fallbackResponse.ok) {
            console.error('Fallback model also failed:', fallbackData.error);
            throw new Error(fallbackData.error?.message || 'Failed with both primary and fallback models');
          }

          const suggestionsText = fallbackData.choices[0].message.content;
          const suggestions = suggestionsText
            .split(/\n|•|-|\d+\./)
            .map(line => line.trim())
            .filter(line => line.length > 0 && line.length < 70)
            .slice(0, 5);

          return new Response(JSON.stringify({ suggestions: suggestions.length > 0 ? suggestions : ongoingFallbackSuggestions }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (fallbackError) {
          console.error('Both models failed, using topical fallback suggestions:', fallbackError);
          
          // Detect topic from conversation and provide relevant fallbacks
          const detectedTopic = detectTopic(messages);
          const topicalSuggestions = topicalFallbackSuggestions[detectedTopic] || ongoingFallbackSuggestions;
          
          console.log(`Using fallback suggestions for topic: ${detectedTopic}`);
          
          return new Response(JSON.stringify({ suggestions: topicalSuggestions }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });
        }
      }
    } else {
      // Initial state with no context
      console.log("Generating initial prompt suggestions");
      
      try {
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
              { role: "user", content: "I'm starting a new conversation. Suggest 5 things I might want to say to you as my mental health companion, covering a diverse range of topics. Make them primarily statements rather than questions." }
            ],
            temperature: 0.8,
            max_tokens: 150,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          console.error('OpenAI API error with primary model:', data.error);
          throw new Error(data.error?.message || 'Failed to get AI response');
        }

        const suggestionsText = data.choices[0].message.content;
        const suggestions = suggestionsText
          .split(/\n|•|-|\d+\./)
          .map(line => line.trim())
          .filter(line => line.length > 0 && line.length < 70)
          .slice(0, 5);

        return new Response(JSON.stringify({ suggestions: suggestions.length > 0 ? suggestions : initialFallbackSuggestions }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error) {
        console.error('Error with primary model, attempting fallback model:', error);
        
        try {
          // Fallback to a different model
          const fallbackResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openAIApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: "gpt-3.5-turbo",
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: "I'm starting a new conversation. Suggest 5 things I might want to say to you as my mental health companion, covering a diverse range of topics. Make them primarily statements rather than questions." }
              ],
              temperature: 0.7,
              max_tokens: 150,
            }),
          });

          const fallbackData = await fallbackResponse.json();

          if (!fallbackResponse.ok) {
            console.error('Fallback model also failed:', fallbackData.error);
            throw new Error(fallbackData.error?.message || 'Failed with both primary and fallback models');
          }

          const suggestionsText = fallbackData.choices[0].message.content;
          const suggestions = suggestionsText
            .split(/\n|•|-|\d+\./)
            .map(line => line.trim())
            .filter(line => line.length > 0 && line.length < 70)
            .slice(0, 5);

          return new Response(JSON.stringify({ suggestions: suggestions.length > 0 ? suggestions : initialFallbackSuggestions }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (fallbackError) {
          console.error('Both models failed, using fallback suggestions:', fallbackError);
          // Return default fallback suggestions
          return new Response(JSON.stringify({ suggestions: initialFallbackSuggestions }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });
        }
      }
    }
  } catch (error) {
    console.error('Error in generate-prompts function:', error);
    // Return fallback suggestions with diverse topics
    return new Response(
      JSON.stringify({ 
        suggestions: [
          "I'm feeling overwhelmed today.",
          "Let me tell you about my sleep problems.",
          "I'm struggling with work relationships.",
          "I've been practicing mindfulness.",
          "My mood has been low lately."
        ]
      }),
      { 
        status: 200, // Return 200 status to avoid breaking the client
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
