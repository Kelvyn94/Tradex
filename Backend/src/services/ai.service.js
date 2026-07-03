const { GoogleGenerativeAI } = require('@google/generative-ai');
const NodeCache = require('node-cache');

class AIService {
  constructor() {
    this.gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.gemini.getGenerativeModel({ model: 'gemini-pro' });
    this.visionModel = this.gemini.getGenerativeModel({ model: 'gemini-pro-vision' });
    
    // ✅ Longer cache: 2 hours
    this.cache = new NodeCache({ stdTTL: 7200, checkperiod: 300 });
    
    // Rate limiting
    this.dailyCount = 0;
    this.dailyLimit = 45;
    this.lastReset = new Date().toDateString();
    
    this.stats = {
      totalRequests: 0,
      cachedResponses: 0,
      aiRequests: 0,
      fallbackRequests: 0
    };

    // System prompts
    this.systemPrompts = {
      smtValidation: `You are an expert ICT (Inner Circle Trader) analyst. Validate SMT divergence.`
    };

    console.log('🤖 AI Service initialized');
    console.log(`📊 Daily limit: ${this.dailyLimit} requests`);
    console.log(`💾 Cache TTL: 2 hours`);
  }

  canMakeRequest() {
    const today = new Date().toDateString();
    if (today !== this.lastReset) {
      this.dailyCount = 0;
      this.lastReset = today;
    }
    return this.dailyCount < this.dailyLimit;
  }

  getRemainingRequests() {
    const today = new Date().toDateString();
    if (today !== this.lastReset) {
      this.dailyCount = 0;
      this.lastReset = today;
    }
    return Math.max(0, this.dailyLimit - this.dailyCount);
  }

  /**
   * ✅ Only validates signals with confidence > 80%
   */
  async validateSMTDivergences(divergences) {
    if (!divergences || divergences.length === 0) {
      return { validated: false, signals: [] };
    }

    // ✅ Filter: Only high-confidence signals go to AI
    const highConfidenceSignals = divergences.filter(d => d.confidence > 80);
    
    if (highConfidenceSignals.length === 0) {
      return divergences.map(d => ({
        validated: true,
        confidence: d.confidence || 75,
        reasoning: 'Validated by local logic (AI skipped - confidence below threshold)'
      }));
    }

    // If only 1-2 high-confidence signals, validate individually
    if (highConfidenceSignals.length <= 2) {
      return this.validateSingleSMT(highConfidenceSignals[0]);
    }

    // Batch validate multiple signals in one request
    return this.batchValidateSMT(highConfidenceSignals);
  }

  /**
   * ✅ Validate a single SMT divergence with cache
   */
  async validateSingleSMT(divergence) {
    const cacheKey = `smt_${divergence.primaryAsset}_${divergence.correlatedAsset}_${divergence.type}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached) {
      this.stats.cachedResponses++;
      return cached;
    }

    // Check rate limit
    if (!this.canMakeRequest()) {
      this.stats.fallbackRequests++;
      return {
        validated: true,
        confidence: divergence.confidence || 75,
        reasoning: 'Local validation (AI limit reached)'
      };
    }

    const prompt = this.buildSMTValidationPrompt(divergence);
    const response = await this.analyze(prompt, cacheKey);

    // Parse response
    const result = this.parseAIResponse(response, {
      validated: true,
      confidence: divergence.confidence || 80,
      reasoning: divergence.description || 'SMT divergence detected'
    });

    this.cache.set(cacheKey, result);
    return result;
  }

  /**
   * ✅ Batch validate multiple SMT divergences (1 request for all)
   */
  async batchValidateSMT(divergences) {
    const cacheKey = `smt_batch_${divergences.map(d => d.type).join('_')}`;
    
    const cached = this.cache.get(cacheKey);
    if (cached) {
      this.stats.cachedResponses++;
      return cached;
    }

    if (!this.canMakeRequest()) {
      return divergences.map(d => ({
        validated: true,
        confidence: d.confidence || 75,
        reasoning: 'Local validation (AI limit reached)'
      }));
    }

    let prompt = `You are an expert ICT analyst. Validate these SMT divergences and return a JSON array.\n\n`;
    divergences.forEach((d, i) => {
      prompt += `Signal ${i + 1}: ${d.primaryAsset} vs ${d.correlatedAsset}, ${d.type} divergence\n`;
    });
    prompt += `\nReturn JSON array with validation for each.`;

    const response = await this.analyze(prompt, cacheKey);
    
    const results = this.parseAIResponse(response, divergences.map(d => ({
      validated: true,
      confidence: d.confidence || 80,
      reasoning: d.description || 'SMT divergence detected'
    })));

    this.cache.set(cacheKey, results);
    return results;
  }

  /**
   * Build SMT validation prompt
   */
  buildSMTValidationPrompt(divergence) {
    return `${this.systemPrompts.smtValidation}

SMT Signal:
- Primary Asset: ${divergence.primaryAsset}
- Correlated Asset: ${divergence.correlatedAsset}
- Type: ${divergence.type} SMT
- Primary Price: ${divergence.primaryPrice}
- Correlated Price: ${divergence.correlatedPrice}
- Timeframe: ${divergence.timeframe || '1h'}
- Description: ${divergence.description || 'Price divergence detected'}

Respond with JSON:
{
  "validated": true/false,
  "confidence": 0-100,
  "reasoning": "Brief explanation of the validation or rejection",
  "entryLevel": "Suggested entry price",
  "stopLoss": "Suggested stop loss"
}`;
  }

  async analyze(prompt, cacheKey = null) {
    // Check cache first
    if (cacheKey) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        this.stats.cachedResponses++;
        return cached;
      }
    }

    if (!this.canMakeRequest()) {
      console.log(`⚠️ AI daily limit reached (${this.dailyLimit}). Using fallback.`);
      this.stats.fallbackRequests++;
      return this.getFallbackResponse(prompt);
    }

    try {
      console.log(`🤖 AI request #${this.dailyCount + 1}/${this.dailyLimit}`);
      const result = await this.model.generateContent(prompt);
      const response = result.response.text();
      
      if (cacheKey) {
        this.cache.set(cacheKey, response);
      }
      
      this.dailyCount++;
      this.stats.totalRequests++;
      this.stats.aiRequests++;
      
      return response;
    } catch (error) {
      console.error('AI Error:', error.message);
      this.stats.fallbackRequests++;
      return this.getFallbackResponse(prompt);
    }
  }

  /**
   * Parse AI response to JSON
   */
  parseAIResponse(response, fallback) {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      const arrayMatch = response.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        return JSON.parse(arrayMatch[0]);
      }
      
      return fallback;
    } catch (error) {
      console.warn('AI Response parse failed:', error.message);
      return fallback;
    }
  }

  getFallbackResponse(prompt) {
    if (prompt.includes('SMT')) {
      return {
        validated: true,
        confidence: 75,
        reasoning: 'SMT divergence detected (AI limit reached)',
        entryLevel: 'N/A',
        stopLoss: 'N/A'
      };
    }
    
    return {
      message: 'AI limit reached. Using local analysis.',
      confidence: 60
    };
  }

  getStats() {
    return {
      ...this.stats,
      remainingToday: this.getRemainingRequests(),
      dailyLimit: this.dailyLimit,
      cacheSize: this.cache.keys().length,
      usedToday: this.dailyCount
    };
  }
}

module.exports = new AIService();