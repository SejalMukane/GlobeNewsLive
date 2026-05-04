/**
 * Groq AI Analysis Service
 * 
 * Provides structured intelligence analysis for OSINT events using Groq API
 * Fast, cheap, and reliable with Mixtral/Llama models
 */

import { Groq } from 'groq-sdk';

// ─── Types ─────────────────────────────────────────────────────────

export interface SignalInput {
  title: string;
  description: string;
  category: string;
  region: string;
  actors?: string[];
}

export interface AIAnalysisResult {
  root_cause: string;
  causal_chain: string[];
  stakeholders: string[];
  escalation_probability: number;
  timeline: string;
  market_impact: {
    oil: string;
    stocks: string;
    crypto: string;
    bonds: string;
  };
}

// ─── Configuration ─────────────────────────────────────────────────

const MODEL_NAME = "llama-3.1-8b-instant"; // Fast, cheap, good for structured output
const MAX_TOKENS = 1024;

// ─── Multi-Key Rotation Manager ────────────────────────────────────

class GroqKeyManager {
  private keys: string[] = [];
  private currentIndex: number = 0;
  private failedKeys: Set<number> = new Set();

  constructor() {
    this.loadKeys();
  }

  private loadKeys(): void {
    // Load all GROQ_API_KEY_* variables (primary method)
    for (let i = 1; i <= 10; i++) {
      const key = process.env[`GROQ_API_KEY_${i}`];
      if (key && key.startsWith('gsk_')) {
        this.keys.push(key);
      }
    }

    // Only check legacy GROQ_API_KEY if no numbered keys found
    if (this.keys.length === 0) {
      const legacyKey = process.env.GROQ_API_KEY;
      if (legacyKey && legacyKey.startsWith('gsk_')) {
        this.keys.push(legacyKey);
      }
    }

    if (this.keys.length === 0) {
      throw new Error(
        'No valid Groq API keys found. Set GROQ_API_KEY_1 through GROQ_API_KEY_10 (or GROQ_API_KEY as fallback)'
      );
    }

    console.log(`🔑 Loaded ${this.keys.length} Groq API keys for rotation`);
  }

  getCurrentKey(): string {
    if (this.failedKeys.size >= this.keys.length) {
      // All keys failed, reset and try again after cooldown
      console.warn('⚠️ All Groq keys failed, resetting rotation...');
      this.failedKeys.clear();
      this.currentIndex = 0;
    }

    // Find next working key
    while (this.failedKeys.has(this.currentIndex)) {
      this.currentIndex = (this.currentIndex + 1) % this.keys.length;
    }

    return this.keys[this.currentIndex];
  }

  markCurrentKeyFailed(): void {
    console.warn(`❌ Key ${this.currentIndex + 1}/${this.keys.length} failed (rate limit or error)`);
    this.failedKeys.add(this.currentIndex);
    
    // Move to next key
    this.currentIndex = (this.currentIndex + 1) % this.keys.length;
    
    if (this.failedKeys.size < this.keys.length) {
      console.log(`🔄 Switching to key ${this.currentIndex + 1}/${this.keys.length}`);
    }
  }

  getKeyStats(): { total: number; failed: number; active: number } {
    return {
      total: this.keys.length,
      failed: this.failedKeys.size,
      active: this.keys.length - this.failedKeys.size,
    };
  }
}

// Global key manager instance
const keyManager = new GroqKeyManager();

function getGroqClient(): Groq {
  const apiKey = keyManager.getCurrentKey();
  return new Groq({ apiKey });
}

// ─── Cache ─────────────────────────────────────────────────────────

interface CacheEntry {
  result: AIAnalysisResult;
  timestamp: number;
}

const analysisCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

function getCacheKey(signal: SignalInput): string {
  const normalized = `${signal.title.trim().toLowerCase().substring(0, 80)}|${signal.category}|${signal.region}`;
  return normalized;
}

function getCachedAnalysis(signal: SignalInput): AIAnalysisResult | null {
  const key = getCacheKey(signal);
  const cached = analysisCache.get(key);
  if (!cached) return null;

  const age = Date.now() - cached.timestamp;
  if (age > CACHE_TTL_MS) {
    analysisCache.delete(key);
    return null;
  }

  console.log(`♻️ AI cache hit for: ${signal.title.substring(0, 50)}...`);
  return cached.result;
}

function cacheAnalysis(signal: SignalInput, result: AIAnalysisResult): void {
  const key = getCacheKey(signal);
  analysisCache.set(key, { result, timestamp: Date.now() });
  console.log(`📝 AI cached (${analysisCache.size} entries)`);
}

// ─── Prompt Engineering ────────────────────────────────────────────

