import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create a variety of fallback responses based on different mental health topics and conversation types
const fallbackResponses = {
  greeting: "Hello! 😊 I'm here to chat about anything mental health related. How are you feeling today?",
  appreciation: "You're welcome! 💭 I'm glad I could help in some way. Is there anything else you'd like to discuss?",
  anxiety: "I understand anxiety can be challenging. 💭 It's a normal response to stress, but it can become overwhelming. Would you like to share more about what you're experiencing?",
  depression: "Feeling down is something many people experience. ❤️ Remember that your feelings are valid, and it's okay to seek support. Would you like to talk more about what you're going through?",
  stress: "Managing stress is important for wellbeing. 🧘 Taking small breaks and practicing mindfulness can help. What situations are causing you stress right now?",
  sleep: "Sleep is crucial for mental health. 💤 Establishing a regular sleep routine can make a difference. Have you noticed any patterns with your sleep lately?",
  mindfulness: "Mindfulness helps us stay present. 🌱 Even a few minutes of practice can be beneficial. Would you like to learn about some simple mindfulness exercises?",
  relationships: "Relationships can significantly impact our mental health. 💭 Both challenges and support from others shape our wellbeing. Would you like to talk about a specific relationship?",
  general: "I'm here to support you with whatever's on your mind. 💭 Mental health is complex and personal. Would you like to share more about what you're experiencing?"
};

// Helper function to detect the type of message and select appropriate fallback
function detectMessageType(message) {
  const text = message.toLowerCase();
  
  // Check for greetings
  if (/^(hi|hello|hey|good (morning|afternoon|evening)|greetings)/i.test(text)) {
    return "greeting";
  }
  
  // Check for appreciation/thanks
  if (/thank|thanks|appreciate|grateful/i.test(text)) {
    return "appreciation";
  }
  
  // Check for different mental health topics
  if (/anxi|nervous|worry|panic|afraid|fear/i.test(text)) {
    return "anxiety";
  }
  
  if (/depress|sad|down|low|unhappy|blue|hopeless/i.test(text)) {
    return "depression";
  }
  
  if (/stress|overwhelm|pressure|burden|too much/i.test(text)) {
    return "stress";
  }
  
  if (/sleep|insomnia|tired|rest|awake|night/i.test(text)) {
    return "sleep";
  }
  
  if (/mindful|meditat|breath|present|focus|aware/i.test(text)) {
    return "mindfulness";
  }
  
  if (/relation|friend|family|partner|colleague|social/i.test(text)) {
    return "relationships";
  }
  
  // Default
  return "general";
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

    console.log('Making request to OpenAI with messages:', JSON.stringify(messages));

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
- Varied in response even to similar questions (never repeat exact phrases or structures)
- Adaptive to the conversation flow and context

Cover a wide range of mental health topics including but not limited to:
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

Use relevant emojis to express emotions when appropriate:
- Use 😊 for greetings and positive encouragement
- Use 🤔 when asking thoughtful questions
- Use 💭 when reflecting on the user's thoughts
- Use 💪 for motivation and strength
- Use 🌱 for growth and progress
- Use 🧘 for mindfulness and calm
- Use ❤️ for empathy and care

Balance emoji usage - typically use 1-2 emojis per message. Don't overuse them.
If you sense any serious mental health concerns, always recommend seeking professional help.

IMPORTANT: For repeat questions, provide new perspectives, different wording and examples each time. Use different metaphors, approaches and suggestions for similar topics to keep responses fresh and helpful. Never use the same phrasing twice. If asked the same question repeatedly, acknowledge you've addressed this before but offer a new angle each time.`
          },
          ...messages
        ];

    // Add a more detailed timestamp to encourage varied responses
    processedMessages.push({
      role: 'system',
      content: `Current timestamp: ${new Date().toISOString()}. 
Random seed: ${Math.random().toString(36).substring(2, 15)}. 
Use these values to provide truly varied responses even for repeat questions.
For identical or similar user questions that may have been asked before, provide a completely different response using new examples, metaphors, or approaches.`
    });

    // Get the user's latest message for fallback detection
    const latestUserMessage = messages.filter(msg => msg.role === 'user').pop()?.content || "";

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: processedMessages,
          temperature: 0.9, // Increased to add more variability in responses
          max_tokens: 300,
          frequency_penalty: 0.8, // Increased to strongly discourage repetition
          presence_penalty: 0.8, // Increased to strongly encourage covering new topics
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('OpenAI API error:', errorData);
        throw new Error(errorData.error?.message || 'Failed to get AI response');
      }

      const data = await response.json();
      console.log('Received successful response from OpenAI:', JSON.stringify(data));

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Error with primary model, attempting fallback model:', error);
      
      // Fallback to a different model with similar high randomness settings
      try {
        const fallbackResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: processedMessages,
            temperature: 0.9,
            max_tokens: 300,
            frequency_penalty: 0.8,
            presence_penalty: 0.8,
          }),
        });

        if (!fallbackResponse.ok) {
          const fallbackErrorData = await fallbackResponse.json();
          console.error('Fallback model also failed:', fallbackErrorData);
          throw new Error(fallbackErrorData.error?.message || 'Failed with both primary and fallback models');
        }

        const fallbackData = await fallbackResponse.json();
        console.log('Received successful response from fallback model:', JSON.stringify(fallbackData));
        
        return new Response(JSON.stringify(fallbackData), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (fallbackError) {
        console.error('Both models failed completely:', fallbackError);
        
        // Determine the type of message and provide a contextually appropriate response
        const messageType = detectMessageType(latestUserMessage);
        const fallbackContent = fallbackResponses[messageType];
        
        console.log(`Using fallback response type: ${messageType}`);
        
        return new Response(
          JSON.stringify({ 
            choices: [{
              message: {
                content: fallbackContent
              }
            }]
          }),
          { 
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }
  } catch (error) {
    console.error('Error in chat function:', error);
    
    // Use a generic helpful response as last resort
    return new Response(
      JSON.stringify({ 
        choices: [{
          message: {
            content: "I'm here to support you. 💭 While I'm having a technical issue at the moment, I'd still like to help. Mental wellbeing is important, and I'm here to listen. Could you share more about what's on your mind?"
          }
        }]
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
