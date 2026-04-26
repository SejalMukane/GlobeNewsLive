/**
 * Multi-Provider AI Architecture
 * 
 * Strategy:
 * 1. Groq → Fast clustering & extraction
 * 2. Google AI Studio → Causality & prediction
 * 3. OpenRouter → Fallback if others fail
 * 4. Cache results → Avoid reprocessing same events
 */

import crypto from 'crypto';

interface AIResponse {
  provider: 'groq' | 'google' | 'openrouter' | 'cached';
  content: string;
  cost: number;
  cached?: boolean;
  timestamp: number;
}

/**
 * Cache for AI results (in-memory)
 * Key: hash of input + task type
 * Value: AI response + timestamp
 * 
 * Production: Use Redis instead
 */
const aiCache = new Map<string, { response: string; timestamp: number; provider: string }>();

/**
 * Generate cache key from input
 */
function generateCacheKey(input: string, taskType: string): string {
  return crypto
    .createHash('sha256')
    .update(`${taskType}:${input}`)
    .digest('hex');
}

/**
 * Check if result is cached (valid for 24 hours)
 */
function getCachedResult(input: string, taskType: string): { response: string; provider: string } | null {
  const key = generateCacheKey(input, taskType);
  const cached = aiCache.get(key);

  if (!cached) return null;

  const ageMinutes = (Date.now() - cached.timestamp) / (1000 * 60);
  if (ageMinutes > 1440) {
    // Cache expired (24 hours)
    aiCache.delete(key);
    return null;
  }

  console.log(`✅ Cache HIT for ${taskType} (age: ${Math.round(ageMinutes)}min)`);
  return {
    response: cached.response,
    provider: cached.provider,
  };
}

/**
 * Store result in cache
 */
function cacheResult(input: string, taskType: string, response: string, provider: string): void {
  const key = generateCacheKey(input, taskType);
  aiCache.set(key, { response, timestamp: Date.now(), provider });
  console.log(`📝 Cached ${taskType} result (cache size: ${aiCache.size})`);
}

/**
 * TASK 1: Clustering & Extraction (Fast)
 * Use: Groq (fastest & cheapest)
 */
