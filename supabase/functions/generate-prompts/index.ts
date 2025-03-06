
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
- DIRECTLY RELEVANT to the current conversation topic and recent messages
- Natural follow-ups to the conversation flow
- Brief (max 10 words per suggestion)
- Diverse in topic and approach
- Personalized to reflect exact details mentioned in the conversation

EXTREMELY IMPORTANT: Analyze the conversation deeply - look for specific topics, symptoms, experiences, emotions, or situations the user has mentioned, and create suggestions that DIRECTLY reference these exact details. NEVER provide generic suggestions that could apply to any conversation. Every suggestion must reference something specific from the conversation.

If the user mentions anxiety symptoms, suggest statements about those exact symptoms.
If they talk about a relationship issue, suggest statements about that specific relationship dynamic.
If they mention work stress, offer statements about their particular work situation.`;

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
  
  return "general";
}

// Extract important topics and keywords from conversation
function extractKeywords(messages) {
  if (!messages || messages.length === 0) {
    return [];
  }
  
  // Get last few messages for better context
  const recentMessages = messages.slice(-4);
  const fullText = recentMessages.map(msg => msg.content.toLowerCase()).join(" ");
  
  // Look for important keywords in mental health contexts
  const possibleKeywords = [
    // Emotions
    "happy", "sad", "angry", "frustrated", "anxious", "worried", "scared", "lonely", 
    "hopeful", "hopeless", "overwhelmed", "calm", "peaceful", "stressed",
    
    // Relationships
    "partner", "spouse", "husband", "wife", "boyfriend", "girlfriend", "friend", 
    "family", "parent", "child", "coworker", "boss",
    
    // Symptoms
    "insomnia", "fatigue", "exhaustion", "pain", "headache", "nausea", 
    "panic attack", "breathing", "heart racing", "crying", "sleeping",
    
    // Activities
    "work", "exercise", "meditation", "therapy", "medication", "reading", 
    "walking", "yoga", "journaling", "hobby",
    
    // Time references
    "morning", "night", "day", "week", "month", "year", "yesterday", "tomorrow"
  ];
  
  return possibleKeywords.filter(word => fullText.includes(word));
}

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
    
    console.log(`Generate prompts received ${messages?.length || 0} messages for context`);

    // If no messages, return initial suggestions
    if (!messages || messages.length === 0) {
      console.log("No message context provided, returning initial suggestions");
      return new Response(JSON.stringify({ suggestions: initialFallbackSuggestions }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Convert messages to the format expected by the OpenAI API
    const conversationContext = messages.map(msg => ({
      role: msg.isBot ? "assistant" : "user",
      content: msg.content
    }));

    // Extract keywords to help with fallbacks if API fails
    const keywords = extractKeywords(messages);
    console.log("Extracted keywords:", keywords);

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
            ...conversationContext.slice(-6), // Send last 6 messages for context
            { 
              role: "user", 
              content: `Based ONLY on our conversation so far (${messages.length} messages), suggest 5 things I might want to say to you next as the human user. Make these DIRECTLY RELEVANT to the SPECIFIC topics we've discussed. Reference exact details I've mentioned.
              
Current timestamp (for uniqueness): ${new Date().toISOString()}
Keywords detected: ${keywords.join(", ")}

DO NOT suggest generic statements that could apply to any conversation. 
Every suggestion must directly reference something specific from our conversation.
Format each suggestion on a new line with a dash (-) prefix.` 
            }
          ],
          temperature: 1.0, // Higher temperature for more varied responses
          max_tokens: 200,
          frequency_penalty: 1.0, // Strongly discourage repetition
          presence_penalty: 1.0, // Strongly encourage mentioning new topics
        }),
      });

      // Check if response is ok
      if (!response.ok) {
        const errorData = await response.json();
        console.error("OpenAI API error:", errorData);
        throw new Error(errorData.error?.message || 'OpenAI API error');
      }

      const data = await response.json();
      const suggestionsText = data.choices[0].message.content;
      
      console.log("Raw suggestions from API:", suggestionsText);
      
      // Better parsing for suggestions
      const suggestions = suggestionsText
        .split(/\n|-|\d+\./)
        .map(line => line.trim())
        .filter(line => line.length > 0 && line.length < 80)
        .slice(0, 5);

      console.log("Parsed suggestions:", suggestions);

      if (suggestions.length > 0) {
        return new Response(JSON.stringify({ suggestions }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        throw new Error("No valid suggestions extracted from API response");
      }
    } catch (error) {
      console.error('Error with primary model:', error);
      
      // Enhanced fallback - use detected topic from conversation
      const detectedTopic = detectTopic(messages);
      console.log(`Falling back to topic-based suggestions for: ${detectedTopic}`);
      
      // Try to create custom fallbacks using extracted keywords
      let customFallbacks = [];
      if (keywords.length > 0) {
        for (const keyword of keywords.slice(0, 5)) {
          customFallbacks.push(`I want to talk more about ${keyword}`);
        }
      }
      
      // Merge custom and topical fallbacks, prioritizing custom ones
      const fallbackSuggestions = [
        ...customFallbacks,
        ...(topicalFallbackSuggestions[detectedTopic] || ongoingFallbackSuggestions)
      ].slice(0, 5);
      
      return new Response(JSON.stringify({ suggestions: fallbackSuggestions }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }
  } catch (error) {
    console.error('Error in generate-prompts function:', error);
    
    // Ultimate fallback
    return new Response(
      JSON.stringify({ 
        suggestions: [
          "I'm feeling overwhelmed today",
          "Let me tell you about my sleep problems",
          "I've been practicing mindfulness lately",
          "My anxiety has been getting worse",
          "I'm struggling with a relationship"
        ]
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
