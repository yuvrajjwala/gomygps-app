import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const DEVICE_TOKEN_KEY = '@device_token';
const NOTIFICATIONS_ENABLED_KEY = '@notifications_enabled';

export async function requestUserPermission() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return false;
    }
    return true;
  } else {
    console.log('Must use physical device for Push Notifications');
    return false;
  }
}

export async function getDeviceToken() {
  try {
    const token = await AsyncStorage.getItem(DEVICE_TOKEN_KEY);
    
    if (!token) {
      const { data: newToken } = await Notifications.getDevicePushTokenAsync();
      
      if (newToken) {
        await AsyncStorage.setItem(DEVICE_TOKEN_KEY, newToken);
        return newToken;
      }
    }
    
    return token;
  } catch (error) {
    console.log('Error getting device token:', error);
    return null;
  }
}

export async function setupNotifications() {
  try {
    const hasPermission = await requestUserPermission();
    if (!hasPermission) {
      console.log('User has not granted permission for notifications');
      return;
    }

    // Get the token
    const token = await getDeviceToken();
    console.log('Device Token:', token);

    // Configure notification handler
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
        priority: Notifications.AndroidNotificationPriority.HIGH
      }),
    });

    // Handle foreground messages
    Notifications.addNotificationReceivedListener(notification => {
      console.log('Received foreground notification:', notification);
      // Show the notification in foreground
      Notifications.scheduleNotificationAsync({
        content: {
          title: notification.request.content.title,
          body: notification.request.content.body,
          data: notification.request.content.data,
        },
        trigger: null, // Show immediately
      });
    });

    // Handle notification response
    Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      // Handle notification tap here
      const data = response.notification.request.content.data;
      // You can add navigation or other actions here based on the notification data
    });

  } catch (error) {
    console.log('Error setting up notifications:', error);
  }
}

export async function isNotificationsEnabled() {
  try {
    const enabled = await AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY);
    // If no value is set (first launch), enable notifications by default
    if (enabled === null) {
      await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, 'true');
      return true;
    }
    return enabled === 'true';
  } catch (error) {
    console.log('Error checking notification status:', error);
    return true; // Return true by default in case of error
  }
}

export async function setNotificationsEnabled(enabled: boolean) {
  try {
    await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, enabled.toString());
    
    if (!enabled) {
      // Unregister from push notifications
      await Notifications.unregisterForNotificationsAsync();
      await AsyncStorage.removeItem(DEVICE_TOKEN_KEY);
    } else {
      // Re-register for push notifications
      const hasPermission = await requestUserPermission();
      if (hasPermission) {
        const token = await getDeviceToken();
        console.log('Device Token:', token);
      }
    }
  } catch (error) {
    console.log('Error setting notification status:', error);
  }
} 