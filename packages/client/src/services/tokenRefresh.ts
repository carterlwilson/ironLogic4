const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function onRefreshed(token: string) {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
}

function addRefreshSubscriber(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

async function refreshAccessToken(): Promise<string | null> {
  const authTokens = localStorage.getItem('authTokens');
  if (!authTokens) return null;

  const { refreshToken } = JSON.parse(authTokens);
  if (!refreshToken) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      // Refresh token expired or invalid - logout
      localStorage.removeItem('authTokens');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return null;
    }

    const data = await response.json();
    const newTokens: AuthTokens = {
      accessToken: data.data.accessToken,
      refreshToken: data.data.refreshToken,
    };

    localStorage.setItem('authTokens', JSON.stringify(newTokens));
    return newTokens.accessToken;
  } catch (error) {
    console.error('Token refresh failed:', error);
    localStorage.removeItem('authTokens');
    localStorage.removeItem('user');
    window.location.href = '/login';
    return null;
  }
}

export async function authenticatedRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const authTokens = localStorage.getItem('authTokens');

  if (!authTokens) {
    throw new Error('No authentication token found');
  }

  const { accessToken } = JSON.parse(authTokens);

  // Add auth header
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`,
    ...options.headers,
  };

  try {
    let response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers,
    });

    // Handle 401 - token expired
    if (response.status === 401) {
      if (!isRefreshing) {
        isRefreshing = true;

        const newAccessToken = await refreshAccessToken();
        isRefreshing = false;

        if (!newAccessToken) {
          throw new Error('Session expired');
        }

        onRefreshed(newAccessToken);

        // Retry original request with new token
        response = await fetch(`${API_BASE_URL}${url}`, {
          ...options,
          headers: {
            ...headers,
            'Authorization': `Bearer ${newAccessToken}`,
          },
        });
      } else {
        // Wait for refresh to complete
        const newAccessToken = await new Promise<string>((resolve) => {
          addRefreshSubscriber(resolve);
        });

        // Retry with new token
        response = await fetch(`${API_BASE_URL}${url}`, {
          ...options,
          headers: {
            ...headers,
            'Authorization': `Bearer ${newAccessToken}`,
          },
        });
      }
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Request failed');
    }

    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}
