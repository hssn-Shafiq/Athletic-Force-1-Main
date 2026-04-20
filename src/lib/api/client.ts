import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { env } from '../env';

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

const REFRESH_PATH = '/api/auth/refresh';

let isRefreshing = false;
let refreshSubscribers: Array<() => void> = [];

function onRefreshed() {
  refreshSubscribers.forEach((cb) => cb());
  refreshSubscribers = [];
}

function subscribeTokenRefresh(cb: () => void) {
  refreshSubscribers.push(cb);
}

function shouldSkipRefresh(url?: string) {
  if (!url) return false;

  return (
    url.includes('/api/auth/login') ||
    url.includes('/api/auth/register') ||
    url.includes('/api/auth/logout') ||
    url.includes('/api/auth/google') ||
    url.includes(REFRESH_PATH)
  );
}

export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  withCredentials: true,
  timeout: 15000,
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;

    if (!originalRequest || originalRequest._retry || error.response?.status !== 401) {
      return Promise.reject(error);
    }

    if (shouldSkipRefresh(originalRequest.url)) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      return new Promise((resolve) => {
        subscribeTokenRefresh(() => {
          resolve(apiClient(originalRequest));
        });
      });
    }

    isRefreshing = true;

    try {
      await axios.post(`${env.apiBaseUrl}${REFRESH_PATH}`, {}, { withCredentials: true });
      onRefreshed();
      return apiClient(originalRequest);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);