function buildAnalysisPrompt(signal: SignalInput): string {
  const actorsText = signal.actors?.length 
    ? `Known actors: ${signal.actors.join(', ')}` 
    : '';

  return `You are an elite geopolitical intelligence analyst. Analyze this event with extreme precision and return ONLY valid JSON.

EVENT DATA:
Title: ${signal.title}
Description: ${signal.description}
Category: ${signal.category}
Region: ${signal.region}
${actorsText}

TASK: Produce structured intelligence analysis.

RULES:
- Be specific and actionable — no vague statements
- Use real-world geopolitical knowledge
- Escalation probability must be evidence-based (0-100)
- Timeline must be realistic given the event type
- Market impacts must reference specific sectors/commodities
- Causal chain must show step-by-step escalation logic
- Stakeholders must be named entities (countries, organizations, corporations)

REQUIRED JSON FORMAT (strict — no markdown, no code blocks, no explanation):
{"root_cause":"The immediate geopolitical trigger or structural cause (1-2 sentences)","causal_chain":["Step 1: Immediate trigger/action","Step 2: Regional response/reaction","Step 3: International involvement or market reaction","Step 4: Potential further escalation or resolution path"],"stakeholders":["Primary actor and their strategic interest","Secondary actor and their strategic interest","Affected regional power and their concern","Global power with vested interest","International organization involved"],"escalation_probability":75,"timeline":"24-48 hours or 3-7 days or 1-2 weeks","market_impact":{"oil":"Specific impact on oil prices with percentage range or direction","stocks":"Specific impact on equity markets by region/sector","crypto":"Impact on Bitcoin and major cryptocurrencies","bonds":"Impact on government bonds and safe-haven flows"}}`;
}

// ─── Response Parsing ──────────────────────────────────────────────

function sanitizeJSON(text: string): string {
  let cleaned = text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/gi, '')
    .trim();
  
  const startIdx = cleaned.indexOf('{');
  const endIdx = cleaned.lastIndexOf('}');
  
  if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
    throw new Error('No valid JSON object found in response');
  }
  
  return cleaned.substring(startIdx, endIdx + 1);
}

function validateAnalysisResult(parsed: any): AIAnalysisResult {
  return {
    root_cause: typeof parsed.root_cause === 'string' ? parsed.root_cause : 'Analysis pending',
    causal_chain: Array.isArray(parsed.causal_chain) 
      ? parsed.causal_chain.filter((s: any) => typeof s === 'string')
      : ['Event detected', 'Regional monitoring activated', 'International response forming'],
    stakeholders: Array.isArray(parsed.stakeholders)
      ? parsed.stakeholders.filter((s: any) => typeof s === 'string')
      : ['Regional powers', 'Global markets'],
    escalation_probability: typeof parsed.escalation_probability === 'number'
      ? Math.max(0, Math.min(100, Math.round(parsed.escalation_probability)))
      : 50,
    timeline: typeof parsed.timeline === 'string' ? parsed.timeline : '3-7 days',
    market_impact: {
      oil: parsed.market_impact?.oil || 'Monitoring required',
      stocks: parsed.market_impact?.stocks || 'Monitoring required',
      crypto: parsed.market_impact?.crypto || 'Monitoring required',
      bonds: parsed.market_impact?.bonds || 'Monitoring required',
    },
  };
}

// ─── Main Analysis Function ────────────────────────────────────────

export async function analyzeEvent(signal: SignalInput): Promise<AIAnalysisResult> {
  const startTime = Date.now();

  const cached = getCachedAnalysis(signal);
  if (cached) return cached;

  if (!signal.title || !signal.description) {
    console.warn('⚠️ Incomplete signal data, returning fallback analysis');
    return getFallbackAnalysis();
  }

  // Try with key rotation (max retries = number of keys)
  const maxRetries = keyManager.getKeyStats().total;
  let lastError: any;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const keyStats = keyManager.getKeyStats();
      console.log(`🚀 Groq: Analyzing "${signal.title.substring(0, 60)}..." (key ${attempt + 1}/${maxRetries})`);

      const groq = getGroqClient();
      const prompt = buildAnalysisPrompt(signal);

      const message = await groq.chat.completions.create({
        model: MODEL_NAME,
        max_tokens: MAX_TOKENS,
        temperature: 0.2,
        messages: [{ role: 'user', content: prompt }],
      });

      const text = message.choices[0].message.content || '';
      const jsonStr = sanitizeJSON(text);
      const parsed = JSON.parse(jsonStr);
      const analysis = validateAnalysisResult(parsed);

      cacheAnalysis(signal, analysis);

      const duration = Date.now() - startTime;
      console.log(`✅ Groq: Analysis complete in ${duration}ms | Escalation: ${analysis.escalation_probability}%`);

      return analysis;

    } catch (error: any) {
      lastError = error;
      
      // Check if it's a rate limit error (429)
      if (error.status === 429 || 
          (error.error?.code === 'rate_limit_exceeded') ||
          (error.message && error.message.includes('rate limit'))) {
        console.warn(`⚠️ Rate limit hit on key ${attempt + 1}, rotating...`);
        keyManager.markCurrentKeyFailed();
        
        // Small delay before retry
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } else {
        // Non-rate-limit error, don't retry
        console.error('❌ Groq analysis failed (non-retryable):', error.message || error);
        break;
      }
    }
  }

  // All keys exhausted or non-retryable error
  console.error('❌ All Groq keys failed or non-retryable error:', lastError?.message || lastError);
  const fallback = getFallbackAnalysis(signal);
  console.log(`⚠️ Fallback analysis returned in ${Date.now() - startTime}ms`);
  return fallback;
}

