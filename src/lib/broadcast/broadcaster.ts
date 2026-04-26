/**
 * Twitter Auto-Broadcast Service
 * Posts critical verified events to Twitter automatically
 */

interface BroadcastEvent {
  id?: string;
  title: string;
  description: string;
  location: string;
  severity: string;
  type: string;
  txHash: string;
  explorerLink: string;
  timestamp: string;
}

/**
 * Broadcast verified event to Twitter
 * Only posts if Twitter credentials are configured
 */
export async function broadcastEvent(event: BroadcastEvent): Promise<void> {
  console.log(`📢 Broadcasting event: ${event.title}`);

  try {
    await broadcastToTwitter(event);
  } catch (error) {
    console.error('❌ Broadcasting error:', error);
  }
}

/**
 * Post to Twitter Bot Account
 */
async function broadcastToTwitter(event: BroadcastEvent): Promise<void> {
  const apiKey = process.env.TWITTER_API_KEY;
  const apiSecret = process.env.TWITTER_API_SECRET;
  const accessToken = process.env.TWITTER_ACCESS_TOKEN;
  const accessTokenSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET;
  const bearerToken = process.env.TWITTER_BEARER_TOKEN;

  // Debug: Log what we have
  console.log('🔍 Twitter Auth Debug:');
  console.log('  OAuth 1.0:', !!(apiKey && apiSecret && accessToken && accessTokenSecret) ? '✅' : '❌');
  console.log('  Bearer Token:', bearerToken ? '✅' : '❌');

  // Skip if not configured
  if (!apiKey || !apiSecret || !accessToken || !accessTokenSecret) {
    console.log('⏭️  Twitter credentials not configured, skipping broadcast');
    return;
  }

  try {
    // Dynamic import to avoid issues
    const { TwitterApi } = await import('twitter-api-v2');

    // Construct tweet
    const tweetText = formatTwitterMessage(event);

    // Try OAuth 1.0 first (standard approach)
    if (apiKey && apiSecret && accessToken && accessTokenSecret) {
      try {
        console.log('📤 Attempting OAuth 1.0 authentication...');
        const client = new TwitterApi({
          appKey: apiKey,
          appSecret: apiSecret,
          accessToken: accessToken,
          accessSecret: accessTokenSecret,
        });

        const rwClient = client.readWrite;
        const result = await rwClient.v2.tweet(tweetText);

        console.log(`✅ Twitter broadcast sent - Tweet ID: ${result.data.id}`);
        console.log(`📱 Posted to Twitter: ${tweetText.substring(0, 50)}...`);
        return;
      } catch (oauth1Error) {
        const oauth1Msg = oauth1Error instanceof Error ? oauth1Error.message : String(oauth1Error);
        console.warn(`⚠️  OAuth 1.0 failed: ${oauth1Msg}`);

        // Check if it's a 402 or auth error
        if (oauth1Msg.includes('402') || oauth1Msg.includes('Unauthorized') || oauth1Msg.includes('Forbidden')) {
          console.log('💡 Tip: Ensure your Twitter app has "Read and Write" permissions.');
          console.log('💡 Tip: API access tier may need to be elevated to Essential or higher.');
        }

        // Try Bearer Token as fallback if available
        if (!bearerToken) {
          console.error('❌ No Bearer Token available for fallback');
          throw oauth1Error;
        }
      }
    }

    // Fallback: Use Bearer Token (OAuth 2.0)
    if (bearerToken) {
      try {
        console.log('🔄 Falling back to Bearer Token authentication...');
        const { TwitterApi } = await import('twitter-api-v2');
        const client = new TwitterApi(bearerToken);
        
        const result = await client.v2.tweet(tweetText);
        console.log(`✅ Twitter broadcast sent via Bearer Token - Tweet ID: ${result.data.id}`);
        console.log(`📱 Posted to Twitter: ${tweetText.substring(0, 50)}...`);
        return;
      } catch (bearerError) {
        const bearerMsg = bearerError instanceof Error ? bearerError.message : String(bearerError);
        console.error('❌ Bearer Token broadcast also failed:', bearerMsg);
        throw bearerError;
      }
    }

    throw new Error('No valid Twitter authentication method available');
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ Twitter broadcast failed:', errorMsg);
    
    // Log helpful debugging info
    if (errorMsg.includes('402')) {
      console.error('❌ Error 402: Payment Required');
      console.error('   Possible causes:');
      console.error('   1. Free tier API lacks v2 write access');
      console.error('   2. Upgrade to Essential tier at https://developer.twitter.com/en/portal/dashboard');
    }
  }
}

/**
 * Format message for Twitter (280 char limit)
 */
function formatTwitterMessage(event: BroadcastEvent): string {
  const shortDesc = event.description.substring(0, 100).trim();

  return `🔗 BLOCKCHAIN VERIFIED

🚨 ${event.title}
📍 ${event.location}

${shortDesc}...

✅ Proof: ${event.explorerLink}

#CrisisIntelligence #Blockchain #Verified`;
}

/**
 * Get event summary for logging
 */
export function getEventSummary(event: BroadcastEvent): string {
  return `
📌 Event: ${event.title}
📍 Location: ${event.location}
🚨 Severity: ${event.severity}
🔗 TxHash: ${event.txHash.substring(0, 16)}...
  `;
}
