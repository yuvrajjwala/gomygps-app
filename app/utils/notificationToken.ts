import Api from '@/config/Api';
import { getDeviceToken } from './notifications';

export async function updateNotificationToken() {
  try {
    const token = await getDeviceToken();
    if (!token) return;

    // Get current user data
    const response = await Api.call('/api/session', 'GET', {}, false);
    if (!response.data) return;

    const userData = response.data;
    const oldTokens = userData.attributes?.notificationTokens?.toString().split(',') || [];
    
    // Update notification tokens
    if (!oldTokens.includes(token)) {
      const newTokens = oldTokens.length > 0 ? `${token},${oldTokens.join(',')}` : token;
      
      // Update user data with new token
      const updatedData = {
        ...userData,
        attributes: {
          ...userData.attributes,
          notificationTokens: newTokens
        }
      };

      await Api.call(`/api/users/${userData.id}`, 'PUT', updatedData, true);
    }
  } catch (error) {
    console.error('Error updating notification token:', error);
  }
}

export async function removeNotificationToken() {
  try {
    const token = await getDeviceToken();
    if (!token) return;

    // Get current user data
    const response = await Api.call('/api/session', 'GET', {}, true);
    if (!response.data) return;

    const userData = response.data;
    const oldTokens = userData.attributes?.notificationTokens?.toString().split(',') || [];
    
    // Remove token if it exists
    if (oldTokens.includes(token)) {
      const newTokens = oldTokens.filter((t: string) => t !== token).join(',');
      
      // Update user data with removed token
      const updatedData = {
        ...userData,
        attributes: {
          ...userData.attributes,
          notificationTokens: newTokens
        }
      };

      await Api.call(`/api/users/${userData.id}`, 'PUT', updatedData, true);
    }
  } catch (error) {
    console.error('Error removing notification token:', error);
  }
} 