import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

export const apiClient = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

interface RetryableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean;
}

const AUTH_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/refresh'];

// No token ever touches JS — both access and refresh tokens live in httpOnly cookies.
// On a 401 from any endpoint other than auth itself, try exactly one refresh, then
// retry the original request once. If the refresh also fails, the session is over.
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetryableConfig | undefined;
    const isAuthEndpoint = AUTH_ENDPOINTS.some((path) => config?.url?.includes(path));

    if (error.response?.status !== 401 || !config || config._retried || isAuthEndpoint) {
      throw error;
    }

    config._retried = true;

    try {
      await apiClient.post('/auth/refresh');
      return apiClient(config);
    } catch {
      throw error;
    }
  },
);
