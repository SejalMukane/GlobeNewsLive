/**
 * Telegram Test API
 * Quick endpoint to verify Telegram bot is working
 * No analysis or verification needed
 */

import { NextResponse } from 'next/server';

export async function GET() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    return NextResponse.json({
      success: false,
      error: 'Telegram credentials not configured',
      config: {
        botToken: botToken ? '✅ Set' : '❌ Missing',
        chatId: chatId ? '✅ Set' : '❌ Missing',
      },
    }, { status: 400 });
  }

  try {
    console.log('🧪 Testing Telegram bot...');

    const testMessage = `🧪 Telegram Bot Test\n\n` +
      `✅ Bot is working correctly\n` +
      `⏰ Time: ${new Date().toISOString()}\n` +
      `🔑 Bot Token: ${botToken.substring(0, 10)}...\n` +
      `💬 Chat ID: ${chatId}\n\n` +
      `This is a test message from GlobeNews Live OSINT system`;

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: testMessage,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      console.error('❌ Telegram test failed:', data);
      return NextResponse.json({
        success: false,
        error: data.description || 'Unknown Telegram error',
        details: data,
      }, { status: 500 });
    }

    console.log('✅ Telegram test message sent successfully');

    return NextResponse.json({
      success: true,
      message: 'Test message sent to Telegram',
      telegramResponse: {
        messageId: data.result?.message_id,
        chatId: data.result?.chat?.id,
        date: data.result?.date,
      },
      config: {
        botToken: `${botToken.substring(0, 10)}...`,
        chatId,
      },
    });

  } catch (error: any) {
    console.error('❌ Telegram test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to send test message',
    }, { status: 500 });
  }
}
