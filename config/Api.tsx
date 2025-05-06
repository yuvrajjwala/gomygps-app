import axios from 'axios';
import { baseUrl } from './Constants';

export default {
  call: async function (
    url: string,
    method: string = 'POST',
    bodyData: any = null,
    token?: string,
  ): Promise<any> {
    const fullUrl: string = baseUrl + url;
    console.log("bodyData", bodyData);
    console.log(method, 'fullUrl', fullUrl);

    let headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    if (token) {
      headers['Authorization'] = 'Bearer ' + token;
    } else {
      headers['Accept'] = 'application/json';
    }

    if (bodyData instanceof FormData) {
      headers['Content-Type'] = 'multipart/form-data';
    }

    try {
      const config = {
        method,
        url: fullUrl,
        headers,
        data: method !== 'GET' ? bodyData : undefined,
        withCredentials: true,
      };

      const response = await axios(config);
      console.log("response", response.status);
      if (response.status === 201 || response.status === 200) {
        return { status: response.status, data: response.data };
      }
    } catch (error: any) {
      if (error.response) {
        if (error.response.status === 401) {
        }
        if (error.response.status === 400) {
        }
      }
      return { status: error.response?.status || 500, error };
    }
  },
};
