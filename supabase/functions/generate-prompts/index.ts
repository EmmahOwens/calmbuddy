
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const systemPrompt = `You are an empathetic and professional mental health companion chatbot. Your job is to suggest helpful prompts that the human user might want to say next based on the conversation context. Generate prompts from the user's perspective, as if the user is talking to you.

Your suggestions should be:
- From the user's perspective (what THEY would say to YOU)
- Focused on mental health topics like anxiety, depression, stress, mindfulness, etc.
- Natural, conversational follow-ups to the last 1-3 messages
- Personalized to reflect details explicitly mentioned in the conversation
- Brief (max 10 words per suggestion)
- Diverse in approach (mix of statements, experiences, and follow-up thoughts)

EXTREMELY IMPORTANT: 
- Each suggestion MUST clearly relate to the exact details and emotions from the conversation
- Avoid generic mental health statements unless the conversation is just starting
- If the user mentions a specific issue (e.g., "I'm anxious about my job interview"), suggest follow-ups about THAT specific issue
- Include at least one suggestion that introduces a NEW but related aspect to the topic being discussed
- Vary suggestion types between: sharing more detail, expressing emotions, asking for specific advice, and reflective statements

The suggestions should feel like natural things the user would want to say next.`;

// Default fallback suggestions for different conversation states
const initialFallbackSuggestions = [
  "I'm feeling anxious about something specific",
  "I've been having trouble sleeping lately",
  "I feel overwhelmed by my responsibilities",
  "Sometimes I feel sad for no reason",
  "I want to learn better coping techniques"
];

const ongoingFallbackSuggestions = [
  "That's helpful, can we explore this more?",
  "I'm dealing with something related",
  "This is exactly what I'm experiencing",
  "How can I practice what you suggested?",
  "I'd like to share more about my situation"
];

// Topic-specific fallback suggestions
const topicalFallbackSuggestions = {
  anxiety: [
    "My anxiety shows up physically as...",
    "I get anxious when I think about...",
    "My anxiety is worst during...",
    "What techniques help panic attacks?",
    "I want to understand my triggers better"
  ],
  depression: [
    "I've lost interest in things I used to enjoy",
    "Some days I struggle to get out of bed",
    "My mood seems to be getting worse",
    "I feel disconnected from everyone",
    "I don't see a way forward sometimes"
  ],
  sleep: [
    "I keep waking up during the night",
    "I feel exhausted even after sleeping",
    "My mind races when I try to sleep",
    "I've tried sleep aids but they don't help",
    "My sleep schedule is completely disrupted"
  ],
  work: [
    "Work stress is affecting my health",
    "I feel undervalued at my job",
    "I'm anxious about upcoming deadlines",
    "I can't stop thinking about work at home",
    "I'm considering a career change"
  ],
  relationships: [
    "I'm having difficulty communicating with...",
    "I feel lonely even when I'm with others",
    "My relationship with my family is strained",
    "I struggle to set boundaries with people",
    "I find it hard to trust others"
  ],
  general: [
    "Let me share what happened today",
    "I'm trying to work on self-care",
    "I'm not sure how to process my feelings",
    "I want to develop healthier habits",
    "Can we talk about managing expectations?"
  ]
};

