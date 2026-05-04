import { NextResponse } from 'next/server';
import { alertManager } from '@/lib/alerts/alertManager';

export async function GET() {
  try {
    const alerts = alertManager.getAlerts();
    const events = alertManager.getEvents();
    
    return NextResponse.json({
      alerts,
      events,
      totalEvents: events.length,
      unacknowledgedEvents: events.filter(e => !e.acknowledged).length
    });
  } catch (error) {
    console.error('❌ Error fetching alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, alertId, eventId, updates } = body;
    
    if (action === 'acknowledge' && eventId) {
      alertManager.acknowledgeEvent(eventId);
      return NextResponse.json({ success: true });
    }
    
    if (action === 'update' && alertId && updates) {
      alertManager.updateAlert(alertId, updates);
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('❌ Error processing alert action:', error);
    return NextResponse.json(
      { error: 'Failed to process action' },
      { status: 500 }
    );
  }
}
