/**
 * Telegram Notification Service
 * 
 * Sends critical OSINT events with AI analysis to Telegram
 * Only sends CRITICAL severity events
 */

interface OSINTEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  credibility: number;
  ai_analysis?: string;
  verified?: boolean;
  txHash?: string;
  explorer?: string;
  sources?: string[];
  timestamp?: string;
}

interface AIAnalysis {
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

function parseAIAnalysis(aiAnalysis?: string): AIAnalysis | null {
  if (!aiAnalysis) return null;
  try {
    return typeof aiAnalysis === 'string' ? JSON.parse(aiAnalysis) : aiAnalysis;
  } catch {
    return null;
  }
}

function escapeMarkdown(text: string): string {
  return text
    .replace(/-/g, '\\-')
    .replace(/_/g, '\\_')
    .replace(/\*/g, '\\*')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/~/g, '\\~')
    .replace(/`/g, '\\`')
    .replace(/>/g, '\\>')
    .replace(/#/g, '\\#')
    .replace(/\+/g, '\\+')
    .replace(/=/g, '\\=')
    .replace(/\|/g, '\\|')
    .replace(/{/g, '\\{')
    .replace(/}/g, '\\}')
    .replace(/!/g, '\\!')
    .replace(/\./g, '\\.');
}

function formatMessage(event: OSINTEvent): string {
  const ai = parseAIAnalysis(event.ai_analysis);
  
  let message = `🔴 *CRITICAL ALERT* 🔴\n\n`;
  
  // Title and Location
  message += `📰 *${escapeMarkdown(event.title)}*\n`;
  message += `📍 Location: ${escapeMarkdown(event.location)}\n`;
  message += `📊 Credibility: ${event.credibility}%\n`;
  message += `⏰ Time: ${event.timestamp || new Date().toISOString()}\n\n`;
  
  // Description
  message += `📝 *Description:*\n${escapeMarkdown(event.description.substring(0, 300))}\n\n`;
  
  // AI Analysis
  if (ai) {
    message += `🧠 *AI Analysis (Groq Mixtral)*\n\n`;
    
    // Escalation Probability
    const prob = ai.escalation_probability;
    const probEmoji = prob >= 70 ? '🔴' : prob >= 50 ? '🟠' : '🟡';
    message += `${probEmoji} *Escalation Probability:* ${prob}%\n`;
    message += `⏱️ *Timeline:* ${escapeMarkdown(ai.timeline)}\n\n`;
    
    // Root Cause
    message += `🔍 *Root Cause:*\n${escapeMarkdown(ai.root_cause)}\n\n`;
    
    // Key Stakeholders
    if (ai.stakeholders && ai.stakeholders.length > 0) {
      message += `🎯 *Key Stakeholders:*\n`;
      ai.stakeholders.slice(0, 5).forEach((stakeholder) => {
        message += `• ${escapeMarkdown(stakeholder)}\n`;
      });
      message += `\n`;
    }
    
    // Causal Chain
    if (ai.causal_chain && ai.causal_chain.length > 0) {
      message += `🔗 *Causal Chain:*\n`;
      ai.causal_chain.slice(0, 4).forEach((step, idx) => {
        message += `${idx + 1}\. ${escapeMarkdown(step)}\n`;
      });
      message += `\n`;
    }
    
    // Market Impact
    if (ai.market_impact) {
      message += `💹 *Market Impact:*\n`;
      message += `🛢️ Oil: ${escapeMarkdown(ai.market_impact.oil)}\n`;
      message += `📈 Stocks: ${escapeMarkdown(ai.market_impact.stocks)}\n`;
      message += `₿ Crypto: ${escapeMarkdown(ai.market_impact.crypto)}\n`;
      message += `📊 Bonds: ${escapeMarkdown(ai.market_impact.bonds)}\n\n`;
    }
  }
  
  // Blockchain Verification
  if (event.verified && event.txHash) {
    message += `✅ *Blockchain Verified*\n`;
    message += `🔗 Hash: \`${event.txHash}\`\n`;
    if (event.explorer) {
      message += `🔍 [View on Explorer](${event.explorer})\n`;
    }
    message += `\n`;
  }
  
  // Sources
  if (event.sources && event.sources.length > 0) {
    message += `📚 *Sources:* ${event.sources.map(s => escapeMarkdown(s)).join(', ')}\n`;
  }
  
  return message;
}

/**
 * Send critical event to Telegram
 */
export async function sendCriticalEventToTelegram(event: OSINTEvent): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  
  if (!botToken || !chatId) {
    console.warn('⚠️ Telegram credentials not configured, skipping notification');
    return false;
  }
  
  // Only send CRITICAL events
  if (event.severity !== 'CRITICAL') {
    return false;
  }
  
  try {
    console.log(`📨 Sending critical event to Telegram: ${event.title}`);
    
    const message = formatMessage(event);
    
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        disable_web_page_preview: true,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Telegram API error:', errorData);
      return false;
    }
    
    console.log('✅ Critical event sent to Telegram successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Failed to send Telegram notification:', error);
    return false;
  }
}

/**
 * Send alert to Telegram
 */
export async function sendAlertToTelegram(title: string, message: string, severity: 'info' | 'warning' | 'critical'): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  
  if (!botToken || !chatId) {
    console.warn('⚠️ Telegram credentials not configured');
    return false;
  }

  const severityEmoji = {
    'info': '📊',
    'warning': '⚠️',
    'critical': '🚨'
  };

  const formattedMessage = `${severityEmoji[severity]} *${title}*\n\n${message}`;

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: formattedMessage,
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      }),
    });

    if (!response.ok) {
      console.error('❌ Telegram API error:', await response.json());
      return false;
    }

    console.log(`✅ Alert sent to Telegram: ${title}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send alert:', error);
    return false;
  }
}

export class TelegramNotificationService {
  private botToken: string;
  private chatId: string;

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || '';
    this.chatId = process.env.TELEGRAM_CHAT_ID || '';
  }

  async sendAlert(title: string, message: string, severity: 'info' | 'warning' | 'critical'): Promise<boolean> {
    return sendAlertToTelegram(title, message, severity);
  }

  async sendCriticalEventToTelegram(event: OSINTEvent): Promise<boolean> {
    return sendCriticalEventToTelegram(event);
  }
}