// ─── Batch Analysis ────────────────────────────────────────────────

export async function analyzeEventsBatch(
  signals: SignalInput[],
  concurrency: number = 5
): Promise<AIAnalysisResult[]> {
  console.log(`🔄 Batch analyzing ${signals.length} events (concurrency: ${concurrency})`);

  const results: AIAnalysisResult[] = [];

  for (let i = 0; i < signals.length; i += concurrency) {
    const batch = signals.slice(i, i + concurrency);
    const batchPromises = batch.map(signal => analyzeEvent(signal));
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }

  console.log(`✅ Batch analysis complete: ${results.length} events processed`);
  return results;
}

// ─── Fallback Analysis ─────────────────────────────────────────────

function getFallbackAnalysis(signal?: SignalInput): AIAnalysisResult {
  const title = signal?.title?.toLowerCase() || '';
  const category = signal?.category?.toLowerCase() || '';

  if (title.includes('military') || title.includes('attack') || category.includes('military')) {
    return {
      root_cause: 'Military escalation or force deployment detected',
      causal_chain: [
        'Military mobilization or strike initiated',
        'Regional defense forces placed on alert',
        'International diplomatic channels activated',
        'Potential for broader regional conflict assessed',
      ],
      stakeholders: [
        'Attacking nation — strategic objectives',
        'Defending nation — territorial integrity',
        'Regional allies — mutual defense obligations',
        'UN/NATO — crisis mediation',
        'Global powers — strategic interest protection',
      ],
      escalation_probability: 70,
      timeline: '24-48 hours',
      market_impact: {
        oil: '+5-12% (supply disruption risk)',
        stocks: '-2-5% (risk-off sentiment)',
        crypto: '+3-8% (safe-haven flows)',
        bonds: 'Flight to safety (US Treasuries, German Bunds)',
      },
    };
  }

  if (title.includes('sanction') || title.includes('economic') || category.includes('economy')) {
    return {
      root_cause: 'Economic coercion or trade restriction measure',
      causal_chain: [
        'Sanctions or trade restrictions announced',
        'Targeted economy begins adaptation measures',
        'Global supply chains reassess routes',
        'Markets price in long-term economic impact',
      ],
      stakeholders: [
        'Imposing nation — foreign policy leverage',
        'Sanctioned nation — economic survival',
        'Multinational corporations — compliance costs',
        'Trading partners — secondary impact',
        'IMF/World Bank — stabilization role',
      ],
      escalation_probability: 45,
      timeline: '3-7 days',
      market_impact: {
        oil: '±2-3% (demand uncertainty)',
        stocks: '-1-3% (sector-specific impact)',
        crypto: 'Neutral to slightly negative',
        bonds: 'Increased demand for safe havens',
      },
    };
  }

  if (title.includes('cyber') || category.includes('cyber')) {
    return {
      root_cause: 'Cyber operation targeting critical infrastructure or data',
      causal_chain: [
        'Initial breach or attack vector deployed',
        'Defensive measures and investigation initiated',
        'Attribution analysis by intelligence agencies',
        'Potential retaliatory or diplomatic response',
      ],
      stakeholders: [
        'Attacking actor — intelligence or disruption goals',
        'Targeted entity — operational recovery',
        'Cybersecurity firms — incident response',
        'Government agencies — national security',
        'Insurance sector — claims assessment',
      ],
      escalation_probability: 35,
      timeline: '3-7 days',
      market_impact: {
        oil: 'Minimal direct impact',
        stocks: '-1-2% (cybersecurity sector positive)',
        crypto: 'Potential volatility if exchanges targeted',
        bonds: 'Minimal impact',
      },
    };
  }

  return {
    root_cause: 'Geopolitical development requiring monitoring',
    causal_chain: [
      'Event reported and initial assessment underway',
      'Regional actors evaluate strategic implications',
      'International community monitors situation',
      'Outcome depends on diplomatic and military responses',
    ],
    stakeholders: [
      'Regional powers — direct impact assessment',
      'Global powers — strategic interest evaluation',
      'International organizations — mediation potential',
      'Markets — risk pricing adjustment',
    ],
    escalation_probability: 40,
    timeline: '3-7 days',
    market_impact: {
      oil: 'Monitoring required',
      stocks: 'Monitoring required',
      crypto: 'Monitoring required',
      bonds: 'Monitoring required',
    },
  };
}

// ─── Cache Utilities ───────────────────────────────────────────────

export function getAnalysisCacheStats(): { size: number; entries: string[] } {
  return {
    size: analysisCache.size,
    entries: Array.from(analysisCache.keys()).map(k => k.substring(0, 60)),
  };
}

export function clearAnalysisCache(): void {
  analysisCache.clear();
  console.log('🗑️ AI analysis cache cleared');
}
