export default async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Session-ID'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Method Not Allowed' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      // ignore
    }
  }

  const { topic, level = 'INTERMEDIATE', type = 'DETAILED' } = body || {};

  if (!topic || !topic.trim()) {
    res.status(400).json({ message: 'Topic is required' });
    return;
  }

  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    res.status(500).json({
      success: false,
      errorMessage: 'GROQ_API_KEY is not configured in Vercel environment variables. Please add GROQ_API_KEY in your Vercel Project Settings > Environment Variables.',
      shortExplanation: 'GROQ_API_KEY is missing on the server. Please configure it in your Vercel Project Settings and redeploy.',
    });
    return;
  }

  try {
    const levelContext = getLevelContext(level);
    const typeContext = getTypeContext(type);
    const includeAnalogy = level === 'BEGINNER' || level === 'INTERMEDIATE';

    const systemPrompt = `You are an expert educator with the ability to explain complex concepts clearly to any audience.

Explain the concept: "${topic}"

Target Audience: ${levelContext}
Explanation Style: ${typeContext}

IMPORTANT: You MUST respond with ONLY a valid JSON object. No markdown, no explanation outside JSON.

Return this exact JSON structure:
{
  "shortExplanation": "A clear 2-3 sentence explanation suitable for the target audience. This is shown first.",
  "detailedExplanation": "A comprehensive explanation covering mechanisms, how it works, why it matters, and important nuances.",
  "example": "A concrete, relatable real-world example that illustrates the concept clearly.",
  "analogy": ${includeAnalogy ? '"A simple, intuitive analogy that connects this concept to everyday life"' : 'null'},
  "summary": "A concise 1-2 sentence TL;DR that captures the essence of the concept.",
  "relatedTopics": ["topic1", "topic2", "topic3", "topic4", "topic5"]
}

Guidelines:
- shortExplanation: ${level === 'BEGINNER' ? 'Use simple everyday words.' : 'Balance simplicity with accuracy.'}
- detailedExplanation: ${
      type === 'STEP_BY_STEP'
        ? 'A numbered step-by-step breakdown. Use \\n1. Step one\\n2. Step two format.'
        : 'A comprehensive explanation covering mechanisms and nuances.'
    }
- example: Make it concrete and easy to visualize.
- analogy: ${includeAnalogy ? 'Use a simple metaphor from everyday life.' : 'null (not needed).'}
- relatedTopics: 4-6 genuinely related concepts worth exploring next.`;

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: systemPrompt }],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
    });

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      throw new Error(`Groq API returned ${groqResponse.status}: ${errorText}`);
    }

    const groqData = await groqResponse.json();
    const explanationContent = JSON.parse(groqData.choices[0].message.content);

    res.status(200).json({
      id: Math.floor(Math.random() * 100000),
      topic,
      level,
      type,
      ...explanationContent,
      success: true,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error generating explanation:', error);
    res.status(500).json({
      success: false,
      errorMessage: error.message || 'Unable to generate explanation',
      shortExplanation: 'An error occurred while generating the explanation. Please try again.',
    });
  }
}

function getLevelContext(level) {
  switch (level) {
    case 'BEGINNER':
      return 'Complete beginner with no prior knowledge. Use simple language, avoid jargon, and relate everything to everyday experiences.';
    case 'ADVANCED':
      return 'Expert or professional who wants precise, technically accurate information. Use proper terminology, discuss nuances, edge cases, and trade-offs.';
    case 'INTERMEDIATE':
    default:
      return "Someone with basic familiarity who wants deeper understanding. Can handle some technical terms if explained. Focus on 'why' not just 'what'.";
  }
}

function getTypeContext(type) {
  switch (type) {
    case 'DEFINITION':
      return "Conceptual Definition — focus on what the concept IS, its core meaning, key characteristics, and how it's formally understood.";
    case 'STEP_BY_STEP':
      return 'Step-by-Step Breakdown — explain how the concept works as a process or sequence. Break it into clear numbered steps or phases.';
    case 'DETAILED':
    default:
      return 'Detailed Explanation — go deep. Cover the concept comprehensively, including mechanisms, causes, effects, and nuances.';
  }
}
