import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const DEVICE_TOKEN_KEY = '@device_token';

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
        severity: Notifications.AndroidNotificationPriority.HIGH
      }),
    });

    // Handle foreground messages
    Notifications.addNotificationReceivedListener(notification => {
      console.log('Received foreground notification:', notification);
    });

    // Handle notification response
    Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
    });

  } catch (error) {
    console.log('Error setting up notifications:', error);
  }
} 