export async function clusterAndExtract(
  osintData: string
): Promise<AIResponse> {
  const taskType = 'clustering';

  // Check cache first
  const cached = getCachedResult(osintData, taskType);
  if (cached) {
    return {
      provider: 'cached',
      content: cached.response,
      cost: 0,
      cached: true,
      timestamp: Date.now(),
    };
  }

  // Try Groq first (if key is valid)
  if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.startsWith('gsk_')) {
    try {
      console.log('🚀 Groq: Clustering & extracting events...');
      const { Groq } = await import('groq-sdk');

      const groq = new Groq({
        apiKey: process.env.GROQ_API_KEY,
      });

      const message = await groq.chat.completions.create({
        model: 'mixtral-8x7b-32768',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: `Analyze these OSINT reports and extract key events. Group related reports together.
            
${osintData}

Return JSON with:
{
  "events": [
    {
      "id": "event-1",
      "title": "...",
      "severity": "CRITICAL|HIGH|MEDIUM|LOW",
      "type": "conflict|disaster|economic|geopolitical",
      "location": "...",
      "credibility": 0-100,
      "sources": ["source1", "source2"],
      "description": "..."
    }
  ]
}`,
          },
        ],
      });

      const content = message.choices[0].message.content || '';

      // Cache the result
      cacheResult(osintData, taskType, content, 'groq');

      return {
        provider: 'groq',
        content,
        cost: 0.0001, // Groq is cheap
        timestamp: Date.now(),
      };
    } catch (error: any) {
      if (error?.status === 401 || error?.error?.code === 'invalid_api_key') {
        console.warn('⚠️  Groq API key invalid, falling back to Google AI...');
      } else {
        console.error('❌ Groq failed:', error);
      }
    }
  }

  // Fallback to Google AI
  try {
    console.log('🧠 Google AI: Clustering events (fallback)...');
    const { GoogleGenerativeAI } = await import('@google/generative-ai');

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    const prompt = `Analyze these OSINT reports and extract key events. Group related reports.

${osintData}

Return JSON with:
{
  "events": [
    {
      "id": "event-1",
      "title": "...",
      "severity": "CRITICAL|HIGH|MEDIUM|LOW",
      "type": "conflict|disaster|economic|geopolitical",
      "location": "...",
      "credibility": 0-100,
      "sources": ["source1", "source2"],
      "description": "..."
    }
  ]
}`;

    const result = await model.generateContent(prompt);
    const content = result.response.text();

    // Cache the result
    cacheResult(osintData, taskType, content, 'google-ai');

    return {
      provider: 'google-ai',
      content,
      cost: 0,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.warn('⚠️  Google AI unavailable, using mock analysis...');
  }

  // FALLBACK: Mock response when all APIs fail
  console.log('📊 Using mock OSINT analysis (all AI providers offline)');
  const mockContent = JSON.stringify({
    events: [
      {
        id: 'event-1',
        title: 'Iran increases naval presence near Strait of Hormuz',
        severity: 'CRITICAL',
        type: 'military',
        location: 'Middle East',
        credibility: 95,
        sources: ['Reuters', 'Bloomberg'],
        description: 'Iranian military increases naval activity in strategically important waterway. Multiple vessels reported in Persian Gulf.',
      },
      {
        id: 'event-2',
        title: 'Global oil prices spike amid Middle East tensions',
        severity: 'HIGH',
        type: 'economic',
        location: 'Global',
        credibility: 85,
        sources: ['Bloomberg', 'OPEC'],
        description: 'Oil futures rise 5% on geopolitical risk premium.',
      },
    ],
  });

  cacheResult(osintData, taskType, mockContent, 'mock');

  return {
    provider: 'mock',
    content: mockContent,
    cost: 0,
    timestamp: Date.now(),
  };
}

/**
 * TASK 2: Causality Analysis (Intelligence)
 * Use: Google AI Studio (good reasoning)
 */
export async function analyzeCausality(eventDescription: string): Promise<AIResponse> {
  const taskType = 'causality';

  // Check cache
  const cached = getCachedResult(eventDescription, taskType);
  if (cached) {
    return {
      provider: 'cached',
      content: cached.response,
      cost: 0,
      cached: true,
      timestamp: Date.now(),
    };
  }

  try {
    console.log('🧠 Google AI: Analyzing causality...');
    const { GoogleGenerativeAI } = await import('@google/generative-ai');

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    const prompt = `Analyze the root causes and causal chain for this geopolitical event:

"${eventDescription}"

Provide deep analysis:
1. Root cause (what triggered this)
2. Causal chain (cause → effect chain)
3. Historical precedents (when similar happened)
4. Stakeholder motivations
5. Confidence level (0-100%)

Format as JSON with: {
  "rootCause": "...",
  "causalChain": ["step1", "step2", ...],
  "precedents": ["..."],
  "stakeholders": {...},
  "confidence": 75
}`;

    const result = await model.generateContent(prompt);
    const content = result.response.text();

    // Cache result
    cacheResult(eventDescription, taskType, content, 'google');

    return {
      provider: 'google',
      content,
      cost: 0.0005, // Google free tier
      timestamp: Date.now(),
    };
  } catch (error) {
    console.warn('⚠️ Google AI failed for causality analysis, using mock...');
    
    // Mock fallback
    const mockContent = JSON.stringify({
      rootCause: 'Regional geopolitical tensions and military posturing',
      causalChain: [
        'Initial military mobilization',
        'International response and counter-mobilization',
        'Economic impacts on global markets',
        'Escalation of diplomatic tensions',
      ],
      precedents: [
        '2022 Russia-Ukraine invasion',
        '2019 Iran nuclear tensions',
        '2003 Iraq invasion buildup',
      ],
      stakeholders: {
        'Regional actors': 'Seeking regional influence',
        'Global powers': 'Protecting strategic interests',
        'Civilians': 'Facing humanitarian impacts',
      },
      confidence: 72,
    });

    return {
      provider: 'mock',
      content: mockContent,
      cost: 0,
      timestamp: Date.now(),
    };
  }
}

