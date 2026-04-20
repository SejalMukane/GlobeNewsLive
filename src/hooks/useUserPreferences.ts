import { useState, useEffect, useCallback } from 'react';
import { UserPreferences, SignalCategory, Severity, RiskPriority } from '@/types';

const DEFAULT_PREFERENCES: UserPreferences = {
  userId: 'default-user',
  dashboardName: 'My Intelligence Dashboard',
  createdAt: new Date(),
  updatedAt: new Date(),
  regions: ['USA', 'Middle East', 'Europe'],
  interests: ['conflict', 'military', 'cyber', 'economy'],
  riskPriority: 'all',
  notificationSettings: {
    minSeverity: 'HIGH',
    soundEnabled: false,
    desktopNotifications: true,
  },
  pinnedEventIds: [],
  riskThreshold: 60,
};

const STORAGE_KEY = 'personalized-dashboard-prefs';

export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setPreferences({
          ...DEFAULT_PREFERENCES,
          ...parsed,
          createdAt: new Date(parsed.createdAt || DEFAULT_PREFERENCES.createdAt),
          updatedAt: new Date(parsed.updatedAt || DEFAULT_PREFERENCES.updatedAt),
        });
      } catch (e) {
        console.error('Failed to parse preferences:', e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    }
  }, [preferences, isLoaded]);

  // Update preferences
  const updatePreferences = useCallback((updates: Partial<UserPreferences>) => {
    setPreferences((prev) => ({
      ...prev,
      ...updates,
      updatedAt: new Date(),
    }));
  }, []);

  // Add/remove regions
  const toggleRegion = useCallback((region: string) => {
    setPreferences((prev) => {
      const regions = prev.regions.includes(region)
        ? prev.regions.filter((r) => r !== region)
        : [...prev.regions, region];
      return { ...prev, regions, updatedAt: new Date() };
    });
  }, []);

  // Add/remove interests
  const toggleInterest = useCallback((interest: SignalCategory) => {
    setPreferences((prev) => {
      const interests = prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest];
      return { ...prev, interests, updatedAt: new Date() };
    });
  }, []);

  // Pin/unpin events
  const togglePinnedEvent = useCallback((eventId: string) => {
    setPreferences((prev) => {
      const pinnedEventIds = prev.pinnedEventIds.includes(eventId)
        ? prev.pinnedEventIds.filter((id) => id !== eventId)
        : [...prev.pinnedEventIds, eventId];
      return { ...prev, pinnedEventIds, updatedAt: new Date() };
    });
  }, []);

  // Update risk priority
  const setRiskPriority = useCallback((priority: RiskPriority) => {
    setPreferences((prev) => ({
      ...prev,
      riskPriority: priority,
      updatedAt: new Date(),
    }));
  }, []);

  // Update notification settings
  const updateNotificationSettings = useCallback((updates: Partial<UserPreferences['notificationSettings']>) => {
    setPreferences((prev) => ({
      ...prev,
      notificationSettings: {
        ...prev.notificationSettings,
        ...updates,
      },
      updatedAt: new Date(),
    }));
  }, []);

  // Update minimum severity for alerts
  const setMinSeverity = useCallback((severity: Severity) => {
    updateNotificationSettings({ minSeverity: severity });
  }, [updateNotificationSettings]);

  // Update risk threshold
  const setRiskThreshold = useCallback((threshold: number) => {
    setPreferences((prev) => ({
      ...prev,
      riskThreshold: Math.max(0, Math.min(100, threshold)),
      updatedAt: new Date(),
    }));
  }, []);

  // Reset to defaults
  const resetToDefaults = useCallback(() => {
    setPreferences({
      ...DEFAULT_PREFERENCES,
      userId: preferences.userId,
      createdAt: preferences.createdAt,
      updatedAt: new Date(),
    });
  }, [preferences.userId, preferences.createdAt]);

  return {
    preferences,
    isLoaded,
    updatePreferences,
    toggleRegion,
    toggleInterest,
    togglePinnedEvent,
    setRiskPriority,
    updateNotificationSettings,
    setMinSeverity,
    setRiskThreshold,
    resetToDefaults,
  };
}
