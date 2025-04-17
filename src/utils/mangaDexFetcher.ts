import axios, { AxiosRequestConfig } from "axios";
import { MangaDexFetchOptions } from "../interfaces/mangadex.interface";

const apiBaseUrl = 'https://api.mangadex.org';

async function mangaDexFetch<T>(endpoint: string = '/manga', options: MangaDexFetchOptions = {}): Promise<T> {
  try {
    const requestConfig: AxiosRequestConfig = {
      url: `${apiBaseUrl}${endpoint}`,
      method: options.method || 'GET',
      headers: options.headers,
      data: options.data,
      params: options.params,
    };
    const response = await axios(requestConfig);
    return response.data;
  } catch (error) {
    console.error(`MangaDex API request failed: ${endpoint}`, error);
    throw error;
  }
}

export default mangaDexFetch;
