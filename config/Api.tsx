import axios from 'axios';
import { baseUrl } from './Constants';

export default {
  call: async function (
    url: string,
    method: string = 'POST',
    bodyData: any = null,
    isLogin: boolean = false
  ): Promise<any> {
    const fullUrl: string = baseUrl + url;
    console.log("bodyData", bodyData);
    console.log(method, 'fullUrl', fullUrl);

    let headers: Record<string, string> = {
      'Content-Type': isLogin ? 'application/x-www-form-urlencoded' : 'application/json',
    };


    headers['Accept'] = 'application/json';


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
      if (response.status === 201 || response.status === 200) {
        return { status: response.status, data: response.data };
      }
    } catch (error: any) {
      if (error.response) {
        console.log("error.response", error.response);
      }
      return { status: error.response?.status || 500, error };
    }
  },
};