// Enhanced topic detection with sub-categories
function detectConversationTheme(messages) {
  if (!messages || messages.length === 0) {
    return { mainTopic: "general", subtopics: [] };
  }
  
  // Get text from the last 3 messages for context
  const recentMessages = messages.slice(-3);
  const recentText = recentMessages.map(msg => msg.content.toLowerCase()).join(" ");
  
  // Define patterns for main topics and subtopics
  const topicPatterns = {
    anxiety: {
      pattern: /anxi|nervous|worry|panic|afraid|fear|stress|overwhelm/i,
      subtopics: {
        social: /social|people|gathering|public|crowd|judg|speak/i,
        health: /health|sick|illness|disease|dying|hospital|symptom/i,
        future: /future|plan|decision|choice|uncertainty|unknown/i,
        performance: /work|school|test|exam|presentation|interview|perform/i
      }
    },
    depression: {
      pattern: /depress|sad|down|low|unhappy|blue|hopeless|empty|numb/i,
      subtopics: {
        motivation: /motivation|energy|tired|exhausted|fatigue|lazy/i,
        self_worth: /worth|value|hate myself|self-esteem|confidence/i,
        purpose: /purpose|meaning|point|reason|why bother|why try/i,
        enjoyment: /enjoy|pleasure|fun|happy|interest|passion|hobby/i
      }
    },
    sleep: {
      pattern: /sleep|insomnia|tired|rest|awake|night|bed|dream|nightmare/i,
      subtopics: {
        falling_asleep: /fall asleep|can't sleep|falling asleep|getting to sleep/i,
        staying_asleep: /stay asleep|wake up|middle of night|early morning/i,
        quality: /quality|restless|toss|turn|deep sleep|rem|restful/i,
        schedule: /schedule|routine|pattern|consistent|irregular|cycle/i
      }
    },
    relationships: {
      pattern: /relation|friend|family|partner|parent|child|colleague|social|lonely/i,
      subtopics: {
        romantic: /partner|spouse|boyfriend|girlfriend|husband|wife|date|love/i,
        family: /family|parent|mother|father|sibling|child|daughter|son/i,
        friendships: /friend|buddy|pal|social circle|colleague|coworker/i,
        isolation: /lonely|alone|isolated|abandoned|rejected|connection/i
      }
    },
    work: {
      pattern: /work|job|career|boss|coworker|office|workplace|profession/i,
      subtopics: {
        stress: /stress|pressure|deadline|overwhelm|burnout|overwork/i,
        satisfaction: /satisf|fulfill|enjoy|purpose|meaning|contribution/i,
        balance: /balance|boundaries|overtime|time off|vacation|weekend/i,
        conflict: /conflict|difficult|toxic|bully|harass|disagree/i
      }
    },
    trauma: {
      pattern: /trauma|abuse|assault|accident|ptsd|flashback|trigger/i,
      subtopics: {
        processing: /process|understand|come to terms|accept|move on/i,
        symptoms: /flashback|nightmare|trigger|avoid|numb|hypervigilant/i,
        healing: /heal|recover|therapy|treatment|better|improve/i,
        safety: /safe|danger|threat|protect|secure|trust|fear/i
      }
    },
    mindfulness: {
      pattern: /mindful|meditat|breath|present|focus|aware|attention|calm/i,
      subtopics: {
        techniques: /technique|practice|exercise|method|strategy|approach/i,
        consistency: /consistent|regular|routine|habit|daily|schedule/i,
        benefits: /benefit|help|improve|better|change|difference/i,
        difficulties: /hard|difficult|challenge|obstacle|barrier|distract/i
      }
    }
  };
  
  // Identify main topic and subtopics
  let mainTopic = "general";
  let topicScore = 0;
  const subtopics = [];
  
  for (const [topic, data] of Object.entries(topicPatterns)) {
    const matches = (recentText.match(data.pattern) || []).length;
    if (matches > topicScore) {
      topicScore = matches;
      mainTopic = topic;
      
      // Check for subtopics
      for (const [subtopic, pattern] of Object.entries(data.subtopics)) {
        if (pattern.test(recentText)) {
          subtopics.push(subtopic);
        }
      }
    }
  }
  
  return { mainTopic, subtopics };
}

// Extract specific entities and emotional states from conversation
function extractConversationDetails(messages) {
  if (!messages || messages.length === 0) return {};
  
  const recentMessages = messages.slice(-4).map(msg => msg.content.toLowerCase()).join(" ");
  const details = {};
  
  // Extract emotions
  const emotionPatterns = {
    anger: /angry|furious|mad|rage|irritated|frustrated/i,
    sadness: /sad|down|unhappy|miserable|depressed|grief|loss/i,
    fear: /scared|afraid|fearful|terrified|anxious|worried|panicked/i,
    joy: /happy|joyful|excited|pleased|delighted|content|satisfied/i,
    shame: /ashamed|embarrassed|guilty|humiliated|inadequate/i,
    hope: /hopeful|optimistic|looking forward|positive|expecting/i
  };
  
  details.emotions = [];
  for (const [emotion, pattern] of Object.entries(emotionPatterns)) {
    if (pattern.test(recentMessages)) {
      details.emotions.push(emotion);
    }
  }
  
  // Extract time references
  if (/yesterday|last night|earlier today|this morning/i.test(recentMessages)) {
    details.timeframe = "recent";
  } else if (/last week|few days ago|recently/i.test(recentMessages)) {
    details.timeframe = "past week";
  } else if (/month|year|long time/i.test(recentMessages)) {
    details.timeframe = "long term";
  } else if (/tomorrow|next week|future|soon|upcoming/i.test(recentMessages)) {
    details.timeframe = "future";
  }
  
  // Extract mentioned people
  const peoplePattern = /\b(friend|partner|spouse|boyfriend|girlfriend|husband|wife|mom|dad|mother|father|boss|coworker|therapist|doctor|family|child|children|parent|sibling|brother|sister)\b/gi;
  const peopleMatches = recentMessages.match(peoplePattern) || [];
  details.people = [...new Set(peopleMatches)]; // Remove duplicates
  
  // Extract potential activities or coping mechanisms mentioned
  const activitiesPattern = /\b(exercise|meditation|reading|therapy|medication|walking|sleeping|eating|drinking|working|studying|talking|spending time|journaling|yoga|breathing|relaxation)\b/gi;
  const activitiesMatches = recentMessages.match(activitiesPattern) || [];
  details.activities = [...new Set(activitiesMatches)]; // Remove duplicates
  
  return details;
}

