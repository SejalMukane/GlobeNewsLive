import { sendAlertToTelegram } from '@/lib/notifications/telegram';

interface AlertConfig {
  id: string;
  name: string;
  type: 'threshold' | 'new_test' | 'success_rate_drop' | 'weekly_report';
  country: string;
  enabled: boolean;
  threshold?: number;
  condition?: 'above' | 'below';
  lastTriggered?: Date;
}

interface AlertEvent {
  id: string;
  alertId: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: Date;
  acknowledged: boolean;
}

class AlertManager {
  private alerts: AlertConfig[] = [];
  private events: AlertEvent[] = [];
  private checkInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.loadDefaultAlerts();
  }

  private loadDefaultAlerts() {
    this.alerts = [
      {
        id: 'nk-new-test',
        name: 'North Korea New Test Alert',
        type: 'new_test',
        country: 'north-korea',
        enabled: true
      },
      {
        id: 'iran-new-test',
        name: 'Iran New Test Alert',
        type: 'new_test',
        country: 'iran',
        enabled: true
      },
      {
        id: 'india-new-test',
        name: 'India New Test Alert',
        type: 'new_test',
        country: 'india',
        enabled: true
      },
      {
        id: 'pakistan-new-test',
        name: 'Pakistan New Test Alert',
        type: 'new_test',
        country: 'pakistan',
        enabled: true
      },
      {
        id: 'success-rate-threshold',
        name: 'Success Rate Drop Alert',
        type: 'success_rate_drop',
        country: 'all',
        enabled: true,
        threshold: 50,
        condition: 'below'
      },
      {
        id: 'weekly-report',
        name: 'Weekly Summary Report',
        type: 'weekly_report',
        country: 'all',
        enabled: true
      }
    ];
  }

  async checkAlerts(testData: any[], country: string) {
    const countryAlerts = this.alerts.filter(a => 
      a.enabled && (a.country === country || a.country === 'all')
    );

    for (const alert of countryAlerts) {
      await this.evaluateAlert(alert, testData, country);
    }
  }

  private async evaluateAlert(alert: AlertConfig, testData: any[], country: string) {
    const now = new Date();
    
    switch (alert.type) {
      case 'new_test':
        await this.checkNewTest(alert, testData, country, now);
        break;
      case 'success_rate_drop':
        await this.checkSuccessRate(alert, testData, now);
        break;
      case 'weekly_report':
        await this.sendWeeklyReport(alert, testData, country, now);
        break;
    }
  }

  private async checkNewTest(alert: AlertConfig, testData: any[], country: string, now: Date) {
    const last24Hours = testData.filter((t: any) => {
      const testDate = new Date(t.date);
      const hoursDiff = (now.getTime() - testDate.getTime()) / (1000 * 60 * 60);
      return hoursDiff <= 24;
    });

    if (last24Hours.length > 0) {
      const latestTest = last24Hours[0];
      const event: AlertEvent = {
        id: `event-${Date.now()}`,
        alertId: alert.id,
        title: `🚨 NEW MISSILE TEST: ${country.toUpperCase()}`,
        message: `Missile: ${latestTest.missile}\nDate: ${latestTest.date}\nOutcome: ${latestTest.outcome}\nFacility: ${latestTest.facility}`,
        severity: 'critical',
        timestamp: now,
        acknowledged: false
      };
      
      await this.triggerAlert(event);
    }
  }

  private async checkSuccessRate(alert: AlertConfig, testData: any[], now: Date) {
    if (!alert.threshold || !alert.condition) return;

    const totalTests = testData.length;
    const successCount = testData.filter((t: any) => t.outcome === 'success').length;
    const successRate = totalTests > 0 ? (successCount / totalTests) * 100 : 0;

    const shouldTrigger = alert.condition === 'below' 
      ? successRate < alert.threshold 
      : successRate > alert.threshold;

    if (shouldTrigger) {
      const event: AlertEvent = {
        id: `event-${Date.now()}`,
        alertId: alert.id,
        title: `⚠️ SUCCESS RATE ALERT`,
        message: `Success rate dropped to ${successRate.toFixed(1)}%\nThreshold: ${alert.threshold}%`,
        severity: 'warning',
        timestamp: now,
        acknowledged: false
      };
      
      await this.triggerAlert(event);
    }
  }

  private async sendWeeklyReport(alert: AlertConfig, testData: any[], country: string, now: Date) {
    const lastWeek = testData.filter((t: any) => {
      const testDate = new Date(t.date);
      const daysDiff = (now.getTime() - testDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 7;
    });

    if (lastWeek.length > 0) {
      const successCount = lastWeek.filter((t: any) => t.outcome === 'success').length;
      const failureCount = lastWeek.filter((t: any) => t.outcome === 'failure').length;
      
      const event: AlertEvent = {
        id: `event-${Date.now()}`,
        alertId: alert.id,
        title: `📊 WEEKLY REPORT: ${country.toUpperCase()}`,
        message: `Tests this week: ${lastWeek.length}\nSuccess: ${successCount}\nFailure: ${failureCount}\nSuccess Rate: ${((successCount / lastWeek.length) * 100).toFixed(1)}%`,
        severity: 'info',
        timestamp: now,
        acknowledged: false
      };
      
      await this.triggerAlert(event);
    }
  }

  private async triggerAlert(event: AlertEvent) {
    this.events.unshift(event);
    
    // Send Telegram notification
    await sendAlertToTelegram(event.title, event.message, event.severity);
    
    // Keep only last 100 events
    if (this.events.length > 100) {
      this.events = this.events.slice(0, 100);
    }
  }

  getAlerts(): AlertConfig[] {
    return this.alerts;
  }

  getEvents(): AlertEvent[] {
    return this.events;
  }

  acknowledgeEvent(eventId: string) {
    const event = this.events.find(e => e.id === eventId);
    if (event) {
      event.acknowledged = true;
    }
  }

  updateAlert(alertId: string, updates: Partial<AlertConfig>) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      Object.assign(alert, updates);
    }
  }

  startMonitoring(checkIntervalMs: number = 300000) { // 5 minutes default
    this.checkInterval = setInterval(async () => {
      // This would be called by the OSINT aggregator
      console.log('🔍 Checking for new alerts...');
    }, checkIntervalMs);
  }

  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}

export const alertManager = new AlertManager();
export type { AlertConfig, AlertEvent };
