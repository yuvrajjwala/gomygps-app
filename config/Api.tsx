import { Alert } from 'react-native';
import { baseUrl } from './Constants';

export default {
  call: async function (
    url: string,
    method: string = 'POST',
    bodyData: any = null,
    token?: string,
  ): Promise<any> {
    let header: Record<string, string> = {};
    const fullUrl: string = baseUrl + url;
    console.log("bodyData", bodyData)
    console.log('fullUrl', fullUrl);
    if (token) {
      header = {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token,
      };
    } else {
      header = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      };
    }
    if (bodyData instanceof FormData) {
      header['Content-Type'] = 'multipart/form-data';
    }
    try {
      const requestOptions: RequestInit = {
        method,
        headers: header,
      };
      if (method !== 'GET' && bodyData) {
        requestOptions.body =
          bodyData instanceof FormData ? bodyData : JSON.stringify(bodyData);
      }

      const response = await fetch(fullUrl, requestOptions);
      const responseData = await response.json();
      if (response.status === 401) {
        Alert.alert('Error', responseData?.message);
      }
      if (response.status === 201 || response.status === 200) {
        return { status: response.status, data: responseData };
      }
      if (response.status === 400) {
        Alert.alert('Error', responseData?.message);
      }
    } catch (err) {
      Alert.alert('Error', 'Network error occurred');
      return { status: 500, error: err };
    }
  },
};