// Generate tailored suggestions based on extracted information
function generateTailoredSuggestions(theme, details) {
  const { mainTopic, subtopics } = theme;
  const suggestions = [];
  
  // Use primary topic for initial suggestions
  const basePool = topicalFallbackSuggestions[mainTopic] || topicalFallbackSuggestions.general;
  suggestions.push(...basePool.slice(0, 2)); // Add 2 from the main topic
  
  // Add emotions-based suggestions if available
  if (details.emotions && details.emotions.length > 0) {
    const emotion = details.emotions[0];
    if (emotion === "anger") {
      suggestions.push("I feel frustrated when this happens");
    } else if (emotion === "sadness") {
      suggestions.push("I've been feeling really down about this");
    } else if (emotion === "fear") {
      suggestions.push("This makes me feel anxious and worried");
    } else if (emotion === "shame") {
      suggestions.push("I feel embarrassed talking about this");
    } else if (emotion === "hope") {
      suggestions.push("I'm starting to feel more hopeful");
    }
  }
  
  // Add people-based suggestions if available
  if (details.people && details.people.length > 0) {
    const person = details.people[0].toLowerCase();
    suggestions.push(`My ${person} doesn't understand what I'm going through`);
  }
  
  // Add activity-based suggestions if available
  if (details.activities && details.activities.length > 0) {
    const activity = details.activities[0].toLowerCase();
    suggestions.push(`${activity} helps me cope sometimes`);
  }
  
  // Add timeframe-based suggestion if available
  if (details.timeframe) {
    if (details.timeframe === "recent") {
      suggestions.push("This has been happening a lot lately");
    } else if (details.timeframe === "long term") {
      suggestions.push("I've been dealing with this for years");
    } else if (details.timeframe === "future") {
      suggestions.push("I'm worried about what happens next");
    }
  }
  
  // Add subtopic-based suggestions
  if (subtopics.length > 0) {
    const subtopic = subtopics[0];
    if (mainTopic === "anxiety" && subtopic === "social") {
      suggestions.push("Social situations make me extremely anxious");
    } else if (mainTopic === "depression" && subtopic === "motivation") {
      suggestions.push("I can't find the energy to do basic tasks");
    } else if (mainTopic === "sleep" && subtopic === "falling_asleep") {
      suggestions.push("My mind races when I try to fall asleep");
    } else if (mainTopic === "work" && subtopic === "stress") {
      suggestions.push("The pressure at work is overwhelming me");
    }
  }
  
  // Make sure we have 5 suggestions
  while (suggestions.length < 5) {
    // Add from general pool if we need more
    const generalSuggestion = ongoingFallbackSuggestions[suggestions.length % ongoingFallbackSuggestions.length];
    if (!suggestions.includes(generalSuggestion)) {
      suggestions.push(generalSuggestion);
    } else {
      // Try from a different topic if needed
      const otherTopics = Object.keys(topicalFallbackSuggestions).filter(t => t !== mainTopic);
      const randomTopic = otherTopics[Math.floor(Math.random() * otherTopics.length)];
      const randomSuggestion = topicalFallbackSuggestions[randomTopic][Math.floor(Math.random() * 5)];
      if (!suggestions.includes(randomSuggestion)) {
        suggestions.push(randomSuggestion);
      }
    }
  }
  
  // Limit to 5 suggestions and ensure uniqueness
  return [...new Set(suggestions)].slice(0, 5);
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

    // Analyze conversation for theme and details
    const conversationTheme = detectConversationTheme(messages);
    const conversationDetails = extractConversationDetails(messages);
    
    console.log("Conversation theme:", conversationTheme);
    console.log("Conversation details:", conversationDetails);

    try {
      // First attempt with OpenAI API
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
            ...conversationContext.slice(-4), // Send last 4 messages for context
            { 
              role: "user", 
              content: `Based only on our conversation so far, suggest 5 specific things I (the human) might want to say to you next.
              
Each suggestion should directly relate to something I've mentioned in our conversation. Make them personalized to my specific situation and emotions.

Use this format:
- suggestion one
- suggestion two
- etc.

Current timestamp for uniqueness: ${new Date().toISOString()}
Detected theme: ${conversationTheme.mainTopic}
Detected subtopics: ${conversationTheme.subtopics.join(", ")}` 
            }
          ],
          temperature: 1.1, // Higher temperature for more varied responses
          max_tokens: 250,
          frequency_penalty: 1.2, // Strongly discourage repetition
          presence_penalty: 1.2, // Strongly encourage mentioning new topics
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
        .filter(line => line.length > 0 && line.length < 100)
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
      console.error('Error with OpenAI API:', error);
      
      // Use our extracted information to generate fallback suggestions
      console.log("Generating tailored fallback suggestions");
      const tailoredSuggestions = generateTailoredSuggestions(conversationTheme, conversationDetails);
      
      console.log("Generated tailored suggestions:", tailoredSuggestions);
      
      return new Response(JSON.stringify({ suggestions: tailoredSuggestions }), {
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
          "I've been feeling overwhelmed lately",
          "Let me tell you about my sleeping problems",
          "Sometimes I have trouble expressing myself",
          "I'm trying to develop better coping skills",
          "I have mixed feelings about therapy"
        ]
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
