/**
 * Test script to verify Groq API key is working
 * Run: npx tsx test-groq.ts
 */

import { Groq } from 'groq-sdk';

async function testGroqAPI() {
  console.log('🔍 Testing Groq API...\n');

  // 1. Check if API key exists
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey) {
    console.error('❌ GROQ_API_KEY is NOT set in environment');
    console.log('\n💡 To fix:');
    console.log('   1. Create .env.local file in project root');
    console.log('   2. Add: GROQ_API_KEY=gsk_your_actual_key_here');
    console.log('   3. Restart the dev server');
    process.exit(1);
  }

  console.log('✅ GROQ_API_KEY found');
  console.log(`   Key prefix: ${apiKey.substring(0, 10)}...`);
  console.log(`   Key length: ${apiKey.length} chars`);
  
  if (!apiKey.startsWith('gsk_')) {
    console.error('❌ Key format is wrong - Groq keys must start with "gsk_"');
    process.exit(1);
  }

  // 2. Test API call
  try {
    console.log('\n🚀 Making test API call...');
    
    const groq = new Groq({ apiKey });
    
    const startTime = Date.now();
    const response = await groq.chat.completions.create({
      model: 'mixtral-8x7b-32768',
      max_tokens: 100,
      temperature: 0.2,
      messages: [
        { 
          role: 'user', 
          content: 'Say "Groq API is working" and nothing else.' 
        }
      ],
    });
    
    const duration = Date.now() - startTime;
    
    console.log(`✅ API call successful in ${duration}ms`);
    console.log(`   Response: "${response.choices[0].message.content?.trim()}"`);
    console.log(`   Model: ${response.model}`);
    console.log(`   Usage: ${JSON.stringify(response.usage)}`);
    
    console.log('\n🎉 Your Groq API key is VALID and working!');
    
  } catch (error: any) {
    console.error('\n❌ API call failed:');
    
    if (error.status === 401) {
      console.error('   Error: Invalid API Key (401)');
      console.log('\n💡 Possible fixes:');
      console.log('   1. Check if the key is copied correctly (no extra spaces)');
      console.log('   2. Generate a new key from https://console.groq.com/keys');
      console.log('   3. Ensure the key has not been revoked');
    } else if (error.status === 429) {
      console.error('   Error: Rate limit exceeded (429)');
      console.log('\n💡 Wait a minute and try again');
    } else {
      console.error(`   Error: ${error.message}`);
    }
    
    process.exit(1);
  }
}

testGroqAPI();
