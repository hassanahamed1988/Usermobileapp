import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token, ActionPerformed, PushNotificationSchema } from '@capacitor/push-notifications';
import { db, auth } from './firebase';
import { doc, setDoc } from 'firebase/firestore';

export async function initPushNotifications(onNotificationClick?: (data: any) => void) {
  if (!Capacitor.isNativePlatform() || !Capacitor.isPluginAvailable('PushNotifications')) {
    console.log('Push notifications plugin not available on this platform/environment.');
    return;
  }
  try {
    const checkPermissions = await PushNotifications.checkPermissions();
    
    if (checkPermissions.receive === 'prompt') {
      const req = await PushNotifications.requestPermissions();
      if (req.receive !== 'granted') {
        console.warn('Push notification permission denied by user.');
        return;
      }
    } else if (checkPermissions.receive === 'denied') {
      console.warn('Push notification permission is denied. Please enable in Android Settings.');
      return;
    }

    try {
      await PushNotifications.register();
    } catch (regErr) {
      console.warn('PushNotifications.register failed:', regErr);
    }

    // Create Android Notification Channels safely
    try {
      await PushNotifications.createChannel({
        id: 'default',
        name: 'Default Channel',
        description: 'General application notifications',
        importance: 3,
        visibility: 1,
      });

      await PushNotifications.createChannel({
        id: 'account_updates',
        name: 'Account & Profile Updates',
        description: 'Notifications regarding account approval, rejections, password updates, and subscriptions',
        importance: 5,
        visibility: 1,
        vibration: true,
      });

      await PushNotifications.createChannel({
        id: 'trips',
        name: 'Trips & Operations',
        description: 'Notifications for trips, status changes, and dispatch operations',
        importance: 4,
        visibility: 1,
      });
    } catch (channelErr) {
      console.warn('Failed to create notification channels:', channelErr);
    }

    try {
      await PushNotifications.removeAllListeners();

      PushNotifications.addListener('registration', async (token: Token) => {
        console.log('Push registration success, token: ' + token.value);
        if (auth.currentUser) {
          try {
            const tokenRef = doc(db, 'fcmTokens', auth.currentUser.uid);
            await setDoc(tokenRef, {
              token: token.value,
              userId: auth.currentUser.uid,
              email: auth.currentUser.email || '',
              updatedAt: new Date().toISOString(),
              platform: 'android'
            }, { merge: true });

            const userRef = doc(db, 'users', auth.currentUser.uid);
            await setDoc(userRef, {
              fcmToken: token.value,
              lastTokenUpdate: new Date().toISOString()
            }, { merge: true });
          } catch (err) {
            console.error('Failed to save FCM token to Firestore:', err);
          }
        }
      });

      PushNotifications.addListener('registrationError', (error: any) => {
        console.error('Error on push registration: ' + JSON.stringify(error));
      });

      PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
        console.log('Push notification received in foreground: ', JSON.stringify(notification));
      });

      PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
        console.log('Push notification action performed: ', JSON.stringify(notification));
        const data = notification.notification.data;
        if (onNotificationClick && data) {
          onNotificationClick(data);
        }
      });
    } catch (listenerErr) {
      console.warn('Failed to add PushNotification listeners:', listenerErr);
    }

  } catch (e) {
    console.log('Push notifications initialization skipped or failed:', e);
  }
}
