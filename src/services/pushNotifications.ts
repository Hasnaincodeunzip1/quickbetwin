import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { supabase } from '@/integrations/supabase/client';

export interface PushNotificationService {
  initialize: () => Promise<void>;
  requestPermission: () => Promise<boolean>;
  getToken: () => Promise<string | null>;
  registerToken: (userId: string) => Promise<void>;
  removeToken: (userId: string) => Promise<void>;
}

class PushNotificationManager implements PushNotificationService {
  private token: string | null = null;
  private initialized = false;

  async initialize(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      console.log('Push notifications only work on native platforms');
      return;
    }

    if (this.initialized) return;

    // Register event listeners
    PushNotifications.addListener('registration', (token: Token) => {
      console.log('Push registration success, token:', token.value);
      this.token = token.value;
    });

    PushNotifications.addListener('registrationError', (error) => {
      console.error('Push registration error:', error);
    });

    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      console.log('Push notification received:', notification);
      // Handle foreground notification - could show a toast or in-app alert
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
      console.log('Push notification action performed:', action);
      // Handle notification tap - could navigate to relevant page
      const data = action.notification.data;
      if (data?.type === 'deposit' || data?.type === 'withdrawal') {
        // Navigate to wallet or history page
        window.location.href = '/wallet';
      }
    });

    this.initialized = true;
  }

  async requestPermission(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return false;
    }

    const result = await PushNotifications.requestPermissions();
    
    if (result.receive === 'granted') {
      await PushNotifications.register();
      return true;
    }
    
    return false;
  }

  async getToken(): Promise<string | null> {
    return this.token;
  }

  async registerToken(userId: string): Promise<void> {
    if (!this.token || !userId) return;

    const platform = Capacitor.getPlatform() as 'ios' | 'android' | 'web';

    try {
      // Upsert the token (insert or update if exists)
      const { error } = await supabase
        .from('device_tokens')
        .upsert({
          user_id: userId,
          token: this.token,
          platform,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,token'
        });

      if (error) {
        console.error('Error registering device token:', error);
      } else {
        console.log('Device token registered successfully');
      }
    } catch (err) {
      console.error('Error registering device token:', err);
    }
  }

  async removeToken(userId: string): Promise<void> {
    if (!this.token || !userId) return;

    try {
      const { error } = await supabase
        .from('device_tokens')
        .delete()
        .eq('user_id', userId)
        .eq('token', this.token);

      if (error) {
        console.error('Error removing device token:', error);
      } else {
        console.log('Device token removed successfully');
      }
    } catch (err) {
      console.error('Error removing device token:', err);
    }
  }
}

export const pushNotificationService = new PushNotificationManager();

// Hook for using push notifications in components
export const usePushNotifications = () => {
  return pushNotificationService;
};