/**
 * TASK 3: Crisis Prediction (Intelligence)
 * Use: Google AI Studio (reasoning capability)
 */
export async function predictEscalation(eventDescription: string): Promise<AIResponse> {
  const taskType = 'prediction';

  // Check cache
  const cached = getCachedResult(eventDescription, taskType);
  if (cached) {
    return {
      provider: 'cached',
      content: cached.response,
      cost: 0,
      cached: true,
      timestamp: Date.now(),
    };
  }

  try {
    console.log('🔮 Google AI: Predicting escalation...');
    const { GoogleGenerativeAI } = await import('@google/generative-ai');

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    const prompt = `Based on this geopolitical event, predict its escalation:

"${eventDescription}"

Provide detailed prediction:
1. Escalation probability (0-100%)
2. Timeline (days until peak)
3. Most likely outcomes (ranked)
4. Market impacts (oil, stocks, supply chains)
5. Affected regions/populations
6. De-escalation factors
7. Confidence level (0-100%)

Format as JSON: {
  "escalationProbability": 68,
  "timelineToEventDays": 14-30,
  "likelyOutcomes": [{"outcome": "...", "probability": 45}],
  "marketImpacts": {"oil": "+8-12%", "stocks": "-2%"},
  "affectedRegions": [...],
  "deescalationFactors": [...],
  "confidence": 72
}`;

    const result = await model.generateContent(prompt);
    const content = result.response.text();

    // Cache result
    cacheResult(eventDescription, taskType, content, 'google');

    return {
      provider: 'google',
      content,
      cost: 0.0005,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.warn('⚠️ Google AI failed, trying OpenRouter fallback:', error);
    return await predictEscalationFallback(eventDescription);
  }
}

/**
 * FALLBACK: OpenRouter (if primary providers fail)
 * Cheaper alternative with good quality
 */
async function predictEscalationFallback(eventDescription: string): Promise<AIResponse> {
  try {
    console.log('🔄 OpenRouter: Using fallback...');

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-2-7b-chat',
        messages: [
          {
            role: 'user',
            content: `Predict crisis escalation for: "${eventDescription}"
            
Return probability (0-100), timeline, and impacts as JSON.`,
          },
        ],
        max_tokens: 500,
      }),
    });

    const data = (await response.json()) as any;
    const content = data.choices[0].message.content;

    return {
      provider: 'openrouter',
      content,
      cost: 0.0002,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.warn('⚠️  OpenRouter failed, returning mock prediction...');
    
    // Mock fallback response
    const mockContent = JSON.stringify({
      escalationProbability: 68,
      timeline: '14-30 days',
      mostLikelyOutcomes: [
        'Regional military escalation',
        'Economic sanctions',
        'International diplomatic crisis',
      ],
      marketImpacts: {
        oil: '+15-25% spike',
        stocks: '-3-5% correction',
        supplyChains: 'Moderate disruption',
      },
      confidence: 65,
    });

    return {
      provider: 'mock',
      content: mockContent,
      cost: 0,
      timestamp: Date.now(),
    };
  }
}

/**
 * Get cache stats
 */
export function getCacheStats() {
  return {
    size: aiCache.size,
    entries: Array.from(aiCache.keys()),
  };
}

/**
 * Clear cache manually
 */
export function clearCache() {
  const oldSize = aiCache.size;
  aiCache.clear();
  console.log(`🗑️ Cleared ${oldSize} cached AI results`);
}